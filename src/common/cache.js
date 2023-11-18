import utils from "../utils";
export default function () {
  let caches = {};
  let set = (key, value) => {
    caches[key] = value;
  };
  let get = (key) => {
    return caches[key] || {};
  };
  let remove = (key) => {
    delete caches[key];
  };
  return {
    set,
    get,
    remove
  }
}