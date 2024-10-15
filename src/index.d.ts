interface EVENT {
  STATE_CHANGED: string;
  MESSAGE_RECEIVED: string;
  MESSAGE_RECALLED: string;
  MESSAGE_UPDATED: string;
  MESSAGE_READ: string;
  MESSAGE_REMOVED: string;
  MESSAGE_CLEAN: string;
  MESSAGE_CLEAN_SOMEONE: string;
  MESSAGE_REACTION_CHANGED: string;
  TAG_ADDED: string;
  TAG_REMOVED: string;
  TAG_CHANGED: string;
  TAG_CONVERSATION_ADDED: string;
  TAG_CONVERSATION_REMOVED: string;
  CONVERSATION_SYNC_FINISHED: string;
  CONVERSATION_UNDISTURBED: string;
  CONVERSATION_TOP: string;
  CONVERSATION_CLEARUNREAD: string;
  CLEAR_TOTAL_UNREADCOUNT: string;
  CONVERSATION_CHANGED: string;
  CONVERSATION_ADDED: string;
  CONVERSATION_REMOVED: string;
  CHATROOM_ATTRIBUTE_UPDATED: string;
  CHATROOM_ATTRIBUTE_DELETED: string;
  CHATROOM_DESTROYED: string;
  CHATROOM_USER_QUIT: string;
  CHATROOM_USER_KICKED: string;
};
interface CONNECT_STATE {
  CONNECTED,
  CONNECTING,
  DISCONNECTED,
  CONNECT_FAILED,
  DB_OPENED,
  DB_CLOSED,
  RECONNECTING,
}
interface CONVERATION_TYPE {
  PRIVATE,
  GROUP,
  CHATROOM,
  SYSTEM,
}
interface MESSAGE_ORDER {
  FORWARD,
  BACKWARD,
}
interface CONVERSATION_ORDER {
  BACKWARD,
  FORWARD,
}
interface MENTION_ORDER {
  BACKWARD,
  FORWARD,
}
interface UPLOAD_TYPE {
  NONE,
  QINIU,
  ALI,
}
interface UNDISTURB_TYPE {
  DISTURB,
  UNDISTURB,
}

interface MESSAGE_TYPE {
  TEXT,
  IMAGE,
  VOICE,
  VIDEO,
  FILE,
  MERGE,
  RECALL,
  RECALL_INFO,
  READ_MSG,
  READ_GROUP_MSG,
  MODIFY,
  CLEAR_MSG,
  CLEAR_UNREAD,
  COMMAND_DELETE_MSGS,
  COMMAND_UNDISTURB,
  COMMAND_TOPCONVERS,
  COMMAND_REMOVE_CONVERS,
  COMMAND_ADD_CONVER,
  COMMAND_CLEAR_TOTALUNREAD,
  COMMAND_MARK_UNREAD,
  COMMAND_LOG_REPORT,
  COMMAND_MSG_EXSET,
  COMMAND_CONVERSATION_TAG_ADD,
  COMMAND_REMOVE_CONVERS_FROM_TAG,
  COMMAND_CONVERSATION_TAG_REMOVE,
  CLIENT_REMOVE_MSGS,
  CLIENT_REMOVE_CONVERS,
  CLIENT_RECALL_MSG,
  CLIENT_MARK_UNREAD,
}
interface MENTION_TYPE {
  ALL,
  SOMEONE,
  ALL_SOMEONE,
}
interface FILE_TYPE {
  IMAGE,
  AUDIO,
  VIDEO,
  FILE,
}
interface MESSAGE_SENT_STATE {
  NONE,
  SENDING,
  SUCCESS,
  FAILED,
  UPLOADING,
}
interface DISCONNECT_TYPE {
  DISCONNECT,
  CLOSE,
  ERROR,
  SERVER,
}
interface UNREAD_TAG {
  READ,
  UNREAD,
}
interface SET_SEARCH_CONTENT_TYPE {
  APPEND,
  REPLACE,
}
interface CONVERATION_TAG_TYPE {
  USER,
  SYSNTEM,
  GLOBAL,
}

