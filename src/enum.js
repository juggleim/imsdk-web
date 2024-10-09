import utils from "./utils";
export let STORAGE = {
  PREFIX: 'suprjj_im',
  NAVI: 'navi',
  SYNC_CHATROOM_RECEIVED_MSG_TIME: 'sync_chatroom_received_msg_time',
  SYNC_CHATROOM_ATTR_TIME: 'sync_chatroom_attr_time',
  CLIENT_SESSION: 'jgim_client_session',
  CRYPTO_RANDOM: 'jg_crypto_randowm',

  //PC 端有同样的 KEY，如果修改 VALUE，需要一起修改
  SYNC_CONVERSATION_TIME: 'sync_conversation_time',
  SYNC_RECEIVED_MSG_TIME: 'sync_received_msg_time',
  SYNC_SENT_MSG_TIME: 'sync_sent_msg_time',
};

export let HEART_TIMEOUT = 1 * 30 * 1000;
export let SYNC_MESSAGE_TIME = 3 * 60 * 1000;
export let CONNECT_ACK_INDEX = 'c_conn_ack_index';
export let PONG_INDEX = 'c_pong_index';

export let SIGNAL_NAME = {
  CMD_RECEIVED: 'cmd_inner_receive',
  CMD_CHATROOM_ATTR_RECEIVED: 'cmd_inner_chatroom_attr_receive',
  CMD_CHATROOM_DESTROY: 'cmd_inner_chatroom_destroy',
  CMD_SYNC_CONVERSATIONS_PROGRESS: 'cmd_inner_sync_conversations_progress',
  CMD_SYNC_CONVERSATION_FINISHED: 'cmd_inner_sync_conversations_finished',
  CMD_CONVERSATION_CHANGED: 'cmd_inner_conversation_changed',
  CONN_CHANGED: 'conn_inner_changed',

  CMD_SYNC_TAG_FINISHED: 'cmd_inner_sync_tags_finished',

  CMD_CHATROOM_EVENT: 'cmd_inner_chatroom_event',
  CMD_CHATROOM_REJOIN: 'cmd_inner_chatroom_rejoin',

  // 与下行信令进行匹配，在 io.js 中进行派发
  S_CONNECT_ACK: 's_connect_ack',
  S_DISCONNECT: 's_disconnect',
  S_PUBLICH_ACK: 's_publish_ack',
  S_QUERY_ACK: 's_query_ack',
  S_NTF: 's_ntf',
  S_CHATROOM_USER_NTF: 's_c_user_ntf',
  // PC 端自定义通知
  S_SYNC_CONVERSATION_NTF: 's_sync_conversation_ntf',
  S_PONG: 's_pong',

  CLIENT_CLEAR_MEMORY_CACHE: 'cmd_clear_memory_cache',
};

