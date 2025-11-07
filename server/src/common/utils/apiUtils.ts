import type { AxiosInstance } from "axios"
import type { AxiosCacheInstance } from "axios-cache-interceptor"
import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible"

import { timeout } from "./asyncUtils"

interface ApiRateLimiterOptions {
  nbRequests?: number
  durationInSeconds?: number
  maxQueueSize?: number
  timeout?: number
  client: AxiosInstance | AxiosCacheInstance
}
export const apiRateLimiter = (name: string, options: ApiRateLimiterOptions) => {
  const rateLimiter = new RateLimiterMemory({
    keyPrefix: name,
    points: options.nbRequests || 1,
    duration: options.durationInSeconds || 1,
  })

  const queue = new RateLimiterQueue(rateLimiter, {
    maxQueueSize: options.maxQueueSize || 25,
  })

  return async <T>(callback: (i: AxiosInstance | AxiosCacheInstance) => T): Promise<T> => {
    await timeout(queue.removeTokens(1), options.timeout || 10000)
    return callback(options.client)
  }
}

export class ApiError extends Error {
  apiName: string
  message: string
  reason: string | undefined
  status: string | undefined

  constructor(apiName: string, message: string, reason?: string, status?: string) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.apiName = apiName
    this.message = `[${apiName}] ${message}`
    this.reason = reason
    this.status = status
  }
}
