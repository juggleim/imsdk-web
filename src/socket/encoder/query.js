import { COMMAND_TOPICS } from "../../enum";
import utils from "../../utils";
import Proto from "../proto";

export default function getQueryBody({ data, callback, index }){
  let { targetId, userId, topic  } = data;
  let buffer = [];
  
  if(utils.isEqual(topic, COMMAND_TOPICS.HISTORY_MESSAGES)){
    let { conversationType, time, count, order } = data;
    let codec = Proto.lookup('codec.QryHisMsgsReq');
    let message = codec.create({
      converId: targetId,
      type: conversationType,
      startTime: time,
      count: count,
      order: order
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
  
  return {
    qryMsgBody: {
      index,
      topic,
      targetId,
      data: buffer
    }
  }
}