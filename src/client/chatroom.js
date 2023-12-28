import { COMMAND_TOPICS, ErrorType, FUNC_PARAM_CHECKER, SIGNAL_CMD } from "../enum";
import utils from "../utils";
import Storage from "../common/storage";
import common from "../common/common";

export default function(io){

  let joinChatroom = (chatroom) =>{
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.JOINCHATROOM, true);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.JOIN_CHATROOM,
        chatroom
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        resolve();
      });
    });
  };

  let quitChatroom = (chatroom) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.QUITCHATROOM, true);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.QUIT_CHATROOM,
        chatroom
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        resolve();
      });
    });
  };

  return {
    joinChatroom,
    quitChatroom
  }
}