import Emitter from "../common/emmit";
import utils from "../utils";
import Storage from "../common/storage";
import Proto from "./proto";
import { CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD, QOS, NOTIFY_TYPE, ErrorType, HEART_TIMEOUT, CONNECT_ACK_INDEX, PONG_INDEX, COMMAND_TOPICS, CONVERATION_TYPE, SYNC_MESSAGE_TIME } from "../enum";
import BufferEncoder from "./encoder/encoder";
import BufferDecoder from "./decoder";
import Network from "../common/network";
import Cache from "../common/cache";
import common from "../common/common";
import Syncer from "./sync";
import Timer from "../common/timer";
import Counter from "../common/counter";

/* 
  fileCompressLimit: 图片缩略图压缩限制，小于设置数值将不执行压缩，单位 KB
  config = { appkey, nav, isSync, upload, uploadType, fileCompressLimit }
*/
export default function IO(config){
  let emitter = Emitter();
  let { appkey, nav, isSync = true } = config;
  nav = nav || 'http://120.48.178.248:8083';
  let ws = {};
  let io = {};
  
  let cache = Cache();
  let decoder = BufferDecoder(cache, io);
  let encoder = BufferEncoder(cache);

  let timer = Timer({ timeout: HEART_TIMEOUT });
  let syncTimer = Timer({ timeout: SYNC_MESSAGE_TIME });

  let connectionState = CONNECT_STATE.DISCONNECTED;
  let updateState = (state, user) => {
    connectionState = state;
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, { state, user });
  }
  let currentUserInfo = {};
  let setCurrentUser = (user) => {
    utils.extend(currentUserInfo, user);
  };
  let connect = ({ token, userId }, callback) => {
    updateState(CONNECT_STATE.CONNECTING);
    return Network.getNavi(nav, { appkey, token, userId }).then((result) => {
      let { servers, userId: id } = result;
      setCurrentUser({ id });

      cache.set(SIGNAL_NAME.S_CONNECT_ACK, callback);

      let onDisconnect = () => {
        let state = CONNECT_STATE.DISCONNECTED;
        if(!utils.isEqual(connectionState, CONNECT_STATE.CONNECTION_SICK)){
          updateState(state);
        }

        timer.pause();
        syncTimer.pause();
      };
      Network.detect(servers, (domain, error) => {
        if(error){
          return disconnect(CONNECT_STATE.CONNECTION_SICK)
        }
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
    }, ({ result: { code } }) => {
      let error = common.getError(code);
      callback({ error });
    });
  };
  
  let PingTimeouts = [];

  let disconnect = (_state) => {
    if(ws){
      ws.close && ws.close();
    }
    let state = _state || CONNECT_STATE.DISCONNECTED;
    updateState(state);
    timer.pause();
    syncTimer.pause();
    
    PingTimeouts.length = 0;
  };

  let sendCommand = (cmd, data, callback) => {
    callback = callback || utils.noop;
    let index = common.getNum();
    if(utils.isEqual(cmd, SIGNAL_CMD.CONNECT)){
      index = CONNECT_ACK_INDEX;
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.PING)){
      index = PONG_INDEX;
    }
    let counter = Counter({ cmd });
    let buffer = encoder.encode(cmd, { callback, data, index, counter });
    ws.send(buffer);
    
    if(!utils.isEqual(SIGNAL_CMD.PUBLISH_ACK, cmd)){
      // 请求发出后开始计时，一定时间内中未响应认为连接异常，断开连接，counter 定时器在收到 ack 后清除
      counter.start(({ cmd: _cmd }) => {
        // PING 三次未响应后认为网络异常，向业务层抛出网络异常状态，PingTimeouts 在收到 PONG 后进行 reset
        if(utils.isEqual(_cmd, SIGNAL_CMD.PING) && PingTimeouts.length < 3){
          return PingTimeouts.push({ cmd: _cmd });
        }
        callback(ErrorType.COMMAND_FAILED);
        disconnect(CONNECT_STATE.CONNECTION_SICK);
      });
    }
  };
  
  let syncer = Syncer(sendCommand, emitter);

  let bufferHandler = (buffer) => {
    let { cmd, result, name } = decoder.decode(buffer);
    let { index } = result;
    let { callback, data, counter } = cache.get(index);
    // 清空计时器，与 counter.start 对应
    if(counter){
      counter.clear();
      PingTimeouts.length = 0;
    }
    if(utils.isEqual(name, SIGNAL_NAME.S_NTF) || utils.isEqual(name, SIGNAL_NAME.CMD_RECEIVED) ){
      syncer.exec({
        msg: result,
        name: name,
        user: { id: currentUserInfo.id }
      });
      // 连接成功后会开始计时 3 分钟拉取逻辑，如果收到直发或者 NTF 重新开始计算时长，连接断开后会清空计时
      syncTimer.reset();
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.PUBLISH_ACK)){
      utils.extend(data, result);
      let { conversationType } = data;
      // 单群聊和聊天室通知和拉取消息时间戳分开计算，只有发送单群聊消息更新发件箱
      if(!utils.isEqual(conversationType, CONVERATION_TYPE.CHATROOM)){
        common.updateSyncTime(data);
      }
      callback(data);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.QUERY_ACK)){
      callback(result);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.CONNECT_ACK)){
      let _callback = cache.get(SIGNAL_NAME.S_CONNECT_ACK) || utils.noop;

      let { ack: { code, userId } } = result;
   
      let state = CONNECT_STATE.CONNECT_FAILED;
      let error = common.getError(code);
      if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS.code)){
        state = CONNECT_STATE.CONNECTED;
        setCurrentUser({ id: userId });

        return getUserInfo({ id: userId }, ({ user: _user }) => {

          _user = _user || {};
          let name = _user.nickname;
          let portrait = _user.userPortrait;
          let exts = utils.toObject(_user.extFields);
          setCurrentUser({ name, portrait, exts });

          if(isSync){
            syncer.exec({
              msg: { type: NOTIFY_TYPE.MSG },
              name: SIGNAL_NAME.S_NTF,
              user: { id: currentUserInfo.id }
            });
          }
          timer.resume(() => {
            sendCommand(SIGNAL_CMD.PING, {});
          });
          syncTimer.resume(() => {
            syncer.exec({
              msg: { type: NOTIFY_TYPE.MSG },
              name: SIGNAL_NAME.S_NTF,
              user: { id: currentUserInfo.id }
            });
          });

          updateState(state, currentUserInfo);
          _callback({ user: currentUserInfo, error });

        });
      }
      updateState(state, currentUserInfo);
      _callback({ user: currentUserInfo, error });
    }
    cache.remove(index);
  }

  let isConnected = () => {
    return utils.isEqual(connectionState, CONNECT_STATE.CONNECTED)
  };
  function getCurrentUser(){
    return currentUserInfo;
  };

  function getConfig(){
    return config;
  };
  function getUserInfo(user, callback){
    let data = {
      topic: COMMAND_TOPICS.GET_USER_INFO,
      userId: user.id
    };
    sendCommand(SIGNAL_CMD.QUERY, data, (result) => {
      callback(result);
    });
  }
  
  utils.extend(io, { 
    getConfig,
    connect,
    disconnect,
    sendCommand,
    isConnected,
    getCurrentUser,
    ...emitter
  })
  return io;
}