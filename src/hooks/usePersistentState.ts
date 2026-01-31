import { useState, useEffect } from 'react';

export function usePersistentState<T>(storageKey: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${storageKey}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key "${storageKey}":`, error);
    }
  }, [storageKey, value]);

  return [value, setValue];
}
