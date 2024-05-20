import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, CONNECT_ACK_INDEX, PONG_INDEX, UPLOAD_TYPE, CONVERATION_TYPE, MESSAGE_SENT_STATE } from "../enum";
import GroupCacher from "../common/group-cacher";
import UserCacher from "../common/user-cacher";
import common from "../common/common";

export default function Decoder(cache, io){
  let imsocket = Proto.lookup('codec.ImWebsocketMsg');
  let decode = (buffer) => {
    let msg = imsocket.decode(new Uint8Array(buffer));
    let result = {}, name = '';
    let { cmd } = msg;
    switch(cmd){
      case SIGNAL_CMD.CONNECT_ACK:
        result = utils.extend(result, { ack: msg.ConnectAckMsgBody, index: CONNECT_ACK_INDEX, ext: msg.ext });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime, code, msgIndex } } = msg;
        result = { messageId, sentTime, index, isSender: true, code, msgIndex };
        break;
      case SIGNAL_CMD.PUBLISH:
        let {_msg, _name } = publishHandler(msg);
        name = _name;
        result = _msg;
        break;
      case SIGNAL_CMD.QUERY_ACK:
        result = queryAckHandler(msg);
        name = SIGNAL_NAME.S_QUERY_ACK;
        break;
      case SIGNAL_CMD.PONG:
        result = { index: PONG_INDEX }
        name = SIGNAL_NAME.S_PONG;
        break;
      case SIGNAL_CMD.DISCONNECT:
        result = utils.extend(result, { ext: msg.ext, cdoe: msg.code });
        break;
    }
    return {
      cmd, result, name
    };
  };
 
  function publishHandler(msg){
    let {  publishMsgBody: { targetId, data, topic, timestamp, index } } = msg;
    let _msg = {};
    let _name = SIGNAL_NAME.CMD_RECEIVED;

    // 收到 NTF 直接返回，通过 sync_msgs 同步消息
    if(utils.isEqual(topic, COMMAND_TOPICS.NTF)){
      let payload = Proto.lookup('codec.Notify');
      let message = payload.decode(data);
      let { syncTime: receiveTime, type, chatroomId } = message;
      _msg = { topic, receiveTime, type, targetId: chatroomId};
      _name = SIGNAL_NAME.S_NTF;
    }else {
      let payload = Proto.lookup('codec.DownMsg');
      let message = payload.decode(data);
      _msg = msgFormat(message);
    }
    utils.extend(_msg, { ackIndex: index });
    return { _msg, _name };
  }
  function queryAckHandler(msg){

    let { qryAckMsgBody: { index, data, code, timestamp } } = msg;
    let { topic, targetId } = cache.get(index);

    let result = { index, code, timestamp };
    if(utils.isInclude([COMMAND_TOPICS.HISTORY_MESSAGES, COMMAND_TOPICS.SYNC_MESSAGES, COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES, COMMAND_TOPICS.GET_MSG_BY_IDS, COMMAND_TOPICS.GET_MERGE_MSGS], topic)){
      result = getMessagesHandler(index, data);
    }

    if(utils.isInclude([COMMAND_TOPICS.CONVERSATIONS, COMMAND_TOPICS.SYNC_CONVERSATIONS, COMMAND_TOPICS.QUERY_TOP_CONVERSATIONS], topic)){
      result = getConversationsHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION)){
      result = getTotalUnread(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_READ_MESSAGE_DETAIL)){
      result = getMessageReadDetails(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_MENTION_MSGS)){
      result = getMentionMessages(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_FILE_TOKEN)){
      result = getFileToken(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_USER_INFO)){
      result = getUserInfo(index, data);
    }
    return result;
  }

  function getMentionMessages(index, data){
    let payload = Proto.lookup('codec.QryMentionMsgsResp');
    let { mentionMsgs, isFinished } = payload.decode(data);
    let msgs = utils.map(mentionMsgs, (msg) => {
      let { mentionType, senderId: senderUserId, msgId: messageId, msgTime: sentTime, msgIndex: messageIndex } = msg;
      return { mentionType, senderUserId, messageId, sentTime, messageIndex };
    });
    return {
      index, msgs, isFinished
    };
  }

  function getFileToken(index, data){
    let payload = Proto.lookup('codec.QryUploadTokenResp');
    let result = payload.decode(data);
    let { ossType } = result;
    let cred = { type: ossType };
    if(utils.isEqual(ossType, UPLOAD_TYPE.QINIU)){
      let { qiniuCred } = result;
      utils.extend(cred, qiniuCred);
    }
    return {
      index, cred
    };
  }

  function getUserInfo(index, data){
    let payload = Proto.lookup('codec.UserInfo');
    let user = payload.decode(data);
    return {
      index, user
    };
  }

  function getMessageReadDetails(index, data){
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

  function getTotalUnread(index, data){
    let payload = Proto.lookup('codec.QryTotalUnreadCountResp');
    let { totalCount: count } = payload.decode(data);
    return {
      index, count
    };
  }
  
  function getConversationsHandler(index, data){
    let payload = Proto.lookup('codec.QryConversationsResp');
    let { conversations, isFinished } = payload.decode(data);
    conversations = conversations.map((conversation) => {
      let { msg, 
            targetId, 
            unreadCount, 
            sortTime: _sortTime, 
            targetUserInfo, 
            groupInfo, 
            syncTime,
            undisturbType,
            mentions, 
            channelType: conversationType,
            latestReadIndex,
            latestUnreadIndex 
          } = conversation;
      utils.extend(msg, { targetId });
      unreadCount = unreadCount || 0;

      mentions = mentions || {};
      if(!utils.isEmpty(mentions)){
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
      let latestMessage = { }
      if(!utils.isEqual(msg.msgContent.length, 0)){
        latestMessage = msgFormat(msg);
      }
      
      if(utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)){
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
  
      if(utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)){
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

      let { conversationTitle, conversationPortrait, conversationExts } = latestMessage;

      return {
        conversationType,
        conversationId: targetId,
        unreadCount,
        sortTime: _sortTime,
        latestMessage,
        conversationTitle,
        conversationPortrait,
        conversationExts,
        mentions,
        syncTime,
        undisturbType: undisturbType || 0,
        latestReadIndex,
        latestUnreadIndex,
      };
    });
    return { conversations, isFinished, index };
  }
  function getMessagesHandler(index, data){
    let payload = Proto.lookup('codec.DownMsgSet');
    let result = payload.decode(data);
    
    let { isFinished, msgs, targetUserInfo, groupInfo } = result;
    let messages = utils.map(msgs, (msg) => {
      
      // sync_msgs 和 getHistoryMessages 共用此方法，但 sync_msgs 的用户信息携带在消息里，历史消息在 pb 结构外侧与 msgs 同级，此处做兼容处理
      if(targetUserInfo){
        utils.extend(msg, { targetUserInfo });
      }
      if(groupInfo){
        utils.extend(msg, { groupInfo });
      }
      
      return msgFormat(msg);
    });
    return { isFinished, messages, index };
  }
  function msgFormat(msg){
    let { undisturbType, senderId, unreadIndex, memberCount, referMsg, readCount, msgId, msgTime, msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, isSend, msgIndex, isRead, flags, targetUserInfo, groupInfo } = msg;
    let content = new TextDecoder().decode(msgContent);
    content = utils.parse(content);

    // 出现非法 JSON，强制转成对象
    if(utils.isString(content)){
      content = { content };
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
    if(utils.isUndefined(targetUser.name)){
      let _user = UserCacher.get(userId);
      targetUser = utils.isEmpty(_user) ? { id: userId } : _user;
    }

    if(utils.isUndefined(groupInfo.groupName)){
      let _group = GroupCacher.get(groupId);
      groupInfo = utils.isEmpty(_group) ? { id: groupId } : _group;
    }

    if(mentionInfo){
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
    if(referMsg){
      let rcontent = referMsg.msgContent || '';
      if(rcontent.length != 0){
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
      isSender: !!isSend,
      messageIndex: msgIndex,
      mentionInfo,
      isRead: !!isRead,
      isUpdated: msgFlag.isUpdated,
      isMuted: msgFlag.isMute,
      referMsg: newRefer,
      sentState: MESSAGE_SENT_STATE.SUCCESS,
      undisturbType:  undisturbType || 0,
      unreadIndex: unreadIndex || 0,
    };

    if(_message.isSender){
      let user = io.getCurrentUser();
      utils.extend(_message.sender, user);
    }

    if(utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)){
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

    if(utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)){
      utils.extend(_message, { 
        conversationTitle: targetUser.name,
        conversationPortrait: targetUser.portrait,
        conversationExts: targetUser.exts,
        conversationUpdatedTime: targetUser.updatedTime,
      });
    }

    if(utils.isInclude([MESSAGE_TYPE.RECALL_INFO, MESSAGE_TYPE.RECALL], msgType)){
      content = utils.rename(content, { 
        msg_id: 'messageId',
        msg_time: 'sentTime',
      });
    }

    if(utils.isEqual(MESSAGE_TYPE.MODIFY, msgType)){
      content = utils.rename(content, { 
        msg_type: 'name',
        msg_content: 'content',
        msg_id: 'messageId',
        msg_seq: 'messageIndex',
        msg_time: 'sentTime'
      });
    }

    if(utils.isEqual(MESSAGE_TYPE.READ_MSG, msgType)){
      delete content.index_scopes;
      let { msgs } = content;
      msgs = utils.map(msgs, ({ msg_id: messageId }) => {
        return { messageId };
      });
      utils.extend(content, { msgs });
    }

    if(utils.isEqual(MESSAGE_TYPE.READ_GROUP_MSG, msgType)){
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

    if(utils.isEqual(MESSAGE_TYPE.CLEAR_UNREAD, msgType)){
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

    if(utils.isEqual(MESSAGE_TYPE.COMMAND_UNDISTURB, msgType)){
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
    if(utils.isEqual(MESSAGE_TYPE.COMMAND_TOPCONVERS, msgType)){
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
    if(utils.isEqual(MESSAGE_TYPE.COMMAND_REMOVE_CONVERS, msgType)){
      let { conversations } = content;
      conversations = utils.map(conversations, (item) => {
        return {
          conversationId: item.target_id,
          conversationType: item.channel_type
        }
      });
      utils.extend(content, { conversations });
    }
    if(utils.isEqual(MESSAGE_TYPE.COMMAND_DELETE_MSGS, msgType)){
      let msgs = utils.map(content.msgs, (item) => {
        return { 
          tid: item.msg_id,
          messageId: item.msg_id,
          conversationId: content.target_id,
          conversationType: content.channel_type,
         };
      });
      content = { 
        conversationId: content.target_id,
        conversationType: content.channel_type,
        messages: msgs,
      }
    }

    utils.extend(_message, { content })
    return _message;
  }
  return {
    decode
  };
}