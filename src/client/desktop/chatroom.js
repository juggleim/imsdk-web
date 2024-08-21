import { SIGNAL_NAME, EVENT } from "../../enum";
import utils from "../../utils";
import AttrCacher from "../../common/attr-cacher";

export default function($chatroom, { io, emitter }){
  let attrCaher = AttrCacher();

  io.on(SIGNAL_NAME.CMD_CHATROOM_ATTR_RECEIVED, (result) => {
    let { dels, updates } = attrCaher.heap(result);
    let { chatroomId } = result;
    if(!utils.isEmpty(dels)){
      emitter.emit(EVENT.CHATROOM_ATTRIBUTE_DELETED, { id: chatroomId, attributes: dels });
    }
    if(!utils.isEmpty(updates)){
      emitter.emit(EVENT.CHATROOM_ATTRIBUTE_UPDATED, { id: chatroomId, attributes: updates });
    }
  });

  let joinChatroom = (chatroom) =>{
    return $chatroom.joinChatroom(chatroom);
  };
  let quitChatroom = (chatroom) => {
    return $chatroom.quitChatroom(chatroom);
  };

  let setChatroomAttributes = (chatroom) => {
    return $chatroom.setChatroomAttributes(chatroom)
  };

  let getChatroomAttributes = (chatroom) => {
    return $chatroom.getChatroomAttributes(chatroom)
  };

  let removeChatroomAttributes = (chatroom) => {
    return $chatroom.removeChatroomAttributes(chatroom)
  };

  let getAllChatRoomAttributes = (chatroom) => {
    return $chatroom.getAllChatRoomAttributes(chatroom)
  };

  return {
    joinChatroom,
    quitChatroom,
    setChatroomAttributes,
    getChatroomAttributes,
    removeChatroomAttributes,
    getAllChatRoomAttributes,
  }
}