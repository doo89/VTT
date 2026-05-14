const DB_NAME = 'VTT_DB';
const STORE_NAME = 'export_history';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryItem(item: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // First, get all items to manage the limit of 10
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      let items = getAllRequest.result;
      items.sort((a, b) => b.timestamp - a.timestamp);
      
      // Add the new item
      store.put(item);
      
      // If we have more than 10, delete the oldest ones
      if (items.length >= 10) {
        // Since we added one, we need to remove enough to stay at 10
        const toDelete = items.slice(9); 
        toDelete.forEach(oldItem => store.delete(oldItem.id));
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getHistory(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const items = request.result;
      items.sort((a, b) => b.timestamp - a.timestamp);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}
