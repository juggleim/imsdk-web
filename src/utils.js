const noop = () => { };
const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};
const isArray = (arr) => {
  return Object.prototype.toString.call(arr) === '[object Array]';
};
const isFunction = (arr) => {
  return Object.prototype.toString.call(arr) === '[object Function]';
};
const isString = (str) => {
  return Object.prototype.toString.call(str) === '[object String]';
};
const isBoolean = (str) => {
  return Object.prototype.toString.call(str) === '[object Boolean]';
};
const isUndefined = (str) => {
  return Object.prototype.toString.call(str) === '[object Undefined]';
};
const isNull = (str) => {
  return Object.prototype.toString.call(str) === '[object Null]';
};
const isNumber = (str) => {
  return Object.prototype.toString.call(str) === '[object Number]';
};
const stringify = (obj) => {
  return JSON.stringify(obj);
};
const parse = (str) => {
  let obj = {};
  try{
    obj = JSON.parse(str); 
  }catch(e){
    obj = str;
  }
  return obj;
};
const forEach = (obj, callback) => {
  callback = callback || noop;
  let loopObj = () => {
    for (var key in obj) {
      callback(obj[key], key, obj);
    }
  };
  var loopArr = () => {
    for (var i = 0, len = obj.length; i < len; i++) {
      callback(obj[i], i, obj);
    }
  };
  if (isObject(obj)) {
    loopObj();
  }
  if (isArray(obj)) {
    loopArr();
  }
};
const isEmpty = (obj) => {
  let result = true;
  if (isObject(obj)) {
    forEach(obj, () => {
      result = false;
    });
  }
  if (isString(obj) || isArray(obj)) {
    result = obj.length === 0;
  }
  if (isNumber(obj)) {
    result = obj === 0;
  }
  return result;
};
const rename = (origin, newNames) => {
  var isObj = isObject(origin);
  if (isObj) {
    origin = [origin];
  }
  origin = parse(stringify(origin));
  var updateProperty = function (val, key, obj) {
    delete obj[key];
    key = newNames[key];
    obj[key] = val;
  };
  forEach(origin, (item) => {
    forEach(item, (val, key, obj) => {
      var isRename = (key in newNames);
      (isRename ? updateProperty : noop)(val, key, obj);
    });
  });
  return isObject ? origin[0] : origin;
};
const extend = (destination, sources) => {
  sources = isArray(sources) ? sources : [sources];
  forEach(sources, (source) => {
    for (let key in source) {
      let value = source[key];
      if (!isUndefined(value)) {
        destination[key] = value;
      }
    }
  });
  return destination;
};
const Defer = Promise;
const deferred = (callback) => {
  return new Defer(callback);
};
const templateFormat = (tpl, data, regexp) => {
  if (!(isArray(data))) {
    data = [data];
  }
  let ret = [];
  let replaceAction = (object) => {
    return tpl.replace(regexp || (/\\?\{([^}]+)\}/g), (match, name) => {
      if (match.charAt(0) === '\\') return match.slice(1);
      return (object[name] !== undefined) ? object[name] : '{' + name + '}';
    });
  };
  for (let i = 0, j = data.length; i < j; i++) {
    ret.push(replaceAction(data[i]));
  }
  return ret.join('');
};
// 暂时支持 String
const isContain = (str, keyword) => {
  return str.indexOf(keyword) > -1;
};
const isEqual = (source, target) => {
  return source === target;
};
const Cache = (cache) => {
  if (!isObject(cache)) {
    cache = {};
  }
  let set = (key, value) => {
    cache[key] = value;
  };
  let get = (key) => {
    return cache[key];
  };
  let remove = (key) => {
    delete cache[key];
  };
  let getKeys = () => {
    let keys = [];
    for (let key in cache) {
      keys.push(key);
    }
    return keys;
  };
  let clear = () => {
    cache = {};
  };
  return {
    set,
    get,
    remove,
    getKeys,
    clear
  };
};
const request = (url, option) => {
  return deferred((resolve, reject) => {
    requestNormal(url, option, {
      success: resolve,
      fail: reject
    });
  });
};
const requestNormal = (url, option, callback) => {
  option = option || {};
  let xhr = new XMLHttpRequest();
  let method = option.method || 'GET';
  xhr.open(method, url, true);
  let headers = option.headers || {};
  forEach(headers, (header, name) => {
    xhr.setRequestHeader(name, header);
  });
  let body = option.body || {};
  let isSuccess = () => {
    return /^(200|202)$/.test(xhr.status);
  };
  let timeout = option.timeout;
  if (timeout) {
    xhr.timeout = timeout;
  }
  xhr.onreadystatechange = function () {
    if (isEqual(xhr.readyState, 4)) {
      let { responseText } = xhr;
      responseText = responseText || '{}';
      let result = JSON.parse(responseText);
      if (isSuccess()) {
        callback.success(result, xhr);
      } else {
        let { status } = xhr;
        let error = { status, result };
        callback.fail(error)
      }
    }
  };
  xhr.onerror = (error) => {
    callback.fail(error)
  }
  xhr.send(body);
  return xhr;
};
const map = (arrs, callback) => {
  return arrs.map(callback);
};
const filter = (arrs, callback) => {
  return arrs.filter(callback);
};
const uniq = (arrs, callback) => {
  let newData = [], tempData = {};
  arrs.forEach(target => {
    let temp = callback(target);
    tempData[temp.key] = temp.value;
  });
  forEach(tempData, (val) => {
    newData.push(val);
  })
  return newData;
};
const some = (arrs, callback) => {
  return arrs.some(callback);
};
const toJSON = (value) => {
  return JSON.stringify(value);
}
const toArray = (obj) => {
  let arrs = [];
  forEach(obj, (v, k) => {
    arrs.push([k, v]);
  });
  return arrs;
};

