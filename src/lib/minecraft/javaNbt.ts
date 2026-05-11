/**
 * Big-endian (Java Edition) NBT reader for Sponge `.schem` schematic
 * files. Strings use a 2-byte BE length prefix followed by Modified UTF-8
 * bytes (interpreted as UTF-8 here — Modified UTF-8 differs only for
 * NUL bytes and code points above the BMP, which schematic strings
 * effectively never contain).
 */

export type JavaNbtValue =
  | number
  | bigint
  | string
  | Int8Array
  | Int32Array
  | BigInt64Array
  | JavaNbtValue[]
  | JavaNbtCompound;

export type JavaNbtCompound = { [key: string]: JavaNbtValue };

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

class JavaNbtReader {
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
    const v = this.view.getInt16(this.pos, false);
    this.pos += 2;
    return v;
  }

  readInt(): number {
    const v = this.view.getInt32(this.pos, false);
    this.pos += 4;
    return v;
  }

  readLong(): bigint {
    const v = this.view.getBigInt64(this.pos, false);
    this.pos += 8;
    return v;
  }

  readFloat(): number {
    const v = this.view.getFloat32(this.pos, false);
    this.pos += 4;
    return v;
  }

  readDouble(): number {
    const v = this.view.getFloat64(this.pos, false);
    this.pos += 8;
    return v;
  }

  readString(): string {
    const len = this.view.getUint16(this.pos, false);
    this.pos += 2;
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, len);
    this.pos += len;
    return this.decoder.decode(bytes);
  }

  readPayload(tag: number): JavaNbtValue {
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
        const arr = new Int8Array(
          this.view.buffer.slice(
            this.view.byteOffset + this.pos,
            this.view.byteOffset + this.pos + len,
          ),
        );
        this.pos += len;
        return arr;
      }
      case TAG_STRING:
        return this.readString();
      case TAG_LIST: {
        const itemTag = this.readByte();
        const len = this.readInt();
        const list: JavaNbtValue[] = [];
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
        throw new Error(`Unknown Java NBT tag id ${tag} at offset ${this.pos}`);
    }
  }

  readCompound(): JavaNbtCompound {
    const result: JavaNbtCompound = {};
    while (true) {
      const tag = this.readByte();
      if (tag === TAG_END) return result;
      const name = this.readString();
      result[name] = this.readPayload(tag);
    }
  }
}

export interface ParsedJavaNbt {
  name: string;
  value: JavaNbtCompound;
}

export function parseJavaNbt(buffer: ArrayBuffer): ParsedJavaNbt {
  const reader = new JavaNbtReader(buffer);
  const tag = reader.readByte();
  if (tag !== TAG_COMPOUND) {
    throw new Error(`Expected root compound (tag 10), got tag ${tag}`);
  }
  const name = reader.readString();
  const value = reader.readCompound();
  return { name, value };
}

/**
 * Decompress a gzipped buffer using the browser's native DecompressionStream.
 * Throws if DecompressionStream isn't available.
 */
export async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream not available in this environment');
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(decompressed);
  return response.arrayBuffer();
}

/**
 * True if the buffer starts with the gzip magic bytes (0x1f 0x8b).
 */
export function isGzipped(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const view = new DataView(buffer);
  return view.getUint8(0) === 0x1f && view.getUint8(1) === 0x8b;
}

/**
 * Decode an unsigned LEB128 (Protobuf-style) varint from a byte array,
 * starting at `offset`. Returns the decoded value and the number of
 * bytes consumed.
 */
export function readVarint(bytes: Int8Array | Uint8Array, offset: number): {
  value: number;
  bytesRead: number;
} {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;
  while (true) {
    if (offset + bytesRead >= bytes.length) {
      throw new Error('Varint truncated');
    }
    const b = bytes[offset + bytesRead] & 0xff;
    bytesRead++;
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift >= 35) throw new Error('Varint too long');
  }
  return { value, bytesRead };
}
