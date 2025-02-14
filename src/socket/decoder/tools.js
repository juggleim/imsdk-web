import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, CONNECT_ACK_INDEX, PONG_INDEX, UPLOAD_TYPE, CONVERATION_TYPE, MESSAGE_SENT_STATE, UNDISTURB_TYPE, STORAGE } from "../../enum";
import utils from "../../utils";
import GroupCacher from "../../common/group-cacher";
import UserCacher from "../../common/user-cacher";
import common from "../../common/common";
import JTextEncoder from "../../provoider/textencoder/index";

function msgFormat(msg, { currentUser }) {
  let { msgItems, converTags, undisturbType, msgExtSet, 
        senderId, unreadIndex, memberCount, referMsg, readCount, msgId, msgTime, 
        msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, 
        isSend, msgIndex, isRead, flags, targetUserInfo, groupInfo,
        grpMemberInfo 
    } = msg;
  let content = '';
  if (msgContent && msgContent.length > 0) {
    content = JTextEncoder.decoder(msgContent);
    content = utils.parse(content);
  }

  // 服务端返回数据有 targetUserInfo 和 groupInfo 为 null 情况，此处补充 targetId，方便本地有缓存时获取信息
  targetUserInfo = targetUserInfo || { userId: senderId };
  groupInfo = groupInfo || { groupId: conversationId };

  // 默认更新内存数据
  let userId = targetUserInfo.userId;
  let groupId = groupInfo.groupId;

  GroupCacher.set(groupId, groupInfo);
  UserCacher.set(userId, targetUserInfo);

  let targetUser = common.formatUser(targetUserInfo);

  // 特性检查，如果没有 name 尝试从内存获取信息
  if (utils.isUndefined(targetUser.name)) {
    let _user = UserCacher.get(userId);
    targetUser = utils.isEmpty(_user) ? { id: userId } : _user;
  }

  if (utils.isUndefined(groupInfo.groupName)) {
    let _group = GroupCacher.get(groupId);
    groupInfo = utils.isEmpty(_group) ? { id: groupId } : _group;
  }

  if (mentionInfo) {
    let { targetUsers, mentionType } = mentionInfo;
    let members = utils.map(targetUsers, (user) => {
      user = common.formatUser(user);
      return user;
    });
    mentionInfo = { mentionType, members };
  }
  let newRefer = {};
  if (referMsg) {
    let rcontent = referMsg.msgContent || '';
    if (rcontent.length != 0) {
      rcontent = JTextEncoder.decoder(rcontent);
      newRefer.content = utils.parse(rcontent);
    }
    referMsg.targetUserInfo = common.formatUser(referMsg.targetUserInfo || {})

    utils.extend(newRefer, {
      name: referMsg.msgType,
      messageId: referMsg.messageIndex,
      messageIndex: referMsg.msgIndex,
      sentTime: referMsg.msgTime,
      sender: referMsg.targetUserInfo
    });
  }
  let msgFlag = common.formatter.toMsg(flags);
  let user = currentUser;

  let reactions = {};
  if(msgExtSet){
    msgExtSet = utils.map(msgExtSet, (item) => {
      let { key } = item;
      item.key = unescape(key);
      return item;
    });
    msgExtSet = utils.clone(msgExtSet);
    reactions = utils.groupBy(msgExtSet, ['key']);
  }
  converTags = converTags || [];
  let tags = utils.map(converTags, (item) => {
    let { tag: id, tagName: name, tagType: type } = item;
    return { id, name, type };
  });

  let groupMember = {};
  if(utils.isEqual(CONVERATION_TYPE.GROUP, conversationType)){
    groupMember = common.formatGroupMember(grpMemberInfo);
  }
  
  let _message = {
    conversationType,
    conversationId,
    conversationTitle: '',
    conversationPortrait: '',
    conversationExts: {},
    sender: utils.clone(targetUser),
    groupMember: groupMember,
    messageId: msgId,
    tid: msgId,
    sentTime: msgTime,
    name: msgType,
    isSender: utils.isEqual(user.id, senderId),
    messageIndex: msgIndex,
    mentionInfo,
    isRead: !!isRead,
    isUpdated: msgFlag.isUpdated,
    isMuted: msgFlag.isMute,
    isMass: msgFlag.isMass,
    isStreamMsg: msgFlag.isStream,
    referMsg: newRefer,
    sentState: MESSAGE_SENT_STATE.SUCCESS,
    undisturbType: undisturbType || 0,
    unreadIndex: unreadIndex || 0,
    flags,
    reactions,
    tags,
  };

  if (_message.isSender) {
    utils.extend(_message.sender, user);
  }
  let streams = [];
  if(_message.isStreamMsg){
    streams = formatStreams(msgItems);
  }
  utils.extend(_message, { streams });

  if (utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)) {
    let { groupName, groupPortrait, extFields, groupId, updatedTime } = groupInfo || {
      extFields: {}
    };

    extFields = utils.toObject(extFields);

    utils.extend(_message, {
      conversationTitle: groupName || '',
      conversationPortrait: groupPortrait || '',
      conversationExts: extFields,
      conversationUpdatedTime: groupInfo.updatedTime || 0,
      unreadCount: memberCount - readCount,
      readCount: readCount
    });
  }

  if (utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)) {
    utils.extend(_message, {
      conversationTitle: targetUser.name,
      conversationPortrait: targetUser.portrait,
      conversationExts: targetUser.exts,
      conversationUpdatedTime: targetUser.updatedTime,
      conversationUserType: targetUser.userType || 0,
    });
  }

  if (utils.isInclude([MESSAGE_TYPE.RECALL_INFO, MESSAGE_TYPE.RECALL], msgType)) {
    content = utils.rename(content, {
      msg_id: 'messageId',
      msg_time: 'sentTime',
    });
  }

  if (utils.isEqual(MESSAGE_TYPE.MODIFY, msgType)) {
    content = utils.rename(content, {
      msg_type: 'name',
      msg_content: 'content',
      msg_id: 'messageId',
      msg_seq: 'messageIndex',
      msg_time: 'sentTime'
    });
  }

  if (utils.isEqual(MESSAGE_TYPE.READ_MSG, msgType)) {
    delete content.index_scopes;
    let { msgs } = content;
    msgs = utils.map(msgs, ({ msg_id: messageId }) => {
      return { messageId };
    });
    utils.extend(content, { msgs });
  }

  if (utils.isEqual(MESSAGE_TYPE.READ_GROUP_MSG, msgType)) {
    let { msgs } = content;
    msgs = utils.map(msgs, ({ msg_id, member_count, read_count }) => {
      return {
        messageId: msg_id,
        unreadCount: member_count - read_count,
        readCount: read_count
      };
    });
    utils.extend(content, { msgs });
  }

  if (utils.isEqual(MESSAGE_TYPE.CLEAR_UNREAD, msgType)) {
    let { conversations } = content;
    conversations = utils.map(conversations, ({ channel_type, target_id, latest_read_index }) => {
      return {
        conversationType: channel_type,
        conversationId: target_id,
        unreadIndex: latest_read_index,
      };
    });
    utils.extend(content, { conversations });
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_UNDISTURB, msgType)) {
    let { conversations } = content;
    conversations = utils.map(conversations, (item) => {
      return {
        conversationId: item.target_id,
        conversationType: item.channel_type,
        undisturbType: item.undisturb_type,
      }
    });
    utils.extend(content, { conversations });
  }
  if (utils.isEqual(MESSAGE_TYPE.COMMAND_TOPCONVERS, msgType)) {
    let { conversations } = content;
    conversations = utils.map(conversations, (item) => {
      return {
        conversationId: item.target_id,
        conversationType: item.channel_type,
        isTop: Boolean(item.is_top),
      }
    });
    utils.extend(content, { conversations });
  }
  if (utils.isEqual(MESSAGE_TYPE.COMMAND_REMOVE_CONVERS, msgType)) {
    let { conversations } = content;
    conversations = utils.map(conversations, (item) => {
      return {
        conversationId: item.target_id,
        conversationType: item.channel_type,
        time: msg.msgTime
      }
    });
    utils.extend(content, { conversations });
  }
  if (utils.isEqual(MESSAGE_TYPE.COMMAND_DELETE_MSGS, msgType)) {
    let msgs = utils.map(content.msgs, (item) => {
      return {
        tid: item.msg_id,
        messageId: item.msg_id,
        conversationId: msg.targetId,
        conversationType: content.channel_type,
      };
    });
    content = {
      conversationId: msg.targetId,
      conversationType: content.channel_type,
      messages: msgs,
    }
  }
  if (utils.isEqual(MESSAGE_TYPE.CLEAR_MSG, msgType)) {
    content = {
      cleanTime: content.clean_time,
      conversationType: content.channel_type,
      conversationId: msg.targetId,
      senderId: content.sender_id,
    }
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_ADD_CONVER, msgType)) {
    let _conversation = content.conversation;
    let { target_id, channel_type, sort_time, sync_time, target_user_info = {} } = _conversation;
    let { nickname, user_portrait, ext_fields, updated_time } = target_user_info;
    content = {
      conversationId: target_id,
      conversationType: channel_type,
      conversationTitle: nickname,
      conversationPortrait: user_portrait,
      conversationExts: ext_fields,
      latestMessage: { conversationId: target_id, conversationType: channel_type },
      unreadCount: 0,
      updatedTime: updated_time,
      sortTime: sort_time,
      syncTime: sync_time
    };
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_CLEAR_TOTALUNREAD, msgType)) {
    content = {
      clearTime: content.clear_time
    };
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_CONVERSATION_TAG_ADD, msgType)) {
    let { tag, tag_name, convers } = content;
    convers = convers || [];
    convers = utils.map(convers, (item) => {
      return { conversationId: item.target_id, conversationType: item.channel_type };
    });
    content = {
      id: tag,
      name: tag_name,
      conversations: convers
    };
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_CONVERSATION_TAG_REMOVE, msgType)) {
    let { tags } = content;
    tags = utils.map(tags, (tag) => {
      return { id: tag.tag };
    });
    content = {
      tags
    };
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_REMOVE_CONVERS_FROM_TAG, msgType)) {
    let { tag: id, convers } = content;
    convers = utils.map(convers, (item) => {
      return { conversationId: item.target_id, conversationType: item.channel_type };
    });
    content = { id, conversations: convers };
  }

  if (utils.isEqual(MESSAGE_TYPE.COMMAND_MARK_UNREAD, msgType)) {
    let list = content.conversations;
    let conversations = utils.map(list, (item) => {
      let { unread_tag, channel_type, target_id } = item;
      return {
        conversationId: target_id,
        conversationType: channel_type,
        unreadTag: unread_tag
      }
    })
    content = { conversations };
  }
  if (utils.isEqual(MESSAGE_TYPE.COMMAND_MSG_EXSET, msgType)) {
    let { channel_type, msg_id, exts } = content;
    let reactions = utils.map(exts, (item) => {
      let { is_del, timestamp, key, value } = item;
      key = unescape(key);
      return { isRemove: Boolean(is_del), key, value, timestamp };
    });
    content = { conversationId, conversationType, messageId: msg_id, reactions };
  }

  utils.extend(_message, { content })
  return _message;
}

