import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_CMD, QOS, CONVERATION_TYPE, COMMAND_TOPICS} from "../enum";
export default function Encoder(cache){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  
  let maps = [
    [CONVERATION_TYPE.PRIVATE, 'p_msg'],
    [CONVERATION_TYPE.GROUP, 'g_msg'],
  ];
  let topics = {};
  utils.forEach(maps, (map) => {
    topics[map[0]] = map[1];
  });

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
        break;
    }
    utils.extend(payload, body);
    let message = imsocket.create(payload);
    let buffer = imsocket.encode(message).finish();
    return buffer;
  };
  
  function getConnectBody({ data }){
    let { appkey, token } = data;
    return {
      connectMsgBody: { appkey, token }
    };
  }

  function getPublishAckBody({data, callback, index}){
    let { msgIndex   } = data;
    cache.set(index, { callback, data });
    return {
      pubAckMsgBody: {
        index: msgIndex
      }
    };
  }

  function getPublishBody({ data, callback, index }){
    let { conversationId: targetId, conversationType, message: { name, content, mentionInfo, flag } } = data;
    let upMsgCodec = Proto.lookup('codec.UpMsg');
    let upMessage = upMsgCodec.create({
      msgType: name,
      mentionInfo,
      flags: flag,
      msgContent: new TextEncoder().encode(content)
    });
    let upMsgBuffer = upMsgCodec.encode(upMessage).finish();
    let topic = topics[conversationType];

    cache.set(index, { callback, data });

    return {
      publishMsgBody: {
        index,
        targetId,
        topic,
        data: upMsgBuffer
      }
    };
  }

  function getQueryBody({ data, callback, index }){
    let { targetId, userId, topic  } = data;
    let buffer = [];
    
    if(utils.isEqual(topic, COMMAND_TOPICS.HISTORY_MESSAGES)){
      let { conversationType, time, count, direction } = data;
      let codec = Proto.lookup('codec.QryHisMsgsReq');
      let message = codec.create({
        converId: targetId,
        type: conversationType,
        startTime: time,
        count: count,
        order: direction
      });
      buffer = codec.encode(message).finish();
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.CONVERSATIONS)){
      let { count, time, direction } = data;
      targetId = userId;
      let codec = Proto.lookup('codec.QryConversationsReq');
      let message = codec.create({
        startTime: time,
        count: count,
        order: direction
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
    
    cache.set(index, { callback, index, topic });

    return {
      qryMsgBody: {
        index,
        topic,
        targetId,
        data: buffer
      }
    }
  }


  return { 
    encode
  };
}