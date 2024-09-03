import utils from "../utils";
import Proto from "./proto";
import Storage from "../common/storage";
import Consumer from "../common/consumer";
import common from "../common/common";
import Cacher from "../common/cache";
import chatroomCacher from "../common/chatroom-cacher";

import { SIGNAL_CMD, COMMAND_TOPICS, STORAGE, NOTIFY_TYPE, SIGNAL_NAME, ErrorType, LOG_MODULE } from "../enum";
export default function Syncer(send, emitter, io, { logger }) {

  let consumer = Consumer();
  let exec = (data) => {
    consumer.produce(data);
    consumer.consume(({ item }, next) => {
      let { name } = item;
      if (utils.isEqual(name, SIGNAL_NAME.CMD_RECEIVED)) {
        publish(item, next);
      }
      if (utils.isEqual(name, SIGNAL_NAME.S_NTF)) {
        query(item, next);
      }
      if (utils.isEqual(name, SIGNAL_NAME.S_SYNC_CONVERSATION_NTF)) {
        syncConversations(item, next);
      }
    });

    function publish(item, next) {
      let { msg } = item;
      let isNewMsg = common.updateSyncTime({...msg, io});
      if (isNewMsg) {
        let { msgIndex, ackIndex } = msg;
        let data = { msgIndex, ackIndex };
        send(SIGNAL_CMD.PUBLISH_ACK, data);
        emitter.emit(SIGNAL_NAME.CMD_RECEIVED, msg);
      }
      next();
    }
    function query(item, next) {
      logger.info({ tag: LOG_MODULE.MSG_SYNC, ...item });
      let { msg } = item;
      let _chatroomResult = chatroomCacher.get(msg.targetId);
      let { isJoined } = _chatroomResult;
      if (utils.isEqual(msg.type, NOTIFY_TYPE.MSG)) {
        queryNormal(item, next);
      } else if (utils.isEqual(msg.type, NOTIFY_TYPE.CHATROOM)) {
        isJoined && queryChatroom(item, next);
      } else if(utils.isEqual(msg.type, NOTIFY_TYPE.CHATROOM_ATTR)){
        isJoined && queryChatroomAttr(item, next);
      } else if(utils.isEqual(msg.type, NOTIFY_TYPE.CHATROOM_DESTORY)){
        isJoined && broadcastChatroomDestory(item, next);
      } else {
        next();
      }
    }

    function broadcastChatroomDestory(item, next){
      let { msg } = item;
      let chatroomId = msg.targetId;
      emitter.emit(SIGNAL_NAME.CMD_CHATROOM_DESTROY, { id: chatroomId });
      next();
    }
    function queryChatroomAttr(item, next) {
      let { msg } = item;
      let chatroomId = msg.targetId;
      let syncTime = getChatroomAttrSyncTime(chatroomId);
      if (syncTime >= msg.receiveTime && msg.receiveTime > 0) {
        return next();
      }

      let data = {
        syncTime: syncTime,
        chatroomId: chatroomId,
        targetId: chatroomId,
        topic: COMMAND_TOPICS.SYNC_CHATROOM_ATTRS
      };
      send(SIGNAL_CMD.QUERY, data, (result) => {
        let { code, attrs, chatroomId: _chatroomId } = result;
        logger.info({ tag: LOG_MODULE.MSG_SYNC, data, msg, code, count: attrs.length });
        if(!utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          return next();
        }
        utils.forEach(attrs, (message) => {
          setChatRoomAttrSyncTime(_chatroomId, message.updateTime);
        });
        emitter.emit(SIGNAL_NAME.CMD_CHATROOM_ATTR_RECEIVED, { attrs, chatroomId: _chatroomId });
        next();
      });
    }

    function queryChatroom(item, next) {
      let {  msg } = item;
      let chatroomId = msg.targetId;
      let syncTime = getChatroomSyncTime(chatroomId);
      if (syncTime >= msg.receiveTime && msg.receiveTime > 0) {
        logger.info({ tag: LOG_MODULE.MSG_SYNC, syncTime, msg });
        return next();
      }

      let data = {
        syncTime: syncTime,
        chatroomId: chatroomId,
        topic: COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES
      };
      send(SIGNAL_CMD.QUERY, data, ({ messages, code }) => {
        logger.info({ tag: LOG_MODULE.MSG_SYNC, data, msg, code, count: messages.length });
        if(!utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          return next();
        }
        let { msgs = [] } = chatroomCacher.get(chatroomId);
        utils.forEach(messages, (message) => {
          setChatRoomSyncTime(message.conversationId, message.sentTime);
          let { messageId } = message;
          let isInclude  = utils.isInclude(msgs, messageId);
          if(!isInclude){
            msgs.push(messageId);
            emitter.emit(SIGNAL_NAME.CMD_RECEIVED, [message]);
          }
        });
        chatroomCacher.set(chatroomId, { msgs });
        next();
      });
    }

    function queryNormal(item, next) {
      let { user, msg, name } = item;

      let syncReceiveTime = Storage.get(STORAGE.SYNC_RECEIVED_MSG_TIME).time || 1700927161470;
      let syncSentTime = Storage.get(STORAGE.SYNC_SENT_MSG_TIME).time || 1700927161470;

      // 如果本地记录时间戳大于 ntf 中的接收时间，认为消息已被当前端接收过，不再执行拉取动作
      if (syncReceiveTime >= msg.receiveTime) {
        logger.info({ tag: LOG_MODULE.MSG_SYNC, syncReceiveTime, msg });
        return next();
      }
      let data = {
        userId: user.id,
        syncTime: syncReceiveTime,
        containsSendBox: true,
        sendBoxSyncTime: syncSentTime,
        topic: COMMAND_TOPICS.SYNC_MESSAGES
      };
      send(SIGNAL_CMD.QUERY, data, ({ isFinished, messages, code }) => {
        
        logger.info({ tag: LOG_MODULE.MSG_SYNC, data, msg, code, count: messages.length });

        if(!utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          return next();
        }

        utils.forEach(messages, (message, index) => {
          let isNewMsg = common.updateSyncTime({ ...message, io});
          if (isNewMsg) {
            let isFinishedAll = isFinished && utils.isEqual(messages.length - 1, index);
            emitter.emit(SIGNAL_NAME.CMD_RECEIVED, [message, isFinishedAll]);
          }
        });
        let isSyncing = !isFinished;
        if (isSyncing) {
          // 如果有未拉取，向队列下标最小位置插入消费对象，一次拉取执行完成后再处理它 ntf 或者 msg
          consumer.produce(item, isSyncing);
        }
        next();
      });
    }

    function syncConversations(item, next) {
      let { user, name, time, $conversation } = item;
      let syncTime = Storage.get(STORAGE.SYNC_CONVERSATION_TIME).time || 0;
      if(syncTime > time){
        logger.info({ tag: LOG_MODULE.CONV_SYNC, syncTime, time });
        return;
      }
      let data = {
        userId: user.id,
        syncTime: syncTime,
        topic: COMMAND_TOPICS.SYNC_CONVERSATIONS,
        count: 200
      };
      send(SIGNAL_CMD.QUERY, data, (qryResult) => {
        let { isFinished, conversations, code } = qryResult;
        
        logger.info({ tag: LOG_MODULE.CONV_SYNC, data, code, count: conversations.length });

        if(!utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)){
          emitter.emit(SIGNAL_NAME.CMD_SYNC_CONVERSATION_FINISHED, {});
          return next();
        }
        let len = conversations.length;
        let conversation = conversations[len - 1] || { syncTime: 0 };
        let { syncTime: newSyncTime } = conversation;
        if(newSyncTime > syncTime){
          Storage.set(STORAGE.SYNC_CONVERSATION_TIME, { time: newSyncTime });
          item = utils.extend(item, { time: newSyncTime});
        }
        conversations = utils.clone(conversations)
        $conversation._batchInsertConversations({ conversations, syncTime: newSyncTime }).then((result) => {
          emitter.emit(SIGNAL_NAME.CMD_SYNC_CONVERSATIONS_PROGRESS, result);
          let isSyncing = !isFinished;
          if (isSyncing) {
            // 如果有未拉取，向队列下标最小位置插入消费对象，一次拉取执行完成后再处理它 ntf 或者 msg
            consumer.produce(item, isSyncing);
          }else{
            emitter.emit(SIGNAL_NAME.CMD_SYNC_CONVERSATION_FINISHED, {});
          }
          next();
        });
      })
    }

    function getChatroomSyncTime(chatroomId){
      let result = chatroomCacher.get(chatroomId);
      return result.syncMsgTime || 0;
    }
    function setChatRoomSyncTime(chatroomId, time){
      let currentTime = getChatroomSyncTime(chatroomId);
      if(time > currentTime){
        chatroomCacher.set(chatroomId, { syncMsgTime: time });
      }
    }

    function getChatroomAttrSyncTime(chatroomId){
      let syncInfo = chatroomCacher.get(chatroomId);
      return syncInfo.syncAttTime || 0;
    }
    function setChatRoomAttrSyncTime(chatroomId, time){
      let currentTime = getChatroomAttrSyncTime(chatroomId);
      if(time > currentTime){
        chatroomCacher.set(chatroomId, { syncAttTime: time });
      }
    }
  }
  return {
    exec
  };
}
