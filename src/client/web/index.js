import Conversation from "./conversation";
import Message from "./message";
import Socket from "./socket";
import Chatroom from "./chatroom";
let init = ({ io, emitter }) => {
  let socket = Socket(io, emitter);
  let conversation = Conversation(io, emitter);
  let message = Message(io, emitter);
  let chatroom = Chatroom(io);
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