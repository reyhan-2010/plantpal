// PlantPal - مدیریت پایگاه داده (IndexedDB)
// این فایل مسئول ذخیره و بازیابی اطلاعات گیاهان، فعالیت‌ها و یادداشت‌هاست.

// ============================================
// بخش ۱: تنظیمات اولیه
// ============================================

const DB_NAME = 'PlantPalDB';
const DB_VERSION = 3;
const STORE_PLANTS = 'plants';
const STORE_CARE_LOGS = 'careLogs';
const STORE_NOTES = 'notes';

const CURRENT_USER_ID = 'local-user';

// مقدار پیش‌فرض فاصله آبیاری (روز)
const DEFAULT_WATERING_FREQUENCY_DAYS = 7;

// محدوده مجاز فاصله آبیاری
const MIN_WATERING_FREQUENCY_DAYS = 1;
const MAX_WATERING_FREQUENCY_DAYS = 14;

let db = null;

// ============================================
// بخش ۲: باز کردن پایگاه داده
// ============================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(event) {
      const database = event.target.result;
      createStores(database);
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      console.log('✓ پایگاه داده با موفقیت باز شد');
      resolve(db);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در باز کردن پایگاه داده:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۳: ساخت Object Storeها
// ============================================

function createStores(database) {
  if (!database.objectStoreNames.contains(STORE_PLANTS)) {
    const plantsStore = database.createObjectStore(STORE_PLANTS, {
      keyPath: 'id',
      autoIncrement: true
    });

    plantsStore.createIndex('userId', 'userId', { unique: false });
    plantsStore.createIndex('name', 'name', { unique: false });
    plantsStore.createIndex('health', 'health', { unique: false });

    console.log('✓ کشوی گیاهان ساخته شد');
  }

  if (!database.objectStoreNames.contains(STORE_CARE_LOGS)) {
    const careLogsStore = database.createObjectStore(STORE_CARE_LOGS, {
      keyPath: 'id',
      autoIncrement: true
    });

    careLogsStore.createIndex('plantId', 'plantId', { unique: false });
    careLogsStore.createIndex('date', 'date', { unique: false });

    console.log('✓ کشوی فعالیت‌های مراقبتی ساخته شد');
  }

  if (!database.objectStoreNames.contains(STORE_NOTES)) {
    const notesStore = database.createObjectStore(STORE_NOTES, {
      keyPath: 'id',
      autoIncrement: true
    });

    notesStore.createIndex('plantId', 'plantId', { unique: false });
    notesStore.createIndex('date', 'date', { unique: false });

    console.log('✓ کشوی یادداشت‌ها ساخته شد');
  }
}

// ============================================
// بخش ۴: اعتبارسنجی فاصله آبیاری
// ============================================

function normalizeWateringFrequency(value) {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return DEFAULT_WATERING_FREQUENCY_DAYS;
  }

  if (num < MIN_WATERING_FREQUENCY_DAYS) {
    return MIN_WATERING_FREQUENCY_DAYS;
  }

  if (num > MAX_WATERING_FREQUENCY_DAYS) {
    return MAX_WATERING_FREQUENCY_DAYS;
  }

  return num;
}

// ============================================
// بخش ۵: توابع ذخیره گیاهان
// ============================================

function savePlant(plantData) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const plant = {
      name: plantData.name || '',
      type: plantData.type || '',
      location: plantData.location || '',
      image: plantData.image || null,
      health: plantData.health || 'healthy',
      wateringFrequencyDays: normalizeWateringFrequency(plantData.wateringFrequencyDays),
      userId: CURRENT_USER_ID,
      createdAt: now,
      updatedAt: now
    };

    const transaction = db.transaction([STORE_PLANTS], 'readwrite');
    const store = transaction.objectStore(STORE_PLANTS);
    const request = store.add(plant);

    request.onsuccess = function(event) {
      console.log('✓ گیاه ذخیره شد. شناسه:', event.target.result);
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در ذخیره گیاه:', event.target.error);
      reject(event.target.error);
    };
  });
}

