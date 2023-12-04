import { SIGNAL_CMD, EVENT, SIGNAL_NAME, FUNC_PARAM_CHECKER, MESSAGE_ORDER, COMMAND_TOPICS } from "../enum";
import utils from "../utils";
import common from "../common/common";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CMD_RECEIVED, (message) => {
    io.emit(SIGNAL_NAME.CMD_CONVERSATION_CHANGED, message);
    emitter.emit(EVENT.MESSAGE_RECEIVED, message)
  });

  let sendMessage = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.SENDMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      let data = utils.clone(params);
      let { message } = data;
      let config = common.getMsgConfig(message.name);
      utils.extend(data.message, config);
      
      io.sendCommand(SIGNAL_CMD.PUBLISH, data, ({ messageId, sentTime }) => {
        utils.extend(params.message, { sentTime, messageId });

        let msg = utils.clone(params.message);
        let { conversationId, conversationType } = params;
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
  let recallMessage = (message) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, message, FUNC_PARAM_CHECKER.RECALLMSG);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.PUBLISH, message, (msg) => {
        resolve(msg);
      });
    });
  };
  return {
    sendMessage,
    getMessages,
    removeMessage,
    recallMessage
  };
}