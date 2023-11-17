import Emitter from "../common/emmit";
import utils from "../utils";
import Storage from "../common/storage";
import Proto from "./proto";
import { CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD, QOS} from "../enum";
import BufferEncoder from "./encoder";
import BufferDecoder from "./decoder";
import Network from "../common/network";

export default function IO(config){
  let emitter = Emitter();
  let { appkey, nav } = config;
  nav = nav || 'http://120.48.178.248:8083';
  let ws = {};
  
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decoder = BufferDecoder();

  let connect = ({ token }) => {
    // return Network.getNavi(nav, { appkey, token });
    // return Network.detect(['120.48.178.248:9002']);
    ws = new WebSocket("ws://120.48.178.248:9002/im");
    ws.addEventListener("open", () => {
      sendCommand(SIGNAL_CMD.CONNECT, { appkey, token });
    });
    ws.addEventListener("close", (e) => {
      console.log('close', e);
    });
    ws.addEventListener("error", (e) => {
      console.log('error', e);
    });
    ws.addEventListener("message", ({ data }) => {
      let reader = new FileReader();
      reader.onload = function() {
        bufferHandler(this.result);
      }
      reader.readAsArrayBuffer(data);
    });
  };

  let disconnect = () => {
    ws && ws.close();
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, CONNECT_STATE.DISCONNECTED);
  };

  let orderNum = 0;
  let getNum = () => {
    orderNum += 1;
    if(orderNum > 65535){
      orderNum = 1;
    }
    return orderNum;
  };

  let encoder = BufferEncoder();
  let commandStroage = {};
  let sendCommand = (cmd, data, callback) => {
    callback = callback || utils.noop;
    let index = getNum();
    utils.extend(data, { index });
    commandStroage[index] = {
      callback,
      data
    };
    
    let buffer = encoder.encode(cmd, data);
    ws.send(buffer);
  };
  
  let bufferHandler = (buffer) => {
    let { cmd, result, name } = decoder.decode(buffer);

    if(utils.isEqual(cmd, SIGNAL_CMD.PUBLISH_ACK)){
      let { index } = result;
      let { callback, data } = commandStroage[index];
      utils.extend(data, result);
      return callback(data);
    }
    emitter.emit(name, result);
  }

  let io = {
    connect,
    disconnect,
    sendCommand,
    ...emitter
  };
  return io;
}