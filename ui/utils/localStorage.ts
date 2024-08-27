export function localStorageSet<T>(key: string, value: T) {
  try {
    if (window?.localStorage) {
      const serializedValue = typeof value === "string" ? value : JSON.stringify(value)
      window.localStorage.setItem(key, serializedValue)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
    return false
  }
}

export function localStorageGet(key: string): string | null {
  try {
    if (window?.localStorage) {
      return window.localStorage.getItem(key)
    }
    return null
  } catch (error) {
    console.error(`Error getting localStorage key "${key}":`, error)
    return null
  }
}
