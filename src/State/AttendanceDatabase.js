const DATABASE_NAME = 'manufacture-erp-attendance';
const DATABASE_VERSION = 1;
const ATTENDANCE_STORE = 'attendance';
const MIGRATIONS_STORE = 'migrations';

function openAttendanceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ATTENDANCE_STORE)) {
        const attendanceStore = database.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id' });
        attendanceStore.createIndex('companyId', 'companyId');
      }
      if (!database.objectStoreNames.contains(MIGRATIONS_STORE)) {
        database.createObjectStore(MIGRATIONS_STORE, { keyPath: 'companyId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open the attendance database.'));
    request.onblocked = () => reject(new Error('The attendance database is blocked by another open application tab.'));
  });
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error('The attendance database transaction was aborted.'));
    transaction.onerror = () => reject(transaction.error || new Error('Unable to write attendance to the database.'));
  });
}

export async function initializeAttendanceDatabase(companyId, legacyAttendance = {}) {
  const database = await openAttendanceDatabase();
  try {
    const migration = database.transaction([ATTENDANCE_STORE, MIGRATIONS_STORE], 'readwrite');
    const attendanceStore = migration.objectStore(ATTENDANCE_STORE);
    const migrationStore = migration.objectStore(MIGRATIONS_STORE);
    const migrationRequest = migrationStore.get(companyId);
    migrationRequest.onsuccess = () => {
      if (migrationRequest.result) return;
      Object.entries(legacyAttendance).forEach(([date, records]) => {
        if (!records || typeof records !== 'object' || Array.isArray(records)) return;
        const id = `${companyId}:${date}`;
        const existingRequest = attendanceStore.get(id);
        existingRequest.onsuccess = () => {
          attendanceStore.put({
            id,
            companyId,
            date,
            records: { ...records, ...(existingRequest.result?.records || {}) },
          });
        };
      });
      migrationStore.put({ companyId, migratedAt: Date.now() });
    };
    await waitForTransaction(migration);

    const readTransaction = database.transaction(ATTENDANCE_STORE, 'readonly');
    const readRequest = readTransaction.objectStore(ATTENDANCE_STORE)
      .index('companyId')
      .getAll(IDBKeyRange.only(companyId));
    const readComplete = waitForTransaction(readTransaction);
    const documents = await new Promise((resolve, reject) => {
      readRequest.onsuccess = () => resolve(readRequest.result);
      readRequest.onerror = () => reject(readRequest.error || new Error('Unable to load attendance records.'));
    });
    await readComplete;
    return documents.reduce((attendance, document) => ({
      ...attendance,
      [document.date]: document.records || {},
    }), {});
  } finally {
    database.close();
  }
}

export async function saveAttendanceToDatabase(companyId, date, records) {
  const database = await openAttendanceDatabase();
  try {
    const transaction = database.transaction(ATTENDANCE_STORE, 'readwrite');
    const store = transaction.objectStore(ATTENDANCE_STORE);
    const id = `${companyId}:${date}`;
    let savedRecords;
    const request = store.get(id);
    request.onsuccess = () => {
      savedRecords = { ...(request.result?.records || {}), ...records };
      store.put({ id, companyId, date, records: savedRecords });
    };
    await waitForTransaction(transaction);
    return savedRecords;
  } finally {
    database.close();
  }
}
