export default  function({ data }){
  let { msgIndex, ackIndex } = data;
  return {
    pubAckMsgBody: {
      index: ackIndex,
      msgIndex,
      code: 0
    }
  };
}