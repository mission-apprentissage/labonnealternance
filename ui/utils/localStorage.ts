"use client"
export function storageSet<T>(storage: Storage, key: string, value: T) {
  try {
    if (storage) {
      const serializedValue = typeof value === "string" ? value : JSON.stringify(value)
      storage.setItem(key, serializedValue)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error setting storage key "${key}":`, error)
    return false
  }
}

export function storageGet(storage: Storage, key: string): string | null {
  try {
    if (storage) {
      return storage.getItem(key)
    }
    return null
  } catch (error) {
    console.error(`Error getting storage key "${key}":`, error)
    return null
  }
}

export function localStorageSet<T>(key: string, value: T) {
  return storageSet(window?.localStorage, key, value)
}

export function localStorageGet(key: string): string | null {
  return storageGet(window?.localStorage, key)
}

export function sessionStorageSet<T>(key: string, value: T) {
  return storageSet(window?.sessionStorage, key, value)
}

export function sessionStorageGet(key: string): any | null {
  return storageGet(window?.sessionStorage, key)
}
