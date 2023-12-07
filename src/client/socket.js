import { SIGNAL_NAME, EVENT, CONNECT_STATE, ErrorType, FUNC_PARAM_CHECKER } from "../enum";
import utils from "../utils";
import Storage from "../common/storage";
import common from "../common/common";

export default function(io, emitter){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (data) => {
    emitter.emit(EVENT.STATE_CHANGED, data);
  });

  let connect = (user) =>{
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, user, FUNC_PARAM_CHECKER.CONNECT, true);
      if(!utils.isEmpty(error)){
        return reject(error);
      }
      // 通过 appkye_userid 隔离本地存储 Key
      let config = io.getConfig();
      let { appkey } = config;
      let { userId } = user;
      Storage.setPrefix(`${appkey}_${userId}`);

      io.connect(user, ({ error, user }) => {
        let { code, msg } = error;
        if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS)){
          return resolve(user);
        }
        reject({ code, msg });
      });
    });
  };

  let disconnect = () => {
    io.disconnect();
  };

  return {
    connect,
    disconnect,
    isConnected: io.isConnected
  }
}