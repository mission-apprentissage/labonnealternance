import { useState } from "react";

export default function useLocalStorage(key, initialValue, stubbedLocalStorage) {

  let actualLocalStorage = stubbedLocalStorage || window.localStorage || {}

  const [storedValue, setStoredValue] = useState(() => {
    const item = actualLocalStorage.getItem(key);
    return item ? item : initialValue;
  });
  const setValue = (value) => {
    setStoredValue(value);
    actualLocalStorage.setItem(key, value);
  };
  
  return [storedValue, setValue];
}
