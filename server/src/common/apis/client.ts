import axios, { AxiosInstance, AxiosRequestConfig } from "axios"
import { AxiosCacheInstance, MemoryStorage, buildMemoryStorage, setupCache } from "axios-cache-interceptor"

const CLEANUP_INTERVAL = 1000 * 60 * 10 // 10 minutes
const MAX_ENTRIES = 200
const CLONE_DATA = false

let client: AxiosInstance | null = null
let cachedClient: AxiosCacheInstance | null = null
let memoryCache: MemoryStorage | null = null

const closeMemoryCache = () => {
  if (memoryCache) {
    clearInterval(memoryCache.cleaner)
    memoryCache = null
    cachedClient = null
    client = null
  }
}

const getApiClient = (options: AxiosRequestConfig, { cache }: { cache: boolean } = { cache: true }): AxiosInstance => {
  if (!client) {
    client = axios.create({
      timeout: 5000,
      ...options,
    })
  }

  if (!cache) {
    return client
  }

  if (!cachedClient) {
    if (!memoryCache) {
      memoryCache = buildMemoryStorage(CLONE_DATA, CLEANUP_INTERVAL, MAX_ENTRIES)
    }

    cachedClient = setupCache(client, {
      storage: memoryCache,
      ttl: 1000 * 60 * 10, // 10 Minutes
    })
  }

  return cachedClient
}

export default getApiClient

export { closeMemoryCache }
