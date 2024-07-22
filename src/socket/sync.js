import utils from "../utils";
import Proto from "./proto";
import Storage from "../common/storage";
import Consumer from "../common/consumer";
import common from "../common/common";

import { SIGNAL_CMD, COMMAND_TOPICS, STORAGE, NOTIFY_TYPE, SIGNAL_NAME, ErrorType } from "../enum";
export default function Syncer(send, emitter) {
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
      let isNewMsg = common.updateSyncTime(msg);
      if (isNewMsg) {
        let { msgIndex, ackIndex } = msg;
        let data = { msgIndex, ackIndex };
        send(SIGNAL_CMD.PUBLISH_ACK, data);
        emitter.emit(SIGNAL_NAME.CMD_RECEIVED, msg);
      }
      next();
    }
    function query(item, next) {
      let { msg } = item;
      if (utils.isEqual(msg.type, NOTIFY_TYPE.MSG)) {
        queryNormal(item, next);
      } else if (utils.isEqual(msg.type, NOTIFY_TYPE.CHATROOM)) {
        queryChatroom(item, next);
      } else {
        next();
      }
    }

    function queryChatroom(item, next) {
      let { user, msg, name } = item;
      let syncTime = Storage.get(STORAGE.SYNC_CHATROOM_RECEIVED_MSG_TIME).time || 0;
      if (syncTime >= msg.receiveTime) {
        return;
      }

      let data = {
        syncTime: syncTime,
        chatroomId: msg.targetId,
        topic: COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES
      };
      send(SIGNAL_CMD.QUERY, data, ({ isFinished, messages }) => {
        utils.forEach(messages, (message) => {
          common.updateChatroomSyncTime(message);
          let isFinishedAll = isFinished && utils.isEqual(messages.length - 1, index);
          emitter.emit(SIGNAL_NAME.CMD_RECEIVED, [message, isFinishedAll]);
        });
        let isSyncing = !isFinished;
        if (isSyncing) {
          // 如果有未拉取，向队列下标最小位置插入消费对象，一次拉取执行完成后再处理它 ntf 或者 msg
          consumer.produce(item, isSyncing);
        }
        next();
      });
    }

    function queryNormal(item, next) {
      let { user, msg, name } = item;

      let syncReceiveTime = Storage.get(STORAGE.SYNC_RECEIVED_MSG_TIME).time || 1700927161470;
      let syncSentTime = Storage.get(STORAGE.SYNC_SENT_MSG_TIME).time || 1700927161470;

      // 如果本地记录时间戳大于 ntf 中的接收时间，认为消息已被当前端接收过，不再执行拉取动作
      if (syncReceiveTime >= msg.receiveTime) {
        return;
      }
      let data = {
        userId: user.id,
        syncTime: syncReceiveTime,
        containsSendBox: true,
        sendBoxSyncTime: syncSentTime,
        topic: COMMAND_TOPICS.SYNC_MESSAGES
      };
      send(SIGNAL_CMD.QUERY, data, ({ isFinished, messages }) => {
        utils.forEach(messages, (message, index) => {
          let isNewMsg = common.updateSyncTime(message);
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
  }
  return {
    exec
  };
}
