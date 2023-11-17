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
        let { 
          publishMsgBody: { 
            targetId: conversationId,
            data: publistData 
          }
        } = msg;
        let message = Proto.lookup('codec.DownMsg');
        let payload = message.decode(publistData);
        let { fromId, msgId, msgTime, msgType, msgContent, type: conversationType } = payload;
        
        result = { 
          conversationId,
          conversationType,
          senderUserId: fromId, 
          messageId: msgId, 
          sentTime: msgTime,
          name: msgType,
          content: new TextDecoder().decode(msgContent)
        };
        name = SIGNAL_NAME.CMD_RECEIVED;
        break;
      case SIGNAL_CMD.QUERY_ACK:
        break;
      case SIGNAL_CMD.PONG:
        break;
    }
    return {
      cmd, result, name
    };
  };
 
  return { 
    decode
  };
}