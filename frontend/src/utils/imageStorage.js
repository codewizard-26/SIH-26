/**
 * Lightweight IndexedDB store for draft inspection images.
 * Persists captured photos so that mobile browser tab refreshes or Android camera restarts
 * never lose user-captured photos.
 */

const DB_NAME = 'packaged_commodity_scanner_db';
const DB_VERSION = 1;
const STORE_NAME = 'draft_inspection';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not available'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save a compressed image file or blob to IndexedDB
 */
export const saveDraftImage = async (key, file) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        key,
        blob: file,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified || Date.now(),
        updatedAt: Date.now(),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DraftStorage] Failed to save to IndexedDB:', err);
    return false;
  }
};

/**
 * Load all draft inspection images
 */
export const loadDraftImages = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = req.result || [];
        const result = {
          slots: {},
          extras: [],
        };

        records.forEach((rec) => {
          if (['front', 'back', 'side', 'mrp'].includes(rec.key)) {
            const file = new File([rec.blob], rec.name || `${rec.key}.jpg`, {
              type: rec.type || 'image/jpeg',
              lastModified: rec.lastModified,
            });
            result.slots[rec.key] = {
              id: `${Date.now()}-${rec.key}`,
              file,
              viewType: rec.key,
              previewUrl: URL.createObjectURL(file),
            };
          } else if (rec.key.startsWith('extra_')) {
            const file = new File([rec.blob], rec.name || 'extra.jpg', {
              type: rec.type || 'image/jpeg',
              lastModified: rec.lastModified,
            });
            result.extras.push({
              id: rec.key,
              file,
              viewType: 'evidence',
              previewUrl: URL.createObjectURL(file),
            });
          }
        });

        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DraftStorage] Failed to load draft images:', err);
    return { slots: {}, extras: [] };
  }
};

/**
 * Remove a specific image by key
 */
export const removeDraftImage = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DraftStorage] Failed to delete draft image:', err);
    return false;
  }
};

/**
 * Clear all draft images after successful analysis submission
 */
export const clearAllDraftImages = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DraftStorage] Failed to clear draft store:', err);
    return false;
  }
};
