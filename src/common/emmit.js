import utils from "../utils";
export default function () {
  /*
  EmitterEvents = {
    name: [event1, event2, ...]
  }
*/
  let EmitterEvents = {};
  let on = (name, event) => {
    let events = EmitterEvents[name] || [];
    events.push(event);
    let eventObj = {};
    eventObj[name] = events;
    utils.extend(EmitterEvents, eventObj);
  }

  let off = (name) => {
    delete EmitterEvents[name];
  }

  let emit = (name, data) => {
    let events = EmitterEvents[name] || [];
    utils.forEach(events, (event) => {
      event(data);
    });
  }

  let clear = () => {
    utils.forEach(EmitterEvents, (event, name) => {
      delete EmitterEvents[name];
    });
  }
  return {
    on,
    off,
    emit,
    clear
  }
}