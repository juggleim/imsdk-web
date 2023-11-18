export let STORAGE = {
  PREFIX: 'suprjuggle_im',
  NAVI: 'navi'
};

export let SIGNAL_NAME = {
  CMD_RECEIVED: 'cmd_inner_receive',
  CONN_CHANGED: 'conn_inner_changed',
  
  // 与下行信令进行匹配，在 io.js 中进行派发
  S_CONNECT_ACK: 's_connect_ack',
  S_DISCONNECT: 's_disconnect',
  S_PUBLICH_ACK: 's_publish_ack',
  S_QUERY_ACK: 's_query_ack',
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
  CONVERSATIONS: 'qry_convers'
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
  CONNECTION_EXISTS: 10001
};

 export let CONVERATION_TYPE = {
  PRIVATE: 1,
  GROUP: 2,
  CHATROOM: 3,
  SYSTEM: 4
 };

 export let MESSAGE_DIRECTION = {
  UP: 0,
  DOWN: 1
 };

 export let ErrorType = {
  ILLEGAL_PARAMS: {
    code: 20000,
    msg: '参数缺失，请检查传入参数' 
  },
  CONNECTION_EXISTS: {
    code: 21000,
    msg: '连接已存在'
  },
  CONNECTION_NOT_READY: {
    code: 21001,
    msg: '连接不存在，请优先调用 connect 连接'
  }
 };