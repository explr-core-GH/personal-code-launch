import * as THREE from 'three';
import { parseNbt, type NbtCompound, type NbtValue } from './nbt';
import { colorForBlock } from './blockColors';
import {
  buildMeshFromGroup,
  exportGlb,
  type FaceGroup,
  type OptimizerResult,
  type OptimizerStats,
} from './glbOptimizer';

const AIR_INDEX = -1;

export interface McStructureData {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  paletteNames: string[];
  blockIndices: Int32Array;
}

/**
 * Parse a Bedrock .mcstructure file (raw little-endian NBT, no gzip).
 * Returns the build dimensions, the palette of block names, and a flat
 * Int32Array of palette indices in x-major / y-mid / z-minor order. Cells
 * containing air or non-cube blocks are flagged with -1 ("air").
 */
export function parseMcstructure(buffer: ArrayBuffer): McStructureData {
  const parsed = parseNbt(buffer);
  const root = parsed.value;
  const sizeList = root.size as NbtValue[];
  if (!Array.isArray(sizeList) || sizeList.length !== 3) {
    throw new Error('mcstructure: missing or malformed size');
  }
  const [sizeX, sizeY, sizeZ] = sizeList as number[];

  const structure = root.structure as NbtCompound;
  if (!structure) throw new Error('mcstructure: missing structure tag');
  const blockIndicesList = structure.block_indices as NbtValue[];
  if (!Array.isArray(blockIndicesList) || blockIndicesList.length < 1) {
    throw new Error('mcstructure: missing block_indices');
  }
  const layer0 = blockIndicesList[0] as number[];
  const expected = sizeX * sizeY * sizeZ;
  if (layer0.length !== expected) {
    throw new Error(
      `mcstructure: expected ${expected} block indices, got ${layer0.length}`,
    );
  }

  const palette = structure.palette as NbtCompound;
  const def = palette?.default as NbtCompound | undefined;
  const blockPalette = def?.block_palette as NbtValue[] | undefined;
  if (!blockPalette || !Array.isArray(blockPalette)) {
    throw new Error('mcstructure: missing palette.default.block_palette');
  }

  const paletteNames = blockPalette.map((entry) => {
    const compound = entry as NbtCompound;
    return (compound.name as string) ?? 'minecraft:air';
  });

  const blockIndices = new Int32Array(expected);
  for (let i = 0; i < expected; i++) {
    blockIndices[i] = layer0[i];
  }

  return { sizeX, sizeY, sizeZ, paletteNames, blockIndices };
}

interface VoxelGrid {
  dims: [number, number, number];
  /** materialId for each voxel, or -1 for empty. Same indexing as blockIndices. */
  cells: Int32Array;
  /** materialId -> three.js material */
  materials: THREE.Material[];
  /** materialId -> readable name */
  materialNames: string[];
  /** count of non-empty voxels */
  filledCount: number;
}

function buildVoxelGrid(data: McStructureData): VoxelGrid {
  const { sizeX, sizeY, sizeZ, paletteNames, blockIndices } = data;
  const cells = new Int32Array(sizeX * sizeY * sizeZ).fill(-1);

  // Resolve each palette slot to either a materialId or "skip"
  const colorByPaletteIdx: (string | null)[] = paletteNames.map((name) =>
    colorForBlock(name),
  );

  // Deduplicate colors across the palette so identical-color blocks share a material
  const colorToMaterialId = new Map<string, number>();
  const materials: THREE.Material[] = [];
  const materialNames: string[] = [];

  const paletteToMaterial = new Int32Array(paletteNames.length).fill(-1);
  for (let p = 0; p < paletteNames.length; p++) {
    const color = colorByPaletteIdx[p];
    if (color === null) continue;
    let matId = colorToMaterialId.get(color);
    if (matId === undefined) {
      matId = materials.length;
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0,
      });
      material.name = color;
      materials.push(material);
      materialNames.push(color);
      colorToMaterialId.set(color, matId);
    }
    paletteToMaterial[p] = matId;
  }

  let filledCount = 0;
  for (let i = 0; i < blockIndices.length; i++) {
    const pi = blockIndices[i];
    if (pi < 0) continue;
    const matId = paletteToMaterial[pi];
    if (matId < 0) continue;
    cells[i] = matId;
    filledCount++;
  }

  return {
    dims: [sizeX, sizeY, sizeZ],
    cells,
    materials,
    materialNames,
    filledCount,
  };
}

