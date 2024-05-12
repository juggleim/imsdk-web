import utils from "../utils";
import { ErrorType, STORAGE, ErrorMessages, MESSAGE_TYPE, UPLOAD_TYPE } from "../enum";
import Storage from "./storage";
import Uploader from "./uploader";

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

// 内置消息类型和动态注入的自定消息类型
let _MSG_FLAG_NAMES = [
  {name: MESSAGE_TYPE.TEXT,  isCount: true, isStorage: true },
  {name: MESSAGE_TYPE.FILE,  isCount: true, isStorage: true },
  {name: MESSAGE_TYPE.IMAGE, isCount: true, isStorage: true },
  {name: MESSAGE_TYPE.VOICE, isCount: true, isStorage: true },
  {name: MESSAGE_TYPE.VIDEO, isCount: true, isStorage: true },
  {name: MESSAGE_TYPE.MERGE, isCount: true, isStorage: true, isMerge: true},
  {name: MESSAGE_TYPE.RECALL, isCommand: true },
  {name: MESSAGE_TYPE.RECALL_INFO, isCommand: true },
  {name: MESSAGE_TYPE.READ_MSG, isCommand: true },
  {name: MESSAGE_TYPE.READ_GROUP_MSG, isCommand: true },
  {name: MESSAGE_TYPE.MODIFY, isCommand: true },
  {name: MESSAGE_TYPE.CLEAR_MSG, isCommand: true },
  {name: MESSAGE_TYPE.CLEAR_UNREAD, isCommand: true,  isCount: false, isStorage: false },
];

let formatter = {
  toFlag: ({ isCommand, isCount, isStorage, isMerge, isMass }) => {
    let flag = 0;
    isCommand && (flag |= (1 << 0));
    isCount && (flag |= (1 << 1));
    isStorage && (flag |= (1 << 3));
    isMerge && (flag |= (1 << 5));
    isMass && (flag |= (1 << 7));
    return flag;
  },
  toMsg: (flag) => {
    let obj = {
      1: { name: 'isCommand' },
      2: { name: 'isCount' },
      3: { name: 'isStatus' },
      4: { name: 'isStorage' },
      5: { name: 'isUpdated' },
      6: { name: 'isMerge' },
      7: { name: 'isMute' },
      8: { name: 'isMass' },
    };
    let result = {};
    for(let num in obj){
      // 创建一个只有第 N 位为 1 其他都为 0 的掩码
      let bitMask = Math.pow(2, (num - 1)); 
      let name = obj[num].name;
      result[name] = ((flag & bitMask) !== 0);
    }
    return result;
  }
};

let registerMessage = (names) => {
  names = utils.isArray(names) ? names : [names];
  utils.forEach(names, (name) => {
    _MSG_FLAG_NAMES.push(name);
  });
};

