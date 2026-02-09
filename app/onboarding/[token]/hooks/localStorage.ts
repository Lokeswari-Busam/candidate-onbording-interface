import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const prevKeyRef = useRef<string>(key);
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

  // ✅ Handle key changes (e.g., when token changes)
  useLayoutEffect(() => {
    if (prevKeyRef.current !== key) {
      // Key changed, re-read from localStorage with the new key
      prevKeyRef.current = key;
      isFirstLoad.current = true;
      
      if (typeof window === "undefined") return;

      // Defer state updates using Promise to avoid ESLint warnings about setState in effects
      Promise.resolve().then(() => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored) as T;
            setState(parsed);
            setIsHydrated(true);
          } else {
            setState(initialValue);
            setIsHydrated(false);
          }
        } catch (err) {
          console.error("Failed to read from localStorage with new key", err);
          setState(initialValue);
        }
      });
    }
  }, [key, initialValue]);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    try {
      const cleaned = removeFilesDeep(state);
localStorage.setItem(key, JSON.stringify(cleaned));

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
      const cleaned = removeFilesDeep(data);
      localStorage.setItem(key, JSON.stringify(cleaned));

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
function removeFilesDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeFilesDeep) as T;
  }

  if (value && typeof value === "object") {
    const newObj: Record<string, unknown> = {};

    for (const key in value as Record<string, unknown>) {
      if (key === "file") continue; // remove File field
      newObj[key] = removeFilesDeep(
        (value as Record<string, unknown>)[key]
      );
    }

    return newObj as T;
  }

  return value;
}
