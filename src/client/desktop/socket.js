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
  invokes.setServerUrlProider = (callback) => {
    webAgent.setServerUrlProider(callback)
  };
  return invokes;
}