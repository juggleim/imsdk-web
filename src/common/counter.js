import utils from "../utils";
export default function (_config = {}) {
  let config = { timeout: 1 * 10 * 1000 };
  utils.extend(config, _config);
  let { timeout } = config;
  let num = 0;
  
  let start = (callback) => {
    num = setTimeout(() => {
      callback();
    }, timeout);
  };
  let clear = () => {
    clearTimeout(num);
  }; 
  return {
    start,
    clear
  };
}