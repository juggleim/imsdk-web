import utils from "../utils";

let detect = (urls) => {
  let requests = {}; 
  utils.forEach(urls, (url) => {
    url = `${url}/health`;
    let options = {};
    let xhr = utils.requestNormal(url, options, {
      success: function(){},
      fail: function(){}
    });
  });
};

export default {
  detect
}