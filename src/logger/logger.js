import DB from './database';
import { LOG_LEVEL } from '../enum';
import utils from "../utils";

export default function Logger(option = {}){
  let TABLE_NAME = 'LOGS';
  let INDEX = {
    TIME: 'time',
    LEVEL: 'level',
    T_L_GROUP: 'time_level'
  };
  let { isConsole = true, appkey, sessionId } = option;

  let $db = DB({
    name: `JUGGLEIM_${appkey}`,
    tables: [
      { 
        name: TABLE_NAME, 
        indexs: [
          { name: INDEX.TIME, value: 'time' },
          { name: INDEX.LEVEL, value: 'level' },
          { name: INDEX.T_L_GROUP, value: ['time', 'level'] },
        ] 
      }
    ]
  });

  let kickDueLogs = () => {
    let day7 = 7 * 24 * 60 * 60 * 1000;
    let time = Date.now() - day7;
    $db.remove({ 
      name: TABLE_NAME, 
      index: { 
        name: INDEX.TIME,
        type: 'upperBound',
        values: [time, false]
      } 
    });
  };
  kickDueLogs();

  let write = (level, time, content) => {
    $db.insert({ name: TABLE_NAME, record: { sessionId, level, time, content } });
  };

  let log = (level, content) => {
    let time = Date.now();
    write(level, time, content);
    if(isConsole){
      let _time = utils.formatTime(time);
      let _content = utils.toJSON(content);
      console.log(`%cJG:LOG`, `background-color:#1e1ec5;color:#FFF;padding:0 4px;font-size:10px;`, `${_time} ${_content}`);
    }
  };
  let error = (content) => {
    log(LOG_LEVEL.ERROR, content);
  };
  let warn = (content) => {
    log(LOG_LEVEL.WARN, content);
  };
  let fatal = (content) => {
    log(LOG_LEVEL.FATAL, content);
  };
  let info = (content) => {
    log(LOG_LEVEL.INFO, content);
  };
  let report = () => {
    let starTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let endTime = Date.now();
    let params = { 
      name: TABLE_NAME, 
      index: { 
        name: INDEX.TIME,
        type: 'bound',
        values: [starTime, endTime, false, false]
      }
    };
    $db.search(params, (result) => {
      console.log(result);
    });
  };
  
  return {
    log,
    error,
    warn,
    fatal,
    info,
    report
  }
}