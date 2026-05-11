import {
  parseJavaNbt,
  gunzip,
  isGzipped,
  readVarint,
  type JavaNbtCompound,
  type JavaNbtValue,
} from './javaNbt';
import {
  optimizeStructure,
  type OptimizeOptions,
  type StructureData,
  type StructureOptimizerResult,
  type PaletteEntry,
} from './voxelPipeline';
import { type StateMap } from './blockShapes';

/**
 * Parse a Sponge `.schem` schematic file (Java Edition WorldEdit /
 * Litematica). Decompresses gzip if needed, parses the big-endian NBT,
 * decodes the varint-packed BlockData, translates Java block-state
 * strings to the Bedrock-style state names used by the shared shape
 * classifier, and returns a normalized StructureData with palette
 * indices in x-major / y-mid / z-minor order.
 */
export async function parseSchem(buffer: ArrayBuffer): Promise<StructureData> {
  const raw = isGzipped(buffer) ? await gunzip(buffer) : buffer;
  const parsed = parseJavaNbt(raw);

  // Find the Schematic compound. Some files have an unnamed root that *is*
  // the Schematic compound; others wrap it in a named field.
  const root = parsed.value;
  const schematic = (root.Schematic as JavaNbtCompound | undefined) ?? root;

  // v3 nests width/height/length under the top level still, but moves
  // Palette + BlockData under a `Blocks` compound.
  const blocksWrap = (schematic.Blocks as JavaNbtCompound | undefined) ?? schematic;

  const width = readNumeric(schematic.Width);
  const height = readNumeric(schematic.Height);
  const length = readNumeric(schematic.Length);
  if (!width || !height || !length) {
    throw new Error('schem: missing or zero Width/Height/Length');
  }

  const paletteCompound = (blocksWrap.Palette as JavaNbtCompound | undefined)
    ?? (schematic.Palette as JavaNbtCompound | undefined);
  if (!paletteCompound) throw new Error('schem: missing Palette');

  const blockData =
    (blocksWrap.Data as Int8Array | undefined) ??
    (blocksWrap.BlockData as Int8Array | undefined) ??
    (schematic.BlockData as Int8Array | undefined);
  if (!blockData) throw new Error('schem: missing BlockData / Blocks.Data');

  // Palette map: id (int) -> block state string. We need to invert.
  const maxId = Object.values(paletteCompound).reduce(
    (acc: number, v) => Math.max(acc, typeof v === 'number' ? v : 0),
    -1,
  );
  const stateStrings: string[] = new Array(maxId + 1).fill('minecraft:air');
  for (const [stateString, idValue] of Object.entries(paletteCompound)) {
    if (typeof idValue !== 'number') continue;
    if (idValue >= 0 && idValue <= maxId) stateStrings[idValue] = stateString;
  }

  // Translate each palette entry to Bedrock-style {name, states} so the
  // shared classifier handles it identically to .mcstructure entries.
  const palette: PaletteEntry[] = stateStrings.map((s) => javaStateToBedrock(s));

  // BlockData is a sequence of varint-encoded palette indices, in
  // Y * width * length + Z * width + X order. We re-pack into x-major
  // canonical order for the shared pipeline.
  const totalCount = width * height * length;
  const canonical = new Int32Array(totalCount).fill(-1);
  const dataBytes = new Uint8Array(blockData.buffer, blockData.byteOffset, blockData.byteLength);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        if (pos >= dataBytes.length) {
          throw new Error('schem: BlockData truncated');
        }
        const { value, bytesRead } = readVarint(dataBytes, pos);
        pos += bytesRead;
        const canonicalIdx = x * height * length + y * length + z;
        canonical[canonicalIdx] = value;
      }
    }
  }

  return {
    sizeX: width,
    sizeY: height,
    sizeZ: length,
    palette,
    blockIndices: canonical,
  };
}

function readNumeric(value: JavaNbtValue | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return 0;
}

interface ParsedBlockState {
  name: string;
  states: Record<string, string>;
}

function parseBlockStateString(s: string): ParsedBlockState {
  const bracketIdx = s.indexOf('[');
  if (bracketIdx < 0) return { name: s, states: {} };
  const name = s.slice(0, bracketIdx);
  let inner = s.slice(bracketIdx + 1);
  if (inner.endsWith(']')) inner = inner.slice(0, -1);
  const states: Record<string, string> = {};
  if (!inner) return { name, states };
  for (const pair of inner.split(',')) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    states[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return { name, states };
}

const STAIR_FACING_TO_WEIRDO: Record<string, number> = {
  east: 0,
  west: 1,
  south: 2,
  north: 3,
};

/**
 * Translate a Java block-state string into a {name, states} pair that the
 * Bedrock-style shape classifier understands. Only shape-relevant
 * properties are mapped; the rest (waterlogged, shape=straight, etc.)
 * are dropped because they don't affect the visual cube/slab/stair/door
 * silhouette we render.
 */
export function javaStateToBedrock(stateString: string): PaletteEntry {
  const { name, states } = parseBlockStateString(stateString);
  const bedrockStates: StateMap = {};

  if (name.endsWith('_slab')) {
    const type = states['type'];
    if (type === 'double') {
      return { name: name.replace(/_slab$/, '_double_slab'), states: {} };
    }
    bedrockStates['minecraft:vertical_half'] = type === 'top' ? 'top' : 'bottom';
  } else if (name.endsWith('_stairs')) {
    const facing = states['facing'];
    const half = states['half'];
    bedrockStates['weirdo_direction'] = STAIR_FACING_TO_WEIRDO[facing] ?? 0;
    bedrockStates['upside_down_bit'] = half === 'top' ? 1 : 0;
  } else if (name.endsWith('_door')) {
    bedrockStates['minecraft:cardinal_direction'] = states['facing'] ?? 'north';
  }

  return { name, states: bedrockStates };
}

export async function optimizeSchem(
  input: ArrayBuffer,
  options: OptimizeOptions = {},
): Promise<StructureOptimizerResult> {
  const data = await parseSchem(input);
  return optimizeStructure(data, 'schem', input.byteLength, options);
}