export let PLATFORM = {
  WEB: 'Web',
  DESKTOP: 'PC'
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
  CONNECT: [{ name: 'token' }],

  SENDMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'content' }, { name: 'name' }],
  INSERT_MESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'content' }, { name: 'name' }, { name: 'sentState' }, { name: 'sender', type: 'Object' }],
  GETMSGS: [{ name: 'conversationType' }, { name: 'conversationId' }],
  GETMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageIds', type: 'Array' }],
  REMOVEMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }],
  CLEARMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'time', type: 'Number' }],
  REMOVE_MSGS: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'sentTime', type: 'Number' }, { name: 'tid' }, { name: 'messageIndex' }],
  RECALLMSG: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }, { name: 'sentTime' }],
  READMESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'sentTime', type: 'Number' }, { name: 'unreadIndex' }],
  GET_MESSAGE_READ_DETAILS: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }],
  UPDATEMESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'tid' }],
  GET_MENTIOIN_MESSAGES: [{ name: 'conversationType' }, { name: 'conversationId' }],
  SEARCH_MESSAGES: [{ name: 'keywords', type: 'Array' }],
  UPDATE_MESSAGE_ATTR: [{ name: 'tid' }, { name: 'attribute', type: 'String' }],
  SET_MESSAGE_SEARCH_CONTENT: [{ name: 'tid' }, { name: 'content', type: 'String' }],
  GET_FILE_TOKEN: [{ name: 'type' }],
  
  SEND_FILE_MESSAGE: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'content', type: 'Object' }],
  SEND_MERGE_MESSAGE: [ 
    { name: 'conversationType' }, 
    { name: 'conversationId' }, 
    { name: 'title' }, 
    { name: 'previewList', type: 'Array' }, 
    { name: 'messages', type: 'Array', children: [
      { name: 'conversationType' },
      { name: 'conversationId' },
      { name: 'messageId' },
      { name: 'sentTime' },
      { name: 'messageIndex' },
    ] }],
  GET_MERGE_MESSAGES: [{ name: 'messageId' }],

  GET_FIRST_UNREAD_MSG: [{ name: 'conversationType' }, { name: 'conversationId' }],

  GETCONVERSATIONS: [{ name: 'limit' }],
  GETCONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],
  
  MARK_UNREAD: [
    { name: 'conversationType' }, 
    { name: 'conversationId' }, 
    { name: 'unreadTag', type: 'Number' }, 
  ],

  GET_TOTAL_UNREADCOUNT: [
    { name: 'ignoreConversations', type: 'Array', children: [
      { name: 'conversationType' },
      { name: 'conversationId' },
    ] },
  ],
  SET_ALL_DISTURB: [
    { name: 'type' }, 
    // { name: 'timezone' }, 
    // { 
    //   name: 'times', 
    //   type: 'Array',
    //   children: [
    //     { name: 'start', type: 'String' },
    //     { name: 'end', type: 'String' },
    //   ]
    // }
  ],

  CLEARUNREADCOUNT: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'unreadIndex' }],
  SET_DRAFT: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'draft' }],
  GET_DRAFT: [{ name: 'conversationType' }, { name: 'conversationId' }],
  REMOVECONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],
  INSERTCONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],
  GET_CONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],
  
  MUTE_CONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'undisturbType' } ],
  
  SET_TOP_CONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'isTop' }],
  UNTOP_CONVERSATION: [{ name: 'conversationType' }, { name: 'conversationId' }],

  JOINCHATROOM: [{ name: 'id', type: 'String' }],
  QUITCHATROOM: [{ name: 'id', type: 'String' }],
  SET_CHATROOM_ATTRS: [
    { name: 'id', type: 'String' }, 
    { 
      name: 'attributes', 
      type: 'Array',
      children: [
        { name: 'key' },
        { name: 'value' },
      ]
    }
  ],
  REMOVE_CHATROOM_ATTRS: [
    { name: 'id', type: 'String' }, 
    { 
      name: 'attributes', 
      type: 'Array',
      children: [
        { name: 'key' },
      ]
    }
  ],
  GET_CHATROOM_ATTRS: [
    { name: 'id', type: 'String' }, 
    { 
      name: 'attributes', 
      type: 'Array',
      children: [
        { name: 'key' },
      ]
    }
  ],
  GET_ALL_CHATROOM_ATTRS: [{ name: 'id', type: 'String' }],

  ADD_MSG_REACTION: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }, { name: 'reactionId', type: 'String' }],
  REMOVE_MSG_REACTION: [{ name: 'conversationType' }, { name: 'conversationId' }, { name: 'messageId' }, { name: 'reactionId', type: 'String' }],

  CREATE_CONVERSATION_TAG: [{ name: 'id', type: 'String' }, { name: 'name', type: 'String' }],
  REMOVE_CONVERSATION_TAG: [{ name: 'id', type: 'String' }],
  ADD_CONVERSATION_TO_TAG: [
    {  name: 'id',  type: 'String'},
    { 
      name: 'conversations', 
      type: 'Array',
      children: [
        { name: 'conversationId' },
        { name: 'conversationType' },
      ]
    }
  ],
  REMOVE_CONVERSATION_FROM_TAG: [
    {  name: 'id',  type: 'String'},
    { 
      name: 'conversations', 
      type: 'Array',
      children: [
        { name: 'conversationId' },
        { name: 'conversationType' },
      ]
    }
  ],

};
export let COMMAND_TOPICS = {
  HISTORY_MESSAGES: 'qry_hismsgs',
  CONVERSATIONS: 'qry_convers',
  QUERY_TOP_CONVERSATIONS: 'qry_top_convers',
  SYNC_CONVERSATIONS: 'sync_convers',
  SYNC_MESSAGES: 'sync_msgs',
  RECALL: 'recall_msg',
  GET_MENTION_MSGS: 'qry_mention_msgs',
  
  NTF: 'ntf',
  MSG: 'msg',
  CHATROOM_USER_NTF: 'c_user_ntf',
  
  SEND_GROUP: 'g_msg',
  SEND_PRIVATE: 'p_msg',
  SEND_CHATROOM: 'c_msg',
  
  GET_MERGE_MSGS: 'qry_merged_msgs',
  
  GET_FIRST_UNREAD_MSG: 'qry_first_unread_msg',

  CLEAR_UNREAD: 'clear_unread',
  REMOVE_CONVERSATION: 'del_convers',
  INSERT_CONVERSATION: 'add_conver',
  GET_CONVERSATION: 'qry_conver',
  MUTE_CONVERSATION: 'undisturb_convers',
  TOP_CONVERSATION: 'top_convers',
  GET_UNREAD_TOTLAL_CONVERSATION: 'qry_total_unread_count',
  CLEAR_UNREAD_TOTLAL_CONVERSATION: 'clear_total_unread',
  MARK_CONVERSATION_UNREAD: 'mark_unread',

  SET_ALL_DISTURB: 'set_user_undisturb',
  GET_ALL_DISTURB: 'get_user_undisturb',

  READ_MESSAGE: 'mark_read',
  GET_READ_MESSAGE_DETAIL: 'qry_read_detail',
  UPDATE_MESSAGE: 'modify_msg',
  CLEAR_MESSAGE: 'clean_hismsg',
  REMOVE_MESSAGE: 'del_msg',
  GET_MSG_BY_IDS: 'qry_hismsg_by_ids',
  GET_FILE_TOKEN: 'file_cred',

  GET_USER_INFO: 'qry_user_info',

  JOIN_CHATROOM: 'c_join',
  QUIT_CHATROOM: 'c_quit',
  SYNC_CHATROOM_MESSAGES: 'c_sync_msgs',
  SYNC_CHATROOM_ATTRS: 'c_sync_atts',
  SET_CHATROOM_ATTRIBUTES: 'c_batch_add_att',
  REMOVE_CHATROOM_ATTRIBUTES: 'c_batch_del_att',
  GET_CHATROOM_ATTRIBUTES: 'fake_c_get_one',
  GET_ALL_CHATROOM_ATTRIBUTES: 'fake_c_get_all',
  
  ADD_MSG_REACTION: 'msg_exset',
  REMOVE_MSG_REACTION: 'del_msg_exset',
  
  CONVERSATION_TAG_ADD: 'tag_add_convers',
  CONVERSATION_TAG_REMOVE: 'tag_del_convers',
  TAG_REMOVE: 'del_user_conver_tags',
  CONVERSATION_TAG_QUERY: 'qry_user_conver_tags',
};
export let NOTIFY_TYPE = {
  DEFAULT: 0,
  MSG: 1,
  CHATROOM: 2,
  CHATROOM_ATTR: 3,
  CHATROOM_EVENT: 4,
  CHATROOM_DESTORY: 5,
};
export let CONNECT_TOOL = {
  START_TIME: 'connect_start_time',
  RECONNECT_FREQUENCY: 'reconnect_frequency',
  RECONNECT_COUNT: 'reconnect_count',
};
export let LOG_LEVEL = {
  NONE: 0,
  FATAL: 1,
  ERROR: 2,
  WARN: 3,
  INFO: 4,
  DEBUG: 5,
  VERBOSE: 6
};

