import { parseNbt, type NbtCompound, type NbtValue } from './nbt';
import {
  optimizeStructure,
  type OptimizeOptions,
  type StructureData,
  type StructureOptimizerResult,
} from './voxelPipeline';
import { type StateMap } from './blockShapes';

/**
 * Parse a Bedrock `.mcstructure` file (raw little-endian NBT, no gzip).
 * Returns a normalized StructureData (x-major palette indices) consumed
 * by the shared voxel pipeline.
 */
export function parseMcstructure(buffer: ArrayBuffer): StructureData {
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

  const paletteEntries = blockPalette.map((entry) => {
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

export async function optimizeMcstructure(
  input: ArrayBuffer,
  options: OptimizeOptions = {},
): Promise<StructureOptimizerResult> {
  const data = parseMcstructure(input);
  return optimizeStructure(data, 'mcstructure', input.byteLength, options);
}