let getMsgFlag = (name, option = {}) => {
  let msg = utils.filter(_MSG_FLAG_NAMES, (n) => {
    return utils.isEqual(n.name, name);
  })[0] || {};
  let _msg = { ...msg, ...option };
  let flag = formatter.toFlag(_msg);
  return flag;
};

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
        let { unreadCount = 0, latestReadIndex = 0, latestUnreadIndex = 0 } = conversation;
        let { latestMessage, updatedTime, conversationExts, mentions, undisturbType } = item;
        let { conversationTitle, conversationPortrait } = latestMessage;
        conversationTitle = conversationTitle || item.conversationTitle;
        conversationPortrait = conversationPortrait || item.conversationPortrait;

        if(utils.isEmpty(conversationTitle)){
          conversationTitle = conversation.conversationTitle;
        }
        if(utils.isEmpty(conversationPortrait)){
          conversationPortrait = conversation.conversationPortrait;
        }
        if(utils.isEmpty(conversationExts)){
          conversationExts = conversation.conversationExts;
        }

        let messageName = latestMessage.name;
        let flag = getMsgFlag(messageName);
        let msgFlag = formatter.toMsg(flag) || {};
        if(!latestMessage.isSender && msgFlag.isCount){
          latestUnreadIndex = latestMessage.unreadIndex || 0;
          unreadCount = latestUnreadIndex - latestReadIndex;
        }
        // 如果是群发消息不更新会话列表
        if(msgFlag.isMass){
          return;
        }
        // 自己发送的多端同步清空消息，未读数设置为 0，最后一条消息保持不变
        if(utils.isEqual(messageName, MESSAGE_TYPE.CLEAR_UNREAD) && latestMessage.isSender){
          unreadCount = 0;
          latestMessage = conversation.latestMessage;
        }
        if(unreadCount < 0){
          unreadCount = 0;
        }
        if(utils.isEqual(latestMessage.name, MESSAGE_TYPE.CLEAR_MSG) && latestMessage.isSender){
          latestMessage = {};
        }
        utils.extend(conversation, { 
          unreadCount: unreadCount,
          latestMessage: latestMessage,
          conversationTitle, 
          conversationPortrait,
          conversationExts,
          mentions,
          updatedTime,
          undisturbType,
          latestReadIndex,
          latestUnreadIndex,
          sortTime: latestMessage.sentTime,
        });
        return conversations.push(conversation);
      }
      let key = getDraftKey(item);
      let draft = Storage.get(key);
      draft = utils.isEmpty(draft) ? '' : draft;
      utils.extend(item, { draft })

      if(item.unreadCount < 0){
        item.unreadCount = 0;
      }

      let _msg = item.latestMessage;
      item.sortTime = _msg.sentTime,
      conversations.push(item);
    });

    let tops = [];
    utils.forEach(conversations, ( item = {}, index) => {
      let { isTop } = item;
      if(isTop){
        let conversation =  conversations.splice(index, 1)[0];
        tops.push(conversation);
      }
    });
    conversations = utils.quickSort(conversations, (a, b) => {
      return a.sortTime > b.sortTime;
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
  let relpace = (conversation) => {
    let index = utils.find(conversations, ({ conversationType, conversationId }) => {
      return utils.isEqual(conversation.conversationType, conversationType) && utils.isEqual(conversation.conversationId, conversationId);
    });
    if(!utils.isEqual(index, -1)){
      utils.extend(conversations[index], conversation);
    }
  };
  let modify = (_conversations, props) => {
    _conversations = utils.isArray(_conversations) ? _conversations : [_conversations];
    utils.forEach(_conversations, (item) => {
      let conversation = getPer(item);
      if(!utils.isEmpty(conversation)){
        utils.extend(conversation, props);
        relpace(conversation);
      }
    });
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
    relpace,
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

function formatMediaMessage(message, url){
  let { name, content } = message;
  
  let _content = {};
  if(utils.isEqual(name, MESSAGE_TYPE.FILE)){
    let { file } = content;
    let size = file.size / 1000
    _content = { size, url };
    utils.extend(message.content, { size, url });
  }

  if(utils.isEqual(name, MESSAGE_TYPE.IMAGE)){
    let { height, width } = content;
    let direction = 'h';
    if(width > height){
      direction = 'w';
    }
    let thumbnail = `${url}&imageView2/2/${direction}/100`;
    _content = { thumbnail, url };
    utils.extend(message.content, { url, thumbnail });
  }

  if(utils.isInclude([MESSAGE_TYPE.VIDEO, MESSAGE_TYPE.VOICE], name)){
    utils.extend(message.content, { url });
  }

  return message;
}

function uploadThumbnail(upload, option, callback){
  let { type, token, domain, file } = option;
  let uploader = Uploader(upload, { type });
  uploader.compress(file, (tbFile, args) => {
    let content = { file: tbFile };
    let opts = { token, domain };
    let callbacks = {
      onprogress: utils.noop,
      oncompleted: ({ url }) => {
        let error = null;
        callback(error, url, args);
      },
      onerror: (error) => {
        callback(error);
      }
    };
    uploader.exec(content, opts, callbacks);
  }, option);
}

function uploadFrame(upload, option, callback){
  let { type, token, domain, file } = option;
  let uploader = Uploader(upload, { type });
  uploader.capture(file, (frameFile, args) => {
    let content = { file: frameFile };
    let opts = { token, domain };
    let callbacks = {
      onprogress: utils.noop,
      oncompleted: ({ url }) => {
        let error = null;
        callback(error, url, args);
      },
      onerror: (error) => {
        callback(error);
      }
    };
    uploader.exec(content, opts, callbacks);
  }, option);
}

function getDraftKey(item){
  return `draft_${item.conversationType}_${item.conversationId}`;
}
function formatUser(user){
  let exts = utils.toObject(user.extFields);
  return {
    id: user.userId,
    name: user.nickname || "",
    portrait: user.userPortrait || "",
    updatedTime: user.updatedTime || 0,
    exts: exts || {}
  };
}
function toKVs(obj){
  let arrs = [];
  utils.forEach(obj, (value, key) => {
    arrs.push({key, value});
  });
  return arrs;
}
function formatProvider(funcs, instance){
  let invokes = {};

  utils.forEach(funcs, (name) => {
    invokes[name] = function(){
      let args = [];
      for(let i = 0; i < arguments.length; i++){
        let item = arguments[i], itemNew = {};
        itemNew = utils.isArray(item) ? item : clone(item);
        args.push(itemNew);
      }
      let func = instance[name];
      if(func){
        return func(...args);
      }
      return Promise.reject(ErrorType.SDK_FUNC_NOT_DEFINED);
    };
  });
  return invokes;
}
function clone(item){
  let loop = (obj) => {
    let newObj = {};
    utils.forEach(obj, (v, k) => {
      // 递归循环中包含 File 对象直接跳过，File 对象不能 clone
      if(utils.isObject(v)){
        newObj[k] = loop(v);
      }else if(utils.isArray(v)){
        newObj[k] = utils.clone(v);
      }else{
        newObj[k] = v;
      }
    });
    return newObj;
  }
  let result = loop(item);
  return result;
}
function isDesktop(){
  return typeof JGChatPCClient != 'undefined';
}
export default {
  check,
  getNum,
  getNaviStorageKey,
  updateSyncTime,
  updateChatroomSyncTime,
  getError,
  ConversationUtils,
  checkUploadType,
  formatMediaMessage,
  uploadThumbnail,
  uploadFrame,
  getDraftKey,
  formatUser,
  toKVs,
  registerMessage,
  getMsgFlag,
  formatter,
  formatProvider,
  isDesktop,
}