import { useState, useEffect, useCallback, useRef } from "react";

// IndexedDB configuration
const DB_NAME = "PromptMeshDB";
const DB_VERSION = 1;
const STORE_NAME = "data";

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
};

// Helper functions for IndexedDB operations
const getFromDB = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
  });
};

const setInDB = async (key, value) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key, value });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const removeFromDB = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const useIndexedDB = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to store the initial value and prevent infinite loops
  const initialValueRef = useRef(initialValue);
  const hasLoadedRef = useRef(false);

  // Load initial value from IndexedDB only once
  useEffect(() => {
    // Only load if we haven't loaded yet
    if (hasLoadedRef.current) return;

    const loadValue = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const item = await getFromDB(key);
        setStoredValue(item !== null ? item : initialValueRef.current);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error(`Error reading IndexedDB key "${key}":`, err);
        setError(err);
        setStoredValue(initialValueRef.current);
        hasLoadedRef.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]); // Remove initialValue from dependencies

  // Update IndexedDB when state changes
  const setValue = useCallback(
    async (value) => {
      try {
        setError(null);
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        // Save to IndexedDB
        if (valueToStore === undefined) {
          await removeFromDB(key);
        } else {
          await setInDB(key, valueToStore);
        }
      } catch (err) {
        console.error(`Error setting IndexedDB key "${key}":`, err);
        setError(err);
      }
    },
    [key, storedValue]
  );

  // Remove from IndexedDB
  const removeValue = useCallback(async () => {
    try {
      setError(null);
      await removeFromDB(key);
      setStoredValue(initialValueRef.current);
    } catch (err) {
      console.error(`Error removing IndexedDB key "${key}":`, err);
      setError(err);
    }
  }, [key]);

  return [storedValue, setValue, removeValue, isLoading, error];
};
