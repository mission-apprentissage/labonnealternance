import axios from "axios"
import { compose, transformData } from "oleoduc"
import { logger } from "../logger.js"
import http from "http"
import https from "https"

class BufferedHttpAgent extends http.Agent {
  constructor({ highWaterMark = 16 * 1024, ...rest }) {
    super(rest)
    //see https://github.com/nodejs/node/issues/39092
    this.highWaterMark = highWaterMark
  }

  createConnection(options, callback) {
    return super.createConnection({ ...options, highWaterMark: this.highWaterMark }, callback)
  }
}
class BufferedHttpsAgent extends https.Agent {
  constructor({ highWaterMark = 16 * 1024, ...rest }) {
    super(rest)
    //see https://github.com/nodejs/node/issues/39092
    this.highWaterMark = highWaterMark
  }

  createConnection(options, callback) {
    return super.createConnection({ ...options, highWaterMark: this.highWaterMark }, callback)
  }
}

async function _fetch(url, options = {}) {
  const { method = "GET", data, highWaterMark, ...rest } = options
  logger.debug(`${method} ${url}...`)

  return axios.request({
    url,
    method,
    httpAgent: new BufferedHttpAgent({ highWaterMark }),
    httpsAgent: new BufferedHttpsAgent({ highWaterMark }),
    ...(data ? { data } : {}),
    ...rest,
  })
}

async function fetchStream(url, options = {}) {
  const response = await _fetch(url, { ...options, responseType: "stream" })
  return compose(
    response.data,
    transformData((d) => d.toString())
  )
}

async function fetchJson(url, options = {}) {
  const response = await _fetch(url, { ...options, responseType: "json" })
  return response.data
}

function addCsvHeaders(filename, encoding, res) {
  res.setHeader("Content-disposition", `attachment; filename=${filename}`)
  res.setHeader("Content-Type", `text/csv; charset=${encoding}`)
}

export { fetchStream, fetchJson, addCsvHeaders }
