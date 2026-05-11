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
import {
  classifyShape,
  isFullCube,
  shapeBoxes,
  type Box,
  type Shape,
  type StateMap,
} from './blockShapes';

const AIR_INDEX = -1;

export interface PaletteEntry {
  name: string;
  states: StateMap;
}

export interface McStructureData {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  palette: PaletteEntry[];
  blockIndices: Int32Array;
}

/**
 * Parse a Bedrock .mcstructure file (raw little-endian NBT, no gzip).
 * Returns the build dimensions, the palette (block name + state compound
 * per entry), and a flat Int32Array of palette indices in x-major /
 * y-mid / z-minor order. Cells containing air are -1.
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

  const paletteEntries: PaletteEntry[] = blockPalette.map((entry) => {
    const compound = entry as NbtCompound;
    return {
      name: (compound.name as string) ?? 'minecraft:air',
      states: (compound.states as StateMap | undefined) ?? {},
    };
  });

  const blockIndices = new Int32Array(expected);
  for (let i = 0; i < expected; i++) {
    blockIndices[i] = layer0[i];
  }

  return { sizeX, sizeY, sizeZ, palette: paletteEntries, blockIndices };
}

interface ShapedInstance {
  matId: number;
  shape: Shape;
  x: number;
  y: number;
  z: number;
}

interface VoxelData {
  dims: [number, number, number];
  /** materialId for full cubes only, or -1. Cubes occlude neighboring faces. */
  cubeCells: Int32Array;
  /** Non-cube blocks rendered as their own geometry. */
  shapedInstances: ShapedInstance[];
  /** materialId -> three.js material */
  materials: THREE.Material[];
  /** materialId -> readable name (the hex color) */
  materialNames: string[];
  /** count of all non-air, non-skipped blocks (cubes + shaped) */
  filledCount: number;
}

function voxelIndex(
  x: number,
  y: number,
  z: number,
  sy: number,
  sz: number,
): number {
  return x * sy * sz + y * sz + z;
}

function buildVoxelData(data: McStructureData): VoxelData {
  const { sizeX, sizeY, sizeZ, palette, blockIndices } = data;
  const cubeCells = new Int32Array(sizeX * sizeY * sizeZ).fill(AIR_INDEX);

  // Per palette slot: classify shape and resolve color → materialId
  const slotShape: Shape[] = palette.map((p) => {
    const color = colorForBlock(p.name);
    if (color === null) return { kind: 'skip' };
    return classifyShape(p.name, p.states);
  });
  const slotColor: (string | null)[] = palette.map((p) => colorForBlock(p.name));

  const colorToMaterialId = new Map<string, number>();
  const materials: THREE.Material[] = [];
  const materialNames: string[] = [];
  const slotMatId = new Int32Array(palette.length).fill(-1);

  for (let p = 0; p < palette.length; p++) {
    const color = slotColor[p];
    if (color === null) continue;
    if (slotShape[p].kind === 'skip') continue;
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
    slotMatId[p] = matId;
  }

  const shapedInstances: ShapedInstance[] = [];
  let filledCount = 0;

  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        const i = voxelIndex(x, y, z, sizeY, sizeZ);
        const pi = blockIndices[i];
        if (pi < 0 || pi >= palette.length) continue;
        const matId = slotMatId[pi];
        if (matId < 0) continue;
        const shape = slotShape[pi];
        filledCount++;
        if (isFullCube(shape)) {
          cubeCells[i] = matId;
        } else {
          shapedInstances.push({ matId, shape, x, y, z });
        }
      }
    }
  }

  return {
    dims: [sizeX, sizeY, sizeZ],
    cubeCells,
    shapedInstances,
    materials,
    materialNames,
    filledCount,
  };
}

function getCube(
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
 * (occupied by this material AND the neighbor cube is not the same
 * material). Shaped blocks at the neighbor cell count as "air" here, so
 * the cube face is emitted in full (the shape sits on top of it).
 */
function buildFaceGroups(
  cubeCells: Int32Array,
  materials: THREE.Material[],
  dims: [number, number, number],
): Map<string, FaceGroup> {
  const groups = new Map<string, FaceGroup>();
  const [sx, sy, sz] = dims;

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
        const m = cubeCells[voxelIndex(x, y, z, sy, sz)];
        if (m < 0) continue;
        const material = materials[m];
        const materialId = material.uuid;

        if (getCube(cubeCells, x + 1, y, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 0, 1, x + 1, y, z);
        }
        if (getCube(cubeCells, x - 1, y, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 0, -1, x, y, z);
        }
        if (getCube(cubeCells, x, y + 1, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 1, 1, y + 1, z, x);
        }
        if (getCube(cubeCells, x, y - 1, z, sx, sy, sz) !== m) {
          addFace(material, materialId, 1, -1, y, z, x);
        }
        if (getCube(cubeCells, x, y, z + 1, sx, sy, sz) !== m) {
          addFace(material, materialId, 2, 1, z + 1, x, y);
        }
        if (getCube(cubeCells, x, y, z - 1, sx, sy, sz) !== m) {
          addFace(material, materialId, 2, -1, z, x, y);
        }
      }
    }
  }

  return groups;
}

