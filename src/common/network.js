import utils from "../utils";

let detect = (urls) => {
  let requests = {}, url = ''; 
  let protocol = utils.getProtocol();
  utils.forEach(urls, (url) => {
    url = `${protocol}//${url}/health`;
    let options = {};
    let xhr = utils.requestNormal(url, options, {
      success: function(){
        console.log(xhr)
      },
      fail: function(){}
    });
  });

  function abort(){

  }
};

let getNavi = (url, option) => {
  url = url.replaceAll(/http:\/\/|https:\/\/|file:\/\//g, '')

  let protocol = utils.getProtocol();
  url = `${protocol}//${url}/navigator/general`
  let { appkey, token } = option;
  return utils.request(url, {
    headers: {
      appkey, token
    }
  }).then((result) => {
    console.log(result)
  });
};
export default {
  detect,
  getNavi
}