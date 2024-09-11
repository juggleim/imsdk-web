import utils from "../../utils";
import Storage from "../../common/storage";
import Consumer from "../../common/consumer";
import common from "../../common/common";

import { SIGNAL_CMD, COMMAND_TOPICS, STORAGE, NOTIFY_TYPE, SIGNAL_NAME, ErrorType, LOG_MODULE } from "../../enum";
export default function ConversationSyncer(send, emitter, io, { logger }) {

  let consumer = Consumer();

  let exec = (data) => {
    consumer.produce(data);
    consumer.consume(({ item }, next) => {
      let { name } = item;
      if (utils.isEqual(name, SIGNAL_NAME.S_SYNC_CONVERSATION_NTF)) {
        syncConversations(item, next);
      }
    });
    function syncConversations(item, next) {
      let { user, name, time, $conversation } = item;
      let syncTime = Storage.get(STORAGE.SYNC_CONVERSATION_TIME).time || 0;
      if(syncTime > time){
        logger.info({ tag: LOG_MODULE.CONV_SYNC, syncTime, time });
        return next();
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
  }
  return {
    exec
  };
}
