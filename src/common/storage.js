import { STORAGE } from "../enum";
import utils from "../utils";

let getKey = (key) => {
  return `${STORAGE.PREFIX}_${key}`;
};

let set = (key, value) => {
  let _key = getKey(key);
  let storage = { data: value};
  localStorage.setItem(_key, utils.toJSON(storage));
};

let get = (key) => {
  let _key = getKey(key);
  let storage = localStorage.getItem(_key);
  storage = utils.parse(storage);
  let value = storage.data;
  return value;
}

let remove = (key) => {
  let _key = getKey(key);
  localStorage.removeItem(_key);
}

export default {
  get,
  set,
  remove
}