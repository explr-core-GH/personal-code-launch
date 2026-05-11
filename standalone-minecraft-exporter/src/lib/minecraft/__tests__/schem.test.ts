import { describe, it, expect } from 'vitest';
import { javaStateToBedrock } from '../schem';

describe('javaStateToBedrock', () => {
  it('passes through plain block names', () => {
    expect(javaStateToBedrock('minecraft:stone')).toEqual({
      name: 'minecraft:stone',
      states: {},
    });
  });

  it('maps a top-half slab to minecraft:vertical_half=top', () => {
    expect(javaStateToBedrock('minecraft:oak_slab[type=top,waterlogged=false]')).toEqual({
      name: 'minecraft:oak_slab',
      states: { 'minecraft:vertical_half': 'top' },
    });
  });

  it('rewrites double slabs to *_double_slab', () => {
    expect(javaStateToBedrock('minecraft:oak_slab[type=double,waterlogged=false]')).toEqual({
      name: 'minecraft:oak_double_slab',
      states: {},
    });
  });

  it('maps stair facing+half to weirdo_direction + upside_down_bit', () => {
    expect(
      javaStateToBedrock('minecraft:spruce_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]'),
    ).toEqual({
      name: 'minecraft:spruce_stairs',
      states: { weirdo_direction: 0, upside_down_bit: 0 },
    });
    expect(
      javaStateToBedrock('minecraft:spruce_stairs[facing=north,half=top,shape=straight,waterlogged=false]'),
    ).toEqual({
      name: 'minecraft:spruce_stairs',
      states: { weirdo_direction: 3, upside_down_bit: 1 },
    });
  });

  it('maps door facing to minecraft:cardinal_direction', () => {
    expect(
      javaStateToBedrock('minecraft:oak_door[facing=west,half=lower,hinge=left,open=false,powered=false]'),
    ).toEqual({
      name: 'minecraft:oak_door',
      states: { 'minecraft:cardinal_direction': 'west' },
    });
  });
});
