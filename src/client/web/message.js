import { 
  MESSAGE_SENT_STATE, SIGNAL_CMD, 
  EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER, MESSAGE_ORDER, COMMAND_TOPICS, CONVERATION_TYPE, 
  ErrorType, MENTION_ORDER, UPLOAD_TYPE, FILE_TYPE, MESSAGE_TYPE,
  LOG_MODULE,
} from "../../enum";
import utils from "../../utils";
import common from "../../common/common";
import Uploder from "../../common/uploader";
import MessageCacher from "../../common/msg-cacher";
import chatroomCacher from "../../common/chatroom-cacher";

export default function(io, emitter, logger){
  let messageCacher = MessageCacher();

  io.on(SIGNAL_NAME.CMD_RECEIVED, (message, isPullFinished = true) => {

    logger.info({ tag: LOG_MODULE.MSG_RECEIVE, messageId: message.messageId });

    let isChatroom = utils.isEqual(message.conversationType, CONVERATION_TYPE.CHATROOM);
    if(isChatroom){
      let _chatroomResult = chatroomCacher.get(message.conversationId);
      return _chatroomResult.isJoined && emitter.emit(EVENT.MESSAGE_RECEIVED, [message, true]);
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_LOG_REPORT)){
      let { content, messageId } = message;
      return common.reportLogs({ logger, params: { ...content, messageId } });
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.MODIFY)){
      let { content: { content, messageId, sentTime } } = message;
      let str = utils.decodeBase64(content);
      let newContent = utils.parse(str);
      // 将被修改消息的 messageId 和 sentTime 赋值给 message，伪装成 message 对象抛给业务层
      utils.extend(message, { content: newContent, messageId, sentTime });
    }

    // 收到非聊天室消息一定要更新会话列表
    io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, utils.clone(message));

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_DELETE_MSGS)){
      let { content: { conversationId, conversationType, messages } } = message;
      return emitter.emit(EVENT.MESSAGE_REMOVED, { conversationId, conversationType, messages });
    }
    
    // 消息监听无需处理标记未读消息
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_MARK_UNREAD)){
      return;
    }
    // 消息监听无需处理清理总数消息
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_CLEAR_TOTALUNREAD)){
      return;
    }
    // 消息监听无需处理会话添加
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_ADD_CONVER)){
      return;
    }
    // 消息监听无需处理会话删除
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_REMOVE_CONVERS)){
      return;
    }
    // 消息监听无需处理会话置顶
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_TOPCONVERS)){
      return;
    }
    // 消息监听无需处理免打扰
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_UNDISTURB)){
      return;
    }
    //清理未读同步，只变更会话列表
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_UNREAD)){
      return;
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.RECALL)){
      let { conversationId, conversationType, content, sender } = message;
      return emitter.emit(EVENT.MESSAGE_RECALLED, { conversationId, conversationType, content, sender });
    }
  
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_MSG)){
      let { content: {  conversationType, conversationId, cleanTime, senderId } } = message;
      if(!utils.isEmpty(senderId)){
        return emitter.emit(EVENT.MESSAGE_CLEAN_SOMEONE, { conversationType, conversationId, senderId });
      }
      return emitter.emit(EVENT.MESSAGE_CLEAN, { conversationType, conversationId, cleanTime });
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.MODIFY)){
      let { conversationType, conversationId, content, messageId } = message;
      return emitter.emit(EVENT.MESSAGE_UPDATED, { conversationType, conversationId, messageId, content });
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.READ_MSG) || utils.isEqual(message.name, MESSAGE_TYPE.READ_GROUP_MSG)){
      let { conversationType, conversationId, content: { msgs } } = message;
      let notify = {
        conversationType, 
        conversationId, 
        messages: msgs
      };
      return emitter.emit(EVENT.MESSAGE_READ, notify);
    }
    if(!messageCacher.isInclude(message)){
      emitter.emit(EVENT.MESSAGE_RECEIVED, [message, isPullFinished]);
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

  let sendMessage = (message, callbacks = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { referMsg } = message;
      if(!utils.isUndefined(referMsg)){
        let { messageIndex, messageId } = referMsg;
        if(utils.isUndefined(messageIndex) || utils.isUndefined(messageId) ){
          return reject(ErrorType.SEND_REFER_MESSAGE_ERROR);
        }
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND });
      let _callbacks = {
        onbefore: () => {}
      };
      utils.extend(_callbacks, callbacks);
      
      let data = utils.clone(message);
      let { name, conversationType, conversationId, isMass } = data;

      let flag = common.getMsgFlag(name, { isMass });
      utils.extend(data, { flag });

      let topic = topics[conversationType];
      utils.extend(data, { topic })

      let tid = message.tid || utils.getUUID();
      utils.extend(message, { tid, sentState: MESSAGE_SENT_STATE.SENDING });
      _callbacks.onbefore(message);
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ messageId, sentTime, code, msg, msgIndex, memberCount }) => {
        let sender = io.getCurrentUser() || {};
        utils.extend(message, { sender, isSender: true });
        if(code){
          utils.extend(message, { error: { code, msg }, sentState: MESSAGE_SENT_STATE.FAILED });
          return reject(message)
        }
        utils.extend(message, { sentTime, messageId, messageIndex: msgIndex, sentState: MESSAGE_SENT_STATE.SUCCESS });
        let config = io.getConfig();
        if(!config.isPC && !utils.isEqual(conversationType, CONVERATION_TYPE.CHATROOM)){
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, message);
        }
        let isChatroom = utils.isEqual(message.conversationType, CONVERATION_TYPE.CHATROOM)
        if(isChatroom){
          let { conversationId } = message;
          let { msgs = [] } = chatroomCacher.get(conversationId);
          msgs.push(message.messageId);
          chatroomCacher.set(conversationId, { msgs });
        }

        let isGroup = utils.isEqual(message.conversationType, CONVERATION_TYPE.GROUP);
        if(isGroup){
          message = utils.extend(message, { unreadCount: memberCount, readCount: 0 });
        }
        resolve(message);
      });
    });
  };

  /* 
    let messages = [ Message, Message, ... ];  
    let callbacks = {
      onbefore: () => {},
      onprogress: ({ message, count, total }) => {},
      oncompleted: ({ messages }) => {},
    };
  */
  let sendMassMessage = (messages, callbacks = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, messages, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_MASS });
      let _cbs = {
        onprogress: () => {},
        oncompleted: () => {},
      };
      utils.extend(_cbs, callbacks);

      messages = utils.isArray(messages) ? messages : [messages];
      messages = utils.map(messages, (message) => {
        return { isMass: true, ...message }
      });
      
      let _msgs = [];
      let total = messages.length;
      utils.iterator(messages, (message, next, isFinished) => {
        let _next = () => {
          if(isFinished){
            resolve();
            return _cbs.oncompleted({ messages: _msgs });
          }
          next();
        };
        let progress = (msg) => {
          _msgs.push(msg);
          _cbs.onprogress({ message: msg, count: _msgs.length, total });
          _next();
        };
        sendMessage(message, callbacks).then(progress, progress);
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
        order: MESSAGE_ORDER.BACKWARD,
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
      let user = io.getCurrentUser();
      let data = {
        topic: COMMAND_TOPICS.GET_MSG_BY_IDS,
        userId: user.id,
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
      logger.info({ tag: LOG_MODULE.MSG_CLEAR, ...params });
      let data = {
        topic: COMMAND_TOPICS.CLEAR_MESSAGE,
        time: 0
      };
      utils.extend(data, params);

      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, timestamp }) => {
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
        }
        let config = io.getConfig();
        if(!config.isPC){
          let msg = { name: MESSAGE_TYPE.CLEAR_MSG, content: { ...data } };
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
        resolve();
      });
    });
  };
  let removeMessages = (messages) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, messages, FUNC_PARAM_CHECKER.REMOVE_MSGS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      messages = utils.isArray(messages) ? messages : [messages];
      let list = utils.quickSort(utils.clone(messages), (a, b) => {
        return a.sentTime > b.sentTime;
      });
      let item = list[0] || { sentTime: -10 };
      logger.info({ tag: LOG_MODULE.MSG_DELETE, time: item.sentTime });

      let user = io.getCurrentUser();
      let data = {
        topic: COMMAND_TOPICS.REMOVE_MESSAGE,
        messages,
        userId: user.id
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, timestamp }) => {
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
        }
        let config = io.getConfig();
        if(!config.isPC){
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, { name: MESSAGE_TYPE.CLIENT_REMOVE_MSGS, content: { messages } });
        }
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
      
      logger.info({ tag: LOG_MODULE.MSG_RECALL,  messageId: message.messageId, sentTime: message.sentTime});

      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let { code, timestamp } = result;
        if(utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
          
          let msg = utils.clone(message);
          let { messageId, sentTime, exts } = message;
          let sender = io.getCurrentUser();
          utils.extend(msg, {
            name: MESSAGE_TYPE.RECALL,
            sender,
            isSender: true,
            content: {
              messageId,
              sentTime,
              exts,
            },
          });
          let config = io.getConfig();
          if(!config.isPC){
            io.emit(SIGNAL_NAME.CMD_RECEIVED, msg);
          }

          let _msg = utils.clone(msg);
          delete msg.exts;
          _msg = utils.extend(msg, { name: MESSAGE_TYPE.RECALL_INFO });
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
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code,  timestamp }) => {
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
        }
        resolve();
      });
    });
  };
  let getMessageReadDetails = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.GET_MESSAGE_READ_DETAILS);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        topic: COMMAND_TOPICS.GET_READ_MESSAGE_DETAIL,
        message
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        delete result.index;
        resolve(result);
      });
    });
  };

  let updateMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.UPDATEMESSAGE);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_UPDATE,  messageId: message.messageId });
      let msg = {
        ...message,
        name: MESSAGE_TYPE.MODIFY,
      };
      let notify = (_msg = {}) => {
        utils.extend(msg, _msg);
        let config = io.getConfig();
        if(!config.isPC){
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
      };
      // 兼容 PC 端修改非 content 属性，保证多端行为一致性，直接返回，PC 端会做本地消息 update
      if(utils.isUndefined(message.content)){
        notify();
        return resolve(msg);
      }
      let data = {
        topic: COMMAND_TOPICS.UPDATE_MESSAGE,
        ...message
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let sender = io.getCurrentUser();
        
        notify({
          sender,
          isSender: true,
          isUpdated: true,
          content: {
            messageId: message.messageId,
            ...message.content
          }
        });
        resolve(msg);
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
      let user = io.getCurrentUser();
      utils.extend(params, conversation);
      let data = {
        topic: COMMAND_TOPICS.GET_MENTION_MSGS,
        userId: user.id,
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
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ cred: { token, domain, type, url } }) => {
        resolve({ token, domain, type, url });
      });
    });
  };