function formatConversations(conversations, options = {}) {
  return conversations.map((conversation) => {
    let { msg,
      targetId,
      unreadCount,
      sortTime: _sortTime,
      topUpdatedTime,
      targetUserInfo,
      groupInfo,
      syncTime,
      undisturbType,
      mentions,
      channelType: conversationType,
      latestReadIndex,
      latestUnreadIndex,
      isTop,
      unreadTag,
      converTags,
    } = conversation;
    if (!msg) {
      msg = { msgContent: [] };
    }
    
    let { topic, currentUser } = options;

    utils.extend(msg, { targetId });
    unreadCount = unreadCount || 0;
    unreadTag = unreadTag || 0;
    mentions = mentions || {};
    if (!utils.isEmpty(mentions)) {
      let { isMentioned, senders, mentionMsgs } = mentions;
      senders = utils.map(senders, (sender) => {
        return common.formatUser(sender);
      });
      mentionMsgs = utils.map(mentionMsgs, (msg) => {
        let { senderId, msgId, msgTime, mentionType } = msg;
        return { senderId, messageId: msgId, sentTime: msgTime, mentionType };
      });
      mentions = {
        isMentioned: isMentioned,
        senders: senders,
        msgs: mentionMsgs,
        count: mentionMsgs.length,
      };
    }
    let latestMessage = {}
    if (!utils.isEqual(msg.msgContent.length, 0)) {
      latestMessage = msgFormat(msg, { currentUser });
    }

    if (utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)) {
      groupInfo = groupInfo || { extFields: {} };
      let { groupName, groupPortrait, extFields, groupId, updatedTime } = groupInfo;
      extFields = utils.toObject(extFields);

      utils.extend(latestMessage, {
        conversationTitle: groupName || '',
        conversationPortrait: groupPortrait || '',
        conversationExts: extFields,
        conversationUpdatedTime: updatedTime || 0,
      });

      GroupCacher.set(groupId, groupInfo);
    }

    if (utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)) {
      targetUserInfo = targetUserInfo || { extFields: {} };
      let { userPortrait, nickname, extFields, userId, updatedTime, userType } = targetUserInfo;
      extFields = utils.toObject(extFields);
      utils.extend(latestMessage, {
        conversationTitle: nickname || '',
        conversationPortrait: userPortrait || '',
        conversationExts: extFields,
        conversationUpdatedTime: updatedTime || 0,
        conversationUserType: userType || 0,
      });
      UserCacher.set(userId, targetUserInfo);
    }

    let { conversationTitle, conversationPortrait, conversationExts, conversationUpdatedTime, conversationUserType } = latestMessage;

    
    if (utils.isEqual(COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS, topic)) {
      _sortTime = topUpdatedTime;
    }

    converTags = converTags || [];
    let tags = utils.map(converTags, (item) => {
      let { tag: id, tagName: name, tagType: type } = item;
      return { id, name, type };
    });
    return {
      conversationType,
      conversationId: targetId,
      unreadCount,
      sortTime: _sortTime,
      latestMessage,
      conversationTitle,
      conversationPortrait,
      conversationUpdatedTime,
      conversationUserType,
      conversationExts,
      mentions,
      syncTime,
      undisturbType: undisturbType || 0,
      latestReadIndex,
      latestUnreadIndex,
      unreadTag,
      tags,
      isTop: !!isTop,
    };
  });
}

function formatRTCRoom(result){
  let { roomId, roomType, members } = result;
  members = utils.map(members, (item) => {
    let { member, rtcState: state, cameraEnable, micEnable, callTime, connectTime, hangupTime, inviter } = item;
    member = common.formatUser(member);
    inviter = common.formatUser(inviter);
    return { member, rtcState: state, cameraEnable, micEnable, callTime, connectTime, hangupTime, inviter };
  });
  return {
    room: { id: roomId, type: roomType },
    members: members,
  };
}

function formatStreams(list){
  let streams = utils.map(list, (item) => {
    return formatStream(item);
  });
  return streams;
}
function formatStream(item){
  let { event, subSeq, partialContent } = item;
  let content = '';
  if (partialContent && partialContent.length > 0) {
    content = JTextEncoder.decoder( partialContent);
    content = utils.parse(content);
  }
  return { event, seq: subSeq, content };
}

export default { msgFormat, formatConversations, formatRTCRoom, formatStreams }