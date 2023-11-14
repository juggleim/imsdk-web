import { SIGNAL_NAME, EVENT, CONNECT_STATE } from "../enum";
export default function(io, emitter){
  io.on(SIGNAL_NAME.CONN_CHANGED, (state) => {
    emitter.emit(EVENT.STATE_CHANGED, { state });
  });

  io.on(SIGNAL_NAME.CMD_RECEIVED, (data) => {
    console.log('onmessage', data);
  });

  io.on(SIGNAL_NAME.S_CONNECT_ACK, (data) => {
    let { ConnectAckMsgBody: { userId: id } } = data;
    let result = { user: { id }, state:  CONNECT_STATE.CONNECTED}
    emitter.emit(EVENT.STATE_CHANGED, result);
  });
 
  let connect = () =>{
    emitter.emit(EVENT.STATE_CHANGED, { state: CONNECT_STATE.CONNECTING });
    io.connect();
  };
  
  let disconnect = () => {
    io.disconnect();
  };

  return {
    connect,
    disconnect
  }
}