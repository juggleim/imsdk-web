import { ErrorType, FUNC_PARAM_CHECKER } from "../../enum";
import utils from "../../utils";
import jrequest from "../../provoider/request/index";
import common from "../../common/common";

export default function(io, emitter, logger) {

  let getRequestUrl = (url) => {
    let config = io.getConfig();
    let { currentDomain } = config;
    let { http: protocol } = utils.getProtocol(currentDomain);
    return `${protocol}//${currentDomain}/${url}`;
  };

  let getRequestOptions = (method, data) => {
    let user = io.getCurrentUser();
    let { token } = user;
    let config = io.getConfig();
    let { appkey } = config;
    let result = {
      method
    };
    let headers = {
      'Appkey': appkey,
      'authorization': token
    };
    if (method === 'POST') {
      headers = utils.extend(headers, {
        'Content-Type': 'application/json'
      });
      result = utils.extend(result, { data })
    }
    return result;
  };
  
  /* 
    var params = {
      content: '',
      mediaList: [fileFile, imageFile, ...]
    };
  */
  let addMoment = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, {}, FUNC_PARAM_CHECKER.ADD_MOMENT);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let { content, mediaList } = params;
      if(utils.isUndefined(params.content) && utils.isUndefined(mediaList)){
        return reject(ErrorType.MOMENT_ADD_PARAM_ERROR);
      }
      if(!utils.isString(content)){
        content = contnet.toString();
      }
      if(!utils.isArray(mediaList)){
        return reject(ErrorType.MOMENT_ADD_PARAM_MDL_ERROR);
      }
      for(let i = 0; i < mediaList.length; i++){
        let file = mediaList[i];
        if(!utils.isFile(file)){
          break;
        }
      }
      let url = getRequestUrl('jim/moments/add');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let removeMoment = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.REMOVE_MOMENT);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let url = getRequestUrl('jim/moments/del');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let getMoments = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_MOMENT_LIST);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let queryStr = utils.formatToQueryStr(params);
      let url = getRequestUrl(`jim/moments/list?${queryStr}`);
      let options = getRequestOptions('GET', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let getMoment = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_POST_INFO);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let queryStr = utils.formatToQueryStr(params);
      let url = getRequestUrl(`jim/moments/info?${queryStr}`);
      let options = getRequestOptions('GET', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };
  let addComment = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.ADD_COMMENT);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      
      let url = getRequestUrl('jim/moments/comments/add');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };
  let removeComment = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.DELETE_COMMENT);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let url = getRequestUrl('jim/moments/comments/del');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };
  let getComments = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_COMMENT_LIST);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let url = getRequestUrl('jim/moments/comments/list');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let addReaction = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.ADD_REACTION);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      
      let url = getRequestUrl('jim/moments/reactions/add');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let removeReaction = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.DELETE_REACTION);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      
      let url = getRequestUrl('jim/moments/reactions/del');
      let options = getRequestOptions('POST', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  let getReactions = (params) => {
    return utils.deferred((resolve, reject) => {
      let error = common.check(io, params, FUNC_PARAM_CHECKER.GET_REACTION_LIST);
      if (!utils.isEmpty(error)) {
        return reject(error);
      }
      let queryStr = utils.formatToQueryStr(params);
      let url = getRequestUrl(`jim/moments/reactions/list?${queryStr}`);
      let options = getRequestOptions('GET', params);
      jrequest.requestNormal(url, options, {
        success: resolve,
        fail: reject
      });
    });
  };

  return {
    addMoment,
    removeMoment,
    getMoments,
    getMoment,
    addComment,
    removeComment,
    getComments,
    addReaction,
    removeReaction,
    getReactions,
  };
}