export let LOG_MODULE = {
  INIT: 'J-Init',
  DB_OPEN: 'DB-Open',
  DB_CLOSE: 'DB-Close',

  PB_PARSE: 'PB-Parse',
  PB_MATCH: 'PB-Match',

  WS_RECEIVE: 'WS-Receive',
  WS_SEND: 'WS-Send',
  WS_CONNECT: 'WS-Connect',

  NAV_START: 'Nav-Start',
  NAV_REQEST: 'Nav-Request',
  
  HB_START: 'HB-Start',
  HB_STOP: 'HB-Stop',

  CON_CONNECT: 'CON-Connect',
  CON_STATUS: 'CON-Status',
  CON_DISCONNECT: 'CON-Disconnect',
  CON_TOKEN: 'CON-Token',
  CON_RECONNECT: 'CON-Reconnect',

  MSG_SYNC: 'MSG-Sync',
  MSG_DELETE: 'MSG-Delete',
  MSG_RECALL: 'MSG-Recall',
  MSG_CLEAR: 'MSG-Clear',
  MSG_GROUP_READ_DETAIL: 'MSG-GroupReadDetail',
  MSG_GET_LIST: 'MSG-Get',
  MSG_GET_MERGE: 'MSG-GetMerge',
  MSG_GET_MENTION: 'MSG-GetMention',
  MSG_REGISTER: 'MSG-Register',
  MSG_SEND: 'MSG-ST',
  MSG_SEND_MASS: 'MSG-ST-MASS',
  MSG_SEND_MERGE: 'MSG-ST-MERGE',
  MSG_SEND_FILE: 'MSG-ST-FILE',
  MSG_RECEIVE: 'MSG-ST-RECEIVE',
  MSG_UPDATE: 'MSG-UPDATE',
  
  CHATROOM_ATTR_RECEIVE: 'CHATROOM_ATTR_RECEIVE',
  CHATROOM_ATTR_SET: 'CHATROOM_ATTR_SET',
  CHATROOM_ATTR_REMOVE: 'CHATROOM_ATTR_REMOVE',
  CHATROOM_USER_REJOIN: 'CHATROOM_USER_REJOIN',
  CHATROOM_USER_JOIN: 'CHATROOM_USER_JOIN',
  CHATROOM_USER_QUIT: 'CHATROOM_USER_QUIT',
  CHATROOM_SERVER_EVENT: 'CHATROOM_SERVER_EVENT',
  CHATROOM_DESTORYED: 'CHATROOM_DESTORYED',

  CONV_SYNC: 'CONV-Sync',
  CONV_DELETE: 'CONV-Delete',
  CONV_CLEAR_UNREAD: 'CONV-ClearUnread',
  CONV_CLEAR_TOTAL: 'CONV-ClearTotal',
  CONV_MUTE: 'CONV-Mute',
  CONV_TOP: 'CONV-Top'
};

