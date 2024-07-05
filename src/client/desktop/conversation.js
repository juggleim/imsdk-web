import common from "../../common/common";
import tools from "./tools";
import utils from "../../utils";

export default function($conversation, { conversationUtils, webAgent }){
  let funcs = [
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

  invokes.getConversations = (params) => {
    return $conversation.getConversations(params).then(({ conversations, groups, users, isFinished }) => {
      let _conversations = tools.formatConversations({ conversations, users, groups });
      // 不指定会话类型时向内存中插入数据
      if(utils.isUndefined(params.conversationType)){
        conversationUtils.add(_conversations);
      }
      return { isFinished, conversations: utils.clone(_conversations)};
    });
  };

  return invokes;
}