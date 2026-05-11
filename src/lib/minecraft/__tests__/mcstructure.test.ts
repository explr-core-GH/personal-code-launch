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
    expect(parsed.paletteNames.length).toBeGreaterThan(0);
    expect(parsed.paletteNames).toContain('minecraft:oak_planks');
    expect(parsed.paletteNames).toContain('minecraft:air');
  });

  it('throws when buffer is empty', () => {
    expect(() => parseMcstructure(new ArrayBuffer(0))).toThrow();
  });
});
