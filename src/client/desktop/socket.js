import common from "../../common/common";
export default function($socket, { webAgent }){
  let funcs = [
    'connect',
    'disconnect',
    'getDevice',
    'isConnected',
    'getCurrentUser',
  ];
  let invokes = common.formatProvider(funcs, $socket);
  invokes.setSetServerUrlProider = (callback) => {
    webAgent.setSetServerUrlProider(callback)
  };
  return invokes;
}