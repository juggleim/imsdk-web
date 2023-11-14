import IO from "../socket/io";
import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Emitter from "../common/emmit";
import { EVENT, CONNECT_STATE } from "../enum";

let init = (config) => {
  let emitter = Emitter();
  let io = IO(config);
  let socket = Socket(io, emitter)
  let conversation = Conversation(io);
  let message = Message(io, emitter);
  return  {
    ...socket,
    ...conversation,
    ...message,
    ...emitter,
    Event: EVENT,
    State: CONNECT_STATE
  }
}
export default {
  init
}