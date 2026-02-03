import { useEffect, useState } from "react";

type Updater<T> = T | ((prev: T) => T);

export function useLocalStorageForm<T>(
  key: string,
  initialValue: T
): [T, (value: Updater<T>) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch (err) {
      console.error("Failed to read from localStorage", err);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to write to localStorage", err);
    }
  }, [key, state]);

  const updateState = (value: Updater<T>) => {
    setState((prev) =>
      typeof value === "function"
        ? (value as (p: T) => T)(prev)
        : value
    );
  };

  const clear = () => {
    localStorage.removeItem(key);
    setState(initialValue);
  };

  return [state, updateState, clear];
}
