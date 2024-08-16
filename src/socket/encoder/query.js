import { COMMAND_TOPICS, CONVERATION_TYPE, UNDISTURB_TYPE } from "../../enum";
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
    let { count, time, order, conversationType } = data;
    targetId = userId;
    let codec = Proto.lookup('codec.QryConversationsReq');
    let content = {
      startTime: time,
      count: count,
      order: order
    };
    if(!utils.isUndefined(conversationType)){
      utils.extend(content, { channelType: conversationType });
    }
    let message = codec.create(content);
    buffer = codec.encode(message).finish();
  }
  
  if(utils.isEqual(COMMAND_TOPICS.GET_CONVERSATION, topic)){
    let {  conversation, userId } = data;
    let { conversationId, conversationType } = conversation;
    let codec = Proto.lookup('codec.QryConverReq');
    let message = codec.create({ 
      channelType: conversationType,
      targetId: conversationId
    });
    targetId = userId;
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
    let codec = Proto.lookup('codec.SyncChatroomMsgReq');
    let message = codec.create({
      syncTime,
      chatroomId
    });
    targetId = chatroomId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_MSG_BY_IDS, topic)){
    let { conversationId, conversationType: channelType, messageIds: msgIds, userId } = data;
    let codec = Proto.lookup('codec.QryHisMsgByIdsReq');
    let message = codec.create({
      channelType,
      targetId: conversationId,
      msgIds,
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION, topic)){
    targetId = userId;
    let codec = Proto.lookup('codec.QryTotalUnreadCountReq');
    let { conversationTypes = [], ignoreConversations = [] } = data;
    let ingores = [];
    utils.forEach(ignoreConversations, ({ conversationId, conversationType }) => {
      ingores.push({ 
        targetId: conversationId,
        channelType: conversationType
       });
    });
    let filter = {
      channelTypes: conversationTypes,
      ignoreConvers: ingores
    };
    let message = codec.create({ 
      filter: filter
    });
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
      let { conversationType, conversationId, sentTime, messageId, unreadIndex } = item;
      channelType = conversationType;
      channelId = conversationId;
      targetId = conversationId;
      return { 
        msgId: messageId,
        msgTime: sentTime,
        msgIndex: unreadIndex
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
    let { conversationId, conversationType: channelType, count, order, messageIndex: startIndex, userId } = data;
    let codec = Proto.lookup('codec.QryMentionMsgsReq');
    let message = codec.create({
      targetId: conversationId,
      channelType,
      count,
      order,
      startIndex
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.GET_FILE_TOKEN, topic)){
    targetId = userId;
    let { type, ext } = data;
    let codec = Proto.lookup('codec.QryUploadTokenReq');
    let message = codec.create({ fileType: type, ext });
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

  if(utils.isEqual(COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS, topic)){
    let { time, userId } = data;
    let codec = Proto.lookup('codec.QryTopConversReq');
    let message = codec.create({ startTime: time });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }
  

  if(utils.isEqual(COMMAND_TOPICS.RECALL, topic)){
    let { messageId, sentTime, exts, conversationType, conversationId } = data;
    let _exts = [];
    utils.forEach(exts, (value, key) => {
      _exts.push({ key, value });
    });
    let codec = Proto.lookup('codec.RecallMsgReq');
    let message = codec.create({
      targetId: conversationId,
      channelType: conversationType,
      msgId: messageId,
      msgTime: sentTime,
      exts: _exts
    });
    targetId = conversationId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.CLEAR_UNREAD, topic)){
    let { conversations, userId } = data;
    conversations = utils.isArray(conversations) ? conversations : [conversations];
    let codec = Proto.lookup('codec.ClearUnreadReq');
    let list = utils.map(conversations, ({ conversationType, conversationId, unreadIndex }) => {
      return { 
        channelType: conversationType,
        targetId: conversationId,
        latestReadIndex: unreadIndex
      };
    });
    let message = codec.create({
      conversations: list
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.SET_ALL_DISTURB, topic)){
    let { userId, times, timezone, type } = data;
    let codec = Proto.lookup('codec.UserUndisturb');
    let isSwitch = utils.isEqual(UNDISTURB_TYPE.DISTURB, type);
    let message = codec.create({
      switch: isSwitch,
      timezone: timezone,
      rules: times,
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }
  
  if(utils.isEqual(COMMAND_TOPICS.GET_ALL_DISTURB, topic)){
    let { userId } = data;
    let codec = Proto.lookup('codec.Nil');
    let message = codec.create({});
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.MARK_CONVERSATION_UNREAD, topic)){
    let { userId, conversations } = data;
    conversations = utils.map(conversations, (item) => {
      let { conversationId, conversationType, unreadTag } = item;
      return {
        channelType: conversationType,
        targetId: conversationId,
        unreadTag,
      }
    })
    let codec = Proto.lookup('codec.ConversationsReq');
    let message = codec.create({ conversations });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }
  
  let codec = Proto.lookup('codec.QueryMsgBody');
  let message = codec.create({ index, topic, targetId, data: buffer });
  let _buffer = codec.encode(message).finish();
  return { buffer: _buffer };
}