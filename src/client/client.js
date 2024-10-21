import IO from "../socket/io";
import Web from "./web/index";
import Desktop from "./desktop/index";
import RTCSignal from "./signal/index";

import Logger from "../logger/logger";
import Emitter from "../common/emmit";
import common from "../common/common";
import { CONVERATION_TAG_TYPE, MESSAGE_SENT_STATE, EVENT, CONNECT_STATE, UNDISTURB_TYPE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE, FILE_TYPE, MENTION_ORDER, SIGNAL_NAME, UNREAD_TAG } from "../enum";
import * as ENUM from "../enum";
import utils from "../utils";
import MessageCacher from "../common/msg-cacher";

let init = (config) => {
  let emitter = Emitter();
  let provider = {};
  let { upload, appkey = '', log = {} } = config;
  let uploadType = common.checkUploadType(upload);
 
  let sessionId = common.getSessionId();
  let logger = Logger({ ...log, appkey, sessionId, getCurrentUser: getCurrentUser, getVersion: getVersion });

  // 移除 AppKey 前后空格
  appkey = appkey.trim();
  utils.extend(config, { uploadType, logger, appkey });
  let io = IO(config);

  function getCurrentUser(){
    return io.getCurrentUser();
  }

  function getVersion(){
    return io.getVersion();
  }

  let web = Web.init({ io, emitter, logger });
  provider = web;

  /* PC 特性检查： 全局变量中存在约定变量自动切换为 PC */
  if(common.isDesktop()){
    emitter = Emitter();
    provider = Desktop.init({ appkey, io, emitter, web, client: JGChatPCClient, logger });
  }


  let _export = {
    ...provider.socket,
    ...provider.message,
    ...provider.conversation,
    ...provider.chatroom,
    ...emitter,
    registerMessage: common.registerMessage,
    isDesktop: common.isDesktop,
    use: () => {
      let rtc = RTCSignal({ io, emitter, logger });
      utils.extend(_export, rtc);
    },
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
    UnreadTag: UNREAD_TAG,
    ConversationTagType: CONVERATION_TAG_TYPE,
  };

  return  _export;
}

export default {
  init,
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
  UnreadTag: UNREAD_TAG,
  ConversationTagType: CONVERATION_TAG_TYPE,
}