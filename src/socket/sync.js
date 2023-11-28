import utils from "../utils";
import Proto from "./proto";
import Storage from "../common/storage";
import Logger from "../common/logger";
import Consumer from "../common/consumer";
import common from "../common/common";

import { SIGNAL_CMD, COMMAND_TOPICS, STORAGE, NOTIFY_TYPE, SIGNAL_NAME } from "../enum";
export default function Syncer(send, emitter){
  let consumer = Consumer();
  let exec = (data) => { 
    consumer.produce(data);
    consumer.consume(({ item }, next) => {
      let { name } = item;
      if(utils.isEqual(name, SIGNAL_NAME.CMD_RECEIVED)){
        publish(item, next);
      }
      if(utils.isEqual(name, SIGNAL_NAME.S_NTF)){
        query(item, next);
      }
    });
    
    function publish(item, next){
      let { msg } = item;
      let isNewMsg = common.updateSyncTime(msg);
      if(isNewMsg){
        emitter.emit(SIGNAL_NAME.CMD_RECEIVED, msg);
      }
      next();
    }
    function query(item, next){
      let { user, msg, name } = item;
      if(!utils.isEqual(msg.type, NOTIFY_TYPE.MSG)){
        return next();
      }
      let syncReceiveTime = Storage.get(STORAGE.SYNC_RECEIVED_MSG_TIME).time || 1700927161470;
      let syncSentTime =  Storage.get(STORAGE.SYNC_SENT_MSG_TIME).time || 1700927161470;
      let data = {
        userId: user.id,
        syncTime: syncReceiveTime,
        containsSendBox: true,
        sendBoxSyncTime: syncSentTime,
        topic: COMMAND_TOPICS.SYNC_MESSAGES
      };
      send(SIGNAL_CMD.QUERY, data, ({ isFinished, messages }) => {
        utils.forEach(messages, (message) => {
          let isNewMsg = common.updateSyncTime(message);
          if(isNewMsg){
            emitter.emit(SIGNAL_NAME.CMD_RECEIVED, message);
          }
        });
        let isSyncing = !isFinished;
        if(isSyncing){
          // 如果有未拉取，向队列下标最小位置插入消费对象，一次拉取执行完成后再处理它 ntf 或者 msg
          consumer.produce(item, isSyncing);
        }
        next();
      });
    }
  }

  return { 
    exec
  };
}