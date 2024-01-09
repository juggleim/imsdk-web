import IO from "../socket/io";
import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Chatroom from "./chatroom";
import Emitter from "../common/emmit";
import common from "../common/common";
import { EVENT, CONNECT_STATE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE, FILE_TYPE, MENTION_ORDER } from "../enum";
import utils from "../utils";

let init = (config) => {
  let emitter = Emitter();
  
  let { upload } = config;
  let uploadType = common.checkUploadType(upload);
  utils.extend(config, { uploadType });

  let io = IO(config);
  let socket = Socket(io, emitter);
  let conversation = Conversation(io, emitter);
  let message = Message(io, emitter);
  let chatroom = Chatroom(io);
  return  {
    ...socket,
    ...conversation,
    ...message,
    ...chatroom,
    ...emitter,
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