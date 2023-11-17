import utils from "../utils";
import { ErrorType } from "../enum";

let check = (io, message, props) => {
  let error = {};
  if(!io.isConnected()){
    error = ErrorType.CONNECTION_NOT_READY;
  }
  let { msg, code } = ErrorType.ILLEGAL_PARAMS;
  utils.forEach(props, (prop) => {
    let val = message[prop];
    if(utils.isUndefined(val)){
      error = {
        code,
        msg: `${prop} ${msg}`
      }
    }
  });
  return error;
};

export default {
  check
}