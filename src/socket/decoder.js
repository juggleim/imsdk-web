import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS } from "../enum";
export default function Decoder(cache){
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
        result = { messageId, sentTime, index, isSender: true };
        break;
      case SIGNAL_CMD.PUBLISH:
        let {_msg, _name } = publishHandler(msg);
        name = _name;
        result = _msg;
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
        data,
        topic,
        timestamp
      }
    } = msg;
    let _msg = {};
    let _name = SIGNAL_NAME.CMD_RECEIVED;

    // 收到 NTF 直接返回，通过 sync_msgs 同步消息
    if(utils.isEqual(topic, COMMAND_TOPICS.NTF)){
      let payload = Proto.lookup('codec.Notify');
      let message = payload.decode(data);
      let { syncTime: receiveTime, type } = message;
      _msg = { topic, receiveTime, type};
      _name = SIGNAL_NAME.S_NTF;
    }else {
      let payload = Proto.lookup('codec.DownMsg');
      let message = payload.decode(data);
      let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType } = message;
      _msg = msgFormat(message);
      utils.extend(_msg, { conversationId });
    }
    return { _msg, _name };
  }
  function queryAckHandler(msg){

    let { qryAckMsgBody: { index, data } } = msg;
    let { topic } = cache.get(index);

    let result = { index };
    if(utils.isEqual(topic, COMMAND_TOPICS.HISTORY_MESSAGES)||utils.isEqual(topic, COMMAND_TOPICS.SYNC_MESSAGES)){
      result = getMessagesHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.CONVERSATIONS)){
      result = getConversationsHandler(index, data);
    }
    return result;
  }
  function getConversationsHandler(index, data){
    let payload = Proto.lookup('codec.QryConversationsResp');
    let { conversations } = payload.decode(data);
    conversations = conversations.map((conversation) => {
      let { msg, type: conversationType, targetId: conversationId, unreadCount, updateTime: latestReadTime } = conversation;
      let latestMessage = msgFormat(msg);
      return {
        conversationType,
        conversationId,
        unreadCount,
        latestReadTime,
        latestMessage
      };
    });
    return { conversations, index };
  }
  function getMessagesHandler(index, data){
    let payload = Proto.lookup('codec.DownMsgSet');
    let result = payload.decode(data);
    
    let { isFinished, msgs } = result;
    let messages = utils.map(msgs, (msg) => {
      return msgFormat(msg);
    });
    return { isFinished, messages, index };
  }
  function msgFormat(msg){
    let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType, isSend } = msg;
    return {
      conversationType,
      senderUserId: fromId, 
      messageId: msgId, 
      sentTime: msgTime,
      name: msgType,
      isSnder: !!isSend,
      content: new TextDecoder().decode(msgContent)
    }
  }
  return { 
    decode
  };
}