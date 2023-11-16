import { SIGNAL_CMD, EVENT, SIGNAL_NAME } from "../enum";
import utils from "../utils";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {
    emitter.emit(EVENT.MESSAGE_RECEIVED, message)
  });

  let sendMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      io.sendCommand(SIGNAL_CMD.PUBLISH, message, (msg) => {
        resolve(msg);
      });
    });
  };

  return {
    sendMessage
  };
}