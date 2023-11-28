import utils from "../utils";
export default function Consumer(){
  let items = [];
  let isFinished = true;
  let produce = (item, isSyncing) => {
    if(isSyncing){
      return items.unshift(item);
    }
    items.push(item);
  };
  let consume = (invoke) => {
    isFinished = utils.isEqual(items.length, 0);
    if(isFinished){
      return;
    }
    let item = items.shift();
    let result = {item, isFinished};
    let next = () => {
      consume(invoke);
    };
    invoke(result, next);
  };
  return {
    consume,
    produce
  }
}