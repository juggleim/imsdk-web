import { SIGNAL_NAME, EVENT, CONNECT_STATE, ErrorType } from "../enum";
import utils from "../utils";

export default function(io, emitter){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (data) => {
    emitter.emit(EVENT.STATE_CHANGED, data);
  });

  let connect = (auth) =>{
    return utils.deferred((resolve, reject) => {
      if(io.isConnected()){
        return reject({ error: ErrorType.CONNECTION_EXISTS });
      }
      io.connect(auth, ({ error, user }) => {
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