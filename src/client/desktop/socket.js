import common from "../../common/common";
export default function($socket){
  let funcs = [
    'connect',
    'disconnect',
    'getDevice',
    'isConnected',
    'getCurrentUser',
  ];
  let invokes = common.formatProvider(funcs, $socket);
  return invokes;
}