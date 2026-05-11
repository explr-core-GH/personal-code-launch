/**
 * Approximate hex colors for Minecraft block IDs. Used when emitting glb
 * from .mcstructure files (which don't carry textures). Falls back to a
 * deterministic hashed color so unknown blocks remain visually distinct
 * and stable across runs.
 *
 * Returning null means "skip this block" — used for air, non-cube blocks
 * (torches, foliage), and gameplay-only blocks that don't have meaningful
 * visual cubes (the structure block itself).
 */

const NAMED_COLORS: Record<string, string> = {
  // air / tools — skipped via SKIP set below; entry here just for completeness
  'minecraft:air': '#000000',

  // stone family
  'minecraft:stone': '#7e7e7e',
  'minecraft:smooth_stone': '#a5a5a5',
  'minecraft:cobblestone': '#7f7f7f',
  'minecraft:mossy_cobblestone': '#6e7e5d',
  'minecraft:stone_bricks': '#939393',
  'minecraft:chiseled_stone_bricks': '#909090',
  'minecraft:cracked_stone_bricks': '#878787',
  'minecraft:mossy_stone_bricks': '#7d8a72',
  'minecraft:andesite': '#878787',
  'minecraft:diorite': '#bfbfbf',
  'minecraft:granite': '#9a6b5b',
  'minecraft:tuff': '#6e6e6e',
  'minecraft:tuff_bricks': '#707070',
  'minecraft:deepslate': '#4a4a55',
  'minecraft:deepslate_bricks': '#4a4a55',
  'minecraft:deepslate_brick_slab': '#4a4a55',
  'minecraft:deepslate_brick_stairs': '#4a4a55',
  'minecraft:deepslate_brick_wall': '#4a4a55',
  'minecraft:deepslate_brick_double_slab': '#4a4a55',
  'minecraft:deepslate_tiles': '#3d3d48',
  'minecraft:deepslate_tile': '#3d3d48',
  'minecraft:deepslate_tile_slab': '#3d3d48',
  'minecraft:deepslate_tile_stairs': '#3d3d48',
  'minecraft:deepslate_tile_wall': '#3d3d48',
  'minecraft:deepslate_tile_double_slab': '#3d3d48',
  'minecraft:bricks': '#9b5c43',
  'minecraft:brick_block': '#9b5c43',
  'minecraft:mud_bricks': '#8a715a',
  'minecraft:mud_brick_wall': '#8a715a',
  'minecraft:mud_brick_slab': '#8a715a',
  'minecraft:mud_brick_stairs': '#8a715a',
  'minecraft:sandstone': '#dccea0',
  'minecraft:red_sandstone': '#bf6730',

  // wood family
  'minecraft:oak_planks': '#b48b54',
  'minecraft:oak_stairs': '#b48b54',
  'minecraft:oak_slab': '#b48b54',
  'minecraft:oak_double_slab': '#b48b54',
  'minecraft:oak_fence': '#b48b54',
  'minecraft:oak_fence_gate': '#b48b54',
  'minecraft:oak_log': '#6f5436',
  'minecraft:oak_wood': '#6f5436',
  'minecraft:stripped_oak_log': '#b9966d',
  'minecraft:stripped_oak_wood': '#b9966d',
  'minecraft:oak_door': '#7a5a32',
  'minecraft:oak_trapdoor': '#7a5a32',
  'minecraft:spruce_planks': '#6e4d34',
  'minecraft:spruce_stairs': '#6e4d34',
  'minecraft:spruce_slab': '#6e4d34',
  'minecraft:spruce_double_slab': '#6e4d34',
  'minecraft:spruce_fence': '#6e4d34',
  'minecraft:spruce_fence_gate': '#6e4d34',
  'minecraft:spruce_shelf': '#6e4d34',
  'minecraft:spruce_trapdoor': '#6e4d34',
  'minecraft:spruce_door': '#6e4d34',
  'minecraft:spruce_log': '#4f3724',
  'minecraft:stripped_spruce_log': '#ad8761',
  'minecraft:stripped_spruce_wood': '#ad8761',
  'minecraft:dark_oak_planks': '#4f351d',
  'minecraft:dark_oak_door': '#3f2a14',
  'minecraft:birch_planks': '#d4c08a',
  'minecraft:birch_log': '#dcd7c7',
  'minecraft:jungle_planks': '#a07058',
  'minecraft:jungle_log': '#4d3517',
  'minecraft:stripped_jungle_log': '#b69e6b',
  'minecraft:stripped_jungle_wood': '#b69e6b',
  'minecraft:acacia_planks': '#aa5d34',
  'minecraft:mangrove_planks': '#6f3a3a',
  'minecraft:cherry_planks': '#e3b1aa',
  'minecraft:bookshelf': '#876c46',
  'minecraft:chiseled_bookshelf': '#876c46',
  'minecraft:crafting_table': '#825e35',

  // natural / ground
  'minecraft:dirt': '#79553a',
  'minecraft:coarse_dirt': '#73503a',
  'minecraft:rooted_dirt': '#9c734d',
  'minecraft:grass_block': '#65943a',
  'minecraft:grass_path': '#8e7440',
  'minecraft:dirt_path': '#8e7440',
  'minecraft:podzol': '#5d3f1c',
  'minecraft:mycelium': '#6e5e64',
  'minecraft:sand': '#dccea0',
  'minecraft:red_sand': '#c66829',
  'minecraft:gravel': '#888880',
  'minecraft:clay': '#a4abb8',
  'minecraft:snow_block': '#f9fafc',
  'minecraft:ice': '#88a7e0',
  'minecraft:packed_ice': '#88a7e0',

  // metals / ores
  'minecraft:iron_block': '#dadada',
  'minecraft:gold_block': '#fbe27a',
  'minecraft:diamond_block': '#5cdcd5',
  'minecraft:emerald_block': '#3aae50',
  'minecraft:redstone_block': '#a91610',
  'minecraft:iron_ore': '#8c7363',
  'minecraft:gold_ore': '#9c8244',
  'minecraft:coal_ore': '#3a3a3a',
  'minecraft:coal_block': '#1a1a1a',

  // glass / decorative
  'minecraft:glass': '#cfe9f7',
  'minecraft:white_stained_glass': '#f5f5f5',
  'minecraft:black_stained_glass': '#1a1a1a',
  'minecraft:red_stained_glass': '#aa3a3a',
  'minecraft:blue_stained_glass': '#3a4dad',
  'minecraft:green_stained_glass': '#4d7c2e',
  'minecraft:yellow_stained_glass': '#e0c14a',
  'minecraft:iron_bars': '#7b7b7b',
  'minecraft:lantern': '#d4a559',

  // wool
  'minecraft:white_wool': '#e9ecec',
  'minecraft:black_wool': '#1a1a1a',
  'minecraft:red_wool': '#a02d2d',
  'minecraft:blue_wool': '#35468c',
  'minecraft:green_wool': '#516d20',
  'minecraft:yellow_wool': '#f1b521',
  'minecraft:gray_wool': '#4a4f4f',
  'minecraft:light_gray_wool': '#999c9c',
  'minecraft:brown_wool': '#704931',
  'minecraft:pink_wool': '#e9968c',
  'minecraft:lime_wool': '#7eb52a',
  'minecraft:orange_wool': '#dc7b16',

  // liquids
  'minecraft:water': '#3d6ed1',
  'minecraft:lava': '#d04a14',
};

