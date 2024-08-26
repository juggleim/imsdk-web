import common from "../../common/common";
import { MESSAGE_SENT_STATE, MESSAGE_ORDER } from "../../enum";
import tools from "./tools";
import utils from "../../utils";

export default function($message, { webAgent }){
  let funcs = [
    'sendMessage',
    'updateMessageAttr',
    'removeMessages',
    'sendMassMessage',
    'getMessagesByIds',
    'clearMessage',
    'recallMessage',
    'readMessage',
    'getMessageReadDetails',
    'updateMessage',
    'insertMessage',
    'getMentionMessages',
    'getFileToken',
    'sendFileMessage',
    'sendImageMessage',
    'sendVoiceMessage',
    'sendVideoMessage',
    'sendMergeMessage',
    'getMergeMessages',
    'setSearchContent',
    'getFirstUnreadMessage',
  ];
  let invokes = common.formatProvider(funcs, $message);

  invokes.getMessages = (conversation) => {
    return utils.deferred((resolve, reject) => {
      let { order = MESSAGE_ORDER.BACKWARD } = conversation;
      let params = {
        time: conversation.time || 0,
        order: order, 
        count: conversation.count || 20,
        names: conversation.names || [],
        conversationType: conversation.conversationType,
        conversationId: conversation.conversationId,
      };
      return $message.getMessages(params).then(({ messages = [], isFinished, groups, senders }) => {
        let list = utils.filter(messages, (msg) => {
          return utils.isEqual(msg.sentState, MESSAGE_SENT_STATE.SUCCESS)
        });
  
        let next = () => {
          // if(utils.isEqual(order, MESSAGE_ORDER.BACKWARD)){
          //   messages.reverse();
          // }
          let _msgs = tools.formatMsgs({ messages, senders, groups });
          resolve({ isFinished, messages: _msgs });
        };
        let isCon = utils.isContinuous(list, 'messageIndex');
        let len = messages.length;
        let isFetch = isFinished && params.count > len;
        if(isFetch || !isCon){
          // 按类型获取历史消息，不再从远端获取，方式 index 断续
          if(!utils.isEmpty(params.names)){
            return next();
          }
          return webAgent.getMessages(conversation).then((result) => {
            let newMsgs = [], existMsgs = [];
            utils.forEach(result.messages, (newMsg) => {
              let index = utils.find(messages, (msg) => {
                return utils.isEqual(msg.messageId, newMsg.messageId);
              });
              if(utils.isEqual(index, -1)){
                newMsgs.push(newMsg)
              }else{
                let eMsg = messages[index];
                existMsgs.push(eMsg);
              }
            })
            $message.insertBatchMsgs({ msgs: newMsgs });
  
            let _msgs = tools.formatMsgs({ messages: existMsgs, senders, groups });
            let list = newMsgs.concat(_msgs);
            list = utils.quickSort(list, (a, b) => {
              return a.sentTime < b.sentTime;
            });
            resolve({ isFinished: result.isFinished, messages: list });    
          }, reject);
        }
        next();
      });
    });
  };

  invokes.searchMessages = (params) => {
    return $message.searchMessages(params).then((result) => {
      let { total, list, groups, senders, isFinished } = result;
      list = utils.map(list, (item) => {
        let { matchedList, matchedCount, conversationType, conversationId } = item;
        let _msgs = tools.formatMsgs({ messages: matchedList, senders, groups });
        let params = { 
          conversation: { 
            id: conversationId, type: conversationType 
          }, 
          users: senders, 
          groups 
        };
        let _conversation = tools.formatConversation(params);
        let { conversationTitle, conversationPortrait, conversationExts } = _conversation;
        return { matchedList: _msgs, matchedCount, conversationType, conversationId, conversationTitle, conversationPortrait, conversationExts };
      });
      return { total, list, isFinished };
    });
  };
  return invokes;
}