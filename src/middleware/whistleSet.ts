import JSONLong from 'json-long';
import debug from 'debug';
import { DekoMiddleware } from '../types';

const dlog = debug('deko:fn:whistleSet');

const whistleSet: DekoMiddleware = function whistleSet(ctx, next) {
  const { decodedData } = ctx;
  const setData = JSONLong.stringify(decodedData);
  const showData = Buffer.from(setData, 'utf8');
  // console.log('whistle set', decodedData);
  ctx.showData = showData;
  dlog(ctx.dataType, ctx.decodedData, ctx.showData);
  return next();
};

export default whistleSet;
