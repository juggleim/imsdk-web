import utils from "../utils";
import { ErrorType, STORAGE, ErrorMessages } from "../enum";
import Storage from "./storage";

let check = (io, params, props) => {
  let error = {};
  if(!io.isConnected()){
    return ErrorType.CONNECTION_NOT_READY;
  }
  let { msg, code } = ErrorType.ILLEGAL_PARAMS;
  let len = props.length;
  for(let i = 0; i < len; i++){
    let prop = props[i];
    if(utils.isInclude(prop, '.')){
      let childs = prop.split('.');
      let val = params[childs[0]][childs[1]];
      error = invoke(val, prop);
    }else{
      error = invoke(params[prop], prop);
    }
    if(!utils.isEmpty(error)){
      return error;
    }
  }
  function invoke(val, prop){
    let result = {};
    if(utils.isUndefined(val)){
      result = {
        code,
        msg: `${prop} ${msg}`
      }
    }
    return result;
  }
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
let orderNum = 0;
let getNum = () => {
  orderNum += 1;
  if(orderNum > 65535){
    orderNum = 1;
  }
  return orderNum;
};
function updateSyncTime(message){
  let { isSender, sentTime } = message;
  let key =  STORAGE.SYNC_RECEIVED_MSG_TIME;
  if(isSender){
    key =  STORAGE.SYNC_SENT_MSG_TIME;
  }
  let time = Storage.get(key).time || 0;
  let isNewMsg = sentTime > time;
  if(isNewMsg){
    Storage.set(key, { time: sentTime });
  }
  return isNewMsg;
}
function getError(code) {
  let error = ErrorMessages.find(error => error.code === code);
  return error || { code };
}
export default {
  check,
  getNum,
  getNaviStorageKey,
  updateSyncTime,
  getError
}