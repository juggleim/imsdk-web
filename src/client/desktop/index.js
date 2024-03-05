import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Chatroom from "./chatroom";

import * as ENUM from "../../enum";
import utils from "../../utils";
import MessageCacher from "../../common/msg-cacher";
import common from "../../common/common";

let init = ({ appkey, io, emitter, web, client }) => {
  // 告知 IO 模块当前是 PC 端，做特殊处理，例如：同步会话列表
  io.setConfig({
    isPC: true
  });
  let { SIGNAL_NAME } = ENUM;
  // 移除 Web 监听
  io.off(SIGNAL_NAME.CMD_CONVERSATION_CHANGED);
  io.off(SIGNAL_NAME.CONN_CHANGED);
  io.off(SIGNAL_NAME.CMD_RECEIVED);

  let pc = JGChatPCClient.init(appkey, {
    ...web,
    emitter,
    io,
    ENUM,
    utils,
    common,
    MessageCacher
  });
  let socket = Socket(pc.socket);
  let conversation = Conversation(pc.conversation);
  let message = Message(pc.message);
  let chatroom = Chatroom(web.chatroom);
  
  return {
    socket,
    conversation,
    message,
    chatroom,
  };
};
export default {
  init
}