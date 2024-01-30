import { SIGNAL_CMD, EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER, MESSAGE_ORDER, COMMAND_TOPICS, CONVERATION_TYPE, ErrorType, MENTION_ORDER, UPLOAD_TYPE, FILE_TYPE, MESSAGE_TYPE } from "../enum";
import utils from "../utils";
import common from "../common/common";
import Uploder from "../common/uploader";
import MessageCacher from "../common/msg-cacher";

export default function(io, emitter){
  let messageCacher = MessageCacher();

  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {

    if(utils.isEqual(message.name, MESSAGE_TYPE.MODIFY)){
      let { content: { content, messageId, sentTime } } = message;
      let str = utils.decodeBase64(content);
      let newContent = utils.parse(str);
      // 将被修改消息的 messageId 和 sentTime 赋值给 message，伪装成 message 对象抛给业务层
      utils.extend(message, { content: newContent, messageId, sentTime });
    }

    // 收到消息一定要更新会话列表
    io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, utils.clone(message));

    //清理未读同步，只变更会话列表
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_UNREAD)){
      return;
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.RECALL)){
      return emitter.emit(EVENT.MESSAGE_RECALLED, message);
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.MODIFY)){
      return emitter.emit(EVENT.MESSAGE_UPDATED, message);
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.READ_MSG)){
      let { conversationType, conversationId, content, sender, sentTime, messageId } = message;
      let notify = {
        conversationType, 
        conversationId, 
        content, 
        messageId,
        sentTime,
        sender
      };
      return emitter.emit(EVENT.MESSAGE_READED, notify);
    }
    if(!messageCacher.isInclude(message)){
      emitter.emit(EVENT.MESSAGE_RECEIVED, message);
      let { conversationId, conversationType } = message;
      messageCacher.add({ conversationId, conversationType }, message);
    }
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
        let sender = io.getCurrentUser() || {};
        utils.extend(message, { sender, isSender: true });
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
        targetId: conversationId,
        names: []
      };
      params = utils.extend(params, conversation);
      io.sendCommand(SIGNAL_CMD.QUERY, params, (result) => {
        let { messages } = result;
        messageCacher.add(conversation, messages);
        resolve(result);
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
          let msg = utils.clone(message);
          let { messageId, sentTime } = message;
          let sender = io.getCurrentUser();
          utils.extend(msg, {
            name: MESSAGE_TYPE.RECALL,
            sender,
            isSender: true,
            content: {
              messageId,
              sentTime,
              senderUserId: sender.id
            }
          });
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
          return resolve(msg);
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
      io.sendCommand(SIGNAL_CMD.QUERY, data, () => {
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
        let sender = io.getCurrentUser();
        let { messageId, conversationType, conversationId } = message;
        let msg = {
          messageId, 
          conversationType, 
          conversationId,
          name: MESSAGE_TYPE.MODIFY,
          sender,
          isSender: true,
          isUpdated: true,
          content: {
            messageId,
            ...message.content
          }
        };
        io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
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
/* options: fileType, Video and Image: scale: 0 ~ 1 */
  let sendFile = (options, message, callbacks = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      
      let { uploadType, upload, fileCompressLimit } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let _callbacks = {
        onprogress: () => { },
        onerror: () => { }
      };
      utils.extend(_callbacks, callbacks);

      let { fileType, scale } = options;
      let uploader = Uploder(upload, { type: uploadType });
      getFileToken({ type: fileType }).then((auth) => {
        let { type } = auth;
        if(!utils.isEqual(type, uploadType)){
          return reject(ErrorType.UPLOAD_PLUGIN_NOTMATCH);
        }
        let { name, content } = message;
        let params = utils.extend(auth, { file: content.file, scale, fileCompressLimit });

        if(utils.isEqual(name, MESSAGE_TYPE.IMAGE)){
          // 业务层设置缩略图，传入优先，不再执行生成缩略图逻辑
          let { thumbnail } = content;
          if(thumbnail){
            return uploadFile(auth, message);
          }
          common.uploadThumbnail(upload, params, (error, thumbnail, args) => {
            let { height, width } = args;
            utils.extend(message.content, { thumbnail, height, width, type: content.file.type });
            uploadFile(auth, message);
          });
        }
        
        if(utils.isEqual(name, MESSAGE_TYPE.VIDEO)){
          // 业务层设置封面，传入优先，不再执行生成缩略图逻辑
          let { poster } = content;
          if(poster){
            return uploadFile(auth, message);
          }
          common.uploadFrame(upload, params, (error, poster, args) => {
            let { height, width, duration } = args;
            utils.extend(message.content, { poster, height, width, duration});
            uploadFile(auth, message);
          });
        }

        if(utils.isInclude([MESSAGE_TYPE.FILE, MESSAGE_TYPE.VOICE], name)){
          uploadFile(auth, message);
        }
      });

      function uploadFile(option, message){
        let { content } = message;
        let cbs = {
          onprogress: ({ percent }) => {
            _callbacks.onprogress({ percent, message });
          },
          oncompleted: ({ url }) => {
            let size = content.file.size/1024;
            utils.extend(message.content, { url, size: size.toFixed(2) });
            delete message.content.file;
            sendMessage(message).then(resolve, reject);
          },
          onerror: (error) => {
            _callbacks.onerror(ErrorType.UPLOADING_FILE_ERROR, error);
          }
        };
        uploader.exec(content, option, cbs);
      }
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
    let option = { fileType: FILE_TYPE.IMAGE, scale: message.scale };
    return sendFile(option, message, callbacks)
  };

  let sendVoiceMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.VOICE });
    let option = { fileType: FILE_TYPE.AUDIO };
    return sendFile(option, message, callbacks)
  };

  let sendVideoMessage = (message, callbacks = {}) => {
    utils.extend(message, { name: MESSAGE_TYPE.VIDEO });
    let option = { fileType: FILE_TYPE.VIDEO, scale: message.scale };
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