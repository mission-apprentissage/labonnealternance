import { useState, useEffect } from 'react';

function getSessionStorageOrDefault(key, defaultValue, stubbedSessionStorage = null) {
  let localSessionStorage = stubbedSessionStorage || sessionStorage
  const stored = localSessionStorage.getItem(key);
  if (!stored) {
    return defaultValue;
  }
  return JSON.parse(stored);
}

export function useSessionStorage(key, defaultValue, stubbedSessionStorage = null) {

  let localSessionStorage = stubbedSessionStorage || sessionStorage

  const [value, setValue] = useState(
    getSessionStorageOrDefault(key, defaultValue, stubbedSessionStorage)
  );

  useEffect(() => {
    localSessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
