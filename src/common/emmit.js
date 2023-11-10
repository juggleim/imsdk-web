import utils from "../utils";
/*
  EmitterEvents = {
    name: [event1, event2, ...]
  }
*/ 
let EmitterEvents = {};
let on = (name, event) => {
  let events = EmitterEvents[name] || [];
  events.push(event);
  utils.extend(EmitterEvents, { name: events });
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

export default {
  on,
  off,
  emit,
  clear
}