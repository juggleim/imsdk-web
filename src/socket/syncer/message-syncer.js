import utils from "../../utils";
import Storage from "../../common/storage";
import Consumer from "../../common/consumer";
import common from "../../common/common";

import { SIGNAL_CMD, COMMAND_TOPICS, STORAGE, NOTIFY_TYPE, SIGNAL_NAME, ErrorType, LOG_MODULE } from "../../enum";
export default function MessageSyncer(send, emitter, io, { logger }) {
 
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
      let { user, msg, name, $message } = item;

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

        let msgs = [];
        utils.forEach(messages, (message, index) => {
          let { flags, sentTime, isSender } = message;
          let msgFlag = common.formatter.toMsg(flags);
          if(msgFlag.isStorage){
            msgs.push(message);
          }
        });
        $message.insertBatchMsgs({ msgs }).then(() => {
          utils.forEach(messages, (message, index) => {
            let { sentTime, isSender } = message;
            let isNewMsg = common.updateSyncTime({ sentTime, isSender, io});
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
      });
    }
  }
  return {
    exec
  };
}