import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, CONNECT_ACK_INDEX, PONG_INDEX, UPLOAD_TYPE, CONVERATION_TYPE, MESSAGE_SENT_STATE, UNDISTURB_TYPE, STORAGE } from "../enum";
import GroupCacher from "../common/group-cacher";
import UserCacher from "../common/user-cacher";
import common from "../common/common";

export default function Decoder(cache, io) {
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decode = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let result = {}, name = '';
    let { cmd, payload } = msg;
    let xors = cache.get(STORAGE.CRYPTO_RANDOM);
    let stream = common.decrypto(msg.payload, xors);
    let codec = null;
    switch (cmd) {
      case SIGNAL_CMD.CONNECT_ACK:
        codec = Proto.lookup('codec.ConnectAckMsgBody');
        let connectAckMsg = codec.decode(stream);
        result = utils.extend(result, { ack: connectAckMsg, index: CONNECT_ACK_INDEX, extra: connectAckMsg.ext });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        codec = Proto.lookup('codec.PublishAckMsgBody');
        let pubAckMsgBody = codec.decode(stream);
        let { index, msgId: messageId, timestamp: sentTime, code, msgIndex } = pubAckMsgBody;
        result = { messageId, sentTime, index, isSender: true, code, msgIndex };
        break;
      case SIGNAL_CMD.PUBLISH:
        let { _msg, _name } = publishHandler(stream);
        name = _name;
        result = _msg;
        break;
      case SIGNAL_CMD.QUERY_ACK:
        result = queryAckHandler(stream);
        name = SIGNAL_NAME.S_QUERY_ACK;
        break;
      case SIGNAL_CMD.PONG:
        result = { index: PONG_INDEX }
        name = SIGNAL_NAME.S_PONG;
        break;
      case SIGNAL_CMD.DISCONNECT:
        codec = Proto.lookup('codec.DisconnectMsgBody');
        let disconnectMsgBody = codec.decode(stream);
        result = utils.extend(result, { extra: disconnectMsgBody.ext, code: disconnectMsgBody.code });
        break;
    }
    return {
      cmd, result, name
    };
  };

  function publishHandler(stream) {
    let codec = Proto.lookup('codec.PublishMsgBody');
    let publishMsgBody = codec.decode(stream);
    let { targetId, data, topic, timestamp, index } = publishMsgBody;

    let _msg = {};
    let _name = SIGNAL_NAME.CMD_RECEIVED;

    // 收到 NTF 直接返回，通过 sync_msgs 同步消息
    if (utils.isEqual(topic, COMMAND_TOPICS.NTF)) {
      let payload = Proto.lookup('codec.Notify');
      let message = payload.decode(data);
      let { syncTime: receiveTime, type, chatroomId } = message;
      _msg = { topic, receiveTime, type, targetId: chatroomId };
      _name = SIGNAL_NAME.S_NTF;
    } else if (utils.isEqual(topic, COMMAND_TOPICS.MSG)) {
      let payload = Proto.lookup('codec.DownMsg');
      let message = payload.decode(data);
      _msg = msgFormat(message);
    } else if (utils.isEqual(topic, COMMAND_TOPICS.CHATROOM_USER_NTF)) {
      let payload = Proto.lookup('codec.ChrmEvent');
      let message = payload.decode(data);
      let { chatId, eventTime, eventType } = message;
      _msg = { chatroomId: chatId, time: eventTime, type: eventType };
      _name = SIGNAL_NAME.S_CHATROOM_USER_NTF;
    } else {
      console.log('unkown topic', topic);
    }
    utils.extend(_msg, { ackIndex: index });
    return { _msg, _name };
  }
  function queryAckHandler(stream) {
    let codec = Proto.lookup('codec.QueryAckMsgBody');
    let qryAckMsgBody = codec.decode(stream);
    let { index, data, code, timestamp } = qryAckMsgBody;

    let { topic, targetId } = cache.get(index);

    let result = {};
    if (utils.isInclude([COMMAND_TOPICS.HISTORY_MESSAGES, COMMAND_TOPICS.SYNC_MESSAGES, COMMAND_TOPICS.GET_MSG_BY_IDS, COMMAND_TOPICS.GET_MERGE_MSGS], topic)) {
      result = getMessagesHandler(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES)) {
      result = getChatroomMsgsHandler(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.SYNC_CHATROOM_ATTRS)) {
      result = getChatroomAttrsHandler(index, data, { targetId });
    }

    if (utils.isInclude([COMMAND_TOPICS.CONVERSATIONS, COMMAND_TOPICS.SYNC_CONVERSATIONS, COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS], topic)) {
      result = getConversationsHandler(index, data, { topic });
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_CONVERSATION)) {
      result = getConversationHandler(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION)) {
      result = getTotalUnread(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_READ_MESSAGE_DETAIL)) {
      result = getMessageReadDetails(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_MENTION_MSGS)) {
      result = getMentionMessages(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_FILE_TOKEN)) {
      result = getFileToken(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_USER_INFO)) {
      result = getUserInfo(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_ALL_DISTURB)) {
      result = getAllDisturb(index, data);
    }

    if (utils.isInclude([COMMAND_TOPICS.REMOVE_CHATROOM_ATTRIBUTES, COMMAND_TOPICS.SET_CHATROOM_ATTRIBUTES], topic)) {
      result = getChatroomSetAttrs(index, data);
    }

    if (utils.isEqual(topic, COMMAND_TOPICS.GET_FIRST_UNREAD_MSG)) {
      result = getMessage(index, data);
    }

    result = utils.extend(result, { code, timestamp, index });
    return result;
  }

  function getChatroomSetAttrs(index, data) {
    let payload = Proto.lookup('codec.ChatAttBatchResp');
    let { attResps } = payload.decode(data);
    let success = [], fail = [];
    utils.forEach(attResps, (attr) => {
      let { code = 0, key, attTime: updateTime, msgTime: messageTime } = attr;
      let _attr = { code, key, updateTime, messageTime };
      if (utils.isEqual(code, ErrorType.COMMAND_SUCCESS.code)) {
        success.push(_attr)
      } else {
        let error = common.getError(code);
        utils.extend(_attr, error);
        fail.push(_attr)
      }
    })
    return {
      index, success, fail
    }
  }
  function getMentionMessages(index, data) {
    let payload = Proto.lookup('codec.QryMentionMsgsResp');
    let { mentionMsgs, isFinished } = payload.decode(data);

    let msgs = utils.map(mentionMsgs, (msg) => {
      return msgFormat(msg);
    });

    return {
      index, msgs, isFinished
    };
  }

  function getFileToken(index, data) {
    let payload = Proto.lookup('codec.QryUploadTokenResp');
    let result = payload.decode(data);
    let { ossType } = result;
    let cred = { type: ossType };
    if (utils.isEqual(ossType, UPLOAD_TYPE.QINIU)) {
      let { qiniuCred } = result;
      utils.extend(cred, qiniuCred);
    }
    if (utils.isEqual(ossType, UPLOAD_TYPE.ALI)) {
      let { preSignResp } = result;
      utils.extend(cred, preSignResp);
    }
    return {
      index, cred
    };
  }

  function getUserInfo(index, data) {
    let payload = Proto.lookup('codec.UserInfo');
    let user = payload.decode(data);
    return {
      index, user
    };
  }

  function getAllDisturb(index, data) {
    let payload = Proto.lookup('codec.UserUndisturb');
    let params = payload.decode(data);
    let { timezone, rules = [] } = params;
    let type = params.switch ? UNDISTURB_TYPE.UNDISTURB : UNDISTURB_TYPE.DISTURB;
    let times = [];
    utils.forEach(rules, ({ start, end }) => {
      times.push({ start, end });
    });
    return { index, type, timezone, times };
  }

  function getMessageReadDetails(index, data) {
    let payload = Proto.lookup('codec.QryReadDetailResp');
    let { readCount, memberCount, readMembers, unreadMembers } = payload.decode(data);
    readMembers = utils.map(readMembers, (item) => {
      return {
        member: common.formatUser(item.member),
        readTime: item.time,
      };
    });
    unreadMembers = utils.map(unreadMembers, (item) => {
      return {
        member: common.formatUser(item.member),
        readTime: item.time,
      };
    });
    return {
      index, readCount, unreadCount: memberCount - readCount, readMembers, unreadMembers
    };
  }

  function getTotalUnread(index, data) {
    let payload = Proto.lookup('codec.QryTotalUnreadCountResp');
    let { totalCount: count } = payload.decode(data);
    return {
      index, count
    };
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
      } = conversation;
      if (!msg) {
        msg = { msgContent: [] };
      }
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
          let { senderId, msgId, msgTime } = msg;
          return { senderId, messageId: msgId, sentTime: msgTime };
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
        latestMessage = msgFormat(msg);
      }

      if (utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)) {
        let { groupName, groupPortrait, extFields, groupId, updatedTime } = groupInfo;
        extFields = utils.toObject(extFields);

        utils.extend(latestMessage, {
          conversationTitle: groupName,
          conversationPortrait: groupPortrait,
          conversationExts: extFields,
          conversationUpdatedTime: updatedTime,
        });

        GroupCacher.set(groupId, groupInfo);
      }

      if (utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)) {
        let { userPortrait, nickname, extFields, userId, updatedTime } = targetUserInfo;
        extFields = utils.toObject(extFields);

        utils.extend(latestMessage, {
          conversationTitle: nickname,
          conversationPortrait: userPortrait,
          conversationExts: extFields,
          conversationUpdatedTime: updatedTime,
        });

        GroupCacher.set(userId, targetUserInfo);
      }

      let { conversationTitle, conversationPortrait, conversationExts, conversationUpdatedTime } = latestMessage;

      let { topic } = options;
      if (utils.isEqual(COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS, topic)) {
        _sortTime = topUpdatedTime;
      }
      return {
        conversationType,
        conversationId: targetId,
        unreadCount,
        sortTime: _sortTime,
        latestMessage,
        conversationTitle,
        conversationPortrait,
        conversationUpdatedTime,
        conversationExts,
        mentions,
        syncTime,
        undisturbType: undisturbType || 0,
        latestReadIndex,
        latestUnreadIndex,
        unreadTag,
        isTop: !!isTop,
      };
    });
  }
  function getConversationHandler(index, data) {
    let payload = Proto.lookup('codec.Conversation');
    let item = payload.decode(data);
    let conversation = {};
    if (!item.msg) {
      conversation = {}
    } else {
      let conversations = formatConversations([item]);
      conversation = conversations[0] || conversation;
    }
    return { conversation, index };
  }
  function getConversationsHandler(index, data, options = {}) {
    let payload = Proto.lookup('codec.QryConversationsResp');
    let { conversations, isFinished } = payload.decode(data);
    conversations = formatConversations(conversations, options);
    return { conversations, isFinished, index };
  }
  function getChatroomAttrsHandler(index, data, { targetId }) {
    let payload = Proto.lookup('codec.SyncChatroomAttResp');
    let result = payload.decode(data);
    let { atts } = result;
    atts = utils.map(atts, (attr) => {
      let { key, value, attTime: updateTime, userId, optType: type, } = attr;
      return { key, value, updateTime, userId, type };
    });
    return { attrs: atts, chatroomId: targetId, index };
  }
  function getChatroomMsgsHandler(index, data) {
    let payload = Proto.lookup('codec.SyncChatroomMsgResp');
    let result = payload.decode(data);
    let { msgs } = result;
    let messages = utils.map(msgs, (msg) => {
      return msgFormat(msg);
    });
    return { messages, index };
  }
  function getMessage(index, data) {
    let payload = Proto.lookup('codec.DownMsg');
    let _msg = payload.decode(data);
    if (!_msg.msgId) {
      return { index, msg: {} };
    }
    let msg = msgFormat(_msg);
    return { index, msg };
  }
  function getMessagesHandler(index, data) {
    let payload = Proto.lookup('codec.DownMsgSet');
    let result = payload.decode(data);

    let { isFinished, msgs, targetUserInfo, groupInfo } = result;
    let messages = utils.map(msgs, (msg) => {

      // sync_msgs 和 getHistoryMessages 共用此方法，但 sync_msgs 的用户信息携带在消息里，历史消息在 pb 结构外侧与 msgs 同级，此处做兼容处理
      if (targetUserInfo) {
        utils.extend(msg, { targetUserInfo });
      }
      if (groupInfo) {
        utils.extend(msg, { groupInfo });
      }

      return msgFormat(msg);
    });
    return { isFinished, messages, index };
  }
  function msgFormat(msg) {
    let { undisturbType, senderId, unreadIndex, memberCount, referMsg, readCount, msgId, msgTime, msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, isSend, msgIndex, isRead, flags, targetUserInfo, groupInfo } = msg;
    let content = '';
    if (msgContent && msgContent.length > 0) {
      content = new TextDecoder().decode(msgContent);
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
      mentionInfo = {
        type: mentionType,
        members,
      };
    }
    let newRefer = {};
    if (referMsg) {
      let rcontent = referMsg.msgContent || '';
      if (rcontent.length != 0) {
        rcontent = new TextDecoder().decode(rcontent);
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
    let user = io.getCurrentUser();

    let _message = {
      conversationType,
      conversationId,
      conversationTitle: '',
      conversationPortrait: '',
      conversationExts: {},
      sender: utils.clone(targetUser),
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
      referMsg: newRefer,
      sentState: MESSAGE_SENT_STATE.SUCCESS,
      undisturbType: undisturbType || 0,
      unreadIndex: unreadIndex || 0,
      flags,
    };

    if (_message.isSender) {
      utils.extend(_message.sender, user);
    }

    if (utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)) {
      let { groupName, groupPortrait, extFields } = groupInfo || { extFields: {} };
      extFields = utils.toObject(extFields);

      utils.extend(_message, {
        conversationTitle: groupName,
        conversationPortrait: groupPortrait,
        conversationExts: extFields,
        conversationUpdatedTime: groupInfo.updatedTime,
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

    utils.extend(_message, { content })
    return _message;
  }
  return {
    decode
  };
}