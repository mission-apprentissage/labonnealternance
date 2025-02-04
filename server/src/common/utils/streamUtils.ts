import { Transform } from "stream"

import { pipeStreams, transformData } from "oleoduc"
import streamJson from "stream-json"
// eslint-disable-next-line import/extensions
import jsonFilters from "stream-json/filters/Pick.js"
// eslint-disable-next-line import/extensions
import streamers from "stream-json/streamers/StreamArray.js"

export function streamNestedJsonArray(arrayPropertyName) {
  return pipeStreams(
    streamJson.parser(),
    jsonFilters.pick({ filter: arrayPropertyName }),
    streamers.streamArray(),
    transformData((data: any) => data.value)
  )
}

export function streamJsonArray() {
  return pipeStreams(
    streamJson.parser(),
    streamers.streamArray(),
    transformData((data: any) => data.value)
  )
}

export const streamGroupByCount = (count: number) => {
  let group: any[] = []
  return new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      group.push(chunk)
      if (group.length === count) {
        this.push(group)
        group = []
      }
      callback()
    },
    flush(callback) {
      if (group.length > 0) {
        this.push(group)
      }
      callback()
    },
  })
}
