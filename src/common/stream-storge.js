import { STORAGE } from "../enum";
import utils from "../utils";
import Cacher from "./cache";
import StorageTool from "./storage";

let add = (messageId, content) => {
  let contentList = get(messageId);
  contentList = utils.isEmpty(contentList) ? [] : contentList;
  contentList.push(content);
  StorageTool.set(messageId, contentList);
};

let get = (messageId) => {
  let contentList = StorageTool.get(messageId);
  return utils.isEmpty(contentList) ? [] : contentList;
}

let remove = (messageId) => {
  StorageTool.remove(messageId);
}

export default {
  get,
  add,
  remove,
}