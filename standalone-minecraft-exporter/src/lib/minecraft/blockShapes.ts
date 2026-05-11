/**
 * Classifies a Bedrock palette entry (block name + states) into a render
 * shape, and generates the axis-aligned boxes that make up that shape
 * inside a unit voxel at the origin. The voxel pipeline merges all boxes
 * of the same color into one mesh per color.
 *
 * Slabs/stairs/doors/fences are explicitly modeled. Trapdoors, fence
 * gates, and other half-cube blocks are intentionally classified as
 * `skip` per product decision.
 */

export type Shape =
  | { kind: 'cube' }
  | { kind: 'slab'; half: 'top' | 'bottom' }
  | { kind: 'stairs'; direction: 0 | 1 | 2 | 3; upsideDown: boolean }
  | { kind: 'door'; facing: 'north' | 'south' | 'east' | 'west' }
  | { kind: 'fence' }
  | { kind: 'skip' };

export type Box = readonly [number, number, number, number, number, number];

export type StateMap = Record<string, string | number | bigint>;

type DoorFacing = 'north' | 'south' | 'east' | 'west';
const VALID_DOOR_FACINGS: Record<string, DoorFacing> = {
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
};

const SHAPE_SKIP_SUFFIXES = ['_trapdoor', '_fence_gate'];

/**
 * Returns the shape for a palette entry. Unknown blocks default to `cube`.
 * Blocks the caller's `colorForBlock` returns null for (air, foliage, ...)
 * are handled upstream and never reach this classifier.
 */
export function classifyShape(name: string, states: StateMap): Shape {
  for (const suffix of SHAPE_SKIP_SUFFIXES) {
    if (name.endsWith(suffix)) return { kind: 'skip' };
  }
  if (name.endsWith('_double_slab')) return { kind: 'cube' };
  if (name.endsWith('_slab')) {
    const half = states['minecraft:vertical_half'];
    return { kind: 'slab', half: half === 'top' ? 'top' : 'bottom' };
  }
  if (name.endsWith('_stairs')) {
    const dir = (states['weirdo_direction'] ?? 0) as number;
    const upsideDown = (states['upside_down_bit'] ?? 0) === 1;
    const clamped = (Math.max(0, Math.min(3, Math.floor(dir))) as 0 | 1 | 2 | 3);
    return { kind: 'stairs', direction: clamped, upsideDown };
  }
  if (name.endsWith('_door')) {
    const cardinal = states['minecraft:cardinal_direction'] as string | undefined;
    const facing = (cardinal && VALID_DOOR_FACINGS[cardinal]) ?? 'north';
    return { kind: 'door', facing };
  }
  if (name.endsWith('_fence')) return { kind: 'fence' };
  return { kind: 'cube' };
}

const HALF = 0.5;
const FENCE_LO = 0.375;
const FENCE_HI = 0.625;
const DOOR_THIN = 0.125;
const DOOR_FAR = 1 - DOOR_THIN;

/**
 * Returns the boxes (in unit-voxel local coordinates) that make up a shape.
 * Each box is [x0, y0, z0, x1, y1, z1]; the renderer translates them by
 * the voxel's world position.
 *
 * Coordinate convention matches the rest of the pipeline:
 * +X = east, +Y = up, +Z = south.
 */
export function shapeBoxes(shape: Shape): Box[] {
  switch (shape.kind) {
    case 'cube':
      return [[0, 0, 0, 1, 1, 1]];
    case 'slab':
      return shape.half === 'top'
        ? [[0, HALF, 0, 1, 1, 1]]
        : [[0, 0, 0, 1, HALF, 1]];
    case 'stairs': {
      const fullHalf: Box = shape.upsideDown
        ? [0, HALF, 0, 1, 1, 1]
        : [0, 0, 0, 1, HALF, 1];
      // Coordinates of the "step" (small) box. For an upright east-ascending
      // stair the step sits on top (+Y) on the east half (+X).
      let stepX0 = 0;
      let stepX1 = 1;
      let stepZ0 = 0;
      let stepZ1 = 1;
      switch (shape.direction) {
        case 0: // ascending east → step on +X
          stepX0 = HALF;
          stepX1 = 1;
          break;
        case 1: // ascending west → step on -X
          stepX0 = 0;
          stepX1 = HALF;
          break;
        case 2: // ascending south → step on +Z
          stepZ0 = HALF;
          stepZ1 = 1;
          break;
        case 3: // ascending north → step on -Z
          stepZ0 = 0;
          stepZ1 = HALF;
          break;
      }
      const stepY0 = shape.upsideDown ? 0 : HALF;
      const stepY1 = shape.upsideDown ? HALF : 1;
      const step: Box = [stepX0, stepY0, stepZ0, stepX1, stepY1, stepZ1];
      return [fullHalf, step];
    }
    case 'door':
      switch (shape.facing) {
        case 'north':
          return [[0, 0, 0, 1, 1, DOOR_THIN]];
        case 'south':
          return [[0, 0, DOOR_FAR, 1, 1, 1]];
        case 'east':
          return [[DOOR_FAR, 0, 0, 1, 1, 1]];
        case 'west':
          return [[0, 0, 0, DOOR_THIN, 1, 1]];
      }
      return [];
    case 'fence':
      return [[FENCE_LO, 0, FENCE_LO, FENCE_HI, 1, FENCE_HI]];
    case 'skip':
      return [];
  }
}

/**
 * True iff the shape fully fills its voxel — i.e. acts as occlusion for
 * neighboring cubes. Only `cube` shapes do; everything else lets adjacent
 * cube faces be emitted.
 */
export function isFullCube(shape: Shape): boolean {
  return shape.kind === 'cube';
}
