import { describe, it, expect } from 'vitest';
import { classifyShape, shapeBoxes, isFullCube } from '../blockShapes';

describe('classifyShape', () => {
  it('treats unknown block names as full cubes', () => {
    expect(classifyShape('minecraft:stone', {})).toEqual({ kind: 'cube' });
  });

  it('classifies a top slab', () => {
    expect(
      classifyShape('minecraft:oak_slab', { 'minecraft:vertical_half': 'top' }),
    ).toEqual({ kind: 'slab', half: 'top' });
  });

  it('classifies a bottom slab (default)', () => {
    expect(
      classifyShape('minecraft:oak_slab', { 'minecraft:vertical_half': 'bottom' }),
    ).toEqual({ kind: 'slab', half: 'bottom' });
  });

  it('treats double slabs as full cubes', () => {
    expect(classifyShape('minecraft:spruce_double_slab', {})).toEqual({ kind: 'cube' });
  });

  it('classifies stairs with weirdo_direction and upside_down_bit', () => {
    expect(
      classifyShape('minecraft:spruce_stairs', {
        weirdo_direction: 0,
        upside_down_bit: 0,
      }),
    ).toEqual({ kind: 'stairs', direction: 0, upsideDown: false });
    expect(
      classifyShape('minecraft:spruce_stairs', {
        weirdo_direction: 3,
        upside_down_bit: 1,
      }),
    ).toEqual({ kind: 'stairs', direction: 3, upsideDown: true });
  });

  it('classifies a door with cardinal_direction', () => {
    expect(
      classifyShape('minecraft:dark_oak_door', {
        'minecraft:cardinal_direction': 'west',
        door_hinge_bit: 0,
        open_bit: 0,
        upper_block_bit: 0,
      }),
    ).toEqual({ kind: 'door', facing: 'west' });
  });

  it('classifies a fence as fence regardless of states', () => {
    expect(classifyShape('minecraft:oak_fence', {})).toEqual({ kind: 'fence' });
  });

  it('skips trapdoors and fence gates', () => {
    expect(classifyShape('minecraft:spruce_trapdoor', {}).kind).toBe('skip');
    expect(classifyShape('minecraft:spruce_fence_gate', {}).kind).toBe('skip');
  });
});

describe('shapeBoxes', () => {
  it('returns a single unit box for a cube', () => {
    expect(shapeBoxes({ kind: 'cube' })).toEqual([[0, 0, 0, 1, 1, 1]]);
  });

  it('returns the bottom half for a bottom slab', () => {
    expect(shapeBoxes({ kind: 'slab', half: 'bottom' })).toEqual([[0, 0, 0, 1, 0.5, 1]]);
  });

  it('returns the top half for a top slab', () => {
    expect(shapeBoxes({ kind: 'slab', half: 'top' })).toEqual([[0, 0.5, 0, 1, 1, 1]]);
  });

  it('returns two boxes for stairs (full half + step)', () => {
    const boxes = shapeBoxes({ kind: 'stairs', direction: 0, upsideDown: false });
    expect(boxes).toHaveLength(2);
    // The full half is the bottom; the step is on east+top
    expect(boxes[0]).toEqual([0, 0, 0, 1, 0.5, 1]);
    expect(boxes[1]).toEqual([0.5, 0.5, 0, 1, 1, 1]);
  });

  it('flips Y for upside-down stairs', () => {
    const boxes = shapeBoxes({ kind: 'stairs', direction: 0, upsideDown: true });
    expect(boxes[0]).toEqual([0, 0.5, 0, 1, 1, 1]);
    expect(boxes[1]).toEqual([0.5, 0, 0, 1, 0.5, 1]);
  });

  it('returns a thin slab for a door, on the cardinal side', () => {
    const boxes = shapeBoxes({ kind: 'door', facing: 'west' });
    expect(boxes).toEqual([[0, 0, 0, 0.125, 1, 1]]);
  });

  it('returns a central post for a fence', () => {
    expect(shapeBoxes({ kind: 'fence' })).toEqual([[0.375, 0, 0.375, 0.625, 1, 0.625]]);
  });
});

describe('isFullCube', () => {
  it('returns true only for cube shapes', () => {
    expect(isFullCube({ kind: 'cube' })).toBe(true);
    expect(isFullCube({ kind: 'slab', half: 'top' })).toBe(false);
    expect(isFullCube({ kind: 'fence' })).toBe(false);
    expect(isFullCube({ kind: 'skip' })).toBe(false);
  });
});
