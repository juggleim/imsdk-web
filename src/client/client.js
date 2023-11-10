import IO from "../socket/io";
import Conversation from "./conversation";
import Message from "./message";

let init = (config) => {
  let io = IO(config);
  return  {
    ...io,
    Conversation,
    Message
  }
}
export default {
  init
}