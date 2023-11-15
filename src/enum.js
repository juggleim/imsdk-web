export let STORAGE = {
  PREFIX: 'suprjuggle_im',
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
  PRIVATE: 0,
  GROUP: 1,
  CHATROOM: 2,
  SYSTEM: 3
 };