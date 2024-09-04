import { FUNC_PARAM_CHECKER, ErrorType, SIGNAL_CMD, COMMAND_TOPICS, SIGNAL_NAME, EVENT, MESSAGE_ORDER, CONNECT_STATE, MESSAGE_TYPE, MENTION_TYPE, UNDISTURB_TYPE, CONVERSATION_ORDER } from "../../enum";
import utils from "../../utils";
import common from "../../common/common";
import Storage from "../../common/storage";

export default function(io, emitter){
  /*  
  1、内存中缓存最近 200 个会话，并按 message.sentTime 倒序排序
  2、startTime 是 0 时，优先返回内存中会话，内存数量小于 count 数，从服务端获取
  3、startTime 非 0 是，直接从服务端获取，并更新到内存中
  */
  let conversationUtils = common.ConversationUtils();

  io.on(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, (message) => {

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_DELETE_MSGS)){
      let { content: { messages } } = message;
      return io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, { ...message, name: MESSAGE_TYPE.CLIENT_REMOVE_MSGS });
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_ADD_CONVER)){
      let { content: _conversation } = message;
      conversationUtils.update(_conversation);
      let newConversation = conversationUtils.getPer(_conversation);
      return emitter.emit(EVENT.CONVERSATION_ADDED, { conversations: utils.clone([newConversation]) });
    }
    
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_CLEAR_TOTALUNREAD)){
      let { content: { clearTime } } = message;
      let conversations = conversationUtils.get();
      conversationUtils.read(conversations);
      return emitter.emit(EVENT.CLEAR_TOTAL_UNREADCOUNT, { clearTime });
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_REMOVE_CONVERS)){
      let { content: { conversations } } = message;
      let list = [];
      utils.forEach(conversations, (item) => {
        let _item = conversationUtils.remove(item);
        list.push(_item);
      });
      return emitter.emit(EVENT.CONVERSATION_REMOVED, { conversations: list });
    }
    
    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_TOPCONVERS)){
      let { content: { conversations } } = message;
      let item = conversations[0] || { isTop: false }
      let list = conversationUtils.modify(conversations, { isTop: item.isTop });
      emitter.emit(EVENT.CONVERSATION_TOP, { conversations });
      return emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: list });
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_UNDISTURB)){
      let { content: { conversations } } = message;
      let item = conversations[0] || { undisturbType: UNDISTURB_TYPE.UNDISTURB }
      let list = conversationUtils.modify(conversations, { undisturbType: item.undisturbType });
      emitter.emit(EVENT.CONVERSATION_UNDISTURBED, { conversations });
      return emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: list });
    }

    // 如果会话最后一条消息大于清理的时间，不更新会话列表
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_MSG)){
      let { content: { cleanTime, conversationType, conversationId, senderId  } } = message;
      let params = { conversationType, conversationId };
      let conversation = conversationUtils.getPer(params) || params;
      let { latestMessage } = conversation || { };
      latestMessage = latestMessage || { sender: { id: '' } }; 
  
      if(cleanTime >= latestMessage.sentTime){
        if(!utils.isEmpty(senderId) && !utils.isEqual(senderId, latestMessage.sender.id)){
          return;
        }
        conversation.latestMessage = {};
        emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: [conversation] });
      }
      return;
    }
    if(utils.isEqual(MESSAGE_TYPE.CLIENT_REMOVE_MSGS, message.name)){
      let { content: { messages } } = message;
      if(utils.isEmpty(messages)){
        return;
      }
      let msg = messages[0];
      let conversation = conversationUtils.getPer(msg);
      if(utils.isEmpty(conversation)){
        conversation = { latestMessage: { tid: '' } };
      }
      let tids = utils.map(messages, (item) => {
        return item.tid;
      });
      let { latestMessage } = conversation;
      // 只有会话最后一条消息被删除时触发会话列表变更
      if(utils.isInclude(tids, latestMessage.tid)){
        next({ conversationId: msg.conversationId, conversationType: msg.conversationType });
      }
      return;
    }
    // 如果会话最后一条消息和被撤回消息不匹配，不更新会话列表
    if(utils.isEqual(message.name, MESSAGE_TYPE.RECALL)){
      let { content: { messageId } } = message;
      let conversation = conversationUtils.getPer(message);
      let { latestMessage } = conversation || { };
      latestMessage = latestMessage || {}; 
      if(!utils.isEqual(latestMessage.messageId, messageId)){
        return;
      }
      // 对外模拟 recallinfo 消息
      message = utils.extend(message, { name: MESSAGE_TYPE.RECALL_INFO });
    }
    if(utils.isInclude([MESSAGE_TYPE.READ_MSG, MESSAGE_TYPE.READ_GROUP_MSG], message.name)){
      return;
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_UNREAD)){
      let { content } = message;
      let { conversations } = content;
      let list = conversationUtils.read(conversations);
      emitter.emit(EVENT.CONVERSATION_CLEARUNREAD, { conversations });
      if(!utils.isEmpty(list)){
        emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: list });
      }
      return;
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.COMMAND_MARK_UNREAD)){
      let { content: { conversations } } = message;
      let list = conversationUtils.modify(conversations);
      return emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: list });
    }

    if(utils.isEqual(message.name, MESSAGE_TYPE.MODIFY)){
      let conversation = conversationUtils.getPer(message);
      let { latestMessage } = conversation || {};
      latestMessage = latestMessage || {}; 
      // 如果会话最后一条消息和被修改消息不匹配，不更新会话列表
      if(!utils.isEqual(latestMessage.messageId, message.messageId)){
        return;
      }
      utils.extend(message, { name: latestMessage.name, isUpdated: true });
    }
    next(message);

    function next(message){
      let conversation = createConversation(message);
      if(conversationUtils.isExisted(conversation)){
        conversationUtils.update(conversation);
        let updateConversation = conversationUtils.getPer(conversation);
        return emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: utils.clone([updateConversation]) });
      }

      conversationUtils.add([conversation]);
      let newConversation = conversationUtils.getPer(conversation);
      emitter.emit(EVENT.CONVERSATION_ADDED, { conversations: utils.clone([newConversation]) });
    }
  });

  io.on(SIGNAL_NAME.CLIENT_CLEAR_MEMORY_CACHE, () => {
    conversationUtils.clear();
  });

  let getConversations = (params = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, []);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let { count = 50, time = 0, conversationType, order = CONVERSATION_ORDER.FORWARD } = params;
      order = utils.isEqual(order, CONVERSATION_ORDER.FORWARD) ? CONVERSATION_ORDER.FORWARD : CONVERSATION_ORDER.BACKWARD;

      let user = io.getCurrentUser();
      let _params = { topic: COMMAND_TOPICS.CONVERSATIONS, time: 0, count, order, userId: user.id, conversationType };
      utils.extend(_params, params);
      io.sendCommand(SIGNAL_CMD.QUERY, _params, (result) => {
        let { code, msg } = result;
        if(!utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return reject({code, msg});
        }
        if(!utils.isUndefined(conversationType)){
          let list = utils.map(result.conversations, (item) => {
            let { unreadCount } = item;
            item.unreadCount = unreadCount < 0 ? 0 : unreadCount;
            return item;
          });
          return resolve(utils.clone({ conversations: list.reverse(), isFinished: result.isFinished }));
        }
        let { conversations } = result;
        conversationUtils.setSynced();
        conversationUtils.add(conversations);
        resolve({ conversations: utils.clone(conversations), isFinished: result.isFinished });
      });
    });
  };
  let removeConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.REMOVECONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.REMOVE_CONVERSATION, conversations, userId: user.id };
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let list = utils.isArray(conversations) ? conversations : [conversations];
        let config = io.getConfig();
        let { timestamp, code } = result;
        list = utils.map(list, (item) => {
          item.time = timestamp;
          return item;
        });
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });
        }
        if(!config.isPC){
          let msg = { name: MESSAGE_TYPE.COMMAND_REMOVE_CONVERS, content: { conversations: list } };
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
        resolve();
      });
    });
  };
  let insertConversation = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.INSERTCONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.INSERT_CONVERSATION, conversation, userId: user.id };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, msg, timestamp }) => {
        if(code){
          return reject({ code, msg })
        }
        common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });
        let item = createConversation({
          ...conversation,
          sentTime: Date.now()
        });
        conversationUtils.update(item);
        let newConversation = conversationUtils.getPer(item);
        resolve({ conversation: newConversation });
      });
    });
  };
  let getConversation = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GET_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.GET_CONVERSATION, conversation, userId: user.id };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, msg, conversation }) => {
        if(code){
          return reject({ code, msg })
        }
        if(!utils.isEmpty(conversation)){
          conversationUtils.update(conversation);
        }
        resolve({ conversation });
      });
    });
  };
 
  let disturbConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.MUTE_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.MUTE_CONVERSATION, conversations, userId: user.id };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, msg, timestamp }) => {
        if(!utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return reject({ code, msg })
        }
        common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
        let config = io.getConfig();
        if(!config.isPC){
          let list = utils.isArray(conversations) ? conversations : [conversations];
          let msg = { name: MESSAGE_TYPE.COMMAND_UNDISTURB, content: { conversations: list } };
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
        resolve();
      });
    });
  };
  let setTopConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.SET_TOP_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.TOP_CONVERSATION, conversations, userId: user.id };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ code, msg, timestamp }) => {
        if(!utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return reject({ code, msg })
        }
        common.updateSyncTime({ isSender: true,  sentTime: timestamp, io }); 
        let config = io.getConfig();
        if(!config.isPC){
          let msg = { name: MESSAGE_TYPE.COMMAND_TOPCONVERS, content: { conversations: conversations } };
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
        resolve();
      });
    });
  };

  let getTopConversations = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, []);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      params = params || {};
      let { count = 50, time = 0 } = params;
      let user = io.getCurrentUser();
      let _params = { topic: COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS, time: 0, count, userId: user.id };
      utils.extend(_params, params);
      io.sendCommand(SIGNAL_CMD.QUERY, _params, (result) => {
        resolve({ conversations: result.conversations, isFinished: result.isFinished });
      });
    });
  };
  let clearUnreadcount = ( conversations ) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.CLEARUNREADCOUNT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.CLEAR_UNREAD };
      utils.extend(data, { conversations, userId: user.id });
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let { timestamp, code } = result;
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });  
        }
        let config = io.getConfig();
        if(!config.isPC){
          let msg = { name: MESSAGE_TYPE.CLEAR_UNREAD, content: { conversations } };
          io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        }
        resolve();
      });
    });
  };
  let getTotalUnreadcount = (params = {}) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, {}, {});
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { conversationTypes = [], ignoreConversations } = params;
      conversationTypes = utils.isArray(conversationTypes) ? conversationTypes : [conversationTypes];
      if(!utils.isEmpty(ignoreConversations)){
        let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_TOTAL_UNREADCOUNT);
        if(!utils.isEmpty(error)){
          return reject(error);
        }
      }
      let { id: userId } = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION, userId, conversationTypes, ignoreConversations };
      io.sendCommand(SIGNAL_CMD.QUERY, data, ({ count }) => {
        resolve({ count });
      });
    });
  };
  let clearTotalUnreadcount = () => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, {}, {});
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { id: userId } = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.CLEAR_UNREAD_TOTLAL_CONVERSATION, userId };
      io.sendCommand(SIGNAL_CMD.QUERY, data, () => {
        let conversations = conversationUtils.get();
        conversationUtils.read(conversations);
        resolve();
      });
    });
  };

  let setDraft = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.SET_DRAFT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let key = common.getDraftKey(conversation);
      let { draft } = conversation;
      Storage.set(key, draft);
      resolve();
    });
  };
  let getDraft = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GET_DRAFT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let key = common.getDraftKey(conversation);
      let draft = Storage.get(key);
      resolve(draft);
    });
  };
  let removeDraft = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GET_DRAFT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let key = common.getDraftKey(conversation);
      let draft = Storage.remove(key);
      resolve(draft);
    });
  };

  function createConversation(message){
    let { conversationId, conversationType, conversationTitle, conversationPortrait, conversationExts, mentionInfo, messageId } = message;

    let $conversation = {
      conversationId,
      conversationType,
      conversationTitle, 
      conversationPortrait,
      conversationExts,
      latestMessage: message,
      unreadCount: 0,
      updatedTime: 0,
      undisturbType: message.undisturbType
    };
    let _conversation = conversationUtils.getPer(message);
    let mentions = _conversation.mentions || {};
    if(mentionInfo){
      let { members, type } = mentionInfo;
      let user = io.getCurrentUser();
      let index = utils.find(members, (member) => {
        return utils.isEqual(user.id, member.id);
      });
      //TODO 撤回 @ 消息需要删除
      if(index > -1 || utils.isEqual(type, MENTION_TYPE.ALL)){
        let { isMentioned = true, senders = [], msgs = [] } = mentions;
        msgs.push({ senderId: message.sender.id, messageId: message.messageId, sentTime: message.sentTime });

        let senderIndex = utils.find(senders, (member) => {
          return utils.isEqual(message.sender.id, member.id);
        });
        if(utils.isEqual(senderIndex, -1)){
          senders.push(message.sender);
        }

        mentions = {
          isMentioned,
          senders,
          msgs,
          count: msgs.length
        };
      }
      utils.extend($conversation, { mentions });
    }
    if(message.isSender){
      let conversation = conversationUtils.getPer(message);
      utils.extend($conversation, {
        conversationTitle: conversation.conversationTitle,
        conversationPortrait: conversation.conversationPortrait,
        conversationExts: conversation.conversationExts,
      });
    }
    return $conversation;
  }

  /* 
    let params = {
      type: UNDISTURB_TYPE.DISTURB,
      timezone: 'Asia/Shanghai',
      times: [
        { start: 'HH:mm', end: 'HH:mm' }
      ]
    };
  */
  let setAllDisturb = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.SET_ALL_DISTURB);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { code } = ErrorType.ILLEGAL_TYPE_PARAMS;
      let _params = { timezone: '', times: [] };
      
      let { type, timezone, times } = params;
      let isDisturb = utils.isEqual(type, UNDISTURB_TYPE.DISTURB);
      if(isDisturb && !utils.isString(timezone)){
        let msg = 'timezone 参数不合法，请检查，格式示例：Asia/Shanghai';
        return reject({ msg, code });
      }

      if(isDisturb && !utils.isArray(times)){
        let msg = "times 参数不合法，请检查，格式示例：[{ start: '12:00', end: '13:00' }]";
        return reject({ msg, code });
      }

      let isValid = true;
      let timeIndex = 0;
      times = times || [];
      for(let i = 0; i < times.length; i++){
        let time = times[i];
        if(!utils.isObject(time)){
          isValid = false;
          timeIndex = i;
          break;
        }
        let { start, end } = time;
        if(!utils.isValidHMTime(start) || !utils.isValidHMTime(end)){
          isValid = false;
          timeIndex = i;
          break;
        }
      }
      if(!isValid){
        let msg = `times 下标 ${timeIndex} 参数，时间格式不正确`
        return reject({ msg, code });
      }

      _params = utils.extend(_params, params);
      let { id: userId } = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.SET_ALL_DISTURB, userId, ..._params };
      io.sendCommand(SIGNAL_CMD.QUERY, data, () => {
        resolve();
      });
    });
  };
  let getAllDisturb = () => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, {}, {});
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let { id: userId } = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.GET_ALL_DISTURB, userId };
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let { timezone, times, type, code } = result;
        if(!utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          return reject({ code, msg: '' });
        }
        resolve({ timezone, times, type });
      });
    });
  };

  let markUnread = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.MARK_UNREAD);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      conversation = utils.clone(conversation);
      let { id: userId } = io.getCurrentUser();
      let conversations = utils.isArray(conversation) ? conversation : [conversation];
      let data = { topic: COMMAND_TOPICS.MARK_CONVERSATION_UNREAD, userId, conversations };
      io.sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
        let { timestamp, code } = result;
        if(utils.isEqual(ErrorType.COMMAND_SUCCESS.code, code)){
          common.updateSyncTime({ isSender: true,  sentTime: timestamp, io });
          let config = io.getConfig();
          if(!config.isPC){
            let msg = { name: MESSAGE_TYPE.COMMAND_MARK_UNREAD, content: { conversations } };
            io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
          }
          resolve();
        }else{
          reject({ code });
        }        
      });
    });
  };

  return {
    getConversations,
    removeConversation,
    insertConversation,
    getConversation,
    markUnread,
    disturbConversation,
    setTopConversation,
    getTopConversations,
    clearUnreadcount,
    getTotalUnreadcount,
    clearTotalUnreadcount,
    setDraft,
    getDraft,
    removeDraft,
    setAllDisturb,
    getAllDisturb,
  };
}
