import { compose, transformData } from "oleoduc"
import streamJson from "stream-json"
// eslint-disable-next-line import/extensions
import jsonFilters from "stream-json/filters/Pick.js"
// eslint-disable-next-line import/extensions
import streamers from "stream-json/streamers/StreamArray.js"

export function streamNestedJsonArray(arrayPropertyName) {
  return compose(
    streamJson.parser(),
    jsonFilters.pick({ filter: arrayPropertyName }),
    streamers.streamArray(),
    transformData((data: any) => data.value)
  )
}

export function streamJsonArray() {
  return compose(
    streamJson.parser(),
    streamers.streamArray(),
    transformData((data: any) => data.value)
  )
}
