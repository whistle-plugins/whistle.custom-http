import debug from 'debug';
import { DekoMiddleware, grpcPrefixed } from '../types';
import { grpcReadOne } from '../util/grpc';

const dlog = debug('deko:fn:grpcDecode');

const grpcDecode: DekoMiddleware<grpcPrefixed> = function grpcDecode(ctx, next) {
  const { req, dataType, data, pipeType } = ctx;
  const { headers, url } = req.originalReq; // oReq;
  dlog(dataType, data, url);

  const contentType = headers['content-type'];

  if (!contentType.startsWith('application/grpc')) {
    throw new Error('content-type should start with "application/grpc"');
  }

  if (!data) {
    dlog('no data');
    return next();
  }

  // 命令字
  ctx.cmd = url;
  const grpcData = grpcReadOne(data);

  ctx.hasBussData = data.length > 0;

  ctx.pbProcess = async (fn) => {
    if (grpcData.message instanceof Buffer) {
      grpcData.messageObj = fn(grpcData.message);
      delete grpcData.message
    }
    return grpcData;
  };

  ctx.decodedData = grpcData;
  dlog(ctx.data, ctx.decodedData);

  return next();
};

export default grpcDecode;