/* options: fileType, Video and Image: scale: 0 ~ 1 */
  let _uploadFile = (options, message, callbacks = {}) => {
    let { uploadType, upload, fileCompressLimit } = io.getConfig();
      let _callbacks = {
        onprogress: () => { },
        onerror: () => { }
      };
      utils.extend(_callbacks, callbacks);

      let { fileType, scale } = options;
      let uploader = Uploder(upload, { type: uploadType });

      let { name, content } = message;
      let _file = content.file;
      let names = _file.name.split('.');
      let ext = names[names.length - 1];
      getFileToken({ type: fileType, ext }).then((auth) => {
        let { type } = auth;
        if(!utils.isEqual(type, uploadType)){
          return _callbacks.onerror(ErrorType.UPLOAD_PLUGIN_NOTMATCH);
        }
        let params = utils.extend(auth, { file: content.file, scale, fileCompressLimit });

        if(utils.isEqual(name, MESSAGE_TYPE.IMAGE)){
          // 业务层设置缩略图，传入优先，不再执行生成缩略图逻辑
          let { thumbnail } = content;
          if(thumbnail){
            return uploadFile(auth, message);
          }

          getFileToken({ type: fileType, ext }).then((cred) => {
            common.uploadThumbnail(upload, { ...params, ...cred }, (error, thumbnail, args) => {
              let { height, width } = args;
              utils.extend(message.content, { thumbnail, height, width, type: content.file.type });
              uploadFile(auth, message);
            });
          });
        }
        
        if(utils.isEqual(name, MESSAGE_TYPE.VIDEO)){
          // 业务层设置封面，传入优先，不再执行生成缩略图逻辑
          let { snapshotUrl } = content;
          if(snapshotUrl){
            return uploadFile(auth, message);
          }
          getFileToken({ type: fileType, ext }).then((cred) => {
            common.uploadFrame(upload, { ...params, ...cred }, (error, snapshotUrl, args) => {
              let { height, width, duration } = args;
              utils.extend(message.content, { snapshotUrl, height, width, duration});
              uploadFile(auth, message);
            });
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
            _callbacks.oncompleted(message);
          },
          onerror: (error) => {
            _callbacks.onerror(ErrorType.UPLOADING_FILE_ERROR, error);
          }
        };
        uploader.exec(content, option, cbs);
      }
  };
  /* 
    message = {
      conversationType,
      conversationId,
      content: { file, name, type, intro }
    }
  */
  let sendFileMessage = (message, callbacks = {}) => {
    message = utils.extend(message, { name: MESSAGE_TYPE.FILE });
    let option = { fileType: FILE_TYPE.FILE };
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      let { uploadType } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_FILE, type: FILE_TYPE.FILE });
      let onbefore = callbacks.onbefore || utils.noop;
      let tid = message.tid || utils.getUUID();
      utils.extend(message, { tid, sentState: MESSAGE_SENT_STATE.SENDING });

      let { size = 0 } = message.content;
      size = size / 1024;
      let msg = utils.clone(message);
      msg.content = { ...message.content, size };
      onbefore(msg);

      _uploadFile(option, message, {
        onprogress: callbacks.onprogress,
        oncompleted: (message) => {
          sendMessage(message).then(resolve, reject);
        },
        onerror: callbacks.onerror,
      })
    });
  };

  let sendImageMessage = (message, callbacks = {}) => {
    message = utils.extend(message, { name: MESSAGE_TYPE.IMAGE });
    let option = { fileType: FILE_TYPE.IMAGE, scale: message.scale };
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      let { uploadType } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_FILE, type: FILE_TYPE.IMAGE });
      let onbefore = callbacks.onbefore || utils.noop;
      let tid = message.tid || utils.getUUID();
      utils.extend(message, { tid, sentState: MESSAGE_SENT_STATE.SENDING });
      onbefore(message);

      _uploadFile(option, message, {
        onprogress: callbacks.onprogress,
        oncompleted: (message) => {
          sendMessage(message).then(resolve, reject);
        },
        onerror: callbacks.onerror,
      })
    });
  };

  let sendVoiceMessage = (message, callbacks = {}) => {
    message = utils.extend(message, { name: MESSAGE_TYPE.VOICE });
    let option = { fileType: FILE_TYPE.AUDIO };
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      let { uploadType } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_FILE, type: FILE_TYPE.AUDIO });

      let onbefore = callbacks.onbefore || utils.noop;
      let tid = message.tid || utils.getUUID();
      utils.extend(message, { tid, sentState: MESSAGE_SENT_STATE.SENDING });
      onbefore(message);

      _uploadFile(option, message, {
        onprogress: callbacks.onprogress,
        oncompleted: (message) => {
          sendMessage(message).then(resolve, reject);
        },
        onerror: callbacks.onerror,
      })
    });
  };

  let sendVideoMessage = (message, callbacks = {}) => {
    message = utils.extend(message, { name: MESSAGE_TYPE.VIDEO });
    let option = { fileType: FILE_TYPE.VIDEO, scale: message.scale };
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SEND_FILE_MESSAGE);
      let { uploadType } = io.getConfig();
      if(utils.isEqual(uploadType, UPLOAD_TYPE.NONE)){
        error = ErrorType.UPLOAD_PLUGIN_ERROR;
      }
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_FILE, type: FILE_TYPE.VIDEO });
      let onbefore = callbacks.onbefore || utils.noop;
      let tid = message.tid || utils.getUUID();
      utils.extend(message, { tid, sentState: MESSAGE_SENT_STATE.SENDING });
      onbefore(message);
      
      _uploadFile(option, message, {
        onprogress: callbacks.onprogress,
        oncompleted: (message) => {
          sendMessage(message).then(resolve, reject);
        },
        onerror: callbacks.onerror,
      });
    });
  };

  let sendMergeMessage = (params, callbacks = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.SEND_MERGE_MESSAGE);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.MSG_SEND_MERGE });
      let { conversationType, conversationId, messages, previewList, title } = params;
      if(messages.length > 20){
        return reject(ErrorType.TRANSFER_MESSAGE_COUNT_EXCEED);
      }
      let mergeMsg = {
        channelType: CONVERATION_TYPE.PRIVATE,
        targetId: ''
      };
      let messageIdList = [];
      messages = utils.map(messages, (message) => {
        utils.extend(mergeMsg, { 
          channelType: message.conversationType,
          targetId: message.conversationId
        });
        return { msgId: message.messageId, msgTime: message.sentTime, msgIndex: message.messageIndex };
      });

      utils.forEach(messages, ({ msgId }) => {
        messageIdList.push(msgId);
      });
      let user = io.getCurrentUser();
      utils.extend(mergeMsg, { userId: user.id, msgs: messages });

      let msg = {
        conversationId,
        conversationType,
        name: MESSAGE_TYPE.MERGE,
        mergeMsg: mergeMsg,
        content: {
          previewList,
          messageIdList,
          title
        }
      };
      return sendMessage(msg, callbacks).then(resolve, reject);
    });
  };

  let getMergeMessages = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_MERGE_MESSAGES);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        time: 0,
        order: MESSAGE_ORDER.FORWARD,
        count: 20,
        topic: COMMAND_TOPICS.GET_MERGE_MSGS,
      };
      utils.extend(data, params);
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ isFinished, messages }) => {
        resolve({ isFinished, messages });
      });
    });
  };

  let getFirstUnreadMessage = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GET_FIRST_UNREAD_MSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = {
        ...conversation,
        topic: COMMAND_TOPICS.GET_FIRST_UNREAD_MSG,
      };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, msg }) => {
        if(!utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return reject({ code });
        }
        resolve({ message: msg });
      });
    });
  };

  let searchMessages = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.SEARCH_MESSAGES);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      return reject(ErrorType.SDK_FUNC_NOT_DEFINED);
    });
  };

  let updateMessageAttr = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.UPDATE_MESSAGE_ATTR);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      return reject(ErrorType.SDK_FUNC_NOT_DEFINED);
    });
  };

  let setSearchContent = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.SET_MESSAGE_SEARCH_CONTENT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      return reject(ErrorType.SDK_FUNC_NOT_DEFINED);
    });
  };

  let insertMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.INSERT_MESSAGE);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let { sender } = message;
      let isSender = utils.isEqual(user.id, sender.id);
      let tid = utils.getUUID();
      let msg = { tid, ...message, isSender, sender };
      resolve(msg);
    });
  };
  return {
    sendMessage,
    sendMassMessage,
    getMessages,
    removeMessages,
    getMessagesByIds,
    clearMessage,
    recallMessage,
    readMessage,
    getMessageReadDetails,
    updateMessage,
    insertMessage,
    updateMessageAttr,
    setSearchContent,
    getMentionMessages,
    getFileToken,
    sendFileMessage,
    sendImageMessage,
    sendVoiceMessage,
    sendVideoMessage,
    sendMergeMessage,
    getMergeMessages,
    getFirstUnreadMessage,
    searchMessages,
    _uploadFile,
  };
}