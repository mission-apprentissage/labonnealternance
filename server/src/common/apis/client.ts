// import http from "http"
// import https from "https"

import axios, { AxiosRequestConfig } from "axios"
import { setupCache } from "axios-cache-interceptor"

const getApiClient = (options: AxiosRequestConfig, { cache }: { cache: boolean } = { cache: true }) => {
  const axiosInstance = axios.create({
    timeout: 5000,
    // httpAgent: new http.Agent({ keepAlive: true }),
    // httpsAgent: new https.Agent({ keepAlive: true }),
    ...options,
  })
  return cache
    ? setupCache(axiosInstance, {
        ttl: 1000 * 60 * 10, // 10 Minutes
      })
    : axiosInstance
}

export default getApiClient
