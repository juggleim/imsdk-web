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
     
      let { token = '' } = user;
      token = token.trim();
      user = utils.extend(user, { token });

      if(!io.isNeedConnect()){
        return reject(ErrorType.REPREAT_CONNECTION);
      }
      
      logger.info({ tag: LOG_MODULE.CON_CONNECT });

      io.connect(user, ({ error, user, next }) => {
        let { code, msg } = error;
        if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS.code)){
          let config = io.getConfig();
          if(!config.isPC){
            next();
            let { id, name, exts, updatedTime, portrait, token } = user;
            return resolve(user)
          }
          
          utils.extend(user, { code, next });
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