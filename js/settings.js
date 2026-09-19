// PlantPal - مدیریت تنظیمات
// این فایل مسئول صفحه تنظیمات است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let pendingImportData = null;
let pendingImportFileName = '';

// ============================================
// بخش ۲: راه‌اندازی
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

  // دکمه‌های پشتیبان‌گیری
  setupBackupButtons();

  // به‌روزرسانی وضعیت
  if (typeof updateNotificationButtons === 'function') {
    updateNotificationButtons();
  }

  // به‌روزرسانی آمار پشتیبان
  refreshBackupStats();

  // به‌روزرسانی آمار هر بار که صفحه تنظیمات باز می‌شود
  const openSettingsBtn = document.getElementById('btn-open-settings');
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', function() {
      setTimeout(refreshBackupStats, 200);
    });
  }
}

// ============================================
// بخش ۳: دکمه‌های یادآوری
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

// ============================================
// بخش ۴: پشتیبان‌گیری — نمایش آمار
// ============================================

async function refreshBackupStats() {
  const plantsEl = document.getElementById('backup-stat-plants');
  const logsEl = document.getElementById('backup-stat-logs');
  const notesEl = document.getElementById('backup-stat-notes');

  if (!plantsEl || !logsEl || !notesEl) return;

  try {
    const stats = await getBackupStats();
    plantsEl.textContent = String(stats.plants);
    logsEl.textContent = String(stats.careLogs);
    notesEl.textContent = String(stats.notes);
    console.log('✓ آمار پشتیبان به‌روزرسانی شد');
  } catch (error) {
    console.error('✗ خطا در خواندن آمار پشتیبان:', error);
    plantsEl.textContent = '—';
    logsEl.textContent = '—';
    notesEl.textContent = '—';
  }
}

// ============================================
// بخش ۵: پشتیبان‌گیری — دکمه‌ها
// ============================================

function setupBackupButtons() {
  // دکمه Export
  const exportBtn = document.getElementById('btn-export-backup');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      openExportModal();
    });
    console.log('✓ دکمه دانلود پشتیبان متصل شد');
  }

  // دکمه Import
  const importBtn = document.getElementById('btn-import-backup');
  if (importBtn) {
    importBtn.addEventListener('click', function() {
      openFilePicker();
    });
    console.log('✓ دکمه بازیابی از فایل متصل شد');
  }

  // فایل input
  const fileInput = document.getElementById('import-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', function(event) {
      handleFileSelected(event);
    });
  }

  // دکمه‌های Modal Export
  const confirmExportBtn = document.getElementById('btn-confirm-export');
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', function() {
      handleConfirmExport();
    });
  }

  const cancelExportBtn = document.getElementById('btn-cancel-export');
  if (cancelExportBtn) {
    cancelExportBtn.addEventListener('click', function() {
      closeExportModal();
    });
  }

  const closeExportBtn = document.getElementById('btn-close-export-modal');
  if (closeExportBtn) {
    closeExportBtn.addEventListener('click', function() {
      closeExportModal();
    });
  }

  // دکمه‌های Modal Import
  const confirmImportBtn = document.getElementById('btn-confirm-import');
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', function() {
      handleConfirmImport();
    });
  }

  const cancelImportBtn = document.getElementById('btn-cancel-import');
  if (cancelImportBtn) {
    cancelImportBtn.addEventListener('click', function() {
      closeImportModal();
    });
  }

  const closeImportBtn = document.getElementById('btn-close-import-modal');
  if (closeImportBtn) {
    closeImportBtn.addEventListener('click', function() {
      closeImportModal();
    });
  }
}

// ============================================
// بخش ۶: Modal Export
// ============================================

function openExportModal() {
  const modal = document.getElementById('modal-export-backup');
  if (modal) {
    modal.classList.add('active');
    console.log('✓ Modal پشتیبان باز شد');
  }
}

function closeExportModal() {
  const modal = document.getElementById('modal-export-backup');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal پشتیبان بسته شد');
  }
}

async function handleConfirmExport() {
  const btn = document.getElementById('btn-confirm-export');
  const includeImagesEl = document.getElementById('export-include-images');
  const includeImages = includeImagesEl ? includeImagesEl.checked : true;

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ در حال آماده‌سازی...';
  }

  try {
    const exportData = await exportAllData(includeImages);
    const filename = downloadBackupFile(exportData);

    closeExportModal();

    setTimeout(function() {
      alert('✅ نسخه پشتیبان با موفقیت دانلود شد.\n\nنام فایل: ' + filename);
    }, 200);

  } catch (error) {
    console.error('✗ خطا در ساخت پشتیبان:', error);
    alert('❌ خطا در ساخت نسخه پشتیبان. لطفاً دوباره تلاش کن.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 دانلود فایل';
    }
  }
}

