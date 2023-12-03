import utils from "../utils";
import { ErrorType, STORAGE, ErrorMessages, MESSAGE_TYPE, MESSAGE_FLAG } from "../enum";
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
  let error = ErrorMessages.find(error => error.code == code);
  return error || { code };
}

function getMsgConfig(name){
  let configs = [
    {name: MESSAGE_TYPE.TEXT, option: { flag: MESSAGE_FLAG.COUNT_STORAGE }},
    {name: MESSAGE_TYPE.FILE, option: { flag: MESSAGE_FLAG.COUNT_STORAGE }},
    {name: MESSAGE_TYPE.IMAGE, option: { flag: MESSAGE_FLAG.COUNT_STORAGE }},
    {name: MESSAGE_TYPE.VOICE, option: { flag: MESSAGE_FLAG.COUNT_STORAGE }},
    {name: MESSAGE_TYPE.VIDEO, option: { flag: MESSAGE_FLAG.COUNT_STORAGE }},
  ];
  let config = configs.find(cfg => cfg.name == name ) || {};
  return config.option || {};
}
export default {
  check,
  getNum,
  getNaviStorageKey,
  updateSyncTime,
  getError,
  getMsgConfig
}