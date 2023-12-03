import { SIGNAL_NAME, EVENT, CONNECT_STATE, ErrorType } from "../enum";
import utils from "../utils";

export default function(io, emitter){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (data) => {
    emitter.emit(EVENT.STATE_CHANGED, data);
  });

  let connect = (auth) =>{
    return utils.deferred((resolve) => {
      if(io.isConnected()){
        return resolve({ error: ErrorType.CONNECTION_EXISTS });
      }
      io.connect(auth, (result) => {
        resolve(result);
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