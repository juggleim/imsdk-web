import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto"

export default function IO(config){

  let ws = {};
  let connect = () => {
    let imsocket = Proto.lookup('codec.ImWebsocketMsg')
    let payload = {
      version: 1,
      cmd: 1,
      qos: 1,
      connectMsgBody: {
        appkey: 'appkey',
        token: 'CgZhcHBrZXkaIDAr072n8uOcw5YBeKCcQ+QCw4m6YWhgt99U787/dEJS'
      }
    };
    let message = imsocket.create();
    let message = imsocket.create(payload)
    let buffer = imsocket.encode(message).finish();
    console.log(buffer);
    ws = new WebSocket("ws://120.48.178.248:9002/im");
    ws.addEventListener("open", () => {
      console.log('open');
      ws.send(buffer)
    });
    ws.addEventListener("close", (e) => {
      console.log('close', e);
    });
    ws.addEventListener("error", (e) => {
      console.log('error', e);
    });
    ws.addEventListener("message", (data) => {
      console.log('message', data);
    });
  };

  let disconnect = () => {
    ws && ws.close();
  };

  let io = {
    connect,
    disconnect
  };
  utils.extend(io, Emitter);
  return io;
}