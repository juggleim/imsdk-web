import utils from "./utils";
export let STORAGE = {
  PREFIX: 'suprjj_im',
  NAVI: 'navi',
  SYNC_RECEIVED_MSG_TIME: 'sync_received_msg_time',
  SYNC_SENT_MSG_TIME: 'sync_sent_msg_time',
  SYNC_CHATROOM_RECEIVED_MSG_TIME: 'sync_chatroom_received_msg_time',
};

export let HEART_TIMEOUT = 1 * 30 * 1000;
export let CONNECT_ACK_INDEX = 'c_conn_ack_index';
export let PONG_INDEX = 'c_pong_index';

export let SIGNAL_NAME = {
  CMD_RECEIVED: 'cmd_inner_receive',
  CMD_CONVERSATION_CHANGED: 'cmd_inner_conversation_changed',
  CONN_CHANGED: 'conn_inner_changed',

  // 与下行信令进行匹配，在 io.js 中进行派发
  S_CONNECT_ACK: 's_connect_ack',
  S_DISCONNECT: 's_disconnect',
  S_PUBLICH_ACK: 's_publish_ack',
  S_QUERY_ACK: 's_query_ack',
  S_NTF: 's_ntf',
  S_PONG: 's_pong'
};

export let PLATFORM = {
  WEB: 'Web'
}

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
  CONNECT: [{ name: 'token' }, { name: 'userId' }],

  SENDMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'content', type: 'Object' }, { name: 'name' }],
  GETMSGS: [{ name: 'conversationType' }, { name: 'conversationId' }],
  GETMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageIds', type: 'Array' }],
  REMOVEMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }],
  CLEARMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'time', type: 'Number' }],
  RECALLMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }, { name: 'sentTime' }],
  READMESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'sentTime', type: 'Number' }, { name: 'messageId' }],
  UPDATEMESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }, { name: 'content', type: 'Object' }],
  GET_MENTIOIN_MESSAGES: [{ name: 'conversationType' }, { name: 'conversationId' }],
  GET_FILE_TOKEN: [{ name: 'type' }],

  GETCONVERSATIONS: [{ name: 'limit' }],
  GETCONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],

  CLEARUNREADCOUNT: [{ name: 'conversationType' }, { name: 'conversationId' }],
  REMOVECONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],

  JOINCHATROOM: [{ name: 'id', type: 'String' }],
  QUITCHATROOM: [{ name: 'id', type: 'String' }],
};
export let COMMAND_TOPICS = {
  HISTORY_MESSAGES: 'qry_hismsgs',
  CONVERSATIONS: 'qry_convers',
  SYNC_MESSAGES: 'sync_msgs',
  RECALL: 'recall_msg',
  GET_MENTION_MSGS: 'qry_mention_msgs',
  
  NTF: 'ntf',
  SEND_GROUP: 'g_msg',
  SEND_PRIVATE: 'p_msg',
  SEND_CHATROOM: 'c_msg',

  CLEAR_UNREAD: 'clear_unread',
  REMOVE_CONVERSATION: 'del_convers',
  GET_UNREAD_TOTLAL_CONVERSATION: 'qry_total_unread_count',
  CLEAR_UNREAD_TOTLAL_CONVERSATION: 'clear_total_unread',

  READ_MESSAGE: 'mark_read',
  UPDATE_MESSAGE: 'modify_msg',
  CLEAR_MESSAGE: 'clean_hismsg',
  GET_MSG_BY_IDS: 'qry_hismsg_by_ids',
  GET_FILE_TOKEN: 'file_cred',

  JOIN_CHATROOM: 'c_join',
  QUIT_CHATROOM: 'c_quit',
  SYNC_CHATROOM_MESSAGES: 'c_sync_msgs',
};
export let NOTIFY_TYPE = {
  DEFAULT: 0,
  MSG: 1,
  CHATROOM: 2,
};


// 以下是对外暴露枚举
export let EVENT = {
  STATE_CHANGED: 'state_changed',
  MESSAGE_RECEIVED: 'message_received',
  CONVERSATION_CHANGED: 'conversation_changed'
};
export let CONNECT_STATE = {
  CONNECTED: 0,
  CONNECTING: 1,
  DISCONNECTED: 2,
  CONNECT_FAILED: 3,
  CONNECTION_SICK: 1000
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

export let CONVERSATION_ORDER = {
  FORWARD: 0,
  BACKWARD: 1
};

export let MENTION_ORDER = {
  FORWARD: 0,
  BACKWARD: 1
};

export let MESSAGE_FLAG = {
  COMMAND: 1,
  COUNT: 2,
  STATE: 4,
  STORAGE: 8,
  COUNT_STORAGE: 10,
  IS_UPDATED: 16,
};

export let UPLOAD_TYPE = {
  QINIU: 1
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

  { code: 13001, msg: '群组不存在', name: 'GROUP_NOT_EXISTS' },

  { code: 25000, msg: '参数缺失，请检查传入参数', name: 'ILLEGAL_PARAMS' },
  { code: 25001, msg: '连接已存在', name: 'CONNECTION_EXISTS' },
  { code: 25002, msg: '连接不存在', name: 'CONNECTION_NOT_READY' },
  { code: 25003, msg: '参数类型不正确', name: 'ILLEGAL_TYPE_PARAMS' },
  { code: 25004, msg: '发送超时，连接异常', name: 'COMMAND_FAILED' },

  { code: 21200, msg: '消息撤回成功', name: 'MESSAGE_RECALL_SUCCESS' },
  
  { code: 0, msg: '内部业务调用成功', name: 'COMMAND_SUCCESS' },
];


function getErrorType() {
  let errors = {};
  utils.forEach(ErrorMessages, (error) => {
    let { name, code, msg } = error;
    errors[name] = { code, msg };
  });
  return errors;
}
export let ErrorType = getErrorType();

export let MESSAGE_TYPE = {
  TEXT: 'jg:text',
  IMAGE: 'jg:img',
  VOICE: 'jg:voice',
  VIDEO: 'jg:video',
  FILE: 'jg:file',
  RECALL: 'jg:recall',
  READ_MSG: 'jg:readedmsg',
  CLEAR_MSG: 'jg:cleanmsg'
}

export let MENTION_TYPE = {
  ALL: 1,
  SOMEONE: 2,
  ALL_SOMEONE: 3
};

export let FILE_TYPE = {
  IMAGE: 1,
  AUDIO: 2,
  VIDEO: 3,
  FILE: 4,
};