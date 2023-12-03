import utils from "./utils";
export let STORAGE = {
  PREFIX: 'suprjuggle_im',
  NAVI: 'navi',
  SYNC_RECEIVED_MSG_TIME: 'sync_received_msg_time',
  SYNC_SENT_MSG_TIME: 'sync_sent_msg_time'
};

export let SIGNAL_NAME = {
  CMD_RECEIVED: 'cmd_inner_receive',
  CONN_CHANGED: 'conn_inner_changed',
  
  // 与下行信令进行匹配，在 io.js 中进行派发
  S_CONNECT_ACK: 's_connect_ack',
  S_DISCONNECT: 's_disconnect',
  S_PUBLICH_ACK: 's_publish_ack',
  S_QUERY_ACK: 's_query_ack',
  S_NTF: 's_ntf',
  S_PONG: 's_pong'
};

export let SIGNAL_CMD = {
  CONNECT: 0,
  CONNECT_ACK: 1,
  DISCONNECT: 2,
  PUBLISH: 3,
  PUBLISH_ACK: 4,
  QUERY: 5,
  QUERY_ACK: 6,
  QUERY_CONFIRM: 7,
  PING: 8,
  PONG: 9
};
export let QOS = {
  YES: 1,
  NO: 0
};
export let FUNC_PARAM_CHECKER = {
  SENDMSG: ['conversationType', 'conversationId', 'name', 'content'],
  GETMSGS: ['conversationType', 'conversationId'],
  REMOVEMSG: ['conversationType', 'conversationId', 'messageId'],
  RECALLMSG: ['conversationType', 'conversationId', 'messageId'],
  
  GETCONVERSATIONS: ['limit'],
  GETCONVERSATION: ['conversationType', 'conversationId'],
  CLEARUNREADCOUNT: ['conversationType', 'conversationId'],
};
export let COMMAND_TOPICS = {
  HISTORY_MESSAGES: 'qry_hismsgs',
  CONVERSATIONS: 'qry_convers',
  SYNC_MESSAGES: 'sync_msgs',
  NTF: 'ntf'
};
export let NOTIFY_TYPE = {
  DEFAULT: 0,
  MSG: 1
};


// 以下是对外暴露枚举
export let EVENT = {
  STATE_CHANGED: 'state_changed',
  MESSAGE_RECEIVED: 'message_received'
};
export let CONNECT_STATE = {
  CONNECTED: 0,
  CONNECTING: 1,
  DISCONNECTED: 2,
  CONNECT_FAILED: 3
};

 export let CONVERATION_TYPE = {
  PRIVATE: 1,
  GROUP: 2,
  CHATROOM: 3,
  SYSTEM: 4
 };

 export let MESSAGE_ORDER = {
  FORWARD: 0,
  BACKWARD: 1
 };


export let ErrorMessages = [
  { code: 0, msg: '链接成功', name: 'CONNECT_SUCCESS' },
  { code: 11000, msg: '默认错误', name: 'CONNECT_ERROR' },
  { code: 11001, msg: '未传 Appkey', name: 'CONNECT_APPKEY_IS_REQUIRE' },
  { code: 11002, msg: '未传 Token', name: 'CONNECT_TOKEN_NOT_EXISTS' },
  { code: 11003, msg: 'Appkey 不存在', name: 'CONNECT_APPKEY_NOT_EXISTS' },
  { code: 11004, msg: 'Token 不合法', name: 'CONNECT_TOKEN_ILLEGAL' },
  { code: 11005, msg: 'Token 未授权', name: 'CONNECT_TOKEN_UNAUTHORIZED' },
  { code: 11006, msg: 'Token 已过期', name: 'CONNECT_TOKEN_EXPIRE' },
  { code: 11007, msg: '需要重定向', name: 'CONNECT_REDIRECT' },
  { code: 11008, msg: '不支持的平台类型', name: 'CONNECT_UNSUPPORT_PLATFORM' },
  { code: 11009, msg: 'App已封禁', name: 'CONNECT_APP_BLOCKED' },
  { code: 11010, msg: '用户已封禁', name: 'CONNECT_USER_BLOCKED' },
  { code: 11011, msg: '被踢下线', name: 'CONNECT_USER_KICKED' },
  { code: 11012, msg: '注销下线', name: 'CONNECT_USER_LOGOUT' },
  { code: 11100, msg: '入参pb解析失败', name: 'PB_ERROR' },

  { code: 25000, msg: '参数错误，请检查传入参数', name: 'ILLEGAL_PARAMS' },
  { code: 25001, msg: '连接已存在', name: 'CONNECTION_EXISTS' },
  { code: 25002, msg: '连接不存在', name: 'CONNECTION_NOT_READY' },
];


function getErrorType(){
  let errors = {};
  utils.forEach(ErrorMessages, (error) => {
    let { name, code, msg } = error;
    errors[name] = { code, msg };
  });
  return errors;
}
 export let ErrorType = getErrorType();