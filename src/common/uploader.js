import { UPLOAD_TYPE } from "../enum";
import utils from "../utils";
export default function (uploader, { type }) {
  let qiniuExec = (content, option, callbacks) => {
    let { token, domain } = option;
    let { file, name } = content;
    let key = `${utils.getUUID()}.${getSuffix(file.name)}`;
    let putExtra = {
      fname: name
    };
    let observable = qiniu.upload(file, key, token, putExtra);
    let subscription = observable.subscribe({
      next: (res) => {
        let { total: { percent } } = res;
        callbacks.onprogress({ percent });
      },
      error: (err) => {
        console.log('err', err);
      },
      complete: (res) => {
        let { key } = res;
        let url = `${domain}/${key}?attname=${name}`
        callbacks.oncompleted({ url });
      }
    })

    function getSuffix(name){
      let names = name.split('.');
      return names[names.length - 1];
    }
  };
  let exec = (content, option, callbacks) => {
    if(utils.isEqual(type, UPLOAD_TYPE.QINIU)){
     return qiniuExec(content, option, callbacks);
    }
    // ... other upload plugion
  };
  return {
    exec
  }
}