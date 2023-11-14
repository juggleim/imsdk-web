import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto"
import { CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD} from "../enum";
export default function IO(config){
  let emitter = Emitter();
  
  let ws = {};
  let connectState = CONNECT_STATE.DISCONNECTED;
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');

  // 转换事件名称，防止其他数字事件名造成 Event 覆盖
  let eventMap = {};
  let events = [
      [SIGNAL_CMD.CONNECT_ACK, SIGNAL_NAME.S_CONNECT_ACK],
      [SIGNAL_CMD.QUERY_ACK, SIGNAL_NAME.S_QUERY_ACK],
      [SIGNAL_CMD.PUBLISH_ACK, SIGNAL_NAME.S_PUBLICH_ACK],
      [SIGNAL_CMD.PONG, SIGNAL_NAME.S_PONG]
    ]
  utils.forEach(events, (event)=>{
    let [name, value] = event;
    eventMap[name] = value;
  });

  let connect = (auth) => {
    ws = new WebSocket("ws://120.48.178.248:9002/im");
    let payload = {
      version: 1,
      cmd: 0,
      qos: 0,
      connectMsgBody: {
        appkey: 'appkey',
        token: 'CgZhcHBrZXkaIDAr072n8uOcw5YBeKCcQ+QCw4m6YWhgt99U787/dEJS'
      }
    };
    let message = imsocket.create(payload)
    let buffer = imsocket.encode(message).finish();
    ws.addEventListener("open", () => {
      ws.send(buffer)
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
        let msg = imsocket.decode(new Uint8Array(this.result));
        let name = eventMap[msg.cmd];
        emitter.emit(name, msg);
      }
      reader.readAsArrayBuffer(data);
    });
  };

  let disconnect = () => {
    ws && ws.close();
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, CONNECT_STATE.DISCONNECTED);
  };

  let isConnected = () => {
    return utils.isEqual(connectState, CONNECT_STATE.CONNECTED);
  }
  let io = {
    connect,
    disconnect,
    isConnected,
    ...emitter
  };
  return io;
}