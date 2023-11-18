import { FUNC_PARAM_CHECKER, SIGNAL_CMD, COMMAND_TOPICS } from "../enum";
import utils from "../utils";
import common from "../common/common";

export default function(io){
  let getConversations = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, []);
      if(!utils.isEmpty(error)){
        return reject(error);
      }

      params = params || {};
      let { count, direction, time } = params;
      let _params = { topic: COMMAND_TOPICS.CONVERSATIONS, time: 0, count: 50, direction: 0 };
      utils.extend(_params, params);
      io.sendCommand(SIGNAL_CMD.QUERY, _params, (result) => {
        resolve(result);
      });
    });
  };
  let removeConversation = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.GETCONVERSATION);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.PUBLISH, conversation, () => {
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
  let clearUnreadcount = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, conversation, FUNC_PARAM_CHECKER.CLEARUNREADCOUNT);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      io.sendCommand(SIGNAL_CMD.PUBLISH, conversation, () => {
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

  return {
    getConversations,
    removeConversation,
    getConversation,
    clearUnreadcount,
    getTotalUnreadcount,
    clearTotalUnreadcount
  };
}