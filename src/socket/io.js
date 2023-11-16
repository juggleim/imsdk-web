import Emitter from "../common/emmit";
import utils from "../utils";
import Storage from "../common/storage";
import Proto from "./proto";
import { CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD, QOS} from "../enum";
export default function IO(config){
  let emitter = Emitter();
  let { appkey, nav } = config;
  nav = nav || 'http://120.48.178.248:8083';
  let ws = {};
  
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');

  let connect = ({ token }) => {
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
        decodeBuffer(this.result);
      }
      reader.readAsArrayBuffer(data);
    });
  };

  let disconnect = () => {
    ws && ws.close();
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, CONNECT_STATE.DISCONNECTED);
  };

  let getNav = (token) => {
    return utils.request(nav, {
      headers: {
        appkey, token
      }
    }).then((result) => {
      console.log(result)
    })
  };

  let orderNum = 0;
  let getNum = () => {
    orderNum += 1;
    if(orderNum > 65535){
      orderNum = 1;
    }
    return orderNum;
  };

  let commandStroage = {};
  let sendCommand = (cmd, data, callback) => {
    callback = callback || utils.noop;
    let index = getNum();
    utils.extend(data, { index });
    commandStroage[index] = {
      callback,
      data
    };
    
    let buffer = encodeBuffer(cmd, data);
    ws.send(buffer);
  };
  
  let encodeBuffer = (cmd, data) => {
    let payload = { 
      version: 1, 
      cmd: cmd,
      qos: QOS.YES
    };
    let topics = {
      1: 'p_msg',
      2: 'g_msg'
    };
    switch(cmd){
      case SIGNAL_CMD.CONNECT:
        let { appkey, token } = data;
        utils.extend(payload, {
          connectMsgBody: { appkey, token }
        });
        break;
      case SIGNAL_CMD.PUBLISH:
        let { conversationId: targetId, conversationType, name, content, index   } = data;

        let upMsgCodec = Proto.lookup('codec.UpMsg');
        let upMessage = upMsgCodec.create({
          msgType: name,
          msgContent: new TextEncoder().encode(content)
        });
        let upMsgBuffer = upMsgCodec.encode(upMessage).finish();
        // upMsgBuffer = new Uint8Array(upMsgBuffer)
        let topic = topics[conversationType];        
        utils.extend(payload, {
          publishMsgBody: {
            index,
            targetId,
            topic,
            data: upMsgBuffer
          }
        });
        break;
      case SIGNAL_CMD.QUERY:
        break;
      case SIGNAL_CMD.PING:
        break;
    }
    let message = imsocket.create(payload);
    let buffer = imsocket.encode(message).finish();
    return buffer;
  };
  
  let decodeBuffer = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let { cmd } = msg;
    switch(cmd){
      case SIGNAL_CMD.CONNECT_ACK:
        emitter.emit(SIGNAL_NAME.S_CONNECT_ACK, msg);
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime } } = msg;
        let { callback, data } = commandStroage[index];
        utils.extend(data, { messageId, sentTime });
        callback(data);
        break;
      case SIGNAL_CMD.PUBLISH:
        let { 
          publishMsgBody: { 
            targetId: conversationId,
            data: publistData 
          }
        } = msg;
        let message = Proto.lookup('codec.DownMsg');
        let $msg = message.decode(publistData);
        let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType } = $msg;
        emitter.emit(SIGNAL_NAME.CMD_RECEIVED, { 
          conversationId,
          conversationType,
          senderUserId: fromId, 
          messageId: msgId, 
          sentTime: msgTime,
          name: msgType,
          content: new TextDecoder().decode(msgContent)
        });
        break;
      case SIGNAL_CMD.QUERY_ACK:
        break;
      case SIGNAL_CMD.PONG:
        break;
    }
  };

  let io = {
    connect,
    disconnect,
    sendCommand,
    ...emitter
  };
  return io;
}