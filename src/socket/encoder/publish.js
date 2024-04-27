import common from "../../common/common";
import { CONVERATION_TYPE, COMMAND_TOPICS } from "../../enum";
import utils from "../../utils";
import Proto from "../proto";

export default function({ data, callback, index }){
  let { conversationId: targetId, conversationType, topic } = data;
  let buffer = [];

  if(utils.isInclude([COMMAND_TOPICS.SEND_GROUP, COMMAND_TOPICS.SEND_PRIVATE], topic)){
    let { name, content, mentionInfo, flag, mergeMsg, referMsg } = data;
    content  = utils.toJSON(content);
    let codec = Proto.lookup('codec.UpMsg');
    let mention = { };
    if(mentionInfo){
      let { members = [], type } = mentionInfo;
      members = utils.map(members, (member) => {
        return { userId: member.id };
      });
      utils.extend(mention, {
        mentionType: type,
        targetUsers: members
      }) 
    }

    if(referMsg){
      let { messageIndex, sentTime, messageId, sender } = referMsg;
      let referContent = utils.toJSON(referMsg.content);
      let referTarget = {
        userId: sender.id,
        nickname: sender.name,
        userPortrait: sender.portrait,
        extFields: common.toKVs(sender.exts)
      };
      referMsg = {
        msgIndex: messageIndex,
        msgTime: sentTime,
        msgId: messageId,
        msgContent: new TextEncoder().encode(referContent),
        msgType: referMsg.name,
        type: referMsg.conversationType,
        targetUserInfo: referTarget
      };
    }
    let message = codec.create({
      msgType: name,
      mentionInfo: mention,
      flags: flag,
      referMsg: referMsg,
      mergedMsgs: mergeMsg,
      msgContent: new TextEncoder().encode(content)
    });
    buffer = codec.encode(message).finish();
  }
 
  if(utils.isEqual(COMMAND_TOPICS.RECALL, topic)){
    let { messageId, sentTime } = data;
    let codec = Proto.lookup('codec.RecallMsgReq');
    let message = codec.create({
      targetId,
      channelType: conversationType,
      msgId: messageId,
      msgTime: sentTime
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.CLEAR_UNREAD, topic)){
    let { conversations, userId } = data;
    conversations = utils.isArray(conversations) ? conversations : [conversations];
    let codec = Proto.lookup('codec.ClearUnreadReq');
    let list = utils.map(conversations, ({ conversationType, conversationId, messageIndex }) => {
      return { 
        channelType: conversationType,
        targetId: conversationId,
        latestReadedMsgIndex: messageIndex
      };
    });
    let message = codec.create({
      conversations: list
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.REMOVE_CONVERSATION, topic)){
    let { conversations, userId } = data;
    conversations = utils.isArray(conversations) ? conversations : [conversations];
    let list = utils.map(conversations, ({ conversationType, conversationId }) => {
      return { 
        channelType: conversationType,
        targetId: conversationId 
      };
    });
    let codec = Proto.lookup('codec.DelConversationReq');
    let message = codec.create({
      conversations: list
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.UPDATE_MESSAGE, topic)){
    let { conversationId: targetId, conversationType: channelType, messageId: msgId, content, sentTime: msgTime } = data;
    let codec = Proto.lookup('codec.ModifyMsgReq');
    content = utils.toJSON(content);
    let message = codec.create({
      channelType,
      targetId,
      msgId,
      msgTime,
      msgContent: new TextEncoder().encode(content)
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.CLEAR_MESSAGE, topic)){
    let { conversationId: targetId, conversationType: channelType, time: cleanMsgTime } = data;
    let codec = Proto.lookup('codec.CleanHisMsgReq');
    let message = codec.create({
      channelType,
      targetId,
      cleanMsgTime,
    });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.JOIN_CHATROOM, topic)){
    let { chatroom: { id: chatId  } } = data;
    let codec = Proto.lookup('codec.ChatRoomReq');
    let message = codec.create({ chatId });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.QUIT_CHATROOM, topic)){
    let { chatroom: { id: chatId  } } = data;
    let codec = Proto.lookup('codec.ChatRoomReq');
    let message = codec.create({ chatId });
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.INSERT_CONVERSATION, topic)){
    let {  conversation, userId } = data;
    let { conversationId, conversationType } = conversation;
    let codec = Proto.lookup('codec.Conversation');
    let message = codec.create({ 
      channelType: conversationType,
      targetId: conversationId
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }
  
  if(utils.isEqual(COMMAND_TOPICS.MUTE_CONVERSATION, topic)){
    let { userId, conversations } = data;
    let items = utils.isArray(conversations) ? conversations : [conversations];
    items = utils.map(items, (item) => {
      let { conversationType, conversationId, undisturbType } = item;
      return { targetId: conversationId, channelType: conversationType, undisturbType };
    });
    let codec = Proto.lookup('codec.UndisturbConversReq');
    let message = codec.create({ 
      userId: userId,
      items: items
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }
  
  if(utils.isEqual(COMMAND_TOPICS.TOP_CONVERSATION, topic)){
    let { userId, conversations, isTop } = data;
    let items = utils.isArray(conversations) ? conversations : [conversations];
    items = utils.map(items, (item) => {
      let { conversationType, conversationId } = item;
      return { targetId: conversationId, channelType: conversationType, isTop };
    });
    let codec = Proto.lookup('codec.ConversationsReq');
    let message = codec.create({ 
      conversations: items
    });
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  if(utils.isEqual(COMMAND_TOPICS.REMOVE_MESSAGE, topic)){
    let { userId, messages } = data;
    messages = utils.isArray(messages) ? messages : [messages];
    let msgs = [], _targetId = '', channelType = CONVERATION_TYPE.PRIVATE;
    utils.forEach(messages, (message) => {
      let { conversationType, conversationId, messageIndex, sentTime, messageId } = message;
      _targetId = conversationId;
      channelType = conversationType,
      msgs.push({ msgId: messageId, msgIndex: messageIndex, msgTime: sentTime });
    });
    let codec = Proto.lookup('codec.DelHisMsgsReq');
    let message = codec.create({ 
      channelType,
      targetId: _targetId,
      msgs: msgs
    });
    
    targetId = userId;
    buffer = codec.encode(message).finish();
  }

  return {
    publishMsgBody: {
      index,
      targetId,
      topic,
      data: buffer
    }
  };
}