// Blocks we skip entirely (non-cube, mechanical, or air).
const SKIP = new Set<string>([
  'minecraft:air',
  'minecraft:cave_air',
  'minecraft:void_air',
  'minecraft:structure_block',
  'minecraft:structure_void',
  'minecraft:barrier',
  'minecraft:torch',
  'minecraft:wall_torch',
  'minecraft:soul_torch',
  'minecraft:soul_wall_torch',
  'minecraft:redstone_torch',
  'minecraft:redstone_wall_torch',
  'minecraft:short_grass',
  'minecraft:tall_grass',
  'minecraft:fern',
  'minecraft:large_fern',
  'minecraft:dandelion',
  'minecraft:poppy',
  'minecraft:rose_bush',
  'minecraft:flower_pot',
  'minecraft:dead_bush',
  'minecraft:sugar_cane',
  'minecraft:wheat',
  'minecraft:vine',
  'minecraft:redstone_wire',
  'minecraft:rail',
  'minecraft:tripwire',
  'minecraft:tripwire_hook',
  'minecraft:string',
  'minecraft:ladder',
  'minecraft:cobweb',
]);

/**
 * Returns a CSS hex color for the given block name, or null if the block
 * should be omitted from the mesh entirely. The optional `palette`
 * argument applies a color transform across the entire build for a
 * different visual style.
 */
export function colorForBlock(
  name: string,
  palette: ColorPalette = 'classic',
): string | null {
  if (SKIP.has(name)) return null;
  const known = NAMED_COLORS[name];
  const base = known ?? hashedColor(name);
  return applyPalette(base, palette);
}

export type ColorPalette = 'classic' | 'pastel' | 'monochrome' | 'neon' | 'sepia';

export const PALETTE_PRESETS: Array<{
  id: ColorPalette;
  label: string;
  description: string;
}> = [
  { id: 'classic', label: 'Classic Minecraft', description: 'The default Minecraft-ish colors.' },
  { id: 'pastel', label: 'Pastel', description: 'Soft, washed-out colors.' },
  { id: 'monochrome', label: 'Monochrome', description: 'Shades of gray only.' },
  { id: 'neon', label: 'Neon', description: 'Bright, saturated, video-game colors.' },
  { id: 'sepia', label: 'Sepia', description: 'Warm vintage tones.' },
];

/**
 * Apply a stylistic color transform to a base hex color. Each preset is
 * an HSL adjustment so we don't have to re-author every block color in
 * every palette.
 */
function applyPalette(hex: string, palette: ColorPalette): string {
  if (palette === 'classic') return hex;
  const { h, s, l } = hexToHsl(hex);
  switch (palette) {
    case 'pastel':
      return hslToHex(h, Math.max(15, s * 0.45), Math.min(88, l + 25));
    case 'monochrome':
      return hslToHex(0, 0, Math.max(15, Math.min(85, l)));
    case 'neon':
      return hslToHex(h, 95, Math.max(45, Math.min(60, l + 8)));
    case 'sepia': {
      const greyL = 0.299 * (s / 100) + l;
      return hslToHex(35, 30, Math.max(15, Math.min(80, greyL)));
    }
  }
  return hex;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hashedColor(name: string): string {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) {
    hash = (hash ^ name.charCodeAt(i)) >>> 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const hue = hash % 360;
  const sat = 35 + ((hash >>> 8) % 30);
  const light = 40 + ((hash >>> 16) % 25);
  return hslToHex(hue, sat, light);
}

function hslToHex(h: number, s: number, l: number): string {
  const sFrac = s / 100;
  const lFrac = l / 100;
  const c = (1 - Math.abs(2 * lFrac - 1)) * sFrac;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lFrac - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
