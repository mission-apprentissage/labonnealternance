import { useCallback, useState } from "react"
import { localStorageGet, localStorageSet } from "@/utils/local-storage"

export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === "undefined") return initialValue ?? null
    const item = localStorageGet(key)
    if (!item) return initialValue ?? null
    try {
      return JSON.parse(item)
    } catch {
      return initialValue ?? null
    }
  })

  // Function to update localStorage
  const setLocalStorage = useCallback(
    (value: T) => {
      if (typeof window === "undefined") return
      localStorageSet(key, value)
      setStoredValue(value)
    },
    [key]
  )

  return { storedValue, setLocalStorage }
}
