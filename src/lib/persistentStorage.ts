// Persistent storage wrapper: localStorage + IndexedDB mirror
// In Median/WebView APKs, localStorage is sometimes cleared between sessions.
// IndexedDB is more reliable as a backup. We dual-write and read from both.

const DB_NAME = "smk_persistent";
const DB_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

/**
 * Synchronous read from localStorage. Used during initial useState init.
 * IndexedDB rehydration happens separately on mount.
 */
export function loadLocalSync<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Dual-write: localStorage + IndexedDB.
 * If localStorage write fails (quota / disabled), IndexedDB still succeeds.
 */
export function savePersistent<T>(key: string, data: T): void {
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(key, json);
  } catch {
    /* quota or disabled */
  }
  // Fire-and-forget IndexedDB mirror
  void idbSet(key, json);
}

/**
 * Async rehydrate: read IndexedDB, return parsed value if it has more entries
 * than the current in-memory value. Used on app mount to recover from
 * localStorage being cleared by Median WebView.
 */
export async function rehydrateFromIDB<T>(key: string): Promise<T | null> {
  const raw = await idbGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