const isInclude = (str, match) => {
  return str.indexOf(match) > -1;
};
const clone = (source) => {
  return JSON.parse(JSON.stringify(source));
};
function Index() {
  let index = 0;
  this.add = () => {
    index += 1;
  };
  this.get = () => {
    return index;
  }
  this.reset = () => {
    index = 0;
  };
}
function Observer() {
  let observers = [];
  this.add = (observer, force) => {
    if (isFunction(observer)) {
      if (force) {
        return observers = [observer];
      }
      observers.push(observer);
    }
  };
  this.remove = (observer) => {
    observers = filter(observers, (_observer) => {
      return _observer !== observer
    });
  };
  this.emit = (data) => {
    forEach(observers, (observer) => {
      observer(data);
    });
  };
}
function Prosumer() {
  let data = [], isConsuming = false;
  this.produce = (res) => {
    data.push(res);
  };
  this.consume = (callback, finished) => {
    if (isConsuming) {
      return;
    }
    isConsuming = true;
    let next = () => {
      let res = data.shift();
      if (isUndefined(res)) {
        isConsuming = false;
        finished && finished();
        return;
      }
      callback(res, next);
    };
    next();
  };
  this.isExeuting = function () {
    return isConsuming;
  };
}

const getBrowser = () => {
  let userAgent = navigator.userAgent;
  let name = '', version = '';
  if (/(Msie|Firefox|Opera|Chrome|Netscape)\D+(\d[\d.]*)/.test(userAgent)) {
    name = RegExp.$1;
    version = RegExp.$2;
  }
  if (/Version\D+(\d[\d.]*).*Safari/.test(userAgent)) {
    name = 'Safari';
    version = RegExp.$1;
  }
  return {
    name,
    version
  };
};

const getUUID = () => {
  return 'j' + 'xxxx-xxxx-xxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getProtocol = (url = '') => {
  let http = location.protocol;
  if(isEqual(http, 'file:')){
    http = 'http:';
  }
  if(isInclude(url, 'https://')){
    http = 'https:';
  }
  let wsMap = {
    'http:': 'ws:',
    'https:': 'wss:'
  };
  let ws = wsMap[http];
  return { http, ws }
};

const sort = (arrs, callback) => {
  const len = arrs.length
	if(len < 2){
    return arrs;
  }
	for (let i = 0; i < len - 1; i++) {
		for (let j = i + 1; j < len; j++) {
			if (callback(arrs[j], arrs[i])) {
				[arrs[i], arrs[j]] = [arrs[j], arrs[i]]
			}
		}
	}
	return arrs
};
const quickSort = (arr, callback) => {
  if (arr.length < 2) {
      return arr;
  }
  let pivot = arr[0];
  let left = [];
  let right = [];
  for (let i = 1; i < arr.length; i++) {
      if (callback(arr[i], pivot)) {
        left.push(arr[i]);
      } else {
        right.push(arr[i]);
      }
  }
  return [...quickSort(left, callback), pivot, ...quickSort(right, callback)];
};
const find = (arrs, callback) => {
  let len = arrs.length;
  let index = -1;
  for(let i = 0; i < len; i++){
    let item = arrs[i];
    if(callback(item)){
      index = i;
      break;
    }
  }
  return index;
};
const toObject = (arrs) => {
  let objs = {};
  forEach(arrs, (item = {}) => {
    let key = item.key;
    let value = item.value;
    objs[key] = value;
  });
  return objs;
};
const decodeBase64 = function (input) {
  let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

  while (i < input.length) {
    enc1 = _keyStr.indexOf(input.charAt(i++));
    enc2 = _keyStr.indexOf(input.charAt(i++));
    enc3 = _keyStr.indexOf(input.charAt(i++));
    enc4 = _keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  return output;
};
const isContinuous = (numbers, key) => {
 numbers.sort((a, b) => {
  return a[key] - b[key];
 });
 for (let i = 0; i < numbers.length - 1; i++) {
     if (numbers[i + 1][key] !== numbers[i][key] + 1) {
         return false;
     }
 }
 return true;
};
const isBase64 = (str) => {
  var regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
  return regex.test(str);
};
function iterator(list, callback){
  let next = () => {
    let item = list.splice(0, 1);
    if(isEmpty(item)){
      return;
    }
    let isFinished = isEqual(list.length, 0);
    callback(item[0], next, isFinished);
  };
  next();
}
function formatTime(time, fmt = 'yyyy-MM-dd hh:mm:ss') {
  let date = new Date(time);
  var o = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    "S": date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

export default {
  Prosumer,
  Observer,
  isUndefined,
  isBoolean,
  isString,
  isObject,
  isArray,
  isFunction,
  stringify,
  parse,
  rename,
  extend,
  clone,
  deferred,
  Defer,
  forEach,
  templateFormat,
  isContain,
  noop,
  Cache,
  request,
  map,
  filter,
  uniq,
  some,
  isEqual,
  isEmpty,
  toJSON,
  isInclude,
  isNull,
  isNumber,
  toArray,
  Index,
  getBrowser,
  getUUID,
  requestNormal,
  getProtocol,
  sort,
  find,
  quickSort,
  toObject,
  decodeBase64,
  isContinuous,
  isBase64,
  iterator,
  formatTime,
}