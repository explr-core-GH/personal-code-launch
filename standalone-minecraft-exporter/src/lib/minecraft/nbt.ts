/**
 * Minimal little-endian NBT reader for Bedrock-format files
 * (.mcstructure, .mcworld level.dat). Strings use 2-byte LE length
 * prefix + UTF-8 bytes. All multi-byte numbers are little-endian.
 */

export type NbtValue =
  | number
  | bigint
  | string
  | Int8Array
  | Int32Array
  | BigInt64Array
  | NbtValue[]
  | NbtCompound;

export type NbtCompound = { [key: string]: NbtValue };

const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_SHORT = 2;
const TAG_INT = 3;
const TAG_LONG = 4;
const TAG_FLOAT = 5;
const TAG_DOUBLE = 6;
const TAG_BYTE_ARRAY = 7;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;
const TAG_INT_ARRAY = 11;
const TAG_LONG_ARRAY = 12;

class NbtReader {
  private view: DataView;
  private pos: number;
  private decoder = new TextDecoder('utf-8');

  constructor(buffer: ArrayBuffer, offset = 0) {
    this.view = new DataView(buffer);
    this.pos = offset;
  }

  readByte(): number {
    const v = this.view.getInt8(this.pos);
    this.pos += 1;
    return v;
  }

  readShort(): number {
    const v = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return v;
  }

  readInt(): number {
    const v = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return v;
  }

  readLong(): bigint {
    const v = this.view.getBigInt64(this.pos, true);
    this.pos += 8;
    return v;
  }

  readFloat(): number {
    const v = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }

  readDouble(): number {
    const v = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  }

  readString(): string {
    const len = this.view.getUint16(this.pos, true);
    this.pos += 2;
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, len);
    this.pos += len;
    return this.decoder.decode(bytes);
  }

  readPayload(tag: number): NbtValue {
    switch (tag) {
      case TAG_BYTE:
        return this.readByte();
      case TAG_SHORT:
        return this.readShort();
      case TAG_INT:
        return this.readInt();
      case TAG_LONG:
        return this.readLong();
      case TAG_FLOAT:
        return this.readFloat();
      case TAG_DOUBLE:
        return this.readDouble();
      case TAG_BYTE_ARRAY: {
        const len = this.readInt();
        const arr = new Int8Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.readByte();
        return arr;
      }
      case TAG_STRING:
        return this.readString();
      case TAG_LIST: {
        const itemTag = this.readByte();
        const len = this.readInt();
        const list: NbtValue[] = [];
        if (itemTag === TAG_END) return list;
        for (let i = 0; i < len; i++) list.push(this.readPayload(itemTag));
        return list;
      }
      case TAG_COMPOUND:
        return this.readCompound();
      case TAG_INT_ARRAY: {
        const len = this.readInt();
        const arr = new Int32Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.readInt();
        return arr;
      }
      case TAG_LONG_ARRAY: {
        const len = this.readInt();
        const arr = new BigInt64Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.readLong();
        return arr;
      }
      default:
        throw new Error(`Unknown NBT tag id ${tag} at offset ${this.pos}`);
    }
  }

  readCompound(): NbtCompound {
    const result: NbtCompound = {};
    while (true) {
      const tag = this.readByte();
      if (tag === TAG_END) return result;
      const name = this.readString();
      result[name] = this.readPayload(tag);
    }
  }
}

export interface ParsedNbt {
  name: string;
  value: NbtCompound;
}

export function parseNbt(buffer: ArrayBuffer): ParsedNbt {
  const reader = new NbtReader(buffer);
  const tag = reader.readByte();
  if (tag !== TAG_COMPOUND) {
    throw new Error(`Expected root compound (tag 10), got tag ${tag}`);
  }
  const name = reader.readString();
  const value = reader.readCompound();
  return { name, value };
}
