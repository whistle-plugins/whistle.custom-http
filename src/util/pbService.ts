// 示范pb服务
import { load, Root } from 'protobufjs';

const PROTO_HELLO_WORLD = `${__dirname}/../proto/helloworld.proto`;
const PROTO_ROUTE_GUIDE = `${__dirname}/../proto/route_guide.proto`;

type methodType = 'requestType' | 'responseType';
type methodSteamType = 'requestStream' | 'responseStream';


const pbStore: { service: string; root : Root }[] = []

async function initProto(){
  if(pbStore.length){
    return pbStore;
  }

  pbStore.push({
    service: 'Greeter',
    root: await load(PROTO_HELLO_WORLD),
  },{
    service: 'RouteGuide',
    root: await load(PROTO_ROUTE_GUIDE),
  });

  return pbStore;
}

initProto();

export async function getPbFromCmd(cmd: string, dataType: 0 | 1) {
  const urlArr = cmd.split('/');

  const funcName = urlArr.pop();
  const serviceFull = urlArr.pop();
  const service = serviceFull?.split('.').pop();

  const desc = await initProto();

  const pbItem = desc.find((item) => item.service === service);

  if (pbItem?.root) {
    const servicePbObj = pbItem.root.lookupService(service!);

    const method = servicePbObj.methods[funcName!];

    const isStreamStr = ['requestStream', 'responseStream'][dataType];
    const dataTypeStr = ['requestType', 'responseType'][dataType];

    const typeStr = method[dataTypeStr as methodType];

    return {
      parser: pbItem.root.lookupType(typeStr),
      isStream: method[isStreamStr as methodSteamType] ?? false,
    };
  }

  return null;
}
