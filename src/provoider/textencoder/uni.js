export default function(){
  let encoder = (str) => {
    return uni.base64ToArrayBuffer(str);
  };

  let decoder = (buffer) => {
    return uni.arrayBufferToBase64(buffer);
  };

  return {
    encoder,
    decoder
  }
}