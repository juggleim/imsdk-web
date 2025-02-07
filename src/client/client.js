import IO from "../socket/io";
import Web from "./web/index";
import Desktop from "./desktop/index";
import RTCSignal from "./signal/index";

import Logger from "../logger/logger";
import Emitter from "../common/emmit";
import common from "../common/common";
import { CONVERSATION_TOP_TYPE, USER_TYPE, STREAM_EVENT, MEDIA_TYPE, CONVERATION_TAG_TYPE, MESSAGE_SENT_STATE, EVENT, CONNECT_STATE, UNDISTURB_TYPE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE, FILE_TYPE, MENTION_ORDER, SIGNAL_NAME, UNREAD_TAG } from "../enum";
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
    return io.getCurrentUser({ ignores: [] });
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


  let plugins = {
    call: () => {
      return RTCSignal({ io, emitter, logger });
    }
  }

  // PC 和 Web 复用的事件在此处透传
  io.on(SIGNAL_NAME.CMD_STREAM_APPENDED, (message) => {
    emitter.emit(EVENT.STREAM_APPENDED, { message });
  });
  io.on(SIGNAL_NAME.CMD_STREAM_COMPLETED, (message) => {
    let { conversationId, conversationType, messageId } = message;
    provider.message.getMessagesByIds({ conversationId, conversationType, messageIds: [messageId] }).then(({ messages }) => {
      let msg = messages[0] || { content: '' };
      emitter.emit(EVENT.STREAM_COMPLETED, { message: { ...message, content: msg.content } });
    });
  });

  let _export = {
    ...provider.socket,
    ...provider.message,
    ...provider.conversation,
    ...provider.chatroom,
    ...emitter,
    registerMessage: common.registerMessage,
    isDesktop: common.isDesktop,
    install: (plugin) => {
      if(!utils.isObject(plugin)){
        return;
      }
      let { name } = plugin;
      let func = plugins[name] || function(){ return {} };
      let apis = func();
      return apis;
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
    MediaType: MEDIA_TYPE,
    UserType: USER_TYPE,
    StreamEvent: STREAM_EVENT,
    ConversationTopType: CONVERSATION_TOP_TYPE,
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
  MediaType: MEDIA_TYPE,
  UserType: USER_TYPE,
  StreamEvent: STREAM_EVENT,
  ConversationTopType: CONVERSATION_TOP_TYPE,
}