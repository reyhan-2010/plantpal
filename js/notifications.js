// PlantPal - مدیریت یادآوری‌ها
// این فایل مسئول یادآوری سیستمی (Notification) است.

// ============================================
// بخش ۱: تنظیمات اولیه
// ============================================

const NOTIFICATION_KEY = 'plantpal-notifications';
const NOTIFICATION_TIMES = ['08:00', '18:00'];

const DEFAULT_WATERING_FREQ = 7;
const FERTILIZING_FREQ = 30;

let notificationCheckInterval = null;

// ============================================
// بخش ۲: بررسی پشتیبانی
// ============================================

function isNotificationSupported() {
  return 'Notification' in window;
}

function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// ============================================
// بخش ۳: درخواست اجازه
// ============================================

async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    alert('مرورگر شما از یادآوری پشتیبانی نمی‌کند.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✓ اجازه یادآوری داده شد');
      saveNotificationEnabled(true);
      updateNotificationButtons();
      return true;
    } else {
      console.log('✗ اجازه یادآوری داده نشد');
      alert('برای دریافت یادآوری، باید اجازه بدهید.');
      return false;
    }
  } catch (error) {
    console.error('✗ خطا در درخواست اجازه:', error);
    return false;
  }
}

// ============================================
// بخش ۴: ذخیره و بازیابی
// ============================================

function isNotificationEnabled() {
  return localStorage.getItem(NOTIFICATION_KEY) === 'true';
}

function saveNotificationEnabled(enabled) {
  localStorage.setItem(NOTIFICATION_KEY, enabled ? 'true' : 'false');
  console.log('✓ وضعیت یادآوری ذخیره شد:', enabled);
}

// ============================================
// بخش ۵: نمایش یادآوری
// ============================================

async function showPlantNotification(title, body) {
  if (!isNotificationEnabled()) return;

  if (getNotificationPermission() !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body: body,
        icon: 'assets/icons/icon-512.png',
        badge: 'assets/icons/icon-512.png',
        dir: 'rtl',
        lang: 'fa',
        tag: 'plantpal-reminder',
        requireInteraction: false
      });
    } else {
      new Notification(title, {
        body: body,
        icon: 'assets/icons/icon-512.png',
        dir: 'rtl',
        lang: 'fa'
      });
    }

    console.log('✓ یادآوری نمایش داده شد:', title);
  } catch (error) {
    console.error('✗ خطا در نمایش یادآوری:', error);
  }
}

// ============================================
// بخش ۶: توابع کمکی
// ============================================

function getPlantWateringFreq(plant) {
  const freq = parseInt(plant && plant.wateringFrequencyDays, 10);
  if (isNaN(freq) || freq < 1) {
    return DEFAULT_WATERING_FREQ;
  }
  return freq;
}

function getDaysSinceLastActivity(careLogs, type) {
  if (!careLogs || careLogs.length === 0) return null;

  const filtered = careLogs.filter(function(log) {
    if (type === 'water') {
      return !log.type || log.type === 'water';
    }
    return log.type === type;
  });

  if (filtered.length === 0) return null;

  const last = filtered[0];
  const lastDate = new Date(last.date);
  const now = new Date();
  const diffMs = now - lastDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================
// بخش ۷: بررسی گیاهان نیازمند
// ============================================

async function checkPlantsForReminders() {
  try {
    const plants = await getAllPlants();

    const needWater = [];
    const needFertilize = [];

    for (const plant of plants) {
      const careLogs = await getCareLogsByPlantId(plant.id);

      // فاصله‌ی مخصوص همین گیاه
      const waterFreq = getPlantWateringFreq(plant);

      const lastWaterDays = getDaysSinceLastActivity(careLogs, 'water');

      if (lastWaterDays === null || lastWaterDays >= waterFreq) {
        const daysText = lastWaterDays === null
          ? 'هرگز آبیاری نشده'
          : lastWaterDays + ' روز از آبیاری گذشته';

        needWater.push({
          name: plant.name,
          days: lastWaterDays,
          text: plant.name + ' (' + daysText + ')'
        });
      }

      const lastFertilizeDays = getDaysSinceLastActivity(careLogs, 'fertilize');
      if (lastFertilizeDays === null || lastFertilizeDays >= FERTILIZING_FREQ) {
        const daysText = lastFertilizeDays === null
          ? 'هرگز کوددهی نشده'
          : lastFertilizeDays + ' روز از کوددهی گذشته';

        needFertilize.push({
          name: plant.name,
          days: lastFertilizeDays,
          text: plant.name + ' (' + daysText + ')'
        });
      }
    }

    return {
      needWater: needWater,
      needFertilize: needFertilize
    };

  } catch (error) {
    console.error('✗ خطا در بررسی گیاهان:', error);
    return { needWater: [], needFertilize: [] };
  }
}

// ============================================
// بخش ۸: ساخت متن نوتیفیکیشن
// ============================================

function buildNotificationBody(reminders) {
  const parts = [];

  if (reminders.needWater.length > 0) {
    const names = reminders.needWater.map(function(item) {
      return '• ' + item.text;
    }).join('\n');
    parts.push('💧 نیاز به آبیاری:\n' + names);
  }

  if (reminders.needFertilize.length > 0) {
    const names = reminders.needFertilize.map(function(item) {
      return '• ' + item.text;
    }).join('\n');
    parts.push('🍃 نیاز به کوددهی:\n' + names);
  }

  return parts.join('\n\n');
}

// ============================================
// بخش ۹: بررسی زمان یادآوری
// ============================================

function isNotificationTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = hours + ':' + minutes;

  return NOTIFICATION_TIMES.includes(currentTime);
}

