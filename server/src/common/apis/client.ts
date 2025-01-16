import axios, { AxiosInstance, AxiosRequestConfig } from "axios"
import { AxiosCacheInstance, MemoryStorage, buildMemoryStorage, setupCache } from "axios-cache-interceptor"

const CLEANUP_INTERVAL = 1000 * 60 * 10 // 10 minutes
const MAX_ENTRIES = 200
const CLONE_DATA = false

const memoryCache: Set<MemoryStorage> = new Set()

const closeMemoryCache = () => {
  memoryCache.forEach((mc) => {
    clearInterval(mc.cleaner)
    memoryCache.delete(mc)
  })
}

const getApiClient = (options: AxiosRequestConfig, { cache }: { cache: boolean } = { cache: true }): AxiosCacheInstance | AxiosInstance => {
  const client: AxiosInstance = axios.create({
    timeout: 5000,
    ...options,
  })

  if (!cache) {
    return client
  }

  const mc = buildMemoryStorage(CLONE_DATA, CLEANUP_INTERVAL, MAX_ENTRIES)
  memoryCache.add(mc)

  return setupCache(client, {
    storage: mc,
    ttl: 1000 * 60 * 10, // 10 Minutes
  })
}

export default getApiClient

export { closeMemoryCache }
