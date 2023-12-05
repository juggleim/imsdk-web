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
  let error = ErrorMessages.find(error => error.code == code) || { code, msg: '' };
  let { msg } = error;
  return { code, msg };
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

function ConversationUtils(){
  let conversations = [];
  let isSynced = false;
  let update = (list) => {
    list = utils.isArray(list) ? list : [list];
    utils.forEach(list, (item) => {
      let index = utils.find(conversations, ({ conversationType, conversationId }) => {
        return utils.isEqual(item.conversationType, conversationType) && utils.isEqual(item.conversationId, conversationId);
      });
      let isNew = utils.isEqual(index, -1);
      if(!isNew){
        let conversation = conversations.splice(index, 1)[0]; 
        let { unreadCount } = conversation;
        utils.extend(conversation, { 
          unreadCount: unreadCount + 1,
          latestMessage: item.latestMessage
        });
        return conversations.push(conversation);
      }
      conversations.push(item);
    });

    let tops = [];
    utils.forEach(conversations, ({ isTop }, index) => {
      if(isTop){
        let conversation =  conversations.splice(index, 1)[0];
        tops.push(conversation);
      }
    });
    utils.sort(conversations, (a, b) => {
      return a.latestMessage.sentTime > b.latestMessage.sentTime;
    });
    conversations = tops.concat(conversations);
  };
  let add = (list) => {
    isSynced = true;
    update(list);
  };
  let remove = (item) => {
    let index = utils.find(conversations, ({ conversationType, conversationId }) => {
      return utils.isEqual(item.conversationType, conversationType) && utils.isEqual(item.conversationId, conversationId);
    });
    if(!utils.isEqual(index, -1)){
      conversations.splice(index, 1);
    }
  };
  let clear = () => {
    isSynced = false;
    conversations.length = 0;
  };
  let get = () => {
    return conversations;
  };
  let isSync = () => {
    return isSynced;
  };
  return {
    remove,
    update,
    clear,
    get,
    isSync,
    add
  };
}

export default {
  check,
  getNum,
  getNaviStorageKey,
  updateSyncTime,
  getError,
  getMsgConfig,
  ConversationUtils
}