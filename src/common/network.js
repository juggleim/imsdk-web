import utils from "../utils";
import Storage from "../common/storage";
import { STORAGE, ErrorType } from "../enum";
import common from "./common";

let detect = (urls, callback, option = {}) => {
  let requests = [], superior = '', errors = []; 

  utils.forEach(urls, (domain) => {
    let { http } = utils.getProtocol(domain);

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
      fail: function(error){
        errors.push(error);
        if(utils.isEqual(errors.length, urls.length)){
          callback(superior, error);
        }
      }
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

let getNavis = (urls, option, callback) => {
  let requests = [], isResponsed = false, errors = []; 
  let { appkey, token, userId } = option;

  let key = common.getNaviStorageKey(appkey, userId);
  let navi = Storage.get(key);
  if(!utils.isEmpty(navi)){
    return callback(navi);
  }

  utils.forEach(urls, (domain) => {
    let url = domain.replaceAll(/http:\/\/|https:\/\/|file:\/\//g, '')
    let { http } = utils.getProtocol(domain);
    url = `${http}//${url}/navigator/general`;
    let options = {
      headers: {
        'x-appkey': appkey,
        'x-token': token
      }
    };
    let xhr = utils.requestNormal(url, options, {
      success: function(result, $xhr){
        if(!isResponsed){
          let { responseURL } = $xhr;
          isResponsed = true;
          let { code, data = {} } = result;
          let { servers, user_id: userId } = data;
          
          // 默认规则：导航和 CMP 的协议必须一致
          let nav = { servers, userId, code };
          if(!utils.isEmpty(servers)){
            Storage.set(key, nav);
          }
          callback(nav);
          abortAll();
        }
      },
      fail: function(error){
        errors.push(error);
        if(utils.isEqual(errors.length, urls.length)){
          callback(error.result);
        }
      }
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
export default {
  detect,
  getNavis
}