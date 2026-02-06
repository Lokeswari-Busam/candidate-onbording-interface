import { useEffect, useRef, useState } from "react";

type Updater<T> = T | ((prev: T) => T);

export function useLocalStorageForm<T>(
  key: string,
  initialValue: T
): [
  T,
  (value: Updater<T>) => void,
  () => void,
  { isHydrated: boolean; resetFromApi: (data: T) => void }
] {
  const isFirstLoad = useRef(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setIsHydrated(true);
        return JSON.parse(stored) as T;
      }
      return initialValue;
    } catch (err) {
      console.error("Failed to read from localStorage", err);
      return initialValue;
    }
  });

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

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

  // 🔥 Important for API hydration
  const resetFromApi = (data: T) => {
    setState(data);
    setIsHydrated(true);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to sync API data to localStorage", err);
    }
  };

  return [state, updateState, clear, { isHydrated, resetFromApi }];
}
// import { useEffect, useState } from "react";

// type Updater<T> = T | ((prev: T) => T);

// export function useLocalStorageForm<T>(
//   key: string,
//   initialValue: T
// ): [T, (value: Updater<T>) => void, () => void] {
//   const [state, setState] = useState<T>(() => {
//     if (typeof window === "undefined") return initialValue;

//     try {
//       const stored = localStorage.getItem(key);
//       return stored ? (JSON.parse(stored) as T) : initialValue;
//     } catch (err) {
//       console.error("Failed to read from localStorage", err);
//       return initialValue;
//     }
//   });

//   useEffect(() => {
//     try {
//       localStorage.setItem(key, JSON.stringify(state));
//     } catch (err) {
//       console.error("Failed to write to localStorage", err);
//     }
//   }, [key, state]);

//   const updateState = (value: Updater<T>) => {
//     setState((prev) =>
//       typeof value === "function"
//         ? (value as (p: T) => T)(prev)
//         : value
//     );
//   };

//   const clear = () => {
//     localStorage.removeItem(key);
//     setState(initialValue);
//   };

//   return [state, updateState, clear];
// }
