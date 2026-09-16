// PlantPal - مدیریت یادآوری‌ها
// این فایل مسئول یادآوری سیستمی (Notification) است.

// ============================================
// بخش ۱: تنظیمات اولیه
// ============================================

const NOTIFICATION_KEY = 'plantpal-notifications';
const NOTIFICATION_TIMES = ['08:00', '18:00'];

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
// بخش ۶: بررسی گیاهان نیازمند
// ============================================

async function checkPlantsForReminders() {
  try {
    const plants = await getAllPlants();

    const needWater = [];
    const needFertilize = [];

    for (const plant of plants) {
      const careLogs = await getCareLogsByPlantId(plant.id);

      const lastWaterDays = getDaysSinceLastActivity(careLogs, 'water');
      if (lastWaterDays === null || lastWaterDays >= 7) {
        needWater.push(plant.name);
      }

      const lastFertilizeDays = getDaysSinceLastActivity(careLogs, 'fertilize');
      if (lastFertilizeDays === null || lastFertilizeDays >= 30) {
        needFertilize.push(plant.name);
      }
    }

    return { needWater, needFertilize };

  } catch (error) {
    console.error('✗ خطا در بررسی گیاهان:', error);
    return { needWater: [], needFertilize: [] };
  }
}

function getDaysSinceLastActivity(careLogs, type) {
  if (!careLogs || careLogs.length === 0) return null;

  const filtered = careLogs.filter(function(log) {
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
// بخش ۷: بررسی زمان یادآوری
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
// بخش ۸: حلقه بررسی
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
      let body = '';

      if (reminders.needWater.length > 0) {
        body += '💧 نیاز به آبیاری: ' + reminders.needWater.join('، ');
      }

      if (reminders.needFertilize.length > 0) {
        if (body) body += '\n';
        body += '🍃 نیاز به کوددهی: ' + reminders.needFertilize.join('، ');
      }

      await showPlantNotification('🌱 PlantPal', body);
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
// بخش ۹: راه‌اندازی
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
// بخش ۱۰: به‌روزرسانی دکمه‌ها
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
// بخش ۱۱: فعال/غیرفعال کردن
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
// بخش ۱۲: تست یادآوری
// ============================================

async function testNotification() {
  if (getNotificationPermission() !== 'granted') {
    alert('اول یادآوری را فعال کنید.');
    return;
  }

  const reminders = await checkPlantsForReminders();

  let body = '';

  if (reminders.needWater.length > 0) {
    body += '💧 نیاز به آبیاری: ' + reminders.needWater.join('، ');
  }

  if (reminders.needFertilize.length > 0) {
    if (body) body += '\n';
    body += '🍃 نیاز به کوددهی: ' + reminders.needFertilize.join('، ');
  }

  if (!body) {
    body = '✅ همه گیاهان سالم هستند.';
  }

  await showPlantNotification('🌱 PlantPal', body);
  console.log('✓ یادآوری تست ارسال شد');
}