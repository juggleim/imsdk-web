import utils from "../../utils";
export default function(){
  let encoder = (str) => {
    return uni.base64ToArrayBuffer(str);
  };

  let decoder = (buffer) => {
    let str = uni.arrayBufferToBase64(buffer);
    return utils.decodeBase64(str);
  };

  return {
    encoder,
    decoder
  }
}