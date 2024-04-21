import common from "../../common/common";
export default function($conversation){
  let funcs = [
    'getConversations',
    'removeConversation',
    'clearUnreadcount',
    'getTotalUnreadcount',
    'clearTotalUnreadcount',
    'setDraft',
    'getDraft',
    'removeDraft',
    'insertConversation',
    'disturbConversation',
    'undisturbConversation',
    'topConversation',
    'untopConversation',
    'getTopConversations',
  ];
  let invokes = common.formatProvider(funcs, $conversation);
  return invokes;
}