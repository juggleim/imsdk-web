import utils from "../utils";
export default function Consumer(){
  let items = [];
  let isFinished = false;
  let produce = (item, isSyncing) => {
    if(isSyncing){
      return items.unshift(item);
    }
    items.push(item);
  };
  let consume = (invoke) => {
    // 如果正在执行，终止本次任务，执行任务结束后自动消费队列 ntf, 1 是首次，所以判断大于 1
    let isDoing = items.length > 1;
    if(isDoing){
      return;
    }
    
    // 队列消费结束，标志完成，此处先判断是否完成，再截取数组，避免数组长度为 1 时，最后一次被丢弃
    isFinished = utils.isEqual(items.length, 0);
    let item = items.shift();
    let result = {item};
    let next = () => {
      consume(invoke);
    };
    if(!isFinished){
      invoke(result, next);
    }
  };
  return {
    consume,
    produce
  }
}