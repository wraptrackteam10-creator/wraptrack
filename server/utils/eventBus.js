const EventEmitter = require("events");
const bus = new EventEmitter();

// Optional: increase max listeners if you register many listeners in dev
bus.setMaxListeners(50);

module.exports = bus;