function wasNotificationSentToday() {
  const today = new Date().toISOString().split('T')[0];
  const lastSent = localStorage.getItem('plantpal-last-notification');
  return lastSent === today;
}

function saveNotificationSent() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('plantpal-last-notification', today);
}

// ============================================
// بخش ۱۰: حلقه بررسی
// ============================================

function startNotificationCheck() {
  if (notificationCheckInterval) return;

  notificationCheckInterval = setInterval(async function() {
    if (!isNotificationEnabled()) return;
    if (getNotificationPermission() !== 'granted') return;
    if (!isNotificationTime()) return;
    if (wasNotificationSentToday()) return;

    const reminders = await checkPlantsForReminders();

    if (reminders.needWater.length > 0 || reminders.needFertilize.length > 0) {
      const body = buildNotificationBody(reminders);
      await showPlantNotification('🌱 PlantPal — یادآوری', body);
      saveNotificationSent();
    }
  }, 60000);

  console.log('✓ بررسی یادآوری شروع شد');
}

function stopNotificationCheck() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
    console.log('✓ بررسی یادآوری متوقف شد');
  }
}

// ============================================
// بخش ۱۱: راه‌اندازی
// ============================================

function initNotifications() {
  console.log('✓ یادآوری راه‌اندازی شد');
  console.log('  - پشتیبانی:', isNotificationSupported());
  console.log('  - اجازه:', getNotificationPermission());
  console.log('  - فعال:', isNotificationEnabled());

  if (isNotificationEnabled()) {
    startNotificationCheck();
  }
}

// ============================================
// بخش ۱۲: به‌روزرسانی دکمه‌ها
// ============================================

function updateNotificationButtons() {
  const btn = document.getElementById('btn-toggle-notifications');
  if (!btn) return;

  if (isNotificationEnabled()) {
    btn.textContent = 'غیرفعال کردن یادآوری';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = 'فعال‌سازی یادآوری';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
  }

  const statusDiv = document.getElementById('notification-status');
  if (statusDiv) {
    if (isNotificationEnabled()) {
      statusDiv.textContent = '✅ یادآوری فعال است';
      statusDiv.className = 'notification-status active';
    } else {
      statusDiv.textContent = '⭕ یادآوری غیرفعال است';
      statusDiv.className = 'notification-status';
    }
  }
}

// ============================================
// بخش ۱۳: فعال/غیرفعال کردن
// ============================================

async function toggleNotifications() {
  if (isNotificationEnabled()) {
    saveNotificationEnabled(false);
    stopNotificationCheck();
    updateNotificationButtons();
    console.log('✓ یادآوری غیرفعال شد');
  } else {
    const granted = await requestNotificationPermission();
    if (granted) {
      startNotificationCheck();
      updateNotificationButtons();
      console.log('✓ یادآوری فعال شد');
    }
  }
}

// ============================================
// بخش ۱۴: تست یادآوری
// ============================================

async function testNotification() {
  if (getNotificationPermission() !== 'granted') {
    alert('اول یادآوری را فعال کنید.');
    return;
  }

  const reminders = await checkPlantsForReminders();

  let body = '';

  if (reminders.needWater.length > 0 || reminders.needFertilize.length > 0) {
    body = buildNotificationBody(reminders);
  } else {
    body = '✅ همه گیاهان سالم هستند.';
  }

  await showPlantNotification('🌱 PlantPal — تست', body);
  console.log('✓ یادآوری تست ارسال شد');
}