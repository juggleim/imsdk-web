export default function({ data }){
  let { appkey, token, deviceId, platform } = data;
  return {
    connectMsgBody: { appkey, token, platform, deviceId }
  };
}