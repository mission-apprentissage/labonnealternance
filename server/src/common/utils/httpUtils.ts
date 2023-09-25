import http from "http"
import https from "https"

import axios, { AxiosRequestConfig } from "axios"
import { compose, transformData } from "oleoduc"

import { logger } from "../logger"

// https://github.com/axios/axios/issues/3845#issuecomment-1040819908
class BufferedHttpAgent extends http.Agent {
  highWaterMark: number

  constructor({ highWaterMark = 16 * 1024, ...rest }) {
    super(rest)

    this.highWaterMark = highWaterMark
  }

  createConnection(options, callback) {
    // @ts-ignore
    return super.createConnection({ ...options, highWaterMark: this.highWaterMark }, callback)
  }
}
class BufferedHttpsAgent extends https.Agent {
  highWaterMark: number

  constructor({ highWaterMark = 16 * 1024, ...rest }) {
    super(rest)
    //see https://github.com/nodejs/node/issues/39092
    this.highWaterMark = highWaterMark
  }

  createConnection(options, callback) {
    // @ts-ignore
    return super.createConnection({ ...options, highWaterMark: this.highWaterMark }, callback)
  }
}

type FetchOptions = AxiosRequestConfig & {
  highWaterMark: number
}
async function _fetch(url: string, options: Partial<FetchOptions> = {}) {
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

async function fetchStream(url: string, options: Partial<FetchOptions> = {}) {
  const response = await _fetch(url, { ...options, responseType: "stream" })
  return compose(
    response.data,
    transformData((d) => d.toString())
  )
}

async function fetchJson(url: string, options: Partial<FetchOptions> = {}) {
  const response = await _fetch(url, { ...options, responseType: "json" })
  return response.data
}

function addCsvHeaders(filename, encoding, res) {
  res.setHeader("Content-disposition", `attachment; filename=${filename}`)
  res.setHeader("Content-Type", `text/csv; charset=${encoding}`)
}

export { fetchStream, fetchJson, addCsvHeaders }
