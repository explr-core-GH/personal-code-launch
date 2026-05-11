import { describe, it, expect } from 'vitest';
import { parseJavaNbt, readVarint, isGzipped } from '../javaNbt';

function buf(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe('parseJavaNbt', () => {
  it('parses an int with big-endian byte order', () => {
    // root compound, then TAG_Int "x" = 0x00000007 (big-endian)
    const data = buf([
      0x0a, 0x00, 0x00,
      0x03, 0x00, 0x01, 0x78, 0x00, 0x00, 0x00, 0x07,
      0x00,
    ]);
    const parsed = parseJavaNbt(data);
    expect(parsed.value).toEqual({ x: 7 });
  });

  it('parses a string with big-endian length', () => {
    // root compound, TAG_String "n" = "hi"
    const data = buf([
      0x0a, 0x00, 0x00,
      0x08, 0x00, 0x01, 0x6e, 0x00, 0x02, 0x68, 0x69,
      0x00,
    ]);
    const parsed = parseJavaNbt(data);
    expect(parsed.value).toEqual({ n: 'hi' });
  });
});

describe('readVarint', () => {
  it('decodes a single-byte varint', () => {
    expect(readVarint(new Uint8Array([0x05]), 0)).toEqual({ value: 5, bytesRead: 1 });
  });

  it('decodes a two-byte varint', () => {
    // 300 = 0b100101100 → 0xac, 0x02
    expect(readVarint(new Uint8Array([0xac, 0x02]), 0)).toEqual({ value: 300, bytesRead: 2 });
  });

  it('decodes a varint at non-zero offset', () => {
    const buf = new Uint8Array([0xff, 0x05, 0xff]);
    expect(readVarint(buf, 1)).toEqual({ value: 5, bytesRead: 1 });
  });
});

describe('isGzipped', () => {
  it('returns true for the gzip magic header', () => {
    expect(isGzipped(new Uint8Array([0x1f, 0x8b, 0x08, 0x00]).buffer)).toBe(true);
  });

  it('returns false for non-gzip data', () => {
    expect(isGzipped(new Uint8Array([0x0a, 0x00]).buffer)).toBe(false);
  });
});
