import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { HeadType } from './enum'

declare interface WReq extends IncomingMessage {
  passThrough: Function;
  res?: ServerResponse;
  sessionStorage: {
    set: (key: string, value: any) => any;
    get: (key: string) => any;
    remove: (key: string) => void;
  };
  request: (...args: any[])=>any;
  originalReq: {
    clientIp: string;
    customParser: boolean;
    id: string;
    headers: {
      host: string;
      'x-forwarded-for': string;
      'x-whistle-policy'?: string;
      'x-whistle-request-tunnel-ack'?: string;
      'x-lack-proxy-proto'?: string;
      connection?: string;
      [key: string]: string;
    };
    isFromPlugin: boolean;
    ruleValue: string;
    ruleUrl: string;
    pipeValue: string;
    hostValue: string;
    fullUrl: string;
    url: string;
    realUrl: string;
    relativeUrl: string;
    method: 'GET' | 'POST';
    clientPort: string;
    globalValue: string;
    proxyValue: string;
    pacValue: string;
  };
}

declare interface WSocket extends Socket {
  writeBin: Function;
  writeText: Function;
}

declare module 'json-long' {
  export function parse(args: string): any;
  export function stringify(...args: any[]): string;
}

interface PbDesc {
  msgs: string; // pb文件字符串
  itfReqSchema: string; // 请求的schema
  itfRspSchema: string; // 响应的schema
  itfId: number;
}

declare type PipeType = 'read' | 'write';

export function setBussData(data: Buffer): void;
export function setBussData<T>(data: T, meta?: any): void;

declare type pbBuffer = Buffer | { type: 'br' | 'base64' ; data: string };

declare interface grpcPrefixed<T = any> {
  compressedFlag: number;
  messageLength: number;
  message?: pbBuffer;
  messageObj?: T;
}

declare type DekoCtx<T = any> = {
  req: WReq;
  pipeType?: PipeType;
  data?: Buffer;
  dataType: HeadType;
  cmd?: string; // 命令字
  hasSetBussData?: () => boolean; // 检测是否已经设置了解包后的业务数据
  hasBussData?: boolean; // 有无业务数据，无则不用解
  userPbId?: number; // 用户指定的pbId
  pbDescList?: PbDesc[];
  decodedData?: T;
  showData?: Buffer;
  isStream?: boolean;
  pbProcess?: (args: any) => any;
  setBussData?: typeof setBussData; // 解开pb后，设置业务数据
  getBussData?: (fn: any) => typeof fn extends Function ? ReturnType<typeof fn> : pbBuffer; // 获取业务数据，可能是buffer,也可能是json结构
};

type DekoMiddleware<T = never> = (ctx: DekoCtx<T>, next: () => Promise<any>) => void;