/**
 * Build one merged BufferGeometry per material from all shaped-block
 * instances. Each box is emitted as 6 axis-aligned quads (no inter-box
 * face culling — it's not worth the complexity for the small number of
 * shaped blocks in a typical build).
 */
function buildShapedMeshes(
  instances: ShapedInstance[],
  materials: THREE.Material[],
): { meshes: THREE.Mesh[]; triangles: number } {
  if (instances.length === 0) return { meshes: [], triangles: 0 };

  // Group instance boxes by materialId, then collect all boxes at world positions
  const byMat = new Map<number, Box[]>();
  for (const inst of instances) {
    const boxes = shapeBoxes(inst.shape);
    if (boxes.length === 0) continue;
    let list = byMat.get(inst.matId);
    if (!list) {
      list = [];
      byMat.set(inst.matId, list);
    }
    for (const b of boxes) {
      list.push([
        b[0] + inst.x,
        b[1] + inst.y,
        b[2] + inst.z,
        b[3] + inst.x,
        b[4] + inst.y,
        b[5] + inst.z,
      ]);
    }
  }

  const meshes: THREE.Mesh[] = [];
  let totalTriangles = 0;
  for (const [matId, boxes] of byMat) {
    const geometry = buildBoxesGeometry(boxes);
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, materials[matId]);
    mesh.name = `shapes_${materials[matId].name}`;
    meshes.push(mesh);
    const indexAttr = geometry.getIndex();
    totalTriangles += indexAttr ? indexAttr.count / 3 : 0;
  }
  return { meshes, triangles: totalTriangles };
}

const BOX_FACES: Array<{
  // Each face: 4 corner offsets within the box (0 or 1 along each axis)
  // and the outward normal (1 or -1 along the axis index).
  axis: 0 | 1 | 2;
  sign: 1 | -1;
  corners: ReadonlyArray<readonly [number, number, number]>;
}> = [
  // +X face: corners on x=1, ccw viewed from +X
  {
    axis: 0,
    sign: 1,
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  // -X face
  {
    axis: 0,
    sign: -1,
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  // +Y face
  {
    axis: 1,
    sign: 1,
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
  },
  // -Y face
  {
    axis: 1,
    sign: -1,
    corners: [
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
    ],
  },
  // +Z face
  {
    axis: 2,
    sign: 1,
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  // -Z face
  {
    axis: 2,
    sign: -1,
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
];

function buildBoxesGeometry(boxes: Box[]): THREE.BufferGeometry | null {
  if (boxes.length === 0) return null;
  const vertexCount = boxes.length * 24;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(boxes.length * 36);

  let vOff = 0;
  let iOff = 0;
  for (let b = 0; b < boxes.length; b++) {
    const [x0, y0, z0, x1, y1, z1] = boxes[b];
    const sx = x1 - x0;
    const sy = y1 - y0;
    const sz = z1 - z0;
    for (const face of BOX_FACES) {
      const baseVertex = vOff;
      for (let i = 0; i < 4; i++) {
        const [cx, cy, cz] = face.corners[i];
        const px = x0 + cx * sx;
        const py = y0 + cy * sy;
        const pz = z0 + cz * sz;
        const p = vOff * 3;
        positions[p] = px;
        positions[p + 1] = py;
        positions[p + 2] = pz;
        normals[p] = face.axis === 0 ? face.sign : 0;
        normals[p + 1] = face.axis === 1 ? face.sign : 0;
        normals[p + 2] = face.axis === 2 ? face.sign : 0;
        vOff++;
      }
      indices[iOff++] = baseVertex;
      indices[iOff++] = baseVertex + 1;
      indices[iOff++] = baseVertex + 2;
      indices[iOff++] = baseVertex;
      indices[iOff++] = baseVertex + 2;
      indices[iOff++] = baseVertex + 3;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

export interface McStructureOptimizerResult extends OptimizerResult {
  stats: OptimizerStats & {
    inputBlocks: number;
    paletteEntries: number;
    shapedBlocks: number;
    sourceFormat: 'mcstructure';
  };
}

export async function optimizeMcstructure(
  input: ArrayBuffer,
): Promise<McStructureOptimizerResult> {
  const inputBytes = input.byteLength;
  const parsed = parseMcstructure(input);
  const data = buildVoxelData(parsed);
  const groups = buildFaceGroups(data.cubeCells, data.materials, data.dims);

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

  const shaped = buildShapedMeshes(data.shapedInstances, data.materials);
  for (const mesh of shaped.meshes) scene.add(mesh);
  outputTriangles += shaped.triangles;

  const glb = await exportGlb(scene);

  return {
    scene,
    glb,
    stats: {
      inputBytes,
      outputBytes: glb.byteLength,
      inputTriangles: 0,
      outputTriangles,
      materialGroups: data.materials.length,
      voxelFaces,
      inputBlocks: data.filledCount,
      paletteEntries: parsed.palette.length,
      shapedBlocks: data.shapedInstances.length,
      sourceFormat: 'mcstructure',
    },
  };
}
