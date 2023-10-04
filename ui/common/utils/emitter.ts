import EventEmitter from "events"

const emitter = new EventEmitter()
const subscribeToHttpEvent = (eventName, callback) => emitter.on(eventName, callback)

export { emitter, subscribeToHttpEvent }
