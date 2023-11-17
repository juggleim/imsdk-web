import { SIGNAL_CMD, EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER } from "../enum";
import utils from "../utils";
import common from "../common/common";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {
    emitter.emit(EVENT.MESSAGE_RECEIVED, message)
  });

  let sendMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.PUBLISH, message, (msg) => {
        resolve(msg);
      });
    });
  };

  return {
    sendMessage
  };
}