import { SIGNAL_NAME, EVENT, CONNECT_STATE } from "../enum";
import utils from "../utils";

export default function(io, emitter){
  let connectState = CONNECT_STATE.DISCONNECTED;
  
  io.on(SIGNAL_NAME.CONN_CHANGED, (state) => {
    updateState(state);
    emitter.emit(EVENT.STATE_CHANGED, { state });
  });

  io.on(SIGNAL_NAME.CMD_RECEIVED, (data) => {
    console.log('onmessage', data);
  });

  io.on(SIGNAL_NAME.S_CONNECT_ACK, (data) => {
    let { ConnectAckMsgBody: { userId: id } } = data;
    let state =  CONNECT_STATE.CONNECTED;
    // TODO: 需要判断 ACK 的状态码
    updateState(state);

    let result = { user: { id }, state};
    emitter.emit(EVENT.STATE_CHANGED, result);
  });
 
  let isConnected = () => {
    return utils.isEqual(connectState, CONNECT_STATE.CONNECTED)
  }
  let updateState = (state) => {
    connectState = state;
  }

  let connect = (auth) =>{
    if(isConnected()){
      return emitter.emit(EVENT.STATE_CHANGED, { state: CONNECT_STATE.CONNECTION_EXISTS });
    }
    emitter.emit(EVENT.STATE_CHANGED, { state: CONNECT_STATE.CONNECTING });
    io.connect(auth);
  };
  
  let disconnect = () => {
    io.disconnect();
  };

  return {
    connect,
    disconnect
  }
}