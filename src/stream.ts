import { PassThrough } from 'stream';
import debug from 'debug';
import { reqComposer, resComposer } from './middleware';

import grpcDecode from './middleware/grpcDecode';
import getPb from './middleware/getPb';
import whistleSet from './middleware/whistleSet';
import Packetizer from './util/packetizer';
import { WReq } from './types';

// 此文件封装的是node stream 的api，外部可以用pipe的方式使用

const dlog = debug('deko:stream');

const middlewares = [grpcDecode, getPb, whistleSet];

const dekoStream = (composer: typeof reqComposer | typeof resComposer)=>({
  packageBegin,
  req
}:{
  packageBegin: number;
  req: WReq
})=>{
  const pt = new PassThrough();
  const packer = new Packetizer({ start: packageBegin });

  const { url, id } = req.originalReq; 

  // req
  pt._transform = (chunk, _, callback) => {
    dlog(id, chunk.length, url);
    packer.write(chunk);
    callback(null, chunk);
  };

  packer.onData = composer(req, middlewares);

  return pt;
}

export const getGrpcReqStream = dekoStream(reqComposer);
export const getGrpcResStream = dekoStream(resComposer);
