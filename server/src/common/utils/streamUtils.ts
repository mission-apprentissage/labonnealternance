import { compose, transformData } from "oleoduc"
import streamJson from "stream-json"
import jsonFilters from "stream-json/filters/Pick.js"
import streamers from "stream-json/streamers/StreamArray.js"

export function streamNestedJsonArray(arrayPropertyName) {
  return compose(
    streamJson.parser(),
    jsonFilters.pick({ filter: arrayPropertyName }),
    streamers.streamArray(),
    transformData((data) => data.value)
  )
}

export function streamJsonArray() {
  return compose(
    streamJson.parser(),
    streamers.streamArray(),
    transformData((data) => data.value)
  )
}