function updatePlant(plantId, plantData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PLANTS], 'readwrite');
    const store = transaction.objectStore(STORE_PLANTS);
    const getRequest = store.get(plantId);

    getRequest.onsuccess = function(event) {
      const existingPlant = event.target.result;

      if (!existingPlant) {
        reject(new Error('گیاه پیدا نشد'));
        return;
      }

      const updatedPlant = {
        ...existingPlant,
        name: plantData.name !== undefined ? plantData.name : existingPlant.name,
        type: plantData.type !== undefined ? plantData.type : existingPlant.type,
        location: plantData.location !== undefined ? plantData.location : existingPlant.location,
        image: plantData.image !== undefined ? plantData.image : existingPlant.image,
        health: plantData.health !== undefined ? plantData.health : existingPlant.health,
        wateringFrequencyDays: plantData.wateringFrequencyDays !== undefined
          ? normalizeWateringFrequency(plantData.wateringFrequencyDays)
          : normalizeWateringFrequency(existingPlant.wateringFrequencyDays),
        updatedAt: new Date().toISOString()
      };

      const putRequest = store.put(updatedPlant);

      putRequest.onsuccess = function() {
        console.log('✓ گیاه ویرایش شد. شناسه:', plantId);
        resolve(updatedPlant);
      };

      putRequest.onerror = function(event) {
        console.error('✗ خطا در ویرایش گیاه:', event.target.error);
        reject(event.target.error);
      };
    };

    getRequest.onerror = function(event) {
      console.error('✗ خطا در پیدا کردن گیاه:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۶: توابع ذخیره فعالیت‌ها
// ============================================

function saveCareLog(logData) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const careLog = {
      plantId: logData.plantId,
      type: logData.type || 'water',
      date: logData.date || now,
      note: logData.note || '',
      createdAt: now
    };

    const transaction = db.transaction([STORE_CARE_LOGS], 'readwrite');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const request = store.add(careLog);

    request.onsuccess = function(event) {
      console.log('✓ فعالیت ذخیره شد. شناسه:', event.target.result);
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در ذخیره فعالیت:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۷: توابع ذخیره یادداشت‌ها
// ============================================

function saveNote(noteData) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const note = {
      plantId: noteData.plantId,
      text: noteData.text || '',
      date: noteData.date || now,
      createdAt: now
    };

    const transaction = db.transaction([STORE_NOTES], 'readwrite');
    const store = transaction.objectStore(STORE_NOTES);
    const request = store.add(note);

    request.onsuccess = function(event) {
      console.log('✓ یادداشت ذخیره شد. شناسه:', event.target.result);
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در ذخیره یادداشت:', event.target.error);
      reject(event.target.error);
    };
  });
}

