import common from "../../common/common";
import { CONVERATION_TYPE, COMMAND_TOPICS } from "../../enum";
import utils from "../../utils";
import Proto from "../proto";

export default function({ data, callback, index }){
  let { conversationId: targetId, conversationType, topic } = data;
  let buffer = [];

  if(utils.isInclude([COMMAND_TOPICS.SEND_GROUP, COMMAND_TOPICS.SEND_PRIVATE, COMMAND_TOPICS.SEND_CHATROOM], topic)){
    let { name, content, mentionInfo, flag, mergeMsg, referMsg } = data;
    content  = utils.toJSON(content);
    let codec = Proto.lookup('codec.UpMsg');
    let mention = { };
    if(mentionInfo){
      let { members = [], mentionType } = mentionInfo;
      members = utils.map(members, (member) => {
        return { userId: member.id };
      });
      utils.extend(mention, {
        mentionType: mentionType,
        targetUsers: members
      }) 
    }

    if(!utils.isEmpty(referMsg)){
      let { messageIndex, sentTime, messageId, sender = { exts: {} } } = referMsg;
      let referContent = utils.toJSON(referMsg.content);
      // let referTarget = {
      //   userId: sender.id,
      //   nickname: sender.name,
      //   userPortrait: sender.portrait,
      //   extFields: common.toKVs(sender.exts)
      // };
      referMsg = {
        msgIndex: messageIndex,
        msgTime: sentTime,
        msgId: messageId,
        msgContent: new TextEncoder().encode(referContent),
        msgType: referMsg.name,
        type: referMsg.conversationType,
        senderId: sender.id
        // targetUserInfo: referTarget
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

  let codec = Proto.lookup('codec.PublishMsgBody');
  let message = codec.create({ index, targetId, topic, data: buffer });
  let _buffer = codec.encode(message).finish();
  return { buffer: _buffer };
}