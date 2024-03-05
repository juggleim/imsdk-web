export default function($chatroom){
  let joinChatroom = (chatroom) =>{
    return $chatroom.joinChatroom(chatroom);
  };
  let quitChatroom = (chatroom) => {
    return $chatroom.quitChatroom(chatroom);
  };
  return {
    joinChatroom,
    quitChatroom
  }
}