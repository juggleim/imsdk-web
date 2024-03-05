import { COMMAND_TOPICS, CONVERATION_TYPE } from "../../enum";
import utils from "../../utils";
import Proto from "../proto";

export default function getQueryBody({ data, callback, index }){
  let { targetId, userId, topic  } = data;
  let buffer = [];
  
  if(utils.isEqual(topic, COMMAND_TOPICS.HISTORY_MESSAGES)){
    let { conversationType, time, count, order, names } = data;
    let codec = Proto.lookup('codec.QryHisMsgsReq');
    let message = codec.create({
      converId: targetId,
      type: conversationType,
      startTime: time,
      count: count,
      order: order,
      msgTypes: names
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(topic, COMMAND_TOPICS.CONVERSATIONS)){
    let { count, time, order } = data;
    targetId = userId;
    let codec = Proto.lookup('codec.QryConversationsReq');
    let message = codec.create({
      startTime: time,
      count: count,
      order: order
    });
    buffer = codec.encode(message).finish();
  }
  
  if(utils.isEqual(COMMAND_TOPICS.SYNC_CONVERSATIONS, topic)){
    let { count, syncTime } = data;
    targetId = userId;
    let codec = Proto.lookup('codec.SyncConversationsReq');
    let message = codec.create({ startTime: syncTime, count });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(topic, COMMAND_TOPICS.SYNC_MESSAGES)){
    let { syncTime, containsSendBox, sendBoxSyncTime } = data;
    targetId = userId;
    let codec = Proto.lookup('codec.SyncMsgReq');
    let message = codec.create({
      syncTime,
      containsSendBox,
      sendBoxSyncTime
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(topic, COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES)){
    let { syncTime, chatroomId } = data;
    targetId = userId;
    let codec = Proto.lookup('codec.SyncMsgReq');
    let message = codec.create({
      syncTime,
      chatroomId
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_MSG_BY_IDS, topic)){
    let { conversationId: targetId, conversationType: channelType, messageIds: msgIds } = data;
    let codec = Proto.lookup('codec.QryHisMsgByIdsReq');
    let message = codec.create({
      channelType,
      targetId,
      msgIds,
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION, topic)){
    targetId = userId;
    let codec = Proto.lookup('codec.QryTotalUnreadCountReq');
    let message = codec.create({});
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.CLEAR_UNREAD_TOTLAL_CONVERSATION, topic)){
    targetId = userId;
    let codec = Proto.lookup('codec.QryTotalUnreadCountReq');
    let message = codec.create({});
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.READ_MESSAGE, topic)){
    let { messages } = data;
    messages = utils.isArray(messages) ? messages : [messages];
    let channelType = CONVERATION_TYPE.PRIVATE;
    let channelId = '';
    
    let msgs = utils.map(messages, (item) => {
      let { conversationType, conversationId, sentTime, messageId, messageIndex } = item;
      channelType = conversationType;
      channelId = conversationId;
      targetId = conversationId;
      return { 
        msgId: messageId,
        msgTime: sentTime,
        msgIndex: messageIndex
      };
    });
    let codec = Proto.lookup('codec.MarkReadReq');
    let message = codec.create({
      channelType,
      targetId: channelId,
      msgs
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_READ_MESSAGE_DETAIL, topic)){
    let { message } = data;
    let { conversationType: channelType, conversationId, messageId: msgId } = message;
    let codec = Proto.lookup('codec.QryReadDetailReq');
    let msg = codec.create({
      channelType,
      targetId: conversationId,
      msgId,
    });
    targetId = msgId;
    buffer = codec.encode(msg).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_MENTION_MSGS, topic)){
    let { conversationId: targetId, conversationType: channelType, count, order, messageIndex: startIndex } = data;
    let codec = Proto.lookup('codec.QryMentionMsgsReq');
    let message = codec.create({
      targetId,
      channelType,
      count,
      order,
      startIndex
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_FILE_TOKEN, topic)){
    targetId = userId;
    let { type } = data;
    let codec = Proto.lookup('codec.QryUploadTokenReq');
    let message = codec.create({ fileType: type });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_USER_INFO, topic)){
    targetId = userId;
    let codec = Proto.lookup('codec.UserIdReq');
    let message = codec.create({ userId });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_MERGE_MSGS, topic)){
    let { messageId, time, count, order } = data;
    targetId = messageId;
    let codec = Proto.lookup('codec.QryMergedMsgsReq');
    let message = codec.create({ startTime: time, count, order });
    buffer = codec.encode(message).finish();
  }
  
  return {
    qryMsgBody: {
      index,
      topic,
      targetId,
      data: buffer
    }
  }
}