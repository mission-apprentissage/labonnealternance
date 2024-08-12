// This code is adapted from the following GitHub repository:
// https://github.com/uidotdev
// Original author: tylermcginnis
// Licensed under the MIT License

import React from "react"

function dispatchStorageEvent(key: string, newValue: any) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }))
}

const setLocalStorageItem = (key: string, value: any) => {
  const stringifiedValue = JSON.stringify(value)
  window.localStorage.setItem(key, stringifiedValue)
  dispatchStorageEvent(key, stringifiedValue)
}

const removeLocalStorageItem = (key: string) => {
  window.localStorage.removeItem(key)
  dispatchStorageEvent(key, null)
}
const getLocalStorageItem = (key: string) => {
  return window.localStorage.getItem(key)
}
const useLocalStorageSubscribe = (callback) => {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}
const getLocalStorageServerSnapshot = () => {
  throw Error("useLocalStorage is a client-only hook")
}

export function useLocalStorage(key: string, initialValue?: any) {
  const getSnapshot = () => getLocalStorageItem(key)
  const store = React.useSyncExternalStore(useLocalStorageSubscribe, getSnapshot, getLocalStorageServerSnapshot)

  const currentValue = React.useMemo(() => {
    return store ? JSON.parse(store) : initialValue
  }, [store, initialValue])

  const setState = React.useCallback(
    (v) => {
      try {
        const nextState = typeof v === "function" ? v(currentValue) : v

        if (nextState === undefined || nextState === null) {
          removeLocalStorageItem(key)
        } else {
          setLocalStorageItem(key, nextState)
        }
      } catch (e) {
        console.warn(e)
      }
    },
    [key, currentValue]
  )

  React.useEffect(() => {
    if (getLocalStorageItem(key) === null && typeof initialValue !== "undefined") {
      setLocalStorageItem(key, initialValue)
    }
  }, [key, initialValue])

  return [currentValue, setState]
}
