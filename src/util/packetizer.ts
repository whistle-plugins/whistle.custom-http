/**
 * 分包器
 *
 * Mode.bin包的格式(用于传统二进制分包)
 * --------------------------------
 *    1B   |  4B    | length  |
 *  0 or 1 | length | message |
 * --------------------------------
 *
 * Mode.string包格式(用于纯字符串分包)
 * --------------------------------
 *    2B   |         10B           | length  |
 *  10 13  | "length(in utf8 str)" | message |
 * --------------------------------
 */
import debug from 'debug';

const dlog = debug('deko:bufR');
const noop = () => 0;

export enum Mode {
  bin,
  string,
}

export enum OutPut {
  all,
  message,
}

export default class Packetizer {
  onData: (data: Buffer) => any;

  onError: (...args: any[]) => any;

  compressedFlag: Buffer;

  mode: Mode;

  output: OutPut;

  flagLen: number;

  lengthFieldLen: number;

  metaLen: number;

  lenBuffer= Buffer.alloc(0)

  buffer = Buffer.alloc(0)

  parsingHeader = false;

  parsingData = false;

  messageLength = 0;

  constructor({
    start,
    mode = Mode.bin,
    output = OutPut.all,
  }: {
    start: number | number[];
    mode?: Mode
    output?: OutPut
  }) {
    this.mode = mode;
    this.output = output;
    this.compressedFlag = Buffer.from(Array.isArray(start) ? start : [start]);
    this.flagLen = Array.isArray(start) ? start.length : 1;
    this.lengthFieldLen = mode === Mode.bin ? 4 : 10;
    this.metaLen = this.flagLen + this.lengthFieldLen;
    this.onData = noop;
    this.onError = noop;
  }

  write = (data: Buffer) => {
    dlog('write', this.mode);
    if (!Buffer.isBuffer(data)) {
      return;
    }
    this.buffer = this.buffer ? Buffer.concat([this.buffer, data]) : data;
    this.expectPacket();
  };

  expectPacket() {
    dlog('expectPacket', this.mode, this.buffer, this.compressedFlag);
    if (this.parsingHeader) {
      return this.expectHeader();
    }
    const start = this.buffer.indexOf(this.compressedFlag);
    if (start === -1) {
      return;
    }
    this.buffer = this.buffer.slice(start + this.compressedFlag.length);
    dlog('expectPacket2 buffer length', this.buffer.length);
    this.expectHeader();
  }

  expectHeader() {
    dlog('expectHeader', this.mode);
    this.parsingHeader = true;
    if (this.parsingData) {
      return this.expectData();
    }
    if (this.buffer.length < this.metaLen) {
      return;
    }
    const lenBuffer = this.buffer.slice(0, this.lengthFieldLen);
    this.lenBuffer = lenBuffer;
    this.messageLength = this.mode === Mode.bin
      ? lenBuffer.readUInt32BE()
      : Number.parseInt(lenBuffer.toString('utf8').slice(1, 9), 16);
    this.buffer = this.buffer.slice(this.lengthFieldLen);
    dlog(
      'expectHeader2',
      this.buffer.length,
      lenBuffer,
      this.messageLength,
    );

    this.expectData();
  }

  expectData() {
    dlog('expectData buffer length', this.buffer.length, 'messageLen', this.messageLength);
    this.parsingData = true;
    if (this.buffer.length < this.messageLength) {
      return;
    }
    this.parsingHeader = false;
    this.parsingData = false;
    const message = this.buffer.slice(0, this.messageLength);
    this.buffer = this.buffer.slice(this.messageLength);

    const nextData = (this.output === OutPut.message) ? message
      : Buffer.concat([this.compressedFlag, this.lenBuffer, message]);

    try {
      dlog('onData', this.onData, nextData);
      this.onData(nextData);
    } catch (err) {
      this.onError(err, message);
    }
    this.expectPacket();
  }
}
