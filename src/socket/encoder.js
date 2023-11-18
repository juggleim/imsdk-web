import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_CMD, QOS, CONVERATION_TYPE } from "../enum";
export default function Encoder(){
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
  
  function getConnectBody(data){
    let { appkey, token } = data;
    return {
      connectMsgBody: { appkey, token }
    };
  }

  function getPublishBody(data){
    let { conversationId: targetId, conversationType, name, content, index   } = data;
    let upMsgCodec = Proto.lookup('codec.UpMsg');
    let upMessage = upMsgCodec.create({
      msgType: name,
      msgContent: new TextEncoder().encode(content)
    });
    let upMsgBuffer = upMsgCodec.encode(upMessage).finish();
    let topic = topics[conversationType];   
    return {
      publishMsgBody: {
        index,
        targetId,
        topic,
        data: upMsgBuffer
      }
    };
  }

  function getQueryBody(data){
    let { conversationId: targetId, userId, conversationType, time, count, direction, index  } = data;

    if(utils.isEqual(CONVERATION_TYPE.PRIVATE, conversationType)){
      targetId = `${userId}:${targetId}`
    }
    let codec = Proto.lookup('codec.QryHisMsgsReq');
    let message = codec.create({
      converId: targetId,
      type: conversationType,
      startTime: time,
      count: count,
      order: direction
    });
    let buffer = codec.encode(message).finish();

    return {
      qryMsgBody: {
        index,
        topic: 'qry_hismsgs',
        targetId,
        data: buffer
      }
    }
  }
  return { 
    encode
  };
}