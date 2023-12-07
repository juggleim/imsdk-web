import { SIGNAL_CMD, EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER, MESSAGE_ORDER, COMMAND_TOPICS, CONVERATION_TYPE, ErrorType } from "../enum";
import utils from "../utils";
import common from "../common/common";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {
    io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, message);
    emitter.emit(EVENT.MESSAGE_RECEIVED, message)
  });

  let maps = [
    [CONVERATION_TYPE.PRIVATE, 'p_msg'],
    [CONVERATION_TYPE.GROUP, 'g_msg'],
  ];
  let topics = {};
  utils.forEach(maps, (map) => {
    topics[map[0]] = map[1];
  });

  let sendMessage = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let data = utils.clone(params);
      let { message, conversationType, conversationId } = data;
      let config = common.getMsgConfig(message.name);
      utils.extend(data.message, config);

      let topic = topics[conversationType];
      utils.extend(data, { topic })

      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ messageId, sentTime }) => {
        utils.extend(params.message, { sentTime, messageId });
        let msg = utils.clone(params.message);
        utils.extend(msg, { conversationId, conversationType });
        io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, msg);
        resolve(params);
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
  let removeMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.REMOVEMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.PUBLISH, message, (msg) => {
        resolve(msg);
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
        if(utils.isEqual(code, ErrorType.MESSAGE_RECALL_SUCCESS.code)){
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
  return {
    sendMessage,
    getMessages,
    removeMessage,
    recallMessage,
    readMessage
  };
}