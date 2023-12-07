import { FUNC_PARAM_CHECKER, SIGNAL_CMD, COMMAND_TOPICS, SIGNAL_NAME, EVENT, MESSAGE_ORDER } from "../enum";
import utils from "../utils";
import common from "../common/common";

export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, (message) => {
    let conversation = createConversation(message);
    conversationUtils.update(conversation);

    let conversations = conversationUtils.get();
    emitter.emit(EVENT.CONVERSATION_CHANGED, { conversations });
  });
  /*  
  1、内存中缓存最近 200 个会话，并按 message.sentTime 倒序排序
  2、startTime 是 0 时，优先返回内存中会话，内存数量小于 count 数，从服务端获取
  3、startTime 非 0 是，直接从服务端获取，并更新到内存中
  */
  let conversationUtils = common.ConversationUtils();
  let getConversations = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, []);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      params = params || {};
      let { count = 50, order = MESSAGE_ORDER.FORWARD, time = 0 } = params;

      let conversations = conversationUtils.get();
      let isSynced = conversationUtils.isSync();
      if(isSynced && utils.isEqual(time, 0)){
        return resolve({ conversations });
      }
      let _params = { topic: COMMAND_TOPICS.CONVERSATIONS, time: 0, count, order };
      utils.extend(_params, params);
      io.sendCommand(SIGNAL_CMD.QUERY, _params, (result) => {
        let { conversations } = result;
        conversationUtils.add(conversations);
        resolve({ conversations });
      });
    });
  };
  let removeConversation = (conversations) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.REMOVECONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = { topic: COMMAND_TOPICS.REMOVE_CONVERSATION, conversations };
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        let list = utils.isArray(conversations) ? conversations : [conversations];
        utils.forEach(list, (conversation) => {
          conversationUtils.remove(conversation);
        });
        resolve();
      });
    });
  };
  let getConversation = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GETCONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.QUERY, params, (conversation) => {
        resolve(conversation);
      });
    });
  };
  let clearUnreadcount = ( conversations ) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversations, FUNC_PARAM_CHECKER.CLEARUNREADCOUNT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      let data = { topic: COMMAND_TOPICS.CLEAR_UNREAD };
      utils.extend(data, { conversations });
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, () => {
        let list = utils.isArray(conversations) ? conversations : [conversations];
        utils.forEach(list, (conversation) => {
          utils.extend(conversation, { unreadCount: 0 });
          conversationUtils.modify(conversation);
        });
        resolve();
      });
    });
  };

  let getTotalUnreadcount = () => {
    return utils.deferred((resolve, reject) => {
      io.sendCommand(SIGNAL_CMD.PUBLISH, {type: 'get'}, () => {
        resolve();
      });
    });
  };
  let clearTotalUnreadcount = () => {
    return utils.deferred((resolve, reject) => {
      io.sendCommand(SIGNAL_CMD.PUBLISH, {type: 'clear'}, () => {
        resolve();
      });
    });
  };

  function createConversation(message){
    let { conversationId, conversationType } = message;
    return {
      conversationId,
      conversationType,
      latestMessage: message,
      unreadCount: 1,
      latestReadTime: 0
    };
  }

  return {
    getConversations,
    removeConversation,
    getConversation,
    clearUnreadcount,
    getTotalUnreadcount,
    clearTotalUnreadcount
  };
}
