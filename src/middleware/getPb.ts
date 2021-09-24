import debug from 'debug';
import { DekoMiddleware } from '../types';
import { getPbFromCmd } from '../util/pbService';

const dlog = debug('deko:fn:getPb');

const getPb: DekoMiddleware<any> = async (ctx, next) => {
  const { cmd, hasBussData, dataType, getBussData, pbProcess } = ctx;
  dlog(dataType, cmd, hasBussData);
  if (!cmd || !hasBussData || !(getBussData || pbProcess)) {
    return next();
  }

  const ret = await getPbFromCmd(cmd, dataType);

  if (pbProcess && ret) {
    const { parser, isStream } = ret;
    ctx.isStream = isStream;
    const encodeFn = (bussBuffer: Buffer) => parser.toObject(parser.decode(bussBuffer));
    await pbProcess(encodeFn);
  } else {
    dlog('没有找到pb的命令字', cmd);
  }

  await next();
};

export default getPb;
