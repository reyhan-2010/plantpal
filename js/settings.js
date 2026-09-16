// PlantPal - مدیریت تنظیمات
// این فایل مسئول صفحه تنظیمات است.

// ============================================
// بخش ۱: راه‌اندازی
// ============================================

function initSettings() {
  console.log('✓ تنظیمات راه‌اندازی شد');

  // دکمه‌های تم
  const themeButtons = document.querySelectorAll('[data-theme-option]');
  themeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const theme = btn.getAttribute('data-theme-option');
      setTheme(theme);
    });
  });

  console.log('✓ دکمه‌های تم متصل شدند. تعداد:', themeButtons.length);

  // دکمه‌های تاریخ
  const dateButtons = document.querySelectorAll('[data-date-format]');
  dateButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const format = btn.getAttribute('data-date-format');
      setDateFormat(format);

      if (typeof renderDashboard === 'function') {
        renderDashboard();
      }
      if (typeof currentPlantId !== 'undefined' && currentPlantId) {
        renderCareLogs(currentPlantId);
      }
    });
  });

  console.log('✓ دکمه‌های فرمت تاریخ متصل شدند. تعداد:', dateButtons.length);

  // دکمه‌های وضعیت سلامت
  const healthButtons = document.querySelectorAll('[data-health]');
  healthButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const health = btn.getAttribute('data-health');
      setSelectedHealth(health);
    });
  });

  console.log('✓ دکمه‌های وضعیت سلامت متصل شدند. تعداد:', healthButtons.length);

  // دکمه‌های یادآوری
  setupNotificationButtons();

  // به‌روزرسانی وضعیت
  if (typeof updateNotificationButtons === 'function') {
    updateNotificationButtons();
  }
}

// ============================================
// بخش ۲: دکمه‌های یادآوری
// ============================================

function setupNotificationButtons() {
  const btnToggle = document.getElementById('btn-toggle-notifications');
  if (btnToggle) {
    btnToggle.addEventListener('click', function() {
      console.log('🔔 کلیک روی دکمه فعال‌سازی یادآوری');
      if (typeof toggleNotifications === 'function') {
        toggleNotifications();
      } else {
        console.error('✗ تابع toggleNotifications وجود ندارد');
      }
    });
    console.log('✓ دکمه فعال‌سازی یادآوری متصل شد');
  } else {
    console.warn('⚠ دکمه btn-toggle-notifications پیدا نشد');
  }

  const btnTest = document.getElementById('btn-test-notification');
  if (btnTest) {
    btnTest.addEventListener('click', function() {
      console.log('🔔 کلیک روی دکمه تست یادآوری');
      if (typeof testNotification === 'function') {
        testNotification();
      } else {
        console.error('✗ تابع testNotification وجود ندارد');
      }
    });
    console.log('✓ دکمه تست یادآوری متصل شد');
  } else {
    console.warn('⚠ دکمه btn-test-notification پیدا نشد');
  }
}