export let CHATROOM_ATTR_OP_TYPE = {
  NONE: 0,
  ADD: 1,
  DEL: 2,
};

export let CHATROOM_EVENT_TYPE = {
  JOIN: 0,
  QUIT: 1,
  KICK: 2,
  FALLOUT: 3,
};

// 以下是对外暴露枚举
export let EVENT = {
  STATE_CHANGED: 'state_changed',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_RECALLED: 'message_recalled',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_READ: 'message_read',
  MESSAGE_REMOVED: 'message_removed',
  MESSAGE_CLEAN: 'message_clean',
  MESSAGE_CLEAN_SOMEONE: 'message_clean_someone',
  MESSAGE_REACTION_CHANGED: 'message_reaction_changed',
  
  TAG_ADDED: 'tag_added',
  TAG_REMOVED: 'tag_removed',
  TAG_CHANGED: 'tag_changed',
  TAG_CONVERSATION_ADDED: 'tag_conversation_added',
  TAG_CONVERSATION_REMOVED: 'tag_conversation_removed',

  CONVERSATION_SYNC_FINISHED: 'conversation_sync_finished',
  CONVERSATION_UNDISTURBED: 'conversation_undisturb',
  CONVERSATION_TOP: 'conversation_top',
  CONVERSATION_CLEARUNREAD: 'conversation_clearunead',
  CLEAR_TOTAL_UNREADCOUNT: 'conversation_total_unreadcount',

  CONVERSATION_CHANGED: 'conversation_changed',
  CONVERSATION_ADDED: 'conversation_added',
  CONVERSATION_REMOVED: 'conversation_removed',
  
  CHATROOM_ATTRIBUTE_UPDATED: 'chatroom_attr_updated',
  CHATROOM_ATTRIBUTE_DELETED: 'chatroom_attr_deleted',
  CHATROOM_DESTROYED: 'chatroom_destroyed',

  CHATROOM_USER_QUIT: 'chatroom_user_quit',
  CHATROOM_USER_KICKED: 'chatroom_user_kicked'

};
export let CONNECT_STATE = {
  CONNECTED: 0,
  CONNECTING: 1,
  DISCONNECTED: 2,
  CONNECT_FAILED: 3,
  DB_OPENED: 4,
  DB_CLOSED: 5,
  RECONNECTING: 6
};

