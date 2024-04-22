import IO from "../socket/io";
import Web from "./web/index";
import Desktop from "./desktop/index";

import Emitter from "../common/emmit";
import common from "../common/common";
import { MESSAGE_SENT_STATE, EVENT, CONNECT_STATE, UNDISTURB_TYPE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE, FILE_TYPE, MENTION_ORDER, SIGNAL_NAME } from "../enum";
import * as ENUM from "../enum";
import utils from "../utils";
import MessageCacher from "../common/msg-cacher";

let init = (config) => {
  let emitter = Emitter();
  let provider = {};
  let { upload, appkey } = config;
  let uploadType = common.checkUploadType(upload);
  utils.extend(config, { uploadType });

  let io = IO(config);
  let web = Web.init({ io, emitter });
  provider = web;

  /* PC 特性检查： 全局变量中存在约定变量自动切换为 PC */
  if(common.isDesktop()){
    emitter = Emitter();
    provider = Desktop.init({ appkey, io, emitter, web, client: JGChatPCClient });
  }

  return  {
    ...provider.socket,
    ...provider.message,
    ...provider.conversation,
    ...provider.chatroom,
    ...emitter,
    registerMessage: common.registerMessage,
    isDesktop: common.isDesktop,
    Event: EVENT,
    ConnectionState: CONNECT_STATE,
    ConversationType: CONVERATION_TYPE,
    MessageType: MESSAGE_TYPE,
    ConversationOrder: CONVERSATION_ORDER,
    ErrorType,
    MentionType: MENTION_TYPE,
    MessageOrder: MESSAGE_ORDER,
    MentionOrder: MENTION_ORDER,
    FileType: FILE_TYPE,
    UndisturbType: UNDISTURB_TYPE,
    SentState: MESSAGE_SENT_STATE,
  }
}

export default {
  init
}