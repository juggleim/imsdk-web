import utils from "../utils";
import { ErrorType, STORAGE, ErrorMessages, MESSAGE_TYPE, MESSAGE_FLAG, UPLOAD_TYPE } from "../enum";
import Storage from "./storage";
/* 
let check = (io, params, props, isStatic) => {
  let error = {};
  if(!isStatic){
    if(!io.isConnected()){
      return ErrorType.CONNECTION_NOT_READY;
    }
  }
  let { msg, code } = ErrorType.ILLEGAL_PARAMS;
  let len = props.length;

  //约定：如果参数是数组，会校验每个元素是否包含 conversatonType 和 conversationId
  if(utils.isArray(params)){
    for(let n = 0; n < params.length; n++){
      let item = params[n];
      for(let i = 0; i < len; i++){
        let name = props[i];
        error = next(name, item, n)
        if(!utils.isEmpty(error)){
          return error;
        }
      }
    }
  }

  //约定：检查数据有二级对象，例如 message.content, 必须优先设置 message
  if(utils.isObject(params)){
    for(let i = 0; i < len; i++){
      let name = props[i];
      error = next(name, params)
      if(!utils.isEmpty(error)){
        break;
      }
    }
  }
 
  function next(name, origin, index){
    let _error = {};
    if(utils.isInclude(name, '.')){
      let childs = name.split('.');
      let val = origin[childs[0]][childs[1]];
      _error = invoke(val, name, index);
    }else{
      _error = invoke(origin[name], name, index);
    }
    return _error;
  }

  function invoke(val, name, index){
    let result = {};
    let _msg = `${name} ${msg}`;
    if(utils.isNumber(index)){
      _msg = `数组下标 ${index} ${_msg}`;
    }
    if(utils.isUndefined(val)){
      result = { code, msg: _msg };
    }
    return result;
  }

  return error;
};
*/

/* 

let params = { content: 123 }
let params = { content: { name: 123 } }
let params = [{ content: 123 }]
let props = [
  {
    name: 'content',
    type: 'Object',
  }
]
*/
let check = (io, _params, props, isStatic) => {
  if(!isStatic){
    if(!io.isConnected()){
      return ErrorType.CONNECTION_NOT_READY;
    }
  }
  _params = _params || {};
  let checkType = (val, type, name) => {
    let error = null;
    let { msg, code } = ErrorType.ILLEGAL_TYPE_PARAMS;
    let _type = Object.prototype.toString.call(val);
    _type = _type.slice(8, _type.length - 1);
    if(!utils.isEqual(_type, type)){
      msg = `${name} ${msg}, 传入 ${_type}, 应传: ${type}`;
      error = { msg, code };
    }
    return error;
  };
  let checkRequire = (val, name, index) => {
    let error = null;
    let { msg, code } = ErrorType.ILLEGAL_PARAMS;
    if(utils.isUndefined(val)){
      msg = `${name} ${msg}`;
      if(utils.isArray(_params)){
        msg = `Array index ${index} : ${msg}`;
      }
      error = { msg, code };
    }
    return error;
  };

  let _check = (prop, param, index) => {
    let { name, type } = prop;
    let val = param[name];
    let error = null;
    error = checkRequire(val, name, index);
    if(error){
      return error;
    }

    if(type){
      error = checkType(val, type, name);
    }
    return error;
  };

  let params = utils.isArray(_params) ? _params : [_params];
  for(let i = 0; i < props.length; i++){
    let prop = props[i];
    for(let j = 0; j < params.length; j++){
      let param = params[j];
      let error = _check(prop, param, j);
      if(error){
        return error;
      }
    }
  }
}

let getTokenUUId = (token) => {
  let uuid = token.slice(16, 40);
  return uuid;
};

let getNaviStorageKey = () => {
  return `${STORAGE.NAVI}`;
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
function updateChatroomSyncTime(message){
  let { sentTime } = message;
  let key =  STORAGE.SYNC_CHATROOM_RECEIVED_MSG_TIME;
  let time = Storage.get(key).time || 0;
  let isNewMsg = sentTime > time;
  if(isNewMsg){
    Storage.set(key, { time: sentTime });
  }
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
    conversations = utils.quickSort(conversations, (a, b) => {
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
  let modify = (conversation) => {
    let index = utils.find(conversations, ({ conversationType, conversationId }) => {
      return utils.isEqual(conversation.conversationType, conversationType) && utils.isEqual(conversation.conversationId, conversationId);
    });
    if(!utils.isEqual(index, -1)){
      utils.extend(conversations[index], conversation);
    }
  };
  let get = () => {
    return conversations;
  };
  let getPer = (conversation) => {
    let index = utils.find(conversations, ({ conversationType, conversationId }) => {
      return utils.isEqual(conversation.conversationType, conversationType) && utils.isEqual(conversation.conversationId, conversationId);
    });
    return conversations[index] || {};
  };
  let isSync = () => {
    return isSynced;
  };
  let read = (list) => {
    list = utils.isArray(list) ? list : [list];
    utils.forEach(list, (item) => {
      let index = utils.find(conversations, ({ conversationType, conversationId }) => {
        return utils.isEqual(item.conversationType, conversationType) && utils.isEqual(item.conversationId, conversationId);
      });
      if(index > -1){
        conversations[index].unreadCount = 0;
      }
    });
  };
  return {
    remove,
    update,
    clear,
    get,
    isSync,
    add,
    modify,
    getPer,
    read
  };
}

function checkUploadType(upload){
  upload = upload || {};
  let type = UPLOAD_TYPE.NONE;
  if(upload.QiniuError){
    type = UPLOAD_TYPE.QINIU
  }
  return type;
}

export default {
  check,
  getNum,
  getNaviStorageKey,
  updateSyncTime,
  updateChatroomSyncTime,
  getError,
  getMsgConfig,
  ConversationUtils,
  checkUploadType
}