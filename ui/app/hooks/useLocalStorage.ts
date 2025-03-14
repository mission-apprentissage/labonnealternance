import { useCallback, useEffect, useState } from "react"

export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | null>(null)

  // Load value from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return // Prevent SSR issues
    const item = localStorage.getItem(key)
    setStoredValue(item ? JSON.parse(item) : (initialValue ?? null))
  }, [key, initialValue])

  // Function to update localStorage
  const setItem = useCallback(
    (value: T) => {
      if (typeof window === "undefined") return
      localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    },
    [key]
  )

  return { storedValue, setLocalStorage: initialValue !== undefined ? setItem : undefined }
}
