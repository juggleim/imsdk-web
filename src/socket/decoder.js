import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, MESSAGE_FLAG, CONNECT_ACK_INDEX, PONG_INDEX } from "../enum";
export default function Decoder(cache){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decode = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let result = {}, name = '';
    let { cmd } = msg;
    switch(cmd){
      case SIGNAL_CMD.CONNECT_ACK:
        result = utils.extend(result, { ack: msg.ConnectAckMsgBody, index: CONNECT_ACK_INDEX });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime, code } } = msg;
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
        result = { index: PONG_INDEX }
        name = SIGNAL_NAME.S_PONG;
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
      let { syncTime: receiveTime, type, chatroomId } = message;
      _msg = { topic, receiveTime, type, targetId: chatroomId};
      _name = SIGNAL_NAME.S_NTF;
    }else {
      let payload = Proto.lookup('codec.DownMsg');
      let message = payload.decode(data);
      _msg = msgFormat(message);
    }
    return { _msg, _name };
  }
  function queryAckHandler(msg){

    let { qryAckMsgBody: { index, data } } = msg;
    let { topic, targetId } = cache.get(index);

    let result = { index };
    if(utils.isInclude([COMMAND_TOPICS.HISTORY_MESSAGES, COMMAND_TOPICS.SYNC_MESSAGES, COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES, COMMAND_TOPICS.GET_MSG_BY_IDS], topic)){
      result = getMessagesHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.CONVERSATIONS)){
      result = getConversationsHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION)){
      result = getTotalUnread(index, data);
    }
    return result;
  }
  function getTotalUnread(index, data){
    let payload = Proto.lookup('codec.QryTotalUnreadCountResp');
    let { totalCount: count } = payload.decode(data);
    return {
      index, count
    };
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
    let { senderId, msgId, msgTime, msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, isSend, msgIndex, isReaded, flags } = msg;
    let content = new TextDecoder().decode(msgContent);
    content = utils.parse(content);

    let isUpdated = utils.isEqual(flags, MESSAGE_FLAG.IS_UPDATED);
    let _message = {
      conversationType,
      conversationId,
      senderUserId: senderId, 
      messageId: msgId, 
      sentTime: msgTime,
      name: msgType,
      isSender: !!isSend,
      msgIndex,
      mentionInfo,
      isReaded: !!isReaded,
      isUpdated
    };

    if(utils.isEqual(MESSAGE_TYPE.RECALL, msgType)){
      content = utils.rename(content, { 
        msg_id: 'messageId',
        msg_time: 'sentTime',
        channel_type: 'conversationType',
        sender_id: 'senderUserId',
        receiver_id: 'conversationId'
      });
    }

    if(utils.isEqual(MESSAGE_TYPE.READ_MSG, msgType)){
      delete content.index_scopes;
      let { msgs } = content;
      msgs = utils.map(msgs, ({ msg_id: messageId }) => {
        return { messageId };
      });
      utils.extend(content, { msgs });
    }

    utils.extend(_message, { content })
    return _message;
  }
  return {
    decode
  };
}