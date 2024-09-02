import Emitter from "../common/emmit";
import utils from "../utils";
import Storage from "../common/storage";
import Proto from "./proto";
import { DISCONNECT_TYPE, CONNECT_STATE, SIGNAL_NAME, SIGNAL_CMD, QOS, NOTIFY_TYPE, ErrorType, HEART_TIMEOUT, CONNECT_ACK_INDEX, PONG_INDEX, COMMAND_TOPICS, CONVERATION_TYPE, SYNC_MESSAGE_TIME, STORAGE, PLATFORM, CONNECT_TOOL } from "../enum";
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
  let { appkey, navList, serverList = [], isSync = true, reconnectCount = 100 } = config;
  if(!utils.isArray(navList)){
    navList = ['https://nav.juggleim.com'];
  }
  let ws = {};
  let io = {};
  
  let cache = Cache();

  let decoder = BufferDecoder(cache, io);
  let encoder = BufferEncoder(cache);

  let timer = Timer({ timeout: HEART_TIMEOUT });
  let syncTimer = Timer({ timeout: SYNC_MESSAGE_TIME });

  let connectionState = CONNECT_STATE.DISCONNECTED;
  let reconnectErrors = [
    ErrorType.CONNECT_APPKEY_IS_REQUIRE.code,
    ErrorType.CONNECT_TOKEN_NOT_EXISTS.code,
    ErrorType.CONNECT_APPKEY_NOT_EXISTS.code,
    ErrorType.CONNECT_TOKEN_ILLEGAL.code,
    ErrorType.CONNECT_TOKEN_UNAUTHORIZED.code,
    ErrorType.CONNECT_TOKEN_EXPIRE.code,
    ErrorType.CONNECT_APP_BLOCKED.code,
    ErrorType.CONNECT_USER_BLOCKED.code,
    ErrorType.CONNECT_USER_KICKED.code,
    ErrorType.CONNECT_USER_LOGOUT.code,
  ]
  let updateState = (result) => {
    connectionState = result.state;
    emitter.emit(SIGNAL_NAME.CONN_CHANGED, { ...result });
  }

  let clearHeart = () => {
    timer.pause();
    syncTimer.pause();
  };

  let isUserDisconnected = false;
  let onDisconnect = (result = {}) => {
    let { code } = result;
    if(!isUserDisconnected && !utils.isInclude(reconnectErrors, code) && !utils.isEqual(connectionState, CONNECT_STATE.DISCONNECTED)){
      let user = getCurrentUser();
      clearHeart();
      return reconnect(user, ({ next }) => {
        next();
      });
    }

    if(!utils.isEqual(connectionState, CONNECT_STATE.DISCONNECTED)){
      let user = getCurrentUser();
      updateState({ state: CONNECT_STATE.DISCONNECTED, ...result, user});
      clearHeart();
    }
  };
  let currentUserInfo = {};
  let setCurrentUser = (user) => {
    utils.extend(currentUserInfo, user);
  };
  let clearLocalServers = (userId) => {
    let key = common.getNaviStorageKey(appkey, userId);
    Storage.remove(key);
  };
  let connect = ({ token, deviceId, _isReconnect = false }, callback) => {
    cache.set(STORAGE.CRYPTO_RANDOM, utils.getRandoms(8));
    let _state = _isReconnect ?  CONNECT_STATE.RECONNECTING : CONNECT_STATE.CONNECTING;
    updateState({ state: _state });
    function smack({ servers, userId }){
      setCurrentUser({ id: userId, token, deviceId });

      cache.set(SIGNAL_NAME.S_CONNECT_ACK, callback);

      Network.detect(servers, (domain, error) => {
        // 如果嗅探失败，返回连接断开，同时清理已缓存的 CMP 地址
        if(error){
          clearLocalServers(userId);
          return reconnect({ token, userId, deviceId }, callback);
        }
        domain = domain.replaceAll(/http:\/\/|https:\/\/|file:\/\/|wss:\/\/|ws:\/\//g, '');
        let { ws: protocol } = utils.getProtocol();
        let url = `${protocol}//${domain}/im`;
        ws = new WebSocket(url);
        ws.onopen = function(){
          let platform = PLATFORM.WEB;
          if(common.isDesktop()){
            platform = PLATFORM.DESKTOP;
          }
          let clientSession = common.getClientSession();
          sendCommand(SIGNAL_CMD.CONNECT, { appkey, token, deviceId, platform, clientSession });
        };
        ws.onclose = (e) => {
          onDisconnect({ type: DISCONNECT_TYPE.CLOSE });
        };
        ws.onerror = () => {
          onDisconnect({ type: DISCONNECT_TYPE.ERROR });
        };
        ws.onmessage = function({ data }){
          let reader = new FileReader();
          reader.onload = function() {
            bufferHandler(this.result);
          }
          reader.readAsArrayBuffer(data);
        };
      });
    }
    if(!utils.isEmpty(serverList)){
      return smack({ servers: serverList })
    }
    return Network.getNavis(navList, { appkey, token }, (result) => {
      let { code, servers, userId } = result;

      if(!utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
        let error = common.getError(code);
        clearLocalServers(userId);
        // 网络异常 code 为空，通过 code 检测是否为网络异常
        if(!code){
          error = ErrorType.IM_SERVER_CONNECT_ERROR;
        }
        updateState({ state: CONNECT_STATE.DISCONNECTED, code: error.code });
        return callback({ error });
      }
      smack({ servers, userId });
    });
  };
  
  let reconnect = ({ token, userId, deviceId }, callback) => {
    let rCountObj = cache.get(CONNECT_TOOL.RECONNECT_COUNT);
    let count = rCountObj.count || 1;
    let isTimeout = count > reconnectCount;
    if(isTimeout){
      cache.remove(CONNECT_TOOL.RECONNECT_COUNT);
      cache.remove(CONNECT_TOOL.RECONNECT_FREQUENCY);
      return updateState({ state: CONNECT_STATE.DISCONNECTED, code: ErrorType.IM_SERVER_CONNECT_ERROR.code })
    }

    let reconnectOpt = cache.get(CONNECT_TOOL.RECONNECT_FREQUENCY);
    let frequency = reconnectOpt.frequency || 1;
    let msec = frequency * 1000;
    setTimeout(() => {
      
      count += 1;
      cache.set(CONNECT_TOOL.RECONNECT_COUNT, { count });

      frequency = frequency * 2;
      cache.set(CONNECT_TOOL.RECONNECT_FREQUENCY, { frequency });

      connect({ token, userId, deviceId, _isReconnect: true }, callback);
    }, msec)
  }
  let PingTimeouts = [];

  let disconnect = () => {
    if(ws){
      ws.close && ws.close();
    }
    timer.pause();
    syncTimer.pause();
    
    PingTimeouts.length = 0;
  };

  let userDisconnect = () => {
    isUserDisconnected = true;
    disconnect();
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
        disconnect();
      });
    }
  };
  
  let syncer = Syncer(sendCommand, emitter, io);

  let bufferHandler = (buffer) => {
    let { cmd, result, name } = decoder.decode(buffer);
    let { index } = result;
    let { callback, data, counter } = cache.get(index);
    // 清空计时器，与 counter.start 对应
    if(counter){
      counter.clear();
      PingTimeouts.length = 0;
    }
    if(utils.isEqual(name, SIGNAL_NAME.S_CHATROOM_USER_NTF)){
      let { chatroomId, time, type } = result;
      emitter.emit(SIGNAL_NAME.CMD_CHATROOM_EVENT, { chatroomId, time, type });
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
        common.updateSyncTime({ ...data, io});
      }
      callback(data);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.QUERY_ACK)){
      callback(result);
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.CONNECT_ACK)){
      
      isUserDisconnected = false;

      let _callback = cache.get(SIGNAL_NAME.S_CONNECT_ACK) || utils.noop;

      let { ack: { code, userId } } = result;
   
      let state = CONNECT_STATE.CONNECT_FAILED;
      let error = common.getError(code);
      if(utils.isEqual(code, ErrorType.CONNECT_SUCCESS.code)){
        state = CONNECT_STATE.CONNECTED;
        setCurrentUser({ id: userId });
        // 兼容只设置 IM Server 列表的情况
        Storage.setPrefix(`${appkey}_${userId}`);

        cache.remove(CONNECT_TOOL.RECONNECT_FREQUENCY);

        return getUserInfo({ id: userId }, ({ user: _user }) => {

          _user = _user || {};
          let name = _user.nickname;
          let portrait = _user.userPortrait;
          let exts = utils.toObject(_user.extFields);
          setCurrentUser({ name, portrait, exts, updatedTime: _user.updatedTime });

          // 首先返回连接方法回调，确保 PC 端本地数据库同步信息时间戳优先更新至 localStorage 中
          _callback({ user: currentUserInfo, error, next: () => {
            updateState({ state, user: currentUserInfo });
          } });

          // 同步会话和同步消息顺序不能调整，保证先同步会话再同步消息，规避会话列表最后一条消息不是最新的
          if(config.isPC){
            let syncNext = () => {
              syncer.exec({
                time: Storage.get(STORAGE.SYNC_CONVERSATION_TIME).time || 0,
                name: SIGNAL_NAME.S_SYNC_CONVERSATION_NTF,
                user: { id: currentUserInfo.id },
                $conversation: config.$conversation
              });
            };

            // PC 中先连接后打开数据库，优先将本地数据库中的同步时间更新至 LocalStorage 中，避免换 Token 不换用户 Id 重复同步会话
            let syncTime = Storage.get(STORAGE.SYNC_CONVERSATION_TIME).time || 0;
            if(utils.isEqual(syncTime, 0)){
              config.$socket.openDB({ appkey, userId, token: currentUserInfo.token }).then(() => {
                syncNext();
              });
            }else{
              syncNext();
            }
          }
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
        });
      }
      updateState({ state, user: currentUserInfo });
      _callback({ user: currentUserInfo, error });
    }
    if(utils.isEqual(cmd, SIGNAL_CMD.DISCONNECT)){
      let { code, extra } = result;
      onDisconnect({ code, extra, type: DISCONNECT_TYPE.SERVER });
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
  function setConfig(cfg){
    utils.extend(config, cfg);
  }
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
    setConfig,
    connect,
    disconnect: userDisconnect,
    sendCommand,
    isConnected,
    getCurrentUser,
    sync: (syncers) => {
      syncers = utils.isArray(syncers) ? syncers : [syncers];
      utils.forEach(syncers, (item) => {
        syncer.exec(item);
      });
    },
    ...emitter
  });
  return io;
}