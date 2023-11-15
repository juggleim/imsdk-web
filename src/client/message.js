import { SIGNAL_CMD } from "../enum";
import utils from "../utils";
export default function(io){

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