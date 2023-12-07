import { STORAGE } from "../enum";
import utils from "../utils";

// 动态设置 storage key 前缀，例如 _appkey_userid_
let _storage_private_prefix_ = '';
let getKey = (key) => {
  return `${STORAGE.PREFIX}_${_storage_private_prefix_}_${key}`;
};

let set = (key, value) => {
  let _key = getKey(key);
  let storage = { data: value};
  localStorage.setItem(_key, utils.toJSON(storage));
};

let get = (key) => {
  let _key = getKey(key);
  let storage = localStorage.getItem(_key);
  storage = utils.parse(storage) || { data: {}};
  let value = storage.data;
  return value;
}

let remove = (key) => {
  let _key = getKey(key);
  localStorage.removeItem(_key);
}

let setPrefix = (str) => {
  _storage_private_prefix_ = str;
};
export default {
  get,
  set,
  remove,
  setPrefix
}