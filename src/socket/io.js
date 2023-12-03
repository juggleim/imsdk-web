import Emitter from "../common/emmit";
import utils from "../utils";
import Storage from "../common/storage";
import Proto from "./proto";
import { CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD, QOS, NOTIFY_TYPE, ErrorType } from "../enum";
import BufferEncoder from "./encoder";
import BufferDecoder from "./decoder";
import Network from "../common/network";
import Cache from "../common/cache";
import common from "../common/common";
import Syncer from "./sync";

export default function IO(config){
  let emitter = Emitter();
  let { appkey, nav, isSync } = config;
  nav = nav || 'http://120.48.178.248:8083';
  let ws = {};
  
  let cache = Cache();
  let decoder = BufferDecoder(cache);
  let encoder = BufferEncoder(cache);

  let connectionState = CONNECT_STATE.DISCONNECTED;
  let updateState = (state, user) => {
    connectionState = state;
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, { state, user });
  }
  let currentUserId = '';
  let setCurrentUserId = (id) => {
    currentUserId = id;
  };
  let connect = ({ token }, callback) => {
    updateState(CONNECT_STATE.CONNECTING);
    return Network.getNavi(nav, { appkey, token }).then((result) => {
      let { servers, userId } = result;
      setCurrentUserId(userId);

      cache.set(SIGNAL_NAME.S_CONNECT_ACK, callback);

      let onDisconnect = () => {
        let state = CONNECT_STATE.DISCONNECTED;
        updateState(state);
      };
      Network.detect(servers, (domain) => {
        let { ws: protocol } = utils.getProtocol();
        let url = `${protocol}//${domain}/im`;
        ws = new WebSocket(url);
        ws.addEventListener("open", () => {
          sendCommand(SIGNAL_CMD.CONNECT, { appkey, token });
        });
        ws.addEventListener("close", onDisconnect);
        ws.addEventListener("error", onDisconnect);
        ws.addEventListener("message", ({ data }) => {
          let reader = new FileReader();
          reader.onload = function() {
            bufferHandler(this.result);
          }
          reader.readAsArrayBuffer(data);
        });
      });
    });
  };

  let disconnect = () => {
    ws && ws.close();
    let state = CONNECT_STATE.DISCONNECTED;
    updateState(state);
  };

  let sendCommand = (cmd, data, callback) => {
    callback = callback || utils.noop;
    let index = common.getNum();
    let buffer = encoder.encode(cmd, { callback, data, index });
    ws.send(buffer);
  };
  
  let syncer = Syncer(sendCommand, emitter);

  let bufferHandler = (buffer) => {
    let { cmd, result, name } = decoder.decode(buffer);
    let { index } = result;
    let { callback, data } = cache.get(index);
    
    if(utils.isEqual(name, SIGNAL_NAME.S_NTF) || utils.isEqual(name, SIGNAL_NAME.CMD_RECEIVED) ){
      syncer.exec({
        msg: result,
        name: name,
        user: { id: currentUserId }
      });
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.PUBLISH_ACK)){
      utils.extend(data, result);
      common.updateSyncTime(data);
      callback(data);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.QUERY_ACK)){
      callback(result);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.CONNECT_ACK)){
      let { ack: { code, userId } } = result;
      // Protobuf 中会把 false、0 的属性隐藏，0 表示成功，此处做兼容处理
      code = code || ErrorType.CONNECT_SUCCESS;
      let user = { };
      let state = CONNECT_STATE.CONNECT_FAILED;
      let error = common.getError(code);
      if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS)){
        state = CONNECT_STATE.CONNECTED;
        utils.extend(user, { id: userId });
        if(isSync){
          syncer.exec({
            msg: { type: NOTIFY_TYPE.MSG },
            name: SIGNAL_NAME.S_NTF,
            user: { id: currentUserId }
          });
        }
      }
      updateState(state, user);
      let callback = cache.get(SIGNAL_NAME.S_CONNECT_ACK) || utils.noop;
      callback({ user, error });
    }
    cache.remove(index);
  }

  let isConnected = () => {
    return utils.isEqual(connectionState, CONNECT_STATE.CONNECTED)
  };
  function getCurrentUser(){
    return { id: currentUserId };
  };

  let io = {
    connect,
    disconnect,
    sendCommand,
    isConnected,
    getCurrentUser,
    ...emitter
  };
  return io;
}