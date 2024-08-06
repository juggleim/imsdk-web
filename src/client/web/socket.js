import { SIGNAL_NAME, EVENT, CONNECT_STATE, ErrorType, FUNC_PARAM_CHECKER, LOG_MODULE, STORAGE } from "../../enum";
import utils from "../../utils";
import Storage from "../../common/storage";
import common from "../../common/common";

export default function(io, emitter, logger){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (data) => {
    let { state, code = '', user = {} } = data;
    logger.info({ tag: LOG_MODULE.CON_STATUS, state, code, userId: user.id });
    emitter.emit(EVENT.STATE_CHANGED, data);
  });

  let connect = (user) =>{
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, user, FUNC_PARAM_CHECKER.CONNECT, true);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      logger.info({ tag: LOG_MODULE.CON_CONNECT });
      // 通过 appkye_userid 隔离本地存储 Key
      // let config = io.getConfig();
      // let { appkey, token } = config;
      // let key = common.getTokenKey(appkey, token);
      // let userId = Storage.get(key);
    
      // Storage.setPrefix(`${appkey}_${userId}`);

      // let { syncConversationTime } = user;
      // if(utils.isNumber(syncConversationTime)){
      //   Storage.set(STORAGE.SYNC_CONVERSATION_TIME,  { time: syncConversationTime })
      // }

      let { token = '' } = user;
      token = token.trim();
      user = utils.extend(user, { token });
      io.connect(user, ({ error, user }) => {
        let { code, msg } = error;
        if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS.code)){
          utils.extend(user, { code });
          return resolve(user);
        }
        reject({ code, msg });
      });
    });
  };

  let disconnect = () => {
    return utils.deferred((resolve) => {
      logger.info({ tag: LOG_MODULE.CON_DISCONNECT });
      io.disconnect();
      let config = io.getConfig();
      if(!config.isPC){
        io.emit(SIGNAL_NAME.CLIENT_CLEAR_MEMORY_CACHE, {});
      }
      resolve();
    });
  };

  let getDevice = () => {
    return utils.deferred((resolve, reject) => {
      return reject(ErrorType.SDK_FUNC_NOT_DEFINED);
    });
  };

  return {
    connect,
    disconnect,
    getDevice: getDevice,
    isConnected: io.isConnected,
    getCurrentUser: io.getCurrentUser
  }
}