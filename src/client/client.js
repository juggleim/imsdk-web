import IO from "../socket/io";
import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Emitter from "../common/emmit";
import { EVENT, CONNECT_STATE, CONVERATION_TYPE, MESSAGE_TYPE, ErrorType, CONVERSATION_ORDER, MESSAGE_ORDER, MENTION_TYPE } from "../enum";

let init = (config) => {
  let emitter = Emitter();
  let io = IO(config);
  let socket = Socket(io, emitter);
  let conversation = Conversation(io, emitter);
  let message = Message(io, emitter);
  return  {
    ...socket,
    ...conversation,
    ...message,
    ...emitter,
    JuggleEvent: EVENT,
    JuggleState: CONNECT_STATE,
    ConversationType: CONVERATION_TYPE,
    MessageType: MESSAGE_TYPE,
    ConversationOrder: CONVERSATION_ORDER,
    ErrorType,
    MentionType: MENTION_TYPE,
    MessageOrder: MESSAGE_ORDER,
  }
}
export default {
  init
}