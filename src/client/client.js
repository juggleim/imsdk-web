import IO from "../socket/io";
import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Chatroom from "./chatroom";
import Emitter from "../common/emmit";
import common from "../common/common";
import { EVENT, CONNECT_STATE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE, FILE_TYPE, MENTION_ORDER, SIGNAL_NAME } from "../enum";
import * as ENUM from "../enum";
import utils from "../utils";
import MessageCacher from "../common/msg-cacher";

let init = (config) => {
  let emitter = Emitter();
  
  let { upload, appkey } = config;
  let uploadType = common.checkUploadType(upload);
  utils.extend(config, { uploadType });

  let io = IO(config);
  let socket = Socket(io, emitter);
  let conversation = Conversation(io, emitter);
  let message = Message(io, emitter);
  let chatroom = Chatroom(io);

  /* PC 特性检查： 全局变量中存在约定变量自动切换为本地存储 */
  let conversationProvider = conversation;
  let messageProvider = message;
  let socketProvider = socket;
  let emitterProvider = emitter;
  if(typeof JGChatPCClient != 'undefined'){
    // 移除 Web 监听
    io.off(SIGNAL_NAME.CMD_CONVERSATION_CHANGED);
    io.off(SIGNAL_NAME.CONN_CHANGED);
    io.off(SIGNAL_NAME.CMD_RECEIVED);
    // PC 端重新创建事件分发对象，与 Web 进行隔离
    emitterProvider = Emitter();
    let pc = JGChatPCClient.init(appkey, { 
      conversation, 
      message,
      socket,
      emitter: emitterProvider,
      io,
      ENUM,
      utils,
      common,
      MessageCacher
    });
    socketProvider = pc.socket;
    conversationProvider = pc.conversation;
    messageProvider = pc.message;
  }

  return  {
    ...socketProvider,
    ...conversationProvider,
    ...messageProvider,
    ...chatroom,
    ...emitterProvider,
    Event: EVENT,
    ConnectionState: CONNECT_STATE,
    ConversationType: CONVERATION_TYPE,
    MessageType: MESSAGE_TYPE,
    ConversationOrder: CONVERSATION_ORDER,
    ErrorType,
    MentionType: MENTION_TYPE,
    MessageOrder: MESSAGE_ORDER,
    MentionOrder: MENTION_ORDER,
    FileType: FILE_TYPE
  }
}
export default {
  init
}