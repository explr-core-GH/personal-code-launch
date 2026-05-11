import { describe, it, expect } from 'vitest';
import { parseNbt } from '../nbt';

function buf(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe('parseNbt', () => {
  it('parses a minimal compound with an int', () => {
    // TAG_Compound (no name), then TAG_Int "x" = 7 (LE), then TAG_End
    const data = buf([
      0x0a, 0x00, 0x00,
      0x03, 0x01, 0x00, 0x78, 0x07, 0x00, 0x00, 0x00,
      0x00,
    ]);
    const parsed = parseNbt(data);
    expect(parsed.name).toBe('');
    expect(parsed.value).toEqual({ x: 7 });
  });

  it('parses a list-of-ints', () => {
    // TAG_Compound "" -> TAG_List "size" of TAG_Int, length 3, values 42 30 25 -> end
    const data = buf([
      0x0a, 0x00, 0x00,
      0x09, 0x04, 0x00, 0x73, 0x69, 0x7a, 0x65,
      0x03,
      0x03, 0x00, 0x00, 0x00,
      0x2a, 0x00, 0x00, 0x00,
      0x1e, 0x00, 0x00, 0x00,
      0x19, 0x00, 0x00, 0x00,
      0x00,
    ]);
    const parsed = parseNbt(data);
    expect(parsed.value.size).toEqual([42, 30, 25]);
  });

  it('parses a nested compound and string', () => {
    // outer compound with inner compound "inner" containing TAG_String "name" = "hi"
    const data = buf([
      0x0a, 0x00, 0x00,
      0x0a, 0x05, 0x00, 0x69, 0x6e, 0x6e, 0x65, 0x72,
      0x08, 0x04, 0x00, 0x6e, 0x61, 0x6d, 0x65, 0x02, 0x00, 0x68, 0x69,
      0x00,
      0x00,
    ]);
    const parsed = parseNbt(data);
    expect((parsed.value.inner as Record<string, unknown>).name).toBe('hi');
  });
});
