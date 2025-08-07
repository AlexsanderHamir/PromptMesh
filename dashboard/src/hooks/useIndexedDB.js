import { useState, useEffect, useCallback } from "react";

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

  // Load initial value from IndexedDB
  useEffect(() => {
    const loadValue = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const item = await getFromDB(key);
        setStoredValue(item !== null ? item : initialValue);
      } catch (err) {
        console.error(`Error reading IndexedDB key "${key}":`, err);
        setError(err);
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, initialValue]);

  // Update IndexedDB when state changes
  const setValue = useCallback(async (value) => {
    try {
      setError(null);
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
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
  }, [key, storedValue]);

  // Remove from IndexedDB
  const removeValue = useCallback(async () => {
    try {
      setError(null);
      await removeFromDB(key);
      setStoredValue(initialValue);
    } catch (err) {
      console.error(`Error removing IndexedDB key "${key}":`, err);
      setError(err);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isLoading, error];
};
