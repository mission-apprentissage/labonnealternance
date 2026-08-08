import { useCallback, useState } from "react"

export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === "undefined") return initialValue ?? null
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : (initialValue ?? null)
  })

  // Function to update localStorage
  const setLocalStorage = useCallback(
    (value: T) => {
      if (typeof window === "undefined") return
      localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    },
    [key]
  )

  return { storedValue, setLocalStorage }
}
