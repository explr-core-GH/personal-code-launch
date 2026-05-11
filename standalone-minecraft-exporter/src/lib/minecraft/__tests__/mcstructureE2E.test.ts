import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { optimizeMcstructure } from '../mcstructure';

const SAMPLE = '/root/.claude/uploads/fe88b0b6-3b0c-403e-8423-b4d409bbbe0a/b4237cb1-Large_Library_Observatory.mcstructure';

describe('optimizeMcstructure end-to-end', () => {
  it.runIf(existsSync(SAMPLE))(
    'produces a valid glb from the Library Observatory mcstructure',
    async () => {
      const buf = readFileSync(SAMPLE);
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const result = await optimizeMcstructure(ab);

      expect(result.stats.sourceFormat).toBe('mcstructure');
      expect(result.stats.inputBlocks).toBeGreaterThan(100);
      expect(result.stats.materialGroups).toBeGreaterThan(0);
      expect(result.stats.outputTriangles).toBeGreaterThan(0);

      // glb header: "glTF" magic + version 2
      const view = new DataView(result.glb);
      expect(view.getUint32(0, true)).toBe(0x46546c67); // 'glTF' little-endian
      expect(view.getUint32(4, true)).toBe(2);

      console.log('Stats:', result.stats);
    },
    20000,
  );
});
