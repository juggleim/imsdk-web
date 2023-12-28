import { PLATFORM } from "../../enum";
export default function({ data }){
  let { appkey, token } = data;
  return {
    connectMsgBody: { appkey, token, platform: PLATFORM.WEB }
  };
}