function updateNote(noteId, noteData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NOTES], 'readwrite');
    const store = transaction.objectStore(STORE_NOTES);
    const getRequest = store.get(noteId);

    getRequest.onsuccess = function(event) {
      const existingNote = event.target.result;

      if (!existingNote) {
        reject(new Error('یادداشت پیدا نشد'));
        return;
      }

      const updatedNote = {
        ...existingNote,
        text: noteData.text !== undefined ? noteData.text : existingNote.text,
        date: noteData.date !== undefined ? noteData.date : existingNote.date
      };

      const putRequest = store.put(updatedNote);

      putRequest.onsuccess = function() {
        console.log('✓ یادداشت ویرایش شد. شناسه:', noteId);
        resolve(updatedNote);
      };

      putRequest.onerror = function(event) {
        console.error('✗ خطا در ویرایش یادداشت:', event.target.error);
        reject(event.target.error);
      };
    };

    getRequest.onerror = function(event) {
      console.error('✗ خطا در پیدا کردن یادداشت:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۸: توابع خواندن
// ============================================

function getAllPlants() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PLANTS], 'readonly');
    const store = transaction.objectStore(STORE_PLANTS);
    const request = store.getAll();

    request.onsuccess = function(event) {
      const plants = event.target.result;
      console.log('✓ تعداد گیاهان خوانده شد:', plants.length);
      resolve(plants);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن گیاهان:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getPlantById(plantId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PLANTS], 'readonly');
    const store = transaction.objectStore(STORE_PLANTS);
    const request = store.get(plantId);

    request.onsuccess = function(event) {
      const plant = event.target.result;
      if (plant) {
        console.log('✓ گیاه خوانده شد:', plant.name);
      } else {
        console.log('⚠ گیاهی با این شناسه پیدا نشد:', plantId);
      }
      resolve(plant);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن گیاه:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getCareLogsByPlantId(plantId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CARE_LOGS], 'readonly');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const index = store.index('plantId');
    const request = index.getAll(plantId);

    request.onsuccess = function(event) {
      let logs = event.target.result;
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log('✓ تعداد فعالیت‌های مراقبتی خوانده شد:', logs.length);
      resolve(logs);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن فعالیت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getNotesByPlantId(plantId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NOTES], 'readonly');
    const store = transaction.objectStore(STORE_NOTES);
    const index = store.index('plantId');
    const request = index.getAll(plantId);

    request.onsuccess = function(event) {
      let notes = event.target.result;
      notes.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log('✓ تعداد یادداشت‌ها خوانده شد:', notes.length);
      resolve(notes);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن یادداشت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۹: توابع حذف
// ============================================

function deletePlant(plantId) {
  return new Promise((resolve, reject) => {
    Promise.all([
      deleteCareLogsByPlantId(plantId),
      deleteNotesByPlantId(plantId)
    ])
      .then(() => {
        const transaction = db.transaction([STORE_PLANTS], 'readwrite');
        const store = transaction.objectStore(STORE_PLANTS);
        const request = store.delete(plantId);

        request.onsuccess = function() {
          console.log('✓ گیاه و متعلقاتش حذف شد. شناسه:', plantId);
          resolve(true);
        };

        request.onerror = function(event) {
          console.error('✗ خطا در حذف گیاه:', event.target.error);
          reject(event.target.error);
        };
      })
      .catch((error) => {
        console.error('✗ خطا در حذف متعلقات گیاه:', error);
        reject(error);
      });
  });
}

function deleteCareLogsByPlantId(plantId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CARE_LOGS], 'readwrite');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const index = store.index('plantId');
    const request = index.openCursor(plantId);

    let deletedCount = 0;

    request.onsuccess = function(event) {
      const cursor = event.target.result;

      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log('✓ تعداد فعالیت‌های حذف‌شده:', deletedCount);
        resolve(deletedCount);
      }
    };

    request.onerror = function(event) {
      console.error('✗ خطا در حذف فعالیت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

function deleteNotesByPlantId(plantId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NOTES], 'readwrite');
    const store = transaction.objectStore(STORE_NOTES);
    const index = store.index('plantId');
    const request = index.openCursor(plantId);

    let deletedCount = 0;

    request.onsuccess = function(event) {
      const cursor = event.target.result;

      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log('✓ تعداد یادداشت‌های حذف‌شده:', deletedCount);
        resolve(deletedCount);
      }
    };

    request.onerror = function(event) {
      console.error('✗ خطا در حذف یادداشت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

function deleteCareLog(logId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CARE_LOGS], 'readwrite');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const request = store.delete(logId);

    request.onsuccess = function() {
      console.log('✓ فعالیت حذف شد. شناسه:', logId);
      resolve(true);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در حذف فعالیت:', event.target.error);
      reject(event.target.error);
    };
  });
}

function deleteNote(noteId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NOTES], 'readwrite');
    const store = transaction.objectStore(STORE_NOTES);
    const request = store.delete(noteId);

    request.onsuccess = function() {
      console.log('✓ یادداشت حذف شد. شناسه:', noteId);
      resolve(true);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در حذف یادداشت:', event.target.error);
      reject(event.target.error);
    };
  });
}


// ============================================
// بخش ۱۰: توابع خواندن همه داده‌ها
// ============================================

