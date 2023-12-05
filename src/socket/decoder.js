import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType } from "../enum";
export default function Decoder(cache){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decode = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let result = {}, name = '';
    let { cmd } = msg;
    switch(cmd){
      case SIGNAL_CMD.CONNECT_ACK:
        result = utils.extend(result, { ack: msg.ConnectAckMsgBody });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime, code } } = msg;
        code = code || ErrorType.MESSAGE_RECALL_SUCCESS.code;
        result = { messageId, sentTime, index, isSender: true, code };
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
    let {  publishMsgBody: { targetId, data, topic, timestamp } } = msg;
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
      //TODO: 判断 tragetId 是 fromUserid 还是 targetId
      utils.extend(message, { targetId });
      _msg = msgFormat(message);
    }
    return { _msg, _name };
  }
  function queryAckHandler(msg){

    let { qryAckMsgBody: { index, data } } = msg;
    let { topic, targetId } = cache.get(index);

    let result = { index };
    if(utils.isInclude([COMMAND_TOPICS.HISTORY_MESSAGES, COMMAND_TOPICS.SYNC_MESSAGES], topic)){
      result = getMessagesHandler(index, data, targetId);
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
      let { msg, type: conversationType, targetId, unreadCount, updateTime: latestReadTime } = conversation;
      utils.extend(msg, { targetId });
      let latestMessage = msgFormat(msg);
      return {
        conversationType,
        conversationId: targetId,
        unreadCount,
        latestReadTime,
        latestMessage
      };
    });
    return { conversations, index };
  }
  function getMessagesHandler(index, data, targetId){
    let payload = Proto.lookup('codec.DownMsgSet');
    let result = payload.decode(data);
    
    let { isFinished, msgs } = result;
    let messages = utils.map(msgs, (msg) => {
      utils.extend(msg, { targetId });
      return msgFormat(msg);
    });
    return { isFinished, messages, index };
  }
  function msgFormat(msg){
    let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, isSend, msgIndex } = msg;
    let content = new TextDecoder().decode(msgContent);
    let _message = {
      conversationType,
      conversationId,
      senderUserId: fromId, 
      messageId: msgId, 
      sentTime: msgTime,
      name: msgType,
      isSnder: !!isSend,
      msgIndex,
      content: content,
      mentionInfo
    };

    if(utils.isEqual(MESSAGE_TYPE.RECALL, msgType)){
      content = utils.parse(content);
      content = utils.rename(content, { 
        msg_id: 'messageId',
        msg_time: 'sentTime',
        channel_type: 'conversationType',
        sender_id: 'senderUserId',
        receiver_id: 'targetId'
      });
      utils.extend(_message, { content })
    }
    return _message;
  }
  return { 
    decode
  };
}