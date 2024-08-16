import { CONVERATION_TYPE, MENTION_TYPE, UNREAD_TAG  } from '../../enum';
import utils from '../../utils';

let isGroup = (type) => {
  return utils.isEqual(CONVERATION_TYPE.GROUP, type);
}

let formatMsg = ({ message, senders, groups }) => {
  let { content = '{}', senderId, conversationType, conversationId, mentionInfo = '{}', isRead, isSender, isUpdated, referMsg = '{}', mergeMsg = '{}', attribute = '' } = message;
  content = utils.parse(content);
  mentionInfo = utils.parse(mentionInfo);
  let sender = utils.filter(senders, (user) => {
    return utils.isEqual(user.id, senderId);
  })[0] || {};
  let target = {};
  if(isGroup(conversationType)){
    target = utils.filter(groups, (group) => {
      return utils.isEqual(group.id, conversationId);
    })[0] || {};
  }else{
    target = utils.filter(senders, (user) => {
      return utils.isEqual(user.id, conversationId);
    })[0] || {};
  }
  message = utils.extend(message, { 
    mergeMsg: utils.parse(mergeMsg),
    referMsg: utils.parse(referMsg),
    conversationTitle: target.name,
    conversationPortrait: target.portrait,
    conversationExts: target.exts,
    content, 
    sender,
    mentionInfo,
    sentTime: Number(message.sentTime),
    isRead: Boolean(isRead), 
    isSender: Boolean(isSender),
    isUpdated: Boolean(isUpdated),
    attribute,
  });
  return message;
};

let formatMsgs = ({ messages, senders, groups }) => {
  let _messages = utils.map(messages, (message) => {
    let msg = formatMsg({ message, senders, groups });
    return msg;
  });
  return _messages;
};

let formatConversation = ({conversation, users, groups}) => {
  if(utils.isEmpty(conversation)){
    return conversation;
  }
  let { 
    id,
    type,
    draft,
    unreadCount,
    isTop,
    undisturbType,
    sortTime,
    mentions,
    latestMessageTid,
    latestMessageId,
    latestMessageName,
    latestMessageIsSender,
    latestMessageIsUpdated,
    latestMessageSentTime,
    latestMessageSenderId,
    latestMessageContent,
    latestMessageMessageIndex,
    latestMessageIsRead,
    latestMessageIsMass,
    latestUnreadCount,
    latestReadCount,
    latestReadIndex, 
    latestUnreadIndex,
    latestMentionInfo,
    unreadTag
  } = conversation;

  mentions = mentions || '{}';

  let sender = utils.filter(users, (user) => {
    return utils.isEqual(user.id, latestMessageSenderId);
  })[0] || { id: latestMessageSenderId};

  let target = {};
  if(isGroup(type)){
    target = utils.filter(groups, (group) => {
      return utils.isEqual(group.id, id);
    })[0] || { id };
  }else{
    target = utils.filter(users, (user) => {
      return utils.isEqual(user.id, id);
    })[0] || { id };
  }
  unreadCount = unreadCount > 0 ? unreadCount : 0;
  let _conversation = {
    conversationId: id,
    conversationType: type,
    conversationPortrait: target.portrait,
    conversationTitle: target.name,
    conversationExts: target.exts,
    draft: draft || "",
    isTop: Boolean(isTop),
    undisturbType: undisturbType,
    latestReadIndex: Number(latestReadIndex), 
    latestUnreadIndex: Number(latestUnreadIndex),
    latestMessage: {
      conversationId: id,
      conversationType: type,
      conversationPortrait: target.portrait,
      conversationTitle: target.name,
      conversationExts: target.exts,
      content: utils.parse(latestMessageContent),
      isRead: Boolean(latestMessageIsRead),
      isSender: Boolean(latestMessageIsSender),
      isUpdated: Boolean(latestMessageIsUpdated),
      isMass: Boolean(latestMessageIsMass),
      messageId: latestMessageId,
      tid: latestMessageTid,
      mentionInfo: utils.parse(latestMentionInfo),
      messageIndex: latestMessageMessageIndex,
      name: latestMessageName,
      readCount: Number(latestReadCount || 0),
      unreadCount: Number(latestUnreadCount || 0),
      sentTime: Number(latestMessageSentTime),
      referMsg: {},
      sender: sender,
    },
    sortTime: Number(sortTime) || 0,
    unreadCount: unreadCount || 0,
    mentions: utils.parse(mentions),
    unreadTag: unreadTag || UNREAD_TAG.READ,
  };
  if(utils.isEmpty(latestMessageId)){
    _conversation.latestMessage = {};
  }
  return _conversation;
};
let formatConversations = ({ conversations, users, groups }) => {
  let _converations = utils.map(conversations, (conversation) => {
    let _converation = formatConversation({ conversation, users, groups });
    return _converation;
  });
  return _converations;
};
let createMentions = (mentions, message, user) => {
  let { mentionInfo } = message;
  if(utils.isEmpty(mentionInfo)){
    return mentions;
  }
  let { members, type } = mentionInfo;
  let index = utils.find(members, (member) => {
    return utils.isEqual(user.id, member.id);
  });

  if(index > -1 || utils.isEqual(type, MENTION_TYPE.ALL)){
    let { isMentioned = true, senders = [], msgs = [] } = mentions;
    msgs.push({ senderId: message.sender.id, messageId: message.messageId, sentTime: message.sentTime });

    let senderIndex = utils.find(senders, (member) => {
      return utils.isEqual(message.sender.id, member.id);
    });
    if(utils.isEqual(senderIndex, -1)){
      senders.push(message.sender);
    }

    mentions = {
      isMentioned,
      senders,
      msgs,
      count: msgs.length
    };
  }
  return mentions;
}

export default {
  isGroup,
  formatMsg,
  formatMsgs,
  formatConversations,
  formatConversation,
  createMentions,
};