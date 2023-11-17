import { SIGNAL_NAME, EVENT, CONNECT_STATE, ErrorType } from "../enum";
import utils from "../utils";

export default function(io, emitter){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (state) => {
    emitter.emit(EVENT.STATE_CHANGED, { state });
  });

  io.on(SIGNAL_NAME.S_CONNECT_ACK, (data) => {
    let { ConnectAckMsgBody: { userId: id }, state } = data;
    let result = { user: { id }, state};
    emitter.emit(EVENT.STATE_CHANGED, result);
  });
 
  let connect = (auth) =>{
    if(io.isConnected()){
      return emitter.emit(EVENT.STATE_CHANGED, { state: ErrorType.CONNECTION_EXISTS.code });
    }
    emitter.emit(EVENT.STATE_CHANGED, { state: CONNECT_STATE.CONNECTING });
    io.connect(auth);
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