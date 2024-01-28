import Emitter from "../common/emmit";
import utils from "../utils";
import Proto from "./proto";
import { SIGNAL_NAME, SIGNAL_CMD, CONNECT_STATE, COMMAND_TOPICS, MESSAGE_TYPE, ErrorType, MESSAGE_FLAG, CONNECT_ACK_INDEX, PONG_INDEX, UPLOAD_TYPE, CONVERATION_TYPE } from "../enum";
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
        result = utils.extend(result, { ack: msg.ConnectAckMsgBody, index: CONNECT_ACK_INDEX });
        name = SIGNAL_NAME.S_CONNECT_ACK;
        break;
      case SIGNAL_CMD.PUBLISH_ACK:
        let { pubAckMsgBody: { index, msgId: messageId, timestamp: sentTime, code } } = msg;
        result = { messageId, sentTime, index, isSender: true, code };
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

    let { qryAckMsgBody: { index, data } } = msg;
    let { topic, targetId } = cache.get(index);

    let result = { index };
    if(utils.isInclude([COMMAND_TOPICS.HISTORY_MESSAGES, COMMAND_TOPICS.SYNC_MESSAGES, COMMAND_TOPICS.SYNC_CHATROOM_MESSAGES, COMMAND_TOPICS.GET_MSG_BY_IDS], topic)){
      result = getMessagesHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.CONVERSATIONS)){
      result = getConversationsHandler(index, data);
    }

    if(utils.isEqual(topic, COMMAND_TOPICS.GET_UNREAD_TOTLAL_CONVERSATION)){
      result = getTotalUnread(index, data);
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

  function getTotalUnread(index, data){
    let payload = Proto.lookup('codec.QryTotalUnreadCountResp');
    let { totalCount: count } = payload.decode(data);
    return {
      index, count
    };
  }
  
  function getConversationsHandler(index, data){
    let payload = Proto.lookup('codec.QryConversationsResp');
    let { conversations } = payload.decode(data);
    conversations = conversations.map((conversation) => {
      let { msg, 
            targetId, 
            unreadCount, 
            updateTime: latestReadTime, 
            userInfo, 
            groupInfo, 
            LatestMentionMsg: latestMentionMsg, 
            channelType: conversationType 
          } = conversation;
      utils.extend(msg, { targetId });
      
      if(latestMentionMsg){
        let { mentionType, senderInfo, msgId } = latestMentionMsg;
        latestMentionMsg = {
          type: mentionType,
          sender: common.formatUser(senderInfo),
          messageId: msgId
        };
      }
      let latestMessage = {  }
      if(!utils.isEqual(msg.msgContent.length, 0)){
        latestMessage = msgFormat(msg);
      }
      
      if(utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)){
        let { groupName, groupPortrait, extFields, groupId } = groupInfo;
        extFields = utils.toObject(extFields);

        utils.extend(latestMessage, { 
          conversationTitle: groupName,
          conversationPortrait: groupPortrait,
          conversationExts: extFields,
        });

        GroupCacher.set(groupId, groupInfo);
      }
  
      if(utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)){
        let { userPortrait, nickname, extFields, userId } = userInfo;
        extFields = utils.toObject(extFields);
        
        utils.extend(latestMessage, { 
          conversationTitle: nickname,
          conversationPortrait: userPortrait,
          conversationExts: extFields
        });

        GroupCacher.set(userId, userInfo);
      }

      let { conversationTitle, conversationPortrait, conversationExts } = latestMessage;

      return {
        conversationType,
        conversationId: targetId,
        unreadCount,
        latestReadTime,
        latestMessage,
        conversationTitle,
        conversationPortrait,
        conversationExts,
        latestMentionMsg
      };
    });
    return { conversations, index };
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
    let { senderId, msgId, msgTime, msgType, msgContent, type: conversationType, targetId: conversationId, mentionInfo, isSend, msgIndex, isReaded, flags, targetUserInfo, groupInfo } = msg;
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

    if(utils.isEmpty(targetUserInfo.nickname)){
      targetUserInfo = UserCacher.get(userId);
    }

    if(utils.isEmpty(targetUserInfo.groupName)){
      groupInfo = GroupCacher.get(groupId);
    }

    let targetUser = common.formatUser(targetUserInfo);

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

    let isUpdated = utils.isEqual(flags, MESSAGE_FLAG.IS_UPDATED);
    let _message = {
      conversationType,
      conversationId,
      conversationTitle: '',
      conversationPortrait: '',
      conversationExts: {},
      sender: targetUser,
      messageId: msgId, 
      sentTime: msgTime,
      name: msgType,
      isSender: !!isSend,
      messageIndex: msgIndex,
      mentionInfo,
      isReaded: !!isReaded,
      isUpdated,
    };

    if(_message.isSender){
      let user = io.getCurrentUser();
      utils.extend(_message.sender, user);
    }

    if(utils.isEqual(conversationType, CONVERATION_TYPE.GROUP)){
      let { groupName, groupPortrait, extFields } = groupInfo;
      extFields = utils.toObject(extFields);

      utils.extend(_message, { 
        conversationTitle: groupName,
        conversationPortrait: groupPortrait,
        conversationExts: extFields,
      });
    }

    if(utils.isEqual(conversationType, CONVERATION_TYPE.PRIVATE)){
      utils.extend(_message, { 
        conversationTitle: targetUser.name,
        conversationPortrait: targetUser.portrait,
        conversationExts: targetUser.exts,
      });
    }

    if(utils.isEqual(MESSAGE_TYPE.RECALL, msgType)){
      content = utils.rename(content, { 
        msg_id: 'messageId',
        msg_time: 'sentTime',
        channel_type: 'conversationType',
        sender_id: 'senderUserId',
        receiver_id: 'conversationId'
      });
    }

    if(utils.isEqual(MESSAGE_TYPE.MODIFY, msgType)){
      content = utils.rename(content, { 
        msg_content: 'content',
        msg_id: 'messageId',
        msg_index: 'messageIndex',
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

    utils.extend(_message, { content })
    return _message;
  }
  return {
    decode
  };
}