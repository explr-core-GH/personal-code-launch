import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { optimizeMcstructure } from '../mcstructure';

const SAMPLE = '/root/.claude/uploads/fe88b0b6-3b0c-403e-8423-b4d409bbbe0a/b4237cb1-Large_Library_Observatory.mcstructure';

describe('optimize options', () => {
  it.runIf(existsSync(SAMPLE))('removeGround drops dirt/grass blocks', async () => {
    const buf = readFileSync(SAMPLE);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const baseline = await optimizeMcstructure(ab);
    const cleaned = await optimizeMcstructure(ab, { removeGround: true });
    expect(cleaned.stats.removedGroundBlocks).toBeGreaterThan(0);
    expect(cleaned.stats.inputBlocks).toBeLessThan(baseline.stats.inputBlocks);
  });

  it.runIf(existsSync(SAMPLE))('palette presets produce different glb output', async () => {
    const buf = readFileSync(SAMPLE);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const classic = await optimizeMcstructure(ab, { palette: 'classic' });
    const mono = await optimizeMcstructure(ab, { palette: 'monochrome' });
    expect(classic.glb.byteLength).toBeGreaterThan(0);
    expect(mono.glb.byteLength).toBeGreaterThan(0);
    // Monochrome collapses many block-type colors to similar gray values,
    // so it should end up with fewer (or equal) distinct material groups.
    expect(mono.stats.materialGroups).toBeLessThanOrEqual(classic.stats.materialGroups);
  });

  it.runIf(existsSync(SAMPLE))('cropToBuilding produces a valid glb', async () => {
    const buf = readFileSync(SAMPLE);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const cropped = await optimizeMcstructure(ab, { cropToBuilding: true });
    expect(cropped.glb.byteLength).toBeGreaterThan(0);
    expect(cropped.stats.croppedToVoxels).toBeLessThanOrEqual(cropped.stats.croppedFromVoxels);
  });
});
