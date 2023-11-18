import utils from "../utils";
import { ErrorType, STORAGE } from "../enum";

let check = (io, params, props) => {
  let error = {};
  if(!io.isConnected()){
    error = ErrorType.CONNECTION_NOT_READY;
  }
  let { msg, code } = ErrorType.ILLEGAL_PARAMS;
  utils.forEach(props, (prop) => {
    let val = params[prop];
    if(utils.isUndefined(val)){
      error = {
        code,
        msg: `${prop} ${msg}`
      }
    }
  });
  return error;
};

let getTokenUUId = (token) => {
  let uuid = token.slice(16, 40);
  return uuid;
};

let getNaviStorageKey = (appkey, token) => {
  let uid = getTokenUUId(token);
  return `${STORAGE.NAVI}_${appkey}_${uid}`;
};
export default {
  check,
  getNaviStorageKey
}