// ============================================
// بخش ۷: Import — انتخاب فایل
// ============================================

function openFilePicker() {
  const fileInput = document.getElementById('import-file-input');
  if (!fileInput) {
    console.error('✗ فایل input پیدا نشد');
    return;
  }

  // پاک کردن مقدار قبلی تا امکان انتخاب همان فایل دوباره باشد
  fileInput.value = '';

  fileInput.click();
  console.log('✓ پنجره انتخاب فایل باز شد');
}

function handleFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  console.log('✓ فایل انتخاب شد:', file.name);
  pendingImportFileName = file.name;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const content = e.target.result;
      const data = JSON.parse(content);

      const validation = validateBackupData(data);

      if (!validation.valid) {
        const errorMsg = validation.errors.join('\n');
        alert('❌ فایل معتبر نیست:\n\n' + errorMsg);
        console.error('✗ اعتبارسنجی فایل شکست خورد:', validation.errors);
        return;
      }

      pendingImportData = data;
      openImportModal(data, file.name);

    } catch (error) {
      console.error('✗ خطا در خواندن فایل:', error);
      alert('❌ خطا در خواندن فایل. مطمئن شو فایل یک JSON معتبر است.');
    }
  };

  reader.onerror = function() {
    console.error('✗ خطا در خواندن فایل');
    alert('❌ خطا در خواندن فایل.');
  };

  reader.readAsText(file, 'utf-8');
}

// ============================================
// بخش ۸: Modal Import
// ============================================

function openImportModal(data, filename) {
  const modal = document.getElementById('modal-import-backup');
  if (!modal) return;

  // نام فایل
  const nameEl = document.getElementById('import-filename');
  if (nameEl) nameEl.textContent = filename;

  // تاریخ پشتیبان
  const dateEl = document.getElementById('import-date');
  if (dateEl) {
    const exportDate = data.metadata && data.metadata.exportDate;
    if (exportDate && typeof formatDate === 'function') {
      dateEl.textContent = formatDate(exportDate);
    } else if (exportDate) {
      dateEl.textContent = exportDate;
    } else {
      dateEl.textContent = '—';
    }
  }

  // شامل عکس
  const hasImagesEl = document.getElementById('import-has-images');
  if (hasImagesEl) {
    const includes = data.metadata && data.metadata.includesImages;
    hasImagesEl.textContent = includes ? '✅ بله' : '❌ خیر';
  }

  // آمار
  const plantsCount = (data.data.plants || []).length;
  const logsCount = (data.data.careLogs || []).length;
  const notesCount = (data.data.notes || []).length;

  const plantsStatEl = document.getElementById('import-stat-plants');
  if (plantsStatEl) plantsStatEl.textContent = String(plantsCount);

  const logsStatEl = document.getElementById('import-stat-logs');
  if (logsStatEl) logsStatEl.textContent = String(logsCount);

  const notesStatEl = document.getElementById('import-stat-notes');
  if (notesStatEl) notesStatEl.textContent = String(notesCount);

  modal.classList.add('active');
  console.log('✓ Modal بازیابی باز شد');
}

function closeImportModal() {
  const modal = document.getElementById('modal-import-backup');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal بازیابی بسته شد');
  }

  // پاک کردن متغیرها
  pendingImportData = null;
  pendingImportFileName = '';

  // پاک کردن input فایل
  const fileInput = document.getElementById('import-file-input');
  if (fileInput) fileInput.value = '';
}

async function handleConfirmImport() {
  if (!pendingImportData) {
    alert('❌ فایل پشتیبان در دسترس نیست.');
    return;
  }

  const btn = document.getElementById('btn-confirm-import');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ در حال بازیابی...';
  }

  try {
    const result = await importAllData(pendingImportData);

    closeImportModal();

    alert(
      '✅ بازیابی با موفقیت انجام شد.\n\n' +
      'گیاهان: ' + result.plants + '\n' +
      'فعالیت‌ها: ' + result.careLogs + '\n' +
      'یادداشت‌ها: ' + result.notes + '\n\n' +
      'صفحه دوباره بازخوانی می‌شود...'
    );

    // رفرش صفحه بعد از بستن پیام
    setTimeout(function() {
      window.location.reload();
    }, 500);

  } catch (error) {
    console.error('✗ خطا در بازیابی:', error);
    alert('❌ خطا در بازیابی داده‌ها. لطفاً دوباره تلاش کن.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚠️ بله، بازیابی کن';
    }
  }
}