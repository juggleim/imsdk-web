import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_CMD, QOS, CONVERATION_TYPE, COMMAND_TOPICS, PLATFORM} from "../enum";
export default function Encoder(cache){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  
  let encode = (cmd, data) => {
    let body = {};
    let payload = {
      version: 1, 
      cmd: cmd,
      qos: QOS.YES
    };
    switch(cmd){
      case SIGNAL_CMD.CONNECT:
        body = getConnectBody(data);
        break;
      case SIGNAL_CMD.PUBLISH:
        body = getPublishBody(data);
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        body = getPublishAckBody(data);
        break;
      case SIGNAL_CMD.QUERY:
        body = getQueryBody(data);
        break;
      case SIGNAL_CMD.PING:
        body = getPingBody(data);
        break;
    }
    utils.extend(payload, body);
    let message = imsocket.create(payload);
    let buffer = imsocket.encode(message).finish();
    return buffer;
  };
  
  function getConnectBody({ data, index, counter }){
    let { appkey, token } = data;
    cache.set(index, { counter });
    return {
      connectMsgBody: { appkey, token, platform: PLATFORM.WEB }
    };
  }

  function getPublishAckBody({data, callback, index, counter}){
    let { msgIndex   } = data;
    cache.set(index, { callback, data, counter });
    return {
      pubAckMsgBody: {
        index: msgIndex,
        code: 0
      }
    };
  }

  function getPublishBody({ data, callback, index, counter }){
    let { conversationId: targetId, conversationType, topic } = data;
    let buffer = [];

    if(utils.isInclude([COMMAND_TOPICS.SEND_GROUP, COMMAND_TOPICS.SEND_PRIVATE], topic)){
      let { name, content, mentionInfo, flag } = data;
      content  = utils.toJSON(content);
      let codec = Proto.lookup('codec.UpMsg');
      let message = codec.create({
        msgType: name,
        mentionInfo,
        flags: flag,
        msgContent: new TextEncoder().encode(content)
      });
      buffer = codec.encode(message).finish();
    }
   
    if(utils.isEqual(COMMAND_TOPICS.RECALL, topic)){
      let { messageId, sentTime } = data;
      let codec = Proto.lookup('codec.RecallMsgReq');
      let message = codec.create({
        targetId,
        channelType: conversationType,
        msgId: messageId,
        msgTime: sentTime
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(COMMAND_TOPICS.CLEAR_UNREAD, topic)){
      let { conversations } = data;
      conversations = utils.isArray(conversations) ? conversations : [conversations];
      let codec = Proto.lookup('codec.ClearUnreadReq');
      let list = utils.map(conversations, ({ conversationType, conversationId }) => {
        return { 
          type: conversationType,
          targetId: conversationId 
        };
      });
      let message = codec.create({
        conversations: list
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(COMMAND_TOPICS.REMOVE_CONVERSATION, topic)){
      let { conversations } = data;
      conversations = utils.isArray(conversations) ? conversations : [conversations];
      let list = utils.map(conversations, ({ conversationType, conversationId }) => {
        return { 
          type: conversationType,
          targetId: conversationId 
        };
      });
      let codec = Proto.lookup('codec.DelConversationReq');
      let message = codec.create({
        conversations: list
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(COMMAND_TOPICS.READ_MESSAGE, topic)){
      let { messages } = data;
      messages = utils.isArray(messages) ? messages : [messages];
      let channelType = CONVERATION_TYPE.PRIVATE;
      let targetId = '';

      let msgs = utils.map(messages, (item) => {
        let { conversationType, conversationId, sentTime, messageId } = item;
        channelType = conversationType;
        targetId = conversationId;
        return { 
          msgId: messageId,
          msgTime: sentTime
        };
      });
      let codec = Proto.lookup('codec.MarkReadReq');
      let message = codec.create({
        channelType,
        targetId,
        msgs
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(COMMAND_TOPICS.UPDATE_MESSAGE, topic)){
      let { conversationId: targetId, conversationType: channelType, messageId: msgId, content, sentTime: msgTime } = data;
      let codec = Proto.lookup('codec.ModifyMsgReq');
      let message = codec.create({
        channelType,
        targetId,
        msgId,
        msgTime,
        msgContent: new TextEncoder().encode(content)
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(COMMAND_TOPICS.CLEAR_MESSAGE, topic)){
      let { conversationId: targetId, conversationType: channelType, time: cleanMsgTime } = data;
      let codec = Proto.lookup('codec.CleanHisMsgReq');
      let message = codec.create({
        channelType,
        targetId,
        cleanMsgTime,
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

    cache.set(index, { callback, data, counter });

    return {
      publishMsgBody: {
        index,
        targetId,
        topic,
        data: buffer
      }
    };
  }

  function getQueryBody({ data, callback, index, counter }){
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
    
    cache.set(index, { callback, index, topic, targetId, counter });

    return {
      qryMsgBody: {
        index,
        topic,
        targetId,
        data: buffer
      }
    }
  }

  function getPingBody({ index, counter }){
    cache.set(index, { counter });
    return {};
  }
  return { 
    encode
  };
}