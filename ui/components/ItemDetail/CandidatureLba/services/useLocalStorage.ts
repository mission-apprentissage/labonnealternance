import { useState } from "react"

export default function useLocalStorage(key: string, initialValue: string | null | undefined, stubbedLocalStorage?: Storage): [string, (newValue: string) => void] {
  const actualLocalStorage = stubbedLocalStorage || window.localStorage || undefined

  const [storedValue, setStoredValue] = useState(() => {
    const item = actualLocalStorage?.getItem(key)
    return item ? item : initialValue
  })
  const setValue = (value) => {
    setStoredValue(value)
    actualLocalStorage?.setItem(key, value)
  }

  return [storedValue, setValue]
}

export const useLocalStorageGeneric = <T>(key: string, initialValue: T) => {
  const storage = window.localStorage
  const [memoryValue, setMemoryValue] = useState<T | null>(() => {
    const storageValue = storage?.getItem(key)
    const value = storageValue === null ? initialValue : (JSON.parse(storageValue) as T)
    return value
  })

  const setValue = (newValue: T | null) => {
    if (newValue === null) {
      storage?.removeItem(key)
      setMemoryValue(null)
    } else {
      storage?.setItem(key, JSON.stringify(newValue))
      setMemoryValue(newValue)
    }
  }
  return [memoryValue, setValue] as const
}
