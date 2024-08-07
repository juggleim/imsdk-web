import { COMMAND_TOPICS, ErrorType, FUNC_PARAM_CHECKER, SIGNAL_CMD, SIGNAL_NAME } from "../../enum";
import utils from "../../utils";
import Storage from "../../common/storage";
import common from "../../common/common";

export default function(io, emitter, logger){
 
  io.on(SIGNAL_NAME.CHATROOM_EVENT, (notify) => {

    // 事件说明：
    // 事件说明：
    // USER_REJOIN: 当前用户断网重新加入
    // MEMBER_CHANGED: 加入 、退出触发
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
      attributes: {
        key1: 'value1',
        key2: 'value2'
      },
      options: {
        isNotify: false,
        isForce: true,
        isAutoDelete: true,
        notifyContent: '',
      }
    }
  */
  let setChatroomAttributes = (chatroom) => {

  };
  
  /* 
    let chatroom = {
      id: 'chatroomId',
      attributes: ['key1', 'key2']
    };
  */
  let getChatroomAttributes = (chatroom) => {

  };

  /* 
    let chatroom = {
      id: 'chatroomId',
      attributes: ['key1', 'key2'],
      options: {
        isNotify: false,
        notifyContent: '',
      }
    };
  */
  let removeChatroomAttributes = () => {

  };

    /* 
    let chatroom = {
      id: 'chatroomId',
    };
  */
  let getAllChatRoomAttributes = (chatroom) => {

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