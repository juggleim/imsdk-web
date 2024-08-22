import { COMMAND_TOPICS, ErrorType, FUNC_PARAM_CHECKER, SIGNAL_CMD, SIGNAL_NAME, EVENT, NOTIFY_TYPE } from "../../enum";
import utils from "../../utils";
import Storage from "../../common/storage";
import common from "../../common/common";
import AttrCacher from "../../common/attr-cacher";

export default function(io, emitter, logger){
  let attrCaher = AttrCacher();

  io.on(SIGNAL_NAME.CMD_CHATROOM_ATTR_RECEIVED, (result) => {
    let { dels, updates } = attrCaher.heap(result);
    let { chatroomId } = result;
    if(!utils.isEmpty(dels)){
      emitter.emit(EVENT.CHATROOM_ATTRIBUTE_DELETED, { id: chatroomId, attributes: dels });
    }
    
    if(!utils.isEmpty(updates)){
      emitter.emit(EVENT.CHATROOM_ATTRIBUTE_UPDATED, { id: chatroomId, attributes: updates });
    }

    // 事件说明：
    // USER_REJOINED: 当前用户断网重新加入
    // USER_JOINED: 当前用户断网重新加入
    // USER_QUIT: 当前用户退出 
    
    // MEMBER_JOINED: 成员加入
    // MEMBER_QUIT: 成员退出
    
    // ATTRIBUTE_UPDATED: 属性变更
    // ATTRIBUTE_REMOVED: 属性被删除

    // CHATROOM_DESTROYED: 聊天室销毁
  });

  let joinChatroom = (chatroom) =>{
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.JOINCHATROOM);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { id } = chatroom;
      let data = {
        topic: COMMAND_TOPICS.JOIN_CHATROOM,
        chatroom,
        conversationId: id
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code }) => {
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          let syncers = [
            { name: SIGNAL_NAME.S_NTF, msg: { receiveTime: 0, type: NOTIFY_TYPE.CHATROOM, targetId: id } },
            { name: SIGNAL_NAME.S_NTF, msg: { receiveTime: 0, type: NOTIFY_TYPE.CHATROOM_ATTR, targetId: id } },
          ];
          io.sync(syncers);
          return resolve();
        }
        let error = common.getError(code);
        reject(error)
      });
    });
  };

  let quitChatroom = (chatroom) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.QUITCHATROOM);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.QUIT_CHATROOM,
        chatroom
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code }) => {
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return resolve();
        }
        let error = common.getError(code);
        reject(error)
      });
    });
  };

  /* 
    let chatroom = {
      id: 'chatroomId',
      attributes: [
        { key: 'name', value: 'xiaoshan', isForce: true, isAutoDel: true },
      ],
      options: {
        notify: '',
      }
    }
  */
  let setChatroomAttributes = (chatroom) => {
    chatroom = utils.clone(chatroom);
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.SET_CHATROOM_ATTRS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { options } = chatroom;
      if(!utils.isObject(options)){
        options = {};
      }
      let { notify } = options;
      if(!utils.isUndefined(notify) && !utils.isString(notify)){
        let _error = ErrorType.ILLEGAL_TYPE_PARAMS;
        return reject({ code: _error.code, msg: `notify ${_error.msg}，必须是 String 类型` })
      }
      chatroom = utils.extend(chatroom, { options });
      let data = {
        topic: COMMAND_TOPICS.SET_CHATROOM_ATTRIBUTES,
        chatroom
      };
      attrCaher.removeAttrs(chatroom);
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let { code, success, fail } = result;
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return resolve({ success, fail });
        }
        let error = common.getError(code);
        reject(error)
      });
    });
  };
  
   /* 
    let chatroom = {
      id: 'chatroomId',
      attributes: [{ key: 'key1' }],
      options: {
        notify: ''
      }
    };
  */
    let removeChatroomAttributes = (chatroom) => {
      return utils.deferred((resolve, reject) => {
        let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.REMOVE_CHATROOM_ATTRS);
        if(!utils.isEmpty(error)){
          return reject(error);
        }
        let { options } = chatroom;
        if(!utils.isObject(options)){
          options = {};
        }
        let { notify } = options;
        if(!utils.isUndefined(notify) && !utils.isString(notify)){
          let _error = ErrorType.ILLEGAL_TYPE_PARAMS;
          return reject({ code: _error.code, msg: `notify ${_error.msg}，必须是 String 类型` })
        }

        chatroom = utils.extend(chatroom, { options });
        
        let data = {
          topic: COMMAND_TOPICS.REMOVE_CHATROOM_ATTRIBUTES,
          chatroom
        };
        io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
          let { code, success, fail } = result;
          if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
            attrCaher.removeAttrs({ id: chatroom.id, attributes: success });
            return resolve({ success, fail });
          }
          let error = common.getError(code);
          reject(error)
        });
      });
    };

  /* 
    let chatroom = {
      id: 'chatroomId',
      attributes: [{ key: 'key1' }],
    };
  */
  let getChatroomAttributes = (chatroom) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.GET_CHATROOM_ATTRS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let result = attrCaher.getAttrs(chatroom);
      resolve(result);
    });
  };
    /* 
    let chatroom = {
      id: 'chatroomId',
    };
  */
  let getAllChatRoomAttributes = (chatroom) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, chatroom, FUNC_PARAM_CHECKER.GET_ALL_CHATROOM_ATTRS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let result = attrCaher.getAll(chatroom);
      resolve(result);
    });
  };

  return {
    joinChatroom,
    quitChatroom,
    setChatroomAttributes,
    getChatroomAttributes,
    removeChatroomAttributes,
    getAllChatRoomAttributes,
  }
}