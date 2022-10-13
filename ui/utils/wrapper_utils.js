
// extending String.prototype is a very bad practice
// we need to find a "hack" to make it possible
// in order to make the default available API
// a lot more readable
const string_wrapper =  (str) => {
  return {
    amongst: (collection) => {
      return collection.includes(str)
    },
    contains: (another) => {
      return str.indexOf(another) >= 0
    },
    in: (another) => {
      return another.indexOf(str) >= 0
    }
  }
}


export { string_wrapper }
