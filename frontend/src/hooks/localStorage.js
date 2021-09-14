// Copied from https://usehooks.com/useLocalStorage/
import { useMemo, useState } from "react";

export function useLocalStorage(key, initialValue) {
  // Pass initial state function to useState so logic is only executed once
  // https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  return useMemo(() => {
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    function setValue(value) {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // TODO: Sentry
        console.log(error);
      }
    }

    return [storedValue, setValue];
  }, [key, storedValue, setStoredValue]);
}
