import { SIGNAL_CMD, EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER, MESSAGE_ORDER, COMMAND_TOPICS, CONVERATION_TYPE, ErrorType, MENTION_ORDER, UPLOAD_TYPE, FILE_TYPE, MESSAGE_TYPE } from "../enum";
import utils from "../utils";
import common from "../common/common";
import Uploder from "../common/uploader";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {
    io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, message);
    emitter.emit(EVENT.MESSAGE_RECEIVED, message)
  });

  let maps = [
    [CONVERATION_TYPE.PRIVATE, 'p_msg'],
    [CONVERATION_TYPE.GROUP, 'g_msg'],
    [CONVERATION_TYPE.CHATROOM, 'c_msg'],
  ];
  let topics = {};
  utils.forEach(maps, (map) => {
    topics[map[0]] = map[1];
  });

  let sendMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let data = utils.clone(message);
      let { name, conversationType, conversationId } = data;
      let config = common.getMsgConfig(name);
      utils.extend(data, config);

      let topic = topics[conversationType];
      utils.extend(data, { topic })

      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ messageId, sentTime, code, msg }) => {
        if(code){
          utils.extend(message, { error: { code, msg } });
          return reject(message)
        }
        utils.extend(message, { sentTime, messageId });
        io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, message);
        resolve(message);
      });
    });
  };

  let getMessages = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GETMSGS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { conversationId } = conversation;
      let { id: userId } = io.getCurrentUser();
      let params = {
        time: 0,
        order: MESSAGE_ORDER.FORWARD,
        count: 20,
        userId: userId,
        topic: COMMAND_TOPICS.HISTORY_MESSAGES,
        targetId: conversationId
      };
      params = utils.extend(params, conversation);
      io.sendCommand(SIGNAL_CMD.QUERY, params, (msg) => {
        resolve(msg);
      });
    });
  };
  let getMessagesByIds = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GETMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.GET_MSG_BY_IDS
      };
      data = utils.extend(data, params);
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ messages }) => {
        resolve({ messages });
      });
    });
  };
  let clearMessage = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.CLEARMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.CLEAR_MESSAGE,
        time: 0
      };
      utils.extend(data, params);

      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        resolve();
      });
    });
  };
  /* 
    let message = {conversationType, conversationId, sentTime, messageId}
  */
  let recallMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.RECALLMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = { topic:  COMMAND_TOPICS.RECALL };
      utils.extend(data, message);
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, (result) => {
        let { code } = result;
        if(utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          return resolve();
        }
        let { msg } = common.getError(code);
        reject({ code, msg });
      });
    });
  };
  let readMessage = (messages) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, messages, FUNC_PARAM_CHECKER.READMESSAGE);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.READ_MESSAGE,
        messages
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        resolve();
      });
    });
  };
  let updateMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.UPDATEMESSAGE);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.UPDATE_MESSAGE,
        ...message
      };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, (result) => {
        resolve(result);
      });
    });
  };
  let getMentionMessages = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GET_MENTIOIN_MESSAGES);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let params = {
        count: 20,
        order: MENTION_ORDER.BACKWARD,
        messageIndex: 0
      };
      utils.extend(params, conversation);
      let data = {
        topic: COMMAND_TOPICS.GET_MENTION_MSGS,
        ...params
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ isFinished, msgs }) => {
        resolve({ isFinished, msgs });
      });
    });
  };
  let getFileToken = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_FILE_TOKEN);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { id: userId } = io.getCurrentUser();
      let data = {
        topic: COMMAND_TOPICS.GET_FILE_TOKEN,
        ...params,
        userId
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ cred: { token, domain, type } }) => {
        resolve({ token, domain, type });
      });
    });
  };
  /* options: fileType */
  let sendFile = (options, message, callbacks = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      
      let { uploadType, upload } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let _callbacks = {
        onprogress: () => {}
      };
      utils.extend(_callbacks, callbacks);

      let { fileType } = options;
      getFileToken({ type: fileType }).then(({ token, domain, type }) => {
        if(!utils.isEqual(type, uploadType)){
          return reject(ErrorType.UPLOAD_PLUGIN_NOTMATCH);
        }
        let option = { type };
        let { content } = message;
        let { file } = content;
        let opts = { token, domain};
        let cbs = {
          onprogress: _callbacks.onprogress,
          oncompleted: ({ url }) => {
            message = common.formatMediaMessage(message, url);
            sendMessage(message).then(resolve, reject);
          }
        };
        Uploder(upload, option).exec(content, opts, cbs);
      });
    });
  };
  /* 
    message = {
      conversationType,
      conversationId,
      content: { file, name, type, intro }
    }
  */
  let sendFileMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.FILE });
    let option = { fileType: FILE_TYPE.FILE };
    return sendFile(option, message, callbacks)
  };

  let sendImageMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.IMAGE });
    let option = { fileType: FILE_TYPE.IMAGE };
    return sendFile(option, message, callbacks)
  };

  let sendVoiceMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.VOICE });
    let option = { fileType: FILE_TYPE.AUDIO };
    return sendFile(option, message, callbacks)
  };

  let sendVideoMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.VIDEO });
    let option = { fileType: FILE_TYPE.VIDEO };
    return sendFile(option, message, callbacks)
  };
  return {
    sendMessage,
    getMessages,
    getMessagesByIds,
    clearMessage,
    recallMessage,
    readMessage,
    updateMessage,
    getMentionMessages,
    getFileToken,
    sendFileMessage,
    sendImageMessage,
    sendVoiceMessage,
    sendVideoMessage
  };
}