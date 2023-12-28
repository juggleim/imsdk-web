export default  function({ data }){
  let { msgIndex } = data;
  return {
    pubAckMsgBody: {
      index: msgIndex,
      code: 0
    }
  };
}