function voxelIndex(
  x: number,
  y: number,
  z: number,
  sizeY: number,
  sizeZ: number,
): number {
  return x * sizeY * sizeZ + y * sizeZ + z;
}

function getMat(
  cells: Int32Array,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
): number {
  if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) return AIR_INDEX;
  return cells[voxelIndex(x, y, z, sy, sz)];
}

/**
 * For each (material, axis, sign, slice), emit only the visible cells
 * (occupied by this material AND the neighbor in the face direction is
 * not the same material). Internal faces shared between two same-material
 * blocks are skipped, which is where the file-size win comes from.
 */
function buildFaceGroups(grid: VoxelGrid): Map<string, FaceGroup> {
  const groups = new Map<string, FaceGroup>();
  const [sx, sy, sz] = grid.dims;
  const cells = grid.cells;

  const addFace = (
    material: THREE.Material,
    materialId: string,
    axis: 0 | 1 | 2,
    sign: 1 | -1,
    slice: number,
    u: number,
    v: number,
  ) => {
    const key = `${materialId}|${axis}|${sign}|${slice}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        materialId,
        axis,
        sign,
        slice,
        cells: new Set(),
        uMin: Infinity,
        uMax: -Infinity,
        vMin: Infinity,
        vMax: -Infinity,
        material,
      };
      groups.set(key, group);
    }
    group.cells.add(`${u},${v}`);
    if (u < group.uMin) group.uMin = u;
    if (u + 1 > group.uMax) group.uMax = u + 1;
    if (v < group.vMin) group.vMin = v;
    if (v + 1 > group.vMax) group.vMax = v + 1;
  };

  for (let x = 0; x < sx; x++) {
    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        const m = cells[voxelIndex(x, y, z, sy, sz)];
        if (m < 0) continue;
        const material = grid.materials[m];
        const materialId = material.uuid;

        // +X face at slice = x+1, axis 0, sign +1, u=y, v=z
        if (getMat(cells, x + 1, y, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 0, 1, x + 1, y, z);
        }
        // -X face at slice = x, axis 0, sign -1
        if (getMat(cells, x - 1, y, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 0, -1, x, y, z);
        }
        // +Y face at slice = y+1, axis 1, sign +1, u=z, v=x
        if (getMat(cells, x, y + 1, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 1, 1, y + 1, z, x);
        }
        // -Y face at slice = y, axis 1, sign -1
        if (getMat(cells, x, y - 1, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 1, -1, y, z, x);
        }
        // +Z face at slice = z+1, axis 2, sign +1, u=x, v=y
        if (getMat(cells, x, y, z + 1, sx, sy, sz) !== m) {
          addFace(material, materialId, 2, 1, z + 1, x, y);
        }
        // -Z face at slice = z, axis 2, sign -1
        if (getMat(cells, x, y, z - 1, sx, sy, sz) !== m) {
          addFace(material, materialId, 2, -1, z, x, y);
        }
      }
    }
  }

  return groups;
}

export interface McStructureOptimizerResult extends OptimizerResult {
  stats: OptimizerStats & {
    inputBlocks: number;
    paletteEntries: number;
    sourceFormat: 'mcstructure';
  };
}

export async function optimizeMcstructure(
  input: ArrayBuffer,
): Promise<McStructureOptimizerResult> {
  const inputBytes = input.byteLength;
  const parsed = parseMcstructure(input);
  const grid = buildVoxelGrid(parsed);
  const groups = buildFaceGroups(grid);

  const scene = new THREE.Group();
  scene.name = 'optimized-minecraft-build';
  let outputTriangles = 0;
  let voxelFaces = 0;

  for (const group of groups.values()) {
    voxelFaces += group.cells.size;
    const mesh = buildMeshFromGroup(group);
    if (!mesh) continue;
    const indexAttr = mesh.geometry.getIndex();
    outputTriangles += indexAttr ? indexAttr.count / 3 : 0;
    scene.add(mesh);
  }

  const glb = await exportGlb(scene);

  return {
    scene,
    glb,
    stats: {
      inputBytes,
      outputBytes: glb.byteLength,
      inputTriangles: 0,
      outputTriangles,
      materialGroups: grid.materials.length,
      voxelFaces,
      inputBlocks: grid.filledCount,
      paletteEntries: parsed.paletteNames.length,
      sourceFormat: 'mcstructure',
    },
  };
}
