import zlib from 'zlib';
import util from 'util';
import { grpcPrefixed } from '../types';

const unzip = util.promisify(zlib.brotliDecompress);

// https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md

export function grpcReadOne(buffer: Buffer): grpcPrefixed;
export function grpcReadOne(buffer: Buffer, initOffset: number): grpcPrefixed & { offset: number };
export function grpcReadOne(buffer: Buffer, initOffset?: number) {
  let offset = typeof initOffset === 'number' ? initOffset : 0;
  const compressedFlag = buffer.readInt8(offset);
  offset++;

  const messageLength = buffer.readInt32BE(offset);
  offset += 4;

  const message = buffer.slice(offset, offset + messageLength);
  offset += messageLength;

  const ret: grpcPrefixed & { offset?: number } = {
    compressedFlag,
    messageLength,
    message,
  };

  if (typeof initOffset === 'number') {
    ret.offset = offset;
  }

  return ret;
}

// 有可能是一个数组，多个
export function grpcLengthPrefixedRead(buffer: Buffer): grpcPrefixed[] {
  let currOffset = 0;
  const result: grpcPrefixed[] = [];

  while (currOffset < buffer.length) {
    const { offset, ...others } = grpcReadOne(buffer, currOffset);
    currOffset = offset;
    result.push(others);
  }

  return result;
}

export async function grpcWriteOne(obj: grpcPrefixed) {
  const { compressedFlag, messageLength, message } = obj;

  let offset = 0;

  const preBuf = Buffer.alloc(5);

  preBuf.writeInt8(compressedFlag, offset);
  offset++;

  preBuf.writeInt32BE(messageLength, offset);
  offset += 4;

  let mesBuf = Buffer.alloc(0);
  if (message) {
    if (message instanceof Buffer) {
      mesBuf = message;
    } else if (message.type === 'br') {
      const buf = Buffer.from(message.data, 'base64');
      const unzipBuf = await unzip(buf);
      mesBuf = unzipBuf;
    } else if (message.type === 'base64') {
      const buf = Buffer.from(message.data, 'base64');
      mesBuf = buf;
    }
  }

  return Buffer.concat([preBuf, mesBuf]);
}

export async function grpcLengthPrefixedWrite(arr: grpcPrefixed[]) {
  console.log('grpcLengthPrefixedWrite', arr);

  const result = [];
  for await (const buf of arr.map(grpcWriteOne)) {
    result.push(buf);
  }

  return Buffer.concat(result);
}
