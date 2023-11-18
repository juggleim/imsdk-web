import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE } from "../enum";
export default function Decoder(){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decode = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let result = {}, name = '';
    let { cmd } = msg;
    switch(cmd){
      case SIGNAL_CMD.CONNECT_ACK:
        result = utils.extend(msg, { state: CONNECT_STATE.CONNECTED });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime } } = msg;
        result = { messageId, sentTime, index };
        break;
      case SIGNAL_CMD.PUBLISH:
        result = publishHandler(msg);
        name = SIGNAL_NAME.CMD_RECEIVED;
        break;
      case SIGNAL_CMD.QUERY_ACK:
        result = queryAckHandler(msg);
        name = SIGNAL_NAME.S_QUERY_ACK;
        break;
      case SIGNAL_CMD.PONG:
        break;
    }
    return {
      cmd, result, name
    };
  };
 
  function publishHandler(msg){
    let { 
      publishMsgBody: { 
        targetId: conversationId,
        data: data 
      }
    } = msg;
    let payload = Proto.lookup('codec.DownMsg');
    let message = payload.decode(data);
    let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType } = message;
    let _msg = msgFormat(message);
    utils.extend(_msg, { conversationId });
    return _msg;
  }
  function queryAckHandler(msg){
    let { qryAckMsgBody: { index, data } } = msg;
    let payload = Proto.lookup('codec.DownMsgSet');
    let result = payload.decode(data);
    
    let { isFinished, msgs } = result;
    let messages = utils.map(msgs, (msg) => {
      return msgFormat(msg);
    });
    return { isFinished, messages, index };
  }
  function msgFormat(msg){
    let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType } = msg;
    return {
      conversationType,
      senderUserId: fromId, 
      messageId: msgId, 
      sentTime: msgTime,
      name: msgType,
      content: new TextDecoder().decode(msgContent)
    }
  }
  return { 
    decode
  };
}