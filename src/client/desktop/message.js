import common from "../../common/common";
export default function($message){
  let funcs = [
    'sendMessage',
    'getMessages',
    'getMessagesByIds',
    'clearMessage',
    'recallMessage',
    'readMessage',
    'getMessageReadDetails',
    'updateMessage',
    'getMentionMessages',
    'getFileToken',
    'sendFileMessage',
    'sendImageMessage',
    'sendVoiceMessage',
    'sendVideoMessage',
    'sendMergeMessage',
    'getMergeMessages',
    'searchMessages',
  ];
  let invokes = common.formatProvider(funcs, $message);
  return invokes;
}