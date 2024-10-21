import Emitter from "../../common/emmit";
import utils from "../../utils";
import Proto from "../proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, CONNECT_ACK_INDEX, PONG_INDEX, UPLOAD_TYPE, CONVERATION_TYPE, MESSAGE_SENT_STATE, UNDISTURB_TYPE, STORAGE } from "../../enum";
import common from "../../common/common";
import tools from "./tools";

export default function getPublishMsgBody(stream, { currentUser }){
  let codec = Proto.lookup('codec.PublishMsgBody');
    let publishMsgBody = codec.decode(stream);
    let { targetId, data, topic, timestamp, index } = publishMsgBody;

    let _msg = {};
    let _name = SIGNAL_NAME.CMD_RECEIVED;

    // 收到 NTF 直接返回，通过 sync_msgs 同步消息
    if (utils.isEqual(topic, COMMAND_TOPICS.NTF)) {
      let payload = Proto.lookup('codec.Notify');
      let message = payload.decode(data);
      let { syncTime: receiveTime, type, chatroomId } = message;
      _msg = { topic, receiveTime, type, targetId: chatroomId };
      _name = SIGNAL_NAME.S_NTF;
    } else if (utils.isEqual(topic, COMMAND_TOPICS.MSG)) {
      let payload = Proto.lookup('codec.DownMsg');
      let message = payload.decode(data);
      _msg = tools.msgFormat(message, { currentUser });
    } else if (utils.isEqual(topic, COMMAND_TOPICS.CHATROOM_USER_NTF)) {
      let payload = Proto.lookup('codec.ChrmEvent');
      let message = payload.decode(data);
      let { chatId, eventTime, eventType } = message;
      _msg = { chatroomId: chatId, time: eventTime, type: eventType };
      _name = SIGNAL_NAME.S_CHATROOM_USER_NTF;
    } else {
      console.log('unkown topic', topic);
    }
    utils.extend(_msg, { ackIndex: index });
    return { _msg, _name };
}