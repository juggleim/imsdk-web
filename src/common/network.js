import utils from "../utils";
import Storage from "../common/storage";
import { STORAGE } from "../enum";
import common from "./common";

let detect = (urls, callback) => {
  let requests = [], superior = ''; 
  let { http } = utils.getProtocol();
  utils.forEach(urls, (domain) => {
    let url = `${http}//${domain}/health`;
    let options = {};
    let xhr = utils.requestNormal(url, options, {
      success: function(result, $xhr){
        if(utils.isEmpty(superior)){
          let { responseURL } = $xhr;
          superior = responseURL.replace(/(https:\/\/|http:\/\/)|(\/health)/g, '');
          callback(superior);
          abortAll();
        }
      },
      fail: function(){}
    });
    requests.push(xhr);
  });

  function abortAll(){
    utils.forEach(requests, (xhr) => {
      xhr.abort();
    });
    requests = [];
  }
};

let getNavi = (url, option) => {
  url = url.replaceAll(/http:\/\/|https:\/\/|file:\/\//g, '')
  let { http } = utils.getProtocol();
  url = `${http}//${url}/navigator/general`
  let { appkey, token } = option;
  let key = common.getNaviStorageKey(appkey, token);
  let navi = Storage.get(key);
  if(!utils.isEmpty(navi)){
    return utils.Defer.resolve(navi);
  }
  return utils.request(url, {
    headers: {
      'x-appkey': appkey,
      'x-token': token
    }
  }).then(({data}) => {
    let { data: { servers, user_id: userId  } } = data;
    let result = { servers, userId };
    Storage.set(key, result);
    return result;
  });
};
export default {
  detect,
  getNavi
}