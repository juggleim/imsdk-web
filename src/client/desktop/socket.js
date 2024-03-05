import common from "../../common/common";
export default function($socket){
  let funcs = [
    'connect',
    'disconnect',
    'isConnected',
    'getCurrentUser',
  ];
  let invokes = common.formatProvider(funcs, $socket);
  return invokes;
}