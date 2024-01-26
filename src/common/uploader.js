import { UPLOAD_TYPE } from "../enum";
import utils from "../utils";
export default function (uploader, { type }) {
  let qiniuExec = (content, option, callbacks) => {
    let { token, domain } = option;
    let { file, name } = content;
    let key = `${utils.getUUID()}.${getSuffix(file.name)}`;
    name = name || key;
    let putExtra = {
      fname: name
    };
    let observable = uploader.upload(file, key, token, putExtra);
    let subscription = observable.subscribe({
      next: (res) => {
        let { total: { percent } } = res;
        callbacks.onprogress({ percent });
      },
      error: (error) => {
        callbacks.onerror(error);
      },
      complete: (res) => {
        let { key } = res;
        let url = `${domain}/${key}?attname=${name}`
        callbacks.oncompleted({ url });
      }
    })

    function getSuffix(name) {
      let names = name.split('.');
      return names[names.length - 1];
    }
  };
  let exec = (content, option, callbacks) => {
    if (utils.isEqual(type, UPLOAD_TYPE.QINIU)) {
      return qiniuExec(content, option, callbacks);
    }
    // ... other upload plugion
  };

  /* 视频截取首帧 */
  let capture = (file, callback, option = {}) => {
    let { scale = 0.4 } = option;
    let video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'auto';
    video.onloadeddata = function () {
      captureImage();
    };

    var captureImage = function () {
      var canvas = document.createElement("canvas");
      let height = video.videoHeight;
      let width = video.videoWidth;
      let duration = video.duration;

      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        var frame = new File([blob], 'frame.png', { type: 'image/png' });
        let args = { height, width, duration };
        callback(frame, args);
      });
    };
  };

  /* 图片压缩缩略图 */
  let compress = (file, callback, option = {}) => {
    let { scale = 0.4, fileCompressLimit = 500 } = option;
    let size = file.size / 1000;
    
    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function () {
      compressImage();
    };
    var compressImage = function () {
      var canvas = document.createElement("canvas");
      let height = img.height;
      let width = img.width;

      if(size <= fileCompressLimit){
        scale = 1;
      }
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        var thumbnail = new File([blob], 'tb.png', { type: 'image/png' });
        callback(thumbnail, { height, width });
      });
    };
  };
  return {
    exec,
    capture,
    compress
  }
}