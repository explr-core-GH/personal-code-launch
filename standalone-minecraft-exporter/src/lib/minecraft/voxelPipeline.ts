import * as THREE from 'three';
import {
  buildMeshFromGroup,
  exportGlb,
  type FaceGroup,
  type OptimizerStats,
} from './glbOptimizer';
import { colorForBlock, type ColorPalette } from './blockColors';
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

/**
 * Canonical structure shape consumed by the voxel-to-glb pipeline. Both
 * `.mcstructure` and `.schem` parsers normalize into this form: palette
 * entries with name + states, plus a flat Int32Array of palette indices
 * in x-major / y-mid / z-minor order (-1 = no block).
 */
export interface StructureData {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  palette: PaletteEntry[];
  blockIndices: Int32Array;
}

export interface OptimizeOptions {
  /** Skip dirt/grass/sand/etc. so the build floats free of its terrain. */
  removeGround?: boolean;
  /** Re-center on the bounding box of visible blocks (drops surrounding empty space). */
  cropToBuilding?: boolean;
  /** Color preset for block-name → hex mapping. Defaults to 'classic'. */
  palette?: ColorPalette;
}

export interface StructureOptimizerStats extends OptimizerStats {
  inputBlocks: number;
  paletteEntries: number;
  shapedBlocks: number;
  removedGroundBlocks: number;
  croppedFromVoxels: number;
  croppedToVoxels: number;
  sourceFormat: 'mcstructure' | 'schem';
}

export interface StructureOptimizerResult {
  scene: THREE.Group;
  glb: ArrayBuffer;
  stats: StructureOptimizerStats;
}

const GROUND_BLOCKS = new Set<string>([
  'minecraft:dirt',
  'minecraft:coarse_dirt',
  'minecraft:rooted_dirt',
  'minecraft:podzol',
  'minecraft:mycelium',
  'minecraft:grass_block',
  'minecraft:grass_path',
  'minecraft:dirt_path',
  'minecraft:gravel',
  'minecraft:sand',
  'minecraft:red_sand',
  'minecraft:clay',
]);

interface ShapedInstance {
  matId: number;
  shape: Shape;
  x: number;
  y: number;
  z: number;
}

interface VoxelData {
  dims: [number, number, number];
  cubeCells: Int32Array;
  shapedInstances: ShapedInstance[];
  materials: THREE.Material[];
  filledCount: number;
  removedGroundCount: number;
}

function voxelIndex(x: number, y: number, z: number, sy: number, sz: number): number {
  return x * sy * sz + y * sz + z;
}

function buildVoxelData(
  data: StructureData,
  options: OptimizeOptions,
): VoxelData {
  const { sizeX, sizeY, sizeZ, palette, blockIndices } = data;
  const palettePref = options.palette ?? 'classic';

  // Per palette slot: classify shape and resolve color → materialId.
  // Slots that are "skip" (air, foliage, ground when removeGround is on) get matId -1.
  const slotShape: Shape[] = palette.map((p) => {
    if (options.removeGround && GROUND_BLOCKS.has(p.name)) return { kind: 'skip' };
    const color = colorForBlock(p.name, palettePref);
    if (color === null) return { kind: 'skip' };
    return classifyShape(p.name, p.states);
  });
  const slotColor: (string | null)[] = palette.map((p) => {
    if (options.removeGround && GROUND_BLOCKS.has(p.name)) return null;
    return colorForBlock(p.name, palettePref);
  });

  const colorToMaterialId = new Map<string, number>();
  const materials: THREE.Material[] = [];
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
      colorToMaterialId.set(color, matId);
    }
    slotMatId[p] = matId;
  }

  const cubeCells = new Int32Array(sizeX * sizeY * sizeZ).fill(AIR_INDEX);
  const shapedInstances: ShapedInstance[] = [];
  let filledCount = 0;
  let removedGroundCount = 0;

  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        const i = voxelIndex(x, y, z, sizeY, sizeZ);
        const pi = blockIndices[i];
        if (pi < 0 || pi >= palette.length) continue;
        if (options.removeGround && GROUND_BLOCKS.has(palette[pi].name)) {
          removedGroundCount++;
          continue;
        }
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
    filledCount,
    removedGroundCount,
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

const BOX_FACES: ReadonlyArray<{
  axis: 0 | 1 | 2;
  sign: 1 | -1;
  corners: ReadonlyArray<readonly [number, number, number]>;
}> = [
  { axis: 0, sign: 1, corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { axis: 0, sign: -1, corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { axis: 1, sign: 1, corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { axis: 1, sign: -1, corners: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]] },
  { axis: 2, sign: 1, corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { axis: 2, sign: -1, corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
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
        const p = vOff * 3;
        positions[p] = x0 + cx * sx;
        positions[p + 1] = y0 + cy * sy;
        positions[p + 2] = z0 + cz * sz;
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

function buildShapedMeshes(
  instances: ShapedInstance[],
  materials: THREE.Material[],
): { meshes: THREE.Mesh[]; triangles: number } {
  if (instances.length === 0) return { meshes: [], triangles: 0 };

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

/**
 * Walk all geometry under `root` and translate every vertex by (dx, dy, dz).
 * Used by `cropToBuilding` to shift the model so its AABB starts at the origin.
 */
function shiftScene(root: THREE.Object3D, dx: number, dy: number, dz: number): void {
  if (dx === 0 && dy === 0 && dz === 0) return;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const pos = obj.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!pos) return;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += dx;
      arr[i + 1] += dy;
      arr[i + 2] += dz;
    }
    pos.needsUpdate = true;
  });
}

function computeAabb(scene: THREE.Object3D): {
  min: [number, number, number];
  max: [number, number, number];
} | null {
  const box = new THREE.Box3().setFromObject(scene);
  if (!isFinite(box.min.x) || !isFinite(box.max.x)) return null;
  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
  };
}

export async function optimizeStructure(
  data: StructureData,
  sourceFormat: 'mcstructure' | 'schem',
  inputBytes: number,
  options: OptimizeOptions = {},
): Promise<StructureOptimizerResult> {
  const voxelData = buildVoxelData(data, options);
  const groups = buildFaceGroups(voxelData.cubeCells, voxelData.materials, voxelData.dims);

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

  const shaped = buildShapedMeshes(voxelData.shapedInstances, voxelData.materials);
  for (const mesh of shaped.meshes) scene.add(mesh);
  outputTriangles += shaped.triangles;

  const croppedFromVoxels = data.sizeX * data.sizeY * data.sizeZ;
  let croppedToVoxels = croppedFromVoxels;
  if (options.cropToBuilding) {
    const aabb = computeAabb(scene);
    if (aabb) {
      shiftScene(scene, -aabb.min[0], -aabb.min[1], -aabb.min[2]);
      const w = Math.ceil(aabb.max[0] - aabb.min[0]);
      const h = Math.ceil(aabb.max[1] - aabb.min[1]);
      const l = Math.ceil(aabb.max[2] - aabb.min[2]);
      croppedToVoxels = Math.max(1, w * h * l);
    }
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
      materialGroups: voxelData.materials.length,
      voxelFaces,
      inputBlocks: voxelData.filledCount,
      paletteEntries: data.palette.length,
      shapedBlocks: voxelData.shapedInstances.length,
      removedGroundBlocks: voxelData.removedGroundCount,
      croppedFromVoxels,
      croppedToVoxels,
      sourceFormat,
    },
  };
}
