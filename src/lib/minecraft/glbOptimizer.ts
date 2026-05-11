import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { greedyMeshGrid } from './greedyMesh';

const EPS = 1e-3;

export interface OptimizerStats {
  inputBytes: number;
  outputBytes: number;
  inputTriangles: number;
  outputTriangles: number;
  materialGroups: number;
  voxelFaces: number;
}

export interface OptimizerResult {
  scene: THREE.Group;
  glb: ArrayBuffer;
  stats: OptimizerStats;
}

interface FaceKey {
  materialId: string;
  axis: 0 | 1 | 2;
  sign: 1 | -1;
  slice: number;
}

interface FaceGroup extends FaceKey {
  cells: Set<string>;
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  material: THREE.Material;
}

export async function optimizeGlb(input: ArrayBuffer): Promise<OptimizerResult> {
  const inputBytes = input.byteLength;
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(input.slice(0), '');

  const groups = new Map<string, FaceGroup>();
  let inputTriangles = 0;

  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry as THREE.BufferGeometry;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    inputTriangles += countTriangles(geometry);
    stampFaces(geometry, materials, object.matrixWorld, groups);
  });

  const outScene = new THREE.Group();
  outScene.name = 'optimized-minecraft-build';
  let outputTriangles = 0;
  let voxelFaces = 0;

  for (const group of groups.values()) {
    voxelFaces += group.cells.size;
    const mesh = buildMeshFromGroup(group);
    if (!mesh) continue;
    outputTriangles += countTriangles(mesh.geometry as THREE.BufferGeometry);
    outScene.add(mesh);
  }

  const glb = await exportGlb(outScene);

  return {
    scene: outScene,
    glb,
    stats: {
      inputBytes,
      outputBytes: glb.byteLength,
      inputTriangles,
      outputTriangles,
      materialGroups: groups.size,
      voxelFaces,
    },
  };
}

function countTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  const pos = geometry.getAttribute('position');
  return pos ? pos.count / 3 : 0;
}

function stampFaces(
  geometry: THREE.BufferGeometry,
  materials: THREE.Material[],
  worldMatrix: THREE.Matrix4,
  groups: Map<string, FaceGroup>,
): void {
  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!positionAttr) return;
  const indexAttr = geometry.getIndex();
  const triCount = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;
  const matGroups = geometry.groups.length > 0 ? geometry.groups : null;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    a.fromBufferAttribute(positionAttr, i0).applyMatrix4(worldMatrix);
    b.fromBufferAttribute(positionAttr, i1).applyMatrix4(worldMatrix);
    c.fromBufferAttribute(positionAttr, i2).applyMatrix4(worldMatrix);

    const material = resolveMaterial(materials, matGroups, t);
    if (!material) continue;

    classifyAndStamp(a, b, c, material, groups);
  }
}

function resolveMaterial(
  materials: THREE.Material[],
  matGroups: { start: number; count: number; materialIndex?: number }[] | null,
  triIndex: number,
): THREE.Material | null {
  if (!matGroups) return materials[0] ?? null;
  const triStart = triIndex * 3;
  for (const g of matGroups) {
    if (triStart >= g.start && triStart < g.start + g.count) {
      return materials[g.materialIndex ?? 0] ?? null;
    }
  }
  return materials[0] ?? null;
}

