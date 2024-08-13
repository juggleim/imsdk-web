export default function({ data }){
  let { appkey, token, deviceId, platform, clientSession } = data;
  return {
    connectMsgBody: { appkey, token, platform, deviceId, clientSession }
  };
}