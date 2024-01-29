import utils from "../utils";
import { ErrorType, STORAGE, ErrorMessages, MESSAGE_TYPE, MESSAGE_FLAG, UPLOAD_TYPE } from "../enum";
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
        let { latestMessage, conversationTitle, conversationPortrait, conversationExts, latestMentionMsg } = item;

        if(utils.isEmpty(conversationTitle)){
          conversationTitle = conversation.conversationTitle;
        }
        if(utils.isEmpty(conversationPortrait)){
          conversationPortrait = conversation.conversationPortrait;
        }
        if(utils.isEmpty(conversationExts)){
          conversationExts = conversation.conversationExts;
        }

        if(!latestMessage.isSender){
          unreadCount = unreadCount + 1
        }
        // 自己发送的多端同步清空消息，未读数设置为 0，最后一条消息保持不变
        if(utils.isEqual(latestMessage.name, MESSAGE_TYPE.CLEAR_UNREAD) && latestMessage.isSender){
          unreadCount = 0;
          latestMessage = conversation.latestMessage;
        }
        utils.extend(conversation, { 
          unreadCount: unreadCount,
          latestMessage: latestMessage,
          conversationTitle, 
          conversationPortrait,
          conversationExts,
          latestMentionMsg
        });
        return conversations.push(conversation);
      }
      let key = getDraftKey(item);
      let draft = Storage.get(key);
      draft = utils.isEmpty(draft) ? '' : draft;
      utils.extend(item, { draft })
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
  utils.extend(user, { extFields: exts });
  return utils.rename(user, {
    extFields: 'exts',
    nickname: 'name',
    userId: 'id',
    userPortrait: 'portrait',
  });
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
  checkUploadType,
  formatMediaMessage,
  uploadThumbnail,
  uploadFrame,
  getDraftKey,
  formatUser
}