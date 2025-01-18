export default function(){
  let noop = () => {};

  let requestNormal = (url, option, callback) => {
    option = option || {};
    callback = callback || { success: noop, fail: noop, progress: noop };
    let headers = option.headers || {};
    let body = option.body || {};

    let requestTask = uni.request({
      url: url,
      data: body,
      header: headers,
      success: (res) => {
        let { data } = res;
        callback.success(data, { responseURL: url });
      },
      fail: (error) => {
        callback.fail(error)
      }
    });
    return requestTask;
  };
  
  let uploadFile = () => {

  };

  return {
    requestNormal,
    uploadFile: noop
  }
}