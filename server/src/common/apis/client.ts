import axios, { AxiosRequestConfig } from "axios"
import { buildMemoryStorage, setupCache } from "axios-cache-interceptor"

const CLEANUP_INTERVAL = 1000 * 60 * 10 // 10 minutes
const MAX_ENTRIES = 200

const getApiClient = (options: AxiosRequestConfig, { cache }: { cache: boolean } = { cache: true }) => {
  const axiosInstance = axios.create({
    timeout: 5000,
    ...options,
  })

  return cache
    ? setupCache(axiosInstance, {
        storage: buildMemoryStorage(true, CLEANUP_INTERVAL, MAX_ENTRIES),
        ttl: 1000 * 60 * 10, // 10 Minutes
      })
    : axiosInstance
}

export default getApiClient
