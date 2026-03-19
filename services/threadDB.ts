import { Thread, ThreadSummary } from '../types';

/**
 * IndexedDB 持久化层
 * 封装 Thread 的 CRUD 操作
 */

const DB_NAME = 'SecureDataMask';
const DB_VERSION = 1;
const STORE_NAME = 'threads';

// ===== 数据库初始化 =====

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== CRUD 操作 =====

/** 保存 Thread（新建或更新） */
export async function saveThread(thread: Thread): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(thread);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 读取单个 Thread */
export async function getThread(id: string): Promise<Thread | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** 获取所有 Thread 摘要（不含完整数据，节省内存） */
export async function listThreads(): Promise<ThreadSummary[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const threads: Thread[] = request.result;
      const summaries: ThreadSummary[] = threads
        .map((t) => ({
          id: t.id,
          name: t.name,
          createdAt: t.createdAt,
          rowCount: t.rowCount,
          maskedColumnCount: t.configs.filter((c) => c.selected && c.strategy !== 'NONE').length,
          totalColumnCount: t.configs.length,
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // 最新的排前面
      resolve(summaries);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** 删除 Thread */
export async function deleteThread(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 导出 Thread 为 JSON 字符串 */
export async function exportThread(id: string): Promise<string> {
  const thread = await getThread(id);
  if (!thread) {
    throw new Error(`Thread not found: ${id}`);
  }
  return JSON.stringify(thread, null, 2);
}

/** 从 JSON 导入恢复 Thread */
export async function importThread(jsonStr: string): Promise<Thread> {
  const thread: Thread = JSON.parse(jsonStr);
  // 验证必要字段
  if (!thread.id || !thread.name || !thread.configs || !thread.mappings) {
    throw new Error('Invalid thread data: missing required fields');
  }
  await saveThread(thread);
  return thread;
}

/** 生成唯一 ID */
export function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