function classifyAndStamp(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  material: THREE.Material,
  groups: Map<string, FaceGroup>,
): void {
  const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
  const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
  const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const absX = Math.abs(nx);
  const absY = Math.abs(ny);
  const absZ = Math.abs(nz);

  let axis: 0 | 1 | 2;
  let nAxis: number;
  if (absX >= absY && absX >= absZ) {
    axis = 0;
    nAxis = nx;
  } else if (absY >= absZ) {
    axis = 1;
    nAxis = ny;
  } else {
    axis = 2;
    nAxis = nz;
  }
  if (nAxis === 0) return;
  const sign: 1 | -1 = nAxis > 0 ? 1 : -1;

  const uAxis = ((axis + 1) % 3) as 0 | 1 | 2;
  const vAxis = ((axis + 2) % 3) as 0 | 1 | 2;
  const sliceRaw = (a.getComponent(axis) + b.getComponent(axis) + c.getComponent(axis)) / 3;
  const slice = Math.round(sliceRaw);
  if (Math.abs(slice - sliceRaw) > 0.1) return;

  const ua = a.getComponent(uAxis);
  const ub = b.getComponent(uAxis);
  const uc = c.getComponent(uAxis);
  const va = a.getComponent(vAxis);
  const vb = b.getComponent(vAxis);
  const vc = c.getComponent(vAxis);

  const uMin = Math.min(ua, ub, uc);
  const uMax = Math.max(ua, ub, uc);
  const vMin = Math.min(va, vb, vc);
  const vMax = Math.max(va, vb, vc);

  const cellU0 = Math.floor(uMin + EPS);
  const cellU1 = Math.ceil(uMax - EPS);
  const cellV0 = Math.floor(vMin + EPS);
  const cellV1 = Math.ceil(vMax - EPS);

  const key = `${material.uuid}|${axis}|${sign}|${slice}`;
  let group = groups.get(key);
  if (!group) {
    group = {
      materialId: material.uuid,
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

  for (let u = cellU0; u < cellU1; u++) {
    for (let v = cellV0; v < cellV1; v++) {
      group.cells.add(`${u},${v}`);
      if (u < group.uMin) group.uMin = u;
      if (u + 1 > group.uMax) group.uMax = u + 1;
      if (v < group.vMin) group.vMin = v;
      if (v + 1 > group.vMax) group.vMax = v + 1;
    }
  }
}

function buildMeshFromGroup(group: FaceGroup): THREE.Mesh | null {
  if (group.cells.size === 0) return null;
  const width = group.uMax - group.uMin;
  const height = group.vMax - group.vMin;
  if (width <= 0 || height <= 0) return null;

  const grid = new Uint8Array(width * height);
  for (const cell of group.cells) {
    const [u, v] = cell.split(',').map(Number);
    grid[(v - group.vMin) * width + (u - group.uMin)] = 1;
  }

  const rects = greedyMeshGrid(grid, width, height);
  if (rects.length === 0) return null;

  const positions = new Float32Array(rects.length * 4 * 3);
  const normals = new Float32Array(rects.length * 4 * 3);
  const uvs = new Float32Array(rects.length * 4 * 2);
  const indices = new Uint32Array(rects.length * 6);

  const { axis, sign, slice } = group;
  const uAxis = (axis + 1) % 3;
  const vAxis = (axis + 2) % 3;

  for (let r = 0; r < rects.length; r++) {
    const rect = rects[r];
    const u0 = rect.u + group.uMin;
    const v0 = rect.v + group.vMin;
    const u1 = u0 + rect.w;
    const v1 = v0 + rect.h;

    const corners: [number, number][] = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    const cornerUVs: [number, number][] = [
      [0, 0],
      [rect.w, 0],
      [rect.w, rect.h],
      [0, rect.h],
    ];

    for (let i = 0; i < 4; i++) {
      const [u, v] = corners[i];
      const p = [0, 0, 0];
      p[axis] = slice;
      p[uAxis] = u;
      p[vAxis] = v;
      const base = (r * 4 + i) * 3;
      positions[base] = p[0];
      positions[base + 1] = p[1];
      positions[base + 2] = p[2];
      normals[base] = axis === 0 ? sign : 0;
      normals[base + 1] = axis === 1 ? sign : 0;
      normals[base + 2] = axis === 2 ? sign : 0;
      const uvBase = (r * 4 + i) * 2;
      uvs[uvBase] = cornerUVs[i][0];
      uvs[uvBase + 1] = cornerUVs[i][1];
    }

    const baseIdx = r * 4;
    const idxBase = r * 6;
    if (sign > 0) {
      indices[idxBase] = baseIdx;
      indices[idxBase + 1] = baseIdx + 1;
      indices[idxBase + 2] = baseIdx + 2;
      indices[idxBase + 3] = baseIdx;
      indices[idxBase + 4] = baseIdx + 2;
      indices[idxBase + 5] = baseIdx + 3;
    } else {
      indices[idxBase] = baseIdx;
      indices[idxBase + 1] = baseIdx + 2;
      indices[idxBase + 2] = baseIdx + 1;
      indices[idxBase + 3] = baseIdx;
      indices[idxBase + 4] = baseIdx + 3;
      indices[idxBase + 5] = baseIdx + 2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const material = prepareMaterial(group.material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `mat_${group.material.name || group.material.uuid.slice(0, 8)}_a${group.axis}${group.sign > 0 ? '+' : '-'}`;
  return mesh;
}

function prepareMaterial(source: THREE.Material): THREE.Material {
  const cloned = source.clone();
  const maps: (keyof THREE.MeshStandardMaterial)[] = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'emissiveMap',
    'aoMap',
  ];
  for (const key of maps) {
    const tex = (cloned as unknown as Record<string, unknown>)[key];
    if (tex instanceof THREE.Texture) {
      const newTex = tex.clone();
      newTex.wrapS = THREE.RepeatWrapping;
      newTex.wrapT = THREE.RepeatWrapping;
      newTex.needsUpdate = true;
      (cloned as unknown as Record<string, unknown>)[key] = newTex;
    }
  }
  cloned.side = THREE.FrontSide;
  return cloned;
}

function exportGlb(scene: THREE.Object3D): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('GLTFExporter returned JSON instead of binary glb'));
        }
      },
      (err) => reject(err),
      { binary: true },
    );
  });
}