export let CONVERATION_TYPE = {
  PRIVATE: 1,
  GROUP: 2,
  CHATROOM: 3,
  SYSTEM: 4
};

export let MESSAGE_ORDER = {
  // 获取新的历史消息
  FORWARD: 1,
  // 获取旧的历史消息
  BACKWARD: 0
};

export let CONVERSATION_ORDER = {
  FORWARD: 0,
  BACKWARD: 1
};

export let MENTION_ORDER = {
  FORWARD: 1,
  BACKWARD: 0
};

export let UPLOAD_TYPE = {
  NONE: 0,
  QINIU: 1,
  ALI: 4,
};

export let UNDISTURB_TYPE = {
  DISTURB: 1,
  UNDISTURB: 0
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
  { code: 14001, msg: '未加入聊天室', name: 'CHATROOM_NOT_JOIN' },
  { code: 14002, msg: '聊天室属性个数超限制', name: 'CHATROOM_ATTR_EXCEED_LIMIT' },
  { code: 14003, msg: '不可操作其它成员设置的聊天室属性', name: 'CHATROOM_ATTR_EXISTS' },
  { code: 14005, msg: '聊天室不存在', name: 'CHATROOM_NOT_EXISTS' },
  { code: 11100, msg: '入参pb解析失败', name: 'PB_ERROR' },

  { code: 13001, msg: '群组不存在', name: 'GROUP_NOT_EXISTS' },

  { code: 25000, msg: '参数缺失，请检查传入参数', name: 'ILLEGAL_PARAMS' },
  { code: 25001, msg: '连接已存在', name: 'CONNECTION_EXISTS' },
  { code: 25002, msg: '连接不存在', name: 'CONNECTION_NOT_READY' },
  { code: 25003, msg: '参数类型不正确', name: 'ILLEGAL_TYPE_PARAMS' },
  { code: 25004, msg: '发送超时，连接异常', name: 'COMMAND_FAILED' },
  { code: 25005, msg: '上传文件组件为空', name: 'UPLOAD_PLUGIN_ERROR' },
  { code: 25006, msg: '上传文件组件与 OSS 存储不一致', name: 'UPLOAD_PLUGIN_NOTMATCH' },
  { code: 25007, msg: '文件上传失败，请重试', name: 'UPLOADING_FILE_ERROR' },
  { code: 25008, msg: '单次合并转发消息条数上限为 20 条', name: 'TRANSFER_MESSAGE_COUNT_EXCEED' },
  { code: 25009, msg: '未建立本地数据库连接，请优先调用连接方法', name: 'DATABASE_NOT_OPENED' },
  { code: 25010, msg: 'Web SDK 方法未实现，请确定使用 PC SDK 调用', name: 'SDK_FUNC_NOT_DEFINED' },
  { code: 25011, msg: '引用消息必须传入完成的 Message 对象', name: 'SEND_REFER_MESSAGE_ERROR' },
  { code: 25012, msg: 'IM 服务连接失败，请检查当前设备网络是否可用', name: 'IM_SERVER_CONNECT_ERROR' },
  { code: 25013, msg: '参数不可为空，请检查传入参数', name: 'ILLEGAL_PARAMS_EMPTY' },
  { code: 25014, msg: 'SDK 内部正在连接，无需重复调用 connect 方法', name: 'REPREAT_CONNECTION' },

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
  MERGE: 'jg:merge',
  RECALL: 'jg:recall',
  RECALL_INFO: 'jg:recallinfo',
  READ_MSG: 'jg:readntf',
  READ_GROUP_MSG: 'jg:grpreadntf',
  MODIFY: 'jg:modify',
  CLEAR_MSG: 'jg:cleanmsg',
  CLEAR_UNREAD: 'jg:clearunread',
  COMMAND_DELETE_MSGS: 'jg:delmsgs',
  COMMAND_UNDISTURB: 'jg:undisturb',
  COMMAND_TOPCONVERS: 'jg:topconvers',
  COMMAND_REMOVE_CONVERS: 'jg:delconvers',
  COMMAND_ADD_CONVER: 'jg:addconver',
  COMMAND_CLEAR_TOTALUNREAD: 'jg:cleartotalunread',
  COMMAND_MARK_UNREAD: 'jg:markunread',
  COMMAND_LOG_REPORT: 'jg:logcmd',
  COMMAND_MSG_EXSET: 'jg:msgexset',
  
  COMMAND_CONVERSATION_TAG_ADD: 'jg:tagaddconvers',

  // 删除 TAG 下会话
  COMMAND_REMOVE_CONVERS_FROM_TAG: 'jg:tagdelconvers',
  
  // 删除 TAG 
  COMMAND_CONVERSATION_TAG_REMOVE: 'jg:delconvertags',
  
  // CLIENT_* 约定为客户端定义适用
  CLIENT_REMOVE_MSGS: 'jgc:removemsgs',
  CLIENT_REMOVE_CONVERS: 'jgc:removeconvers',
  CLIENT_RECALL_MSG: 'jgc:recallmsg',
  CLIENT_MARK_UNREAD: 'jgc:markunread',
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

export let MESSAGE_SENT_STATE = {
  NONE: 0,
  SENDING: 1,
  SUCCESS: 2,
  FAILED: 3,
  UPLOADING: 4,
}

export let DISCONNECT_TYPE = {
  DISCONNECT: 1,
  CLOSE: 2,
  ERROR: 3,
  SERVER: 4
}

export let UNREAD_TAG = {
  READ: 0,
  UNREAD: 1,
};

export let SET_SEARCH_CONTENT_TYPE = {
  APPEND: 1,
  REPLACE: 2
};

export let CONVERSATION_TAG = {
  jg_all: { id: 'jg_all', type: 1, name: '消息' },
  jg_unread: { id: 'jg_unread', type: 1, name: '未读' },
  jg_mentionme: { id: 'jg_mentionme', type: 1, name: '@我' },
  jg_private: { id: 'jg_private', type: 1, name: '单聊' },
  jg_group: { id: 'jg_group', type: 1, name: '群聊' },
};

export let CONVERATION_TAG_TYPE = {
  USER: 0,
  SYSNTEM: 1,
  GLOBAL: 2
}