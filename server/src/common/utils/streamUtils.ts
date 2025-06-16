import { compose, transformData } from "oleoduc"
import streamJson from "stream-json"
// eslint-disable-next-line import/extensions
import streamers from "stream-json/streamers/StreamArray.js"

export function streamJsonArray() {
  return compose(
    streamJson.parser(),
    streamers.streamArray(),
    transformData((data: any) => data.value)
  )
}
