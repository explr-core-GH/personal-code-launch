import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parseMcstructure } from '../mcstructure';

const SAMPLE = '/root/.claude/uploads/fe88b0b6-3b0c-403e-8423-b4d409bbbe0a/b4237cb1-Large_Library_Observatory.mcstructure';

describe('parseMcstructure', () => {
  it.runIf(existsSync(SAMPLE))('parses the sample Library Observatory build', () => {
    const buf = readFileSync(SAMPLE);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const parsed = parseMcstructure(ab);
    expect(parsed.sizeX).toBe(42);
    expect(parsed.sizeY).toBe(30);
    expect(parsed.sizeZ).toBe(25);
    expect(parsed.blockIndices.length).toBe(42 * 30 * 25);
    expect(parsed.palette.length).toBeGreaterThan(0);
    const names = parsed.palette.map((p) => p.name);
    expect(names).toContain('minecraft:oak_planks');
    expect(names).toContain('minecraft:air');
    // Slabs / stairs / doors should carry their states for shape classification
    const aSlab = parsed.palette.find((p) => p.name === 'minecraft:oak_slab');
    expect(aSlab?.states['minecraft:vertical_half']).toMatch(/top|bottom/);
    const aStair = parsed.palette.find((p) => p.name === 'minecraft:spruce_stairs');
    expect(typeof aStair?.states.weirdo_direction).toBe('number');
    const aDoor = parsed.palette.find((p) => p.name === 'minecraft:dark_oak_door');
    expect(aDoor?.states['minecraft:cardinal_direction']).toBeDefined();
  });

  it('throws when buffer is empty', () => {
    expect(() => parseMcstructure(new ArrayBuffer(0))).toThrow();
  });
});
