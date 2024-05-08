import { FUNC_PARAM_CHECKER, SIGNAL_CMD, COMMAND_TOPICS, SIGNAL_NAME, EVENT, MESSAGE_ORDER, CONNECT_STATE, MESSAGE_TYPE, MENTION_TYPE, UNDISTURB_TYPE } from "../../enum";
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

    // 如果会话最后一条消息大于清理的时间，不更新会话列表
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_MSG)){
      let { content: { clean_time: cleanTime, channel_type: conversationType, target_id: conversationId  } } = message;
      utils.extend(message, { content: { cleanTime },  conversationType, conversationId });
      let conversation = conversationUtils.getPer(message);
      let { latestMessage } = conversation || { };
      latestMessage = latestMessage || {}; 
      if(latestMessage.sentTime > cleanTime){
        return;
      }
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
    }
    if(utils.isInclude([MESSAGE_TYPE.READ_MSG, MESSAGE_TYPE.READ_GROUP_MSG], message.name)){
      return;
    }
    if(utils.isEqual(message.name, MESSAGE_TYPE.CLEAR_UNREAD)){
      let { content, name, isSender } = message;
      let { conversations: msgs } = content;
      utils.forEach(msgs, (msg) => {
        utils.extend(msg, { name, isSender });
        next(msg);
      });
      return;
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
      conversationUtils.update(conversation);

      let conversations = conversationUtils.get();
      let newConversation = conversationUtils.getPer(conversation);
      emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: utils.clone(conversations), conversation: newConversation });
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

      let { count = 50, order = MESSAGE_ORDER.FORWARD, time = 0, conversationType } = params;

      // let conversations = conversationUtils.get();
      // let isSynced = conversationUtils.isSync();
      // if(isSynced && utils.isEqual(time, 0)){
      //   return resolve({ conversations: utils.clone(conversations) });
      // }
      let user = io.getCurrentUser();
      let _params = { topic: COMMAND_TOPICS.CONVERSATIONS, time: 0, count, order, userId: user.id, conversationType };
      utils.extend(_params, params);
      io.sendCommand(SIGNAL_CMD.QUERY, _params, (result) => {
        if(!utils.isUndefined(conversationType)){
          let list = result.conversations || [];
          return resolve(utils.clone({ conversations: list.reverse(), isFinished: result.isFinished }));
        }
        conversationUtils.add(result.conversations);
        let conversations = conversationUtils.get();
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
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        let list = utils.isArray(conversations) ? conversations : [conversations];
        utils.forEach(list, (conversation) => {
          conversationUtils.remove(conversation);
        });
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
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code, msg }) => {
        if(code){
          return reject({ code, msg })
        }
        let item = createConversation({
          ...conversation,
          sentTime: Date.now()
        });
        conversationUtils.update(item);
        let newConversation = conversationUtils.getPer(item);
        // let conversations = conversationUtils.get();
        // let config = io.getConfig();
        // if(!config.isPC){
        //   emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations: utils.clone(conversations), conversation: newConversation });
        // }
        resolve({ conversation: newConversation });
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
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code, msg }) => {
        if(code){
          return reject({ code, msg })
        }
        let list = utils.isArray(conversations) ? conversations : [conversations];
        let undisturbType = list[0].undisturbType;
        conversationUtils.modify(conversations, { undisturbType  });
        resolve();
      });
    });
  };
  let undisturbConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.UNMUTE_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.MUTE_CONVERSATION, conversations, userId: user.id, type: UNDISTURB_TYPE.UNDISTURB };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code, msg }) => {
        if(code){
          return reject({ code, msg })
        }
        conversationUtils.modify(conversations, { undisturbType: UNDISTURB_TYPE.UNDISTURB });
        resolve();
      });
    });
  };
  let topConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.TOP_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.TOP_CONVERSATION, conversations, userId: user.id, isTop: true };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code, msg }) => {
        if(code){
          return reject({ code, msg })
        }
        conversationUtils.modify(conversations, { isTop: true });
        resolve();
      });
    });
  };
  let untopConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.UNTOP_CONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let user = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.TOP_CONVERSATION, conversations, userId: user.id, isTop: false };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ code, msg }) => {
        if(code){
          return reject({ code, msg })
        }
        conversationUtils.modify(conversations, { isTop: false });
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
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        conversationUtils.read(conversations);
        resolve();
      });
    });
  };
  let getTotalUnreadcount = () => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, {}, {});
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let { id: userId } = io.getCurrentUser();
      let data = { topic: COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION, userId };
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
    let latestMentionMsg = _conversation.latestMentionMsg;
    if(mentionInfo){
      let { members, type } = mentionInfo;
      let user = io.getCurrentUser();
      let index = utils.find(members, (member) => {
        return utils.isEqual(user.id, member.id);
      });
      if(index > -1 || utils.isEqual(type, MENTION_TYPE.ALL)){
        latestMentionMsg = {
          type,
          messageId,
          sender: message.sender
        };
      }
      utils.extend($conversation, { latestMentionMsg });
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

  return {
    getConversations,
    removeConversation,
    insertConversation,
    disturbConversation,
    undisturbConversation,
    topConversation,
    untopConversation,
    getTopConversations,
    clearUnreadcount,
    getTotalUnreadcount,
    clearTotalUnreadcount,
    setDraft,
    getDraft,
    removeDraft,
  };
}