interface Error {
  code: number,
  msg: string
}
declare class IMUser {
  id?: string;
  name?: string;
  portrait?: string;
  token?: string;
  exts?: string;
}
declare class ERROR_TYPE {
  CONNECT_SUCCESS: Error;
  CONNECT_ERROR: Error;
  CONNECT_APPKEY_IS_REQUIRE: Error;
  CONNECT_TOKEN_NOT_EXISTS: Error;
  CONNECT_APPKEY_NOT_EXISTS: Error;
  CONNECT_TOKEN_ILLEGAL: Error;
  CONNECT_TOKEN_UNAUTHORIZED: Error;
  CONNECT_TOKEN_EXPIRE: Error;
  CONNECT_REDIRECT: Error;
  CONNECT_UNSUPPORT_PLATFORM: Error;
  CONNECT_APP_BLOCKED: Error;
  CONNECT_USER_BLOCKED: Error;
  CONNECT_USER_KICKED: Error;
  CONNECT_USER_LOGOUT: Error;
  CHATROOM_NOT_JOIN: Error;
  CHATROOM_ATTR_EXCEED_LIMIT: Error;
  CHATROOM_ATTR_EXISTS: Error;
  CHATROOM_NOT_EXISTS: Error;
  PB_ERROR: Error;
  GROUP_NOT_EXISTS: Error;
  ILLEGAL_PARAMS: Error;
  CONNECTION_EXISTS: Error;
  CONNECTION_NOT_READY: Error;
  ILLEGAL_TYPE_PARAMS: Error;
  COMMAND_FAILED: Error;
  UPLOAD_PLUGIN_ERROR: Error;
  UPLOAD_PLUGIN_NOTMATCH: Error;
  UPLOADING_FILE_ERROR: Error;
  TRANSFER_MESSAGE_COUNT_EXCEED: Error;
  DATABASE_NOT_OPENED: Error;
  SDK_FUNC_NOT_DEFINED: Error;
  SEND_REFER_MESSAGE_ERROR: Error;
  IM_SERVER_CONNECT_ERROR: Error;
  ILLEGAL_PARAMS_EMPTY: Error;
  REPREAT_CONNECTION: Error;
  MESSAGE_RECALL_SUCCESS: Error;
  COMMAND_SUCCESS: Error;
  CONNECT_SIGNAL_UNSUPPORT: Error;
  COMMAND_OVER_FREQUENCY: Error;
  CONNECT_USER_NOT_EXISTS: Error;
  PARAMS_TIMEZONE_ILLEGAL: Error;
  PARAMS_MESSAGE_ILLEGAL: Error;
  REJECTED_BY_BLACKLIST: Error;
  KV_DUPLICATION: Error;
  MESSAGE_SENSITIVE_WORDS: Error;
  GROUP_NOT_GROUP_MEMBER: Error;
  GROUP_BANNED: Error;
  GROUP_MEMBER_BANNED: Error;
  GROUP_MEMBER_OVERFLOW: Error;
  CHATROOM_KV_NOT_EXISTS: Error;
  CHATROOM_DESTROY: Error;
  CHATROOM_MEMBER_BANNED: Error;
  CHATROOM_MEMBER_BLOCKED: Error;
}
declare class Message {
  conversationId: string;
  conversationType: CONVERATION_TYPE;
  conversationTitle?: string;
  conversationPortrait?: string;
  conversationExts?: string;
  tid?: string;
  messageId?: string;
  name: string;
  content: Object;
  sentState?: number;
  sentTime?: number;
  sender?: IMUser;
  attribute?: string;
  referMsg?: Message;
  isMass?: boolean;
  isUpdated?: boolean;
  isSender?: boolean;
  isRead?: boolean;
  readCount?: number;
  unreadCount?: number;
  reactions?: any;
}
declare class Conversation {
  conversationId: string;
  conversationType: number;
  conversationTitle?: string;
  conversationPortrait?: string;
  conversationExts?: string;
  latestMessage?: Message;
  draft?: string;
  isTop?: boolean;
  latestReadIndex?: number;
  latestUnreadIndex?: number;
  undisturbType?: number;
  sortTime?: number;
  unreadCount?: number;
  unreadTag?: number;
}
declare class ChatroomAttribute {
  key: string;
  value: string;
  isForce: boolean;
  isDel: boolean;
}

declare class Chatroom {
  id: string;
  attributes?: ChatroomAttribute[];
}

