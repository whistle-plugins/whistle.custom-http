import http from 'http';
import debug from 'debug'
import { WReq } from './types';

const dlog = debug('deko:server');

import { getGrpcReqStream, getGrpcResStream } from './stream';

export default (server: http.Server) => {
  server.on('request', (req: WReq, res) => {
    const { headers } = req.originalReq; // oReq;
    const messageEncoding = headers['grpc-encoding']; // identity,deflate,gzip
    let packageBegin = 1;
    if (messageEncoding === 'identity' || typeof messageEncoding === 'undefined') {
      packageBegin = 0;
    }

    const params = { packageBegin, req };

    const reqStream  = getGrpcReqStream(params)
    const resStream  = getGrpcResStream(params)

    // passThrough and get socket
    const client = req.request((res2: any) => {
      dlog('client resp', res2.statusCode, res2.headers);
      res.writeHead(res2.statusCode, res2.headers); // 可以理解为，完成一次http握手
      res2.pipe(resStream).pipe(res);
    });
    req.pipe(reqStream).pipe(client);
  });
};