function getAllCareLogs() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CARE_LOGS], 'readonly');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const request = store.getAll();

    request.onsuccess = function(event) {
      const logs = event.target.result;
      console.log('✓ تعداد کل فعالیت‌ها خوانده شد:', logs.length);
      resolve(logs);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن همه فعالیت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getAllNotes() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NOTES], 'readonly');
    const store = transaction.objectStore(STORE_NOTES);
    const request = store.getAll();

    request.onsuccess = function(event) {
      const notes = event.target.result;
      console.log('✓ تعداد کل یادداشت‌ها خوانده شد:', notes.length);
      resolve(notes);
    };

    request.onerror = function(event) {
      console.error('✗ خطا در خواندن همه یادداشت‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۱۱: پشتیبان‌گیری (Export)
// ============================================

async function exportAllData(includeImages) {
  const plants = await getAllPlants();
  const careLogs = await getAllCareLogs();
  const notes = await getAllNotes();

  let exportPlants;

  if (includeImages) {
    exportPlants = plants;
  } else {
    exportPlants = plants.map(function(plant) {
      return {
        ...plant,
        image: null
      };
    });
  }

  const exportData = {
    metadata: {
      appName: 'PlantPal',
      version: '1.0',
      formatVersion: 1,
      exportDate: new Date().toISOString(),
      includesImages: !!includeImages,
      plantCount: plants.length,
      careLogCount: careLogs.length,
      noteCount: notes.length
    },
    data: {
      plants: exportPlants,
      careLogs: careLogs,
      notes: notes
    }
  };

  console.log('✓ داده‌های پشتیبان آماده شد:');
  console.log('  - گیاهان:', plants.length);
  console.log('  - فعالیت‌ها:', careLogs.length);
  console.log('  - یادداشت‌ها:', notes.length);
  console.log('  - شامل عکس:', includeImages);

  return exportData;
}

function downloadBackupFile(exportData) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const filename = 'plantpal-backup-' + year + '-' + month + '-' + day + '.json';

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(function() {
    URL.revokeObjectURL(url);
  }, 1000);

  console.log('✓ فایل پشتیبان دانلود شد:', filename);

  return filename;
}

async function getBackupStats() {
  const plants = await getAllPlants();
  const careLogs = await getAllCareLogs();
  const notes = await getAllNotes();

  return {
    plants: plants.length,
    careLogs: careLogs.length,
    notes: notes.length
  };
}


// ============================================
// بخش ۱۲: اعتبارسنجی فایل پشتیبان
// ============================================

function validateBackupData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('ساختار فایل معتبر نیست.');
    return { valid: false, errors: errors };
  }

  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('اطلاعات نسخه پشتیبان یافت نشد.');
    return { valid: false, errors: errors };
  }

  if (data.metadata.appName !== 'PlantPal') {
    errors.push('این فایل پشتیبان PlantPal نیست.');
  }

  if (!data.data || typeof data.data !== 'object') {
    errors.push('داده‌های فایل یافت نشد.');
    return { valid: false, errors: errors };
  }

  if (!Array.isArray(data.data.plants)) {
    errors.push('فهرست گیاهان در فایل ناقص است.');
  }

  if (!Array.isArray(data.data.careLogs)) {
    errors.push('فهرست فعالیت‌ها در فایل ناقص است.');
  }

  if (!Array.isArray(data.data.notes)) {
    errors.push('فهرست یادداشت‌ها در فایل ناقص است.');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ============================================
// بخش ۱۳: پاک کردن همه داده‌ها
// ============================================

function clearAllData() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_PLANTS, STORE_CARE_LOGS, STORE_NOTES],
      'readwrite'
    );

    const plantsStore = transaction.objectStore(STORE_PLANTS);
    const careLogsStore = transaction.objectStore(STORE_CARE_LOGS);
    const notesStore = transaction.objectStore(STORE_NOTES);

    plantsStore.clear();
    careLogsStore.clear();
    notesStore.clear();

    transaction.oncomplete = function() {
      console.log('✓ همه داده‌ها پاک شد');
      resolve(true);
    };

    transaction.onerror = function(event) {
      console.error('✗ خطا در پاک کردن داده‌ها:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================
// بخش ۱۴: بازیابی از فایل (Import)
// ============================================

function importSinglePlant(oldPlant) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const plant = {
      name: oldPlant.name || '',
      type: oldPlant.type || '',
      location: oldPlant.location || '',
      image: oldPlant.image || null,
      health: oldPlant.health || 'healthy',
      wateringFrequencyDays: normalizeWateringFrequency(oldPlant.wateringFrequencyDays),
      userId: oldPlant.userId || CURRENT_USER_ID,
      createdAt: oldPlant.createdAt || now,
      updatedAt: oldPlant.updatedAt || now
    };

    const transaction = db.transaction([STORE_PLANTS], 'readwrite');
    const store = transaction.objectStore(STORE_PLANTS);
    const request = store.add(plant);

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

function importSingleCareLog(oldLog, newPlantId) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const careLog = {
      plantId: newPlantId,
      type: oldLog.type || 'water',
      date: oldLog.date || now,
      note: oldLog.note || '',
      createdAt: oldLog.createdAt || now
    };

    const transaction = db.transaction([STORE_CARE_LOGS], 'readwrite');
    const store = transaction.objectStore(STORE_CARE_LOGS);
    const request = store.add(careLog);

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

function importSingleNote(oldNote, newPlantId) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const note = {
      plantId: newPlantId,
      text: oldNote.text || '',
      date: oldNote.date || now,
      createdAt: oldNote.createdAt || now
    };

    const transaction = db.transaction([STORE_NOTES], 'readwrite');
    const store = transaction.objectStore(STORE_NOTES);
    const request = store.add(note);

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

async function importAllData(importData) {
  try {
    console.log('▶ شروع بازیابی داده‌ها...');

    // ۱. پاک کردن همه داده‌های فعلی
    await clearAllData();

    // ۲. بازیابی گیاهان + ساخت نگاشت شناسه‌ها
    const idMap = {};
    const plants = importData.data.plants;

    for (let i = 0; i < plants.length; i++) {
      const oldPlant = plants[i];
      const oldId = oldPlant.id;
      const newId = await importSinglePlant(oldPlant);

      if (oldId !== undefined && oldId !== null) {
        idMap[oldId] = newId;
      }
    }

    console.log('✓ گیاهان بازیابی شد:', plants.length);

    // ۳. بازیابی فعالیت‌ها با نگاشت شناسه گیاه
    const careLogs = importData.data.careLogs;
    let importedLogs = 0;

    for (let i = 0; i < careLogs.length; i++) {
      const oldLog = careLogs[i];
      const newPlantId = idMap[oldLog.plantId];

      if (newPlantId !== undefined) {
        await importSingleCareLog(oldLog, newPlantId);
        importedLogs++;
      } else {
        console.warn('⚠ فعالیت با گیاه نامعلوم رد شد. plantId قدیمی:', oldLog.plantId);
      }
    }

    console.log('✓ فعالیت‌ها بازیابی شد:', importedLogs);

    // ۴. بازیابی یادداشت‌ها با نگاشت شناسه گیاه
    const notes = importData.data.notes;
    let importedNotes = 0;

    for (let i = 0; i < notes.length; i++) {
      const oldNote = notes[i];
      const newPlantId = idMap[oldNote.plantId];

      if (newPlantId !== undefined) {
        await importSingleNote(oldNote, newPlantId);
        importedNotes++;
      } else {
        console.warn('⚠ یادداشت با گیاه نامعلوم رد شد. plantId قدیمی:', oldNote.plantId);
      }
    }

    console.log('✓ یادداشت‌ها بازیابی شد:', importedNotes);
    console.log('✅ بازیابی با موفقیت انجام شد');

    return {
      success: true,
      plants: plants.length,
      careLogs: importedLogs,
      notes: importedNotes
    };

  } catch (error) {
    console.error('✗ خطا در بازیابی داده‌ها:', error);
    throw error;
  }
}