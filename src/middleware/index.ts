import compose from 'koa-compose';
import { WReq, DekoMiddleware, DekoCtx } from '../types';
import { HeadType } from '../types/enum'

const frameTuple = ['clientFrame', 'serverFrame'];

const composer = (dataType: HeadType, pipeType?: 'read' | 'write') => (
  req: WReq,
  middlewares: DekoMiddleware[],
) => {
  const dispatch = compose<DekoCtx<any>>(middlewares as any);
  return (data: Buffer | any) => {
    const ctx: DekoCtx = {
      req,
      [pipeType === 'write' ? 'decodedData' : 'data']: data,
      dataType,
      pipeType,
    };
    console.log('begin dispatch', dataType, pipeType, ctx.data, ctx.decodedData);
    (dispatch as any)(ctx)
      .then(() => {
        const { req: ctxReq, data: binData, showData, dataType } = ctx;
        const { socket } = ctxReq;
        if (pipeType) {
          const nextData = pipeType === 'read' ? showData : binData;
          if (socket) {
            socket.write(nextData!);
          }
        } else {
          // 使用server的形式，此时由外部程序自行 passThrough
          ctxReq.emit(frameTuple[dataType], showData);
        }
      })
      .catch((e: Error) => {
        console.error(e);
      });
  };
};

export const reqComposer = composer(HeadType.REQUEST);
export const resComposer = composer(HeadType.RESPONSE);