interface GetConversationOptions {
  order?: number;
  count?: number;
  time?: number;
}
interface TotalUnreadResult{
  total: number;
}
interface GetTotalOptions{
  conversationTypes?: CONVERATION_TYPE[];
  ignoreConversations?: Conversation[];
}
declare class TimeZone{
  start: string;
  end: string;
}
declare class DisturbInfo {
  type: UNDISTURB_TYPE,
  timezone: string,
  times: TimeZone[];
}
declare class TagInfo {
  id: string;
  name?: string;
  conversations?: Conversation[]
}
interface SendMsgCallbacks{
  onbefore?(message: Message): any;
  onerror?(error: Error): any;
  onprogress?({ percent?: number, message: Message, count?: number, total?: number  }):any;
  oncompleted?({ messages: Message[] }): any;
}
interface GetMsgByIdOptions{
  conversationType: CONVERATION_TYPE,
  conversationId: string;
  messageIds: string[];
}
interface ClearMsgsOptions{
  conversationType: CONVERATION_TYPE,
  conversationId: string;
  time: number;
}
interface ReadMember{
  readTime: number;
  member: IMUser;
}
interface GetGroupMessageDetailResult{
  readCount: number;
  unreadCount: number;
  unreadMembers: ReadMember[];
  readMembers: ReadMember[];
}
interface GetMentionOptions{
  conversationType: CONVERATION_TYPE,
  conversationId: string;
  messageIndex: number;
  count?: number;
  order?: number;
}
interface SendMergeOptions{
  conversationType: CONVERATION_TYPE,
  conversationId: string;
  messageIdList: string[];
  previewList: Array;
  title: string;
}
interface SearchOptions{
  conversationType?: CONVERATION_TYPE,
  conversationId?: string;
  keywords: string[];
  senderIds?: string[];
  messageNames?: string[];
  startTime?: number;
  endTime?: number;
  page?: number;
  pageSize?: number;
}
interface SearchMatchMsg{
  conversationType: CONVERATION_TYPE;
  conversationId: string;
  conversationExts: string;
  conversationPortrait: string;
  conversationTitle: string;
  matchedCount: number;
  matchedList: Message[];
}
interface SearchResult{
  isFinished: boolean;
  total: number;
  list: SearchMatchMsg[];
}
interface ReactionOptions{
  conversationType: CONVERATION_TYPE;
  conversationId: string;
  messageId: string;
  reactionId: string;
}
declare class IMProvider {
  connect: (user: IMUser) => Promise<>;
  disconnect: () => Promise<any>;
  getDevice: () => Promise<any>;
  isConnected: () => boolean;
  getCurrentUser: () => IMUser;
  joinChatroom: (chatroom: Chatroom) => Promise<any>;
  quitChatroom: (chatroom: Chatroom) => Promise<any>;
  setChatroomAttributes: (chatroom: Chatroom) => Promise<any>;
  getChatroomAttributes: (chatroom: Chatroom) => Promise<Chatroom>;
  removeChatroomAttributes: (chatroom: Chatroom) => Promise<any>;
  getAllChatRoomAttributes: (chatroom: Chatroom) => Promise<Chatroom>;
  getConversations: (options?: GetConversationOptions) => Promise<{ conversations: Conversation[], isFinished: boolean }>;
  removeConversation: (conversations: Conversation[]) => Promise<any>;
  insertConversation: (conversation: Conversation) => Promise<any>;
  getConversation: (conversation: Conversation) => Promise<Conversation>;
  markUnread: (conversation: Conversation) => Promise<any>;
  disturbConversation: (conversation: Conversation | Conversation[]) => Promise<any>;
  setTopConversation: (conversation: Conversation | Conversation[]) => Promise<any>;
  getTopConversations: () => Promise<{ conversations: Conversation[] }>;
  clearUnreadcount: (conversation: Conversation | Conversation[]) => Promise<any>;
  getTotalUnreadcount: (options?: GetTotalOptions) => Promise<TotalUnreadResult>;
  clearTotalUnreadcount: () => Promise<any>;
  setDraft: (conversation: Conversation) => Promise<any>;
  getDraft: (conversation: Conversation) => Promise<string>;
  removeDraft: (conversation: Conversation) => Promise<any>;
  setAllDisturb: (options: DisturbInfo) => Promise<any>;
  getAllDisturb: () => Promise<DisturbInfo>;
  createConversationTag: (tag: TagInfo) => Promise<any>;
  destroyConversationTag: (tag: TagInfo) => Promise<any>;
  getConversationTags: () => Promise<{ tags: TagInfo[] }>;
  addConversationsToTag: (tag: TagInfo) => Promise<any>;
  removeConversationsFromTag: (tag: TagInfo) => Promise<any>;
  sendMessage: (message: Message, callbacks?: SendMsgCallbacks) => Promise<Message>;
  sendMassMessage: (messages: Message[], callbacks?: SendMsgCallbacks) => Promise<any>;
  getMessages: (conversation: Conversation) => Promise<{ isFinished: boolean, messages: Message[] }>;
  removeMessages: (messages: Messages[]) => Promise<any>;
  getMessagesByIds: (options: GetMsgByIdOptions) => Promise<{ messages: Message[] }>;
  clearMessage: (options: ClearMsgsOptions) => Promise<any>;
  recallMessage: (message: Message) => Promise<any>;
  readMessage: (messages: Message[]) => Promise<any>;
  getMessageReadDetails: (message: Message) => Promise<GetGroupMessageDetailResult>;
  updateMessage: (message: Message) => Promise<any>;
  insertMessage: (message: Message) => Promise<any>;
  updateMessageAttr: (message: Message) => Promise<any>;
  setSearchContent: (message: Message) => Promise<any>;
  getMentionMessages: (options: GetMentionOptions) => Promise<{ isFinished: boolean, messages: Message[] }>;
  getFileToken: (params: any) => Promise<any>;
  sendFileMessage: (message: Message, callbacks?: SendMsgCallbacks) => Promise<Message>;
  sendImageMessage: (message: Message, callbacks?: SendMsgCallbacks) => Promise<Message>;
  sendVoiceMessage: (message: Message, callbacks?: SendMsgCallbacks) => Promise<Message>;
  sendVideoMessage: (message: Message, callbacks?: SendMsgCallbacks) => Promise<Message>;
  sendMergeMessage: (options: SendMergeOptions, callbacks?: SendMsgCallbacks) => Promise<Message>;
  getMergeMessages: (message: Message) => Promise<{ isFinished: boolean, messages: Message[] }>;
  getFirstUnreadMessage: (conversation: Conversation) => Promise<{ message: Message }>;
  searchMessages: (options: SearchOptions) => Promise<SearchResult>;
  addMessageReaction: (message: ReactionOptions) => Promise<any>;
  removeMessageReaction: (message: ReactionOptions) => Promise<any>;
  Event: EVENT;
  ConnectionState: CONNECT_STATE;
  ConversationType: CONVERATION_TYPE;
  MessageType: MESSAGE_TYPE;
  ConversationOrder: CONVERSATION_ORDER;
  MentionType: MENTION_TYPE;
  MessageOrder: MESSAGE_ORDER;
  MentionOrder: MENTION_ORDER;
  FileType: FILE_TYPE;
  UndisturbType: UNDISTURB_TYPE;
  SentState: MESSAGE_SENT_STATE;
  UnreadTag: UNREAD_TAG;
  ConversationTagType: CONVERATION_TAG_TYPE;
  ErrorType: ERROR_TYPE;
  Message: Message;
  InitOptions: InitOptions;
  IMProvider: IMProvider;
}

interface InitOptions {
  appkey: string;
  navList?: Array;
  isSync?: boolean;
  upload?: Object;
}

declare namespace IMCore {
  export function init(options: InitOptions): IMProvider;
  export let Event: EVENT;
  export let ConnectionState: CONNECT_STATE;
  export let ConversationType: CONVERATION_TYPE;
  export let MessageType: MESSAGE_TYPE;
  export let ConversationOrder: CONVERSATION_ORDER;
  export let MentionType: MENTION_TYPE;
  export let MessageOrder: MESSAGE_ORDER;
  export let MentionOrder: MENTION_ORDER;
  export let FileType: FILE_TYPE;
  export let UndisturbType: UNDISTURB_TYPE;
  export let SentState: MESSAGE_SENT_STATE;
  export let UnreadTag: UNREAD_TAG;
  export let ConversationTagType: CONVERATION_TAG_TYPE;
  export let ErrorType: ERROR_TYPE;
  export let Message: Message;
  export let InitOptions: InitOptions;
  export let IMProvider: IMProvider;
}

export default { ...IMCore };