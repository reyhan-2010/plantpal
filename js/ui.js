// PlantPal - مدیریت رابط کاربری (UI)
// این فایل مسئول نمایش و مخفی کردن صفحه‌هاست.

// ============================================
// بخش ۱: تنظیمات اولیه
// ============================================

const PAGES = {
  HOME: 'page-home',
  ADD: 'page-add',
  DETAILS: 'page-details',
  REPORTS: 'page-reports',
  SETTINGS: 'page-settings'
};

// ============================================
// بخش ۲: مدیریت صفحه‌ها
// ============================================

function showPage(pageId) {
  const allPages = document.querySelectorAll('.page');
  allPages.forEach(function(page) {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
    console.log('✓ صفحه نمایش داده شد:', pageId);
  } else {
    console.error('✗ صفحه پیدا نشد:', pageId);
  }
}

function showHomePage() {
  showPage(PAGES.HOME);
}

function showAddPage() {
  showPage(PAGES.ADD);
}

function showDetailsPage() {
  showPage(PAGES.DETAILS);
}

function showReportsPage() {
  showPage(PAGES.REPORTS);
}

function showSettingsPage() {
  showPage(PAGES.SETTINGS);
}

// ============================================
// بخش ۳: مدیریت پیام‌های خالی
// ============================================

function toggleEmptyPlantsState(isEmpty) {
  const emptyState = document.getElementById('empty-state');
  const plantsList = document.getElementById('plants-list');

  if (!emptyState || !plantsList) return;

  if (isEmpty) {
    emptyState.style.display = 'block';
    plantsList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    plantsList.style.display = 'grid';
  }
}

function toggleEmptyCareLogsState(isEmpty) {
  const emptyState = document.getElementById('empty-care-logs');
  const careLogsList = document.getElementById('care-logs-list');

  if (!emptyState || !careLogsList) return;

  if (isEmpty) {
    emptyState.style.display = 'block';
    careLogsList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    careLogsList.style.display = 'block';
  }
}

// ============================================
// بخش ۴: پاک کردن و پر کردن فرم
// ============================================

function clearAddForm() {
  const form = document.getElementById('form-add-plant');
  if (form) {
    form.reset();
    selectedHealth = 'healthy';
    setSelectedHealth('healthy');
    console.log('✓ فرم پاک شد');
  }
}

function fillAddForm(plant) {
  document.getElementById('add-name').value = plant.name || '';
  document.getElementById('add-type').value = plant.type || '';
  document.getElementById('add-location').value = plant.location || '';
  setSelectedHealth(plant.health || 'healthy');
}

// ============================================
// بخش ۵: وضعیت سلامت
// ============================================

function setSelectedHealth(health) {
  selectedHealth = health;

  const healthInput = document.getElementById('add-health');
  if (healthInput) {
    healthInput.value = health;
  }

  updateHealthButtons(health);

  console.log('✓ وضعیت سلامت انتخاب شد:', health);
}

function getHealthLabel(health) {
  const labels = {
    'healthy': 'سالم',
    'growing': 'در حال رشد',
    'warning': 'نیاز به توجه',
    'sick': 'بیمار'
  };
  return labels[health] || 'سالم';
}

function getHealthIcon(health) {
  const icons = {
    'healthy': 'health-healthy',
    'growing': 'health-growing',
    'warning': 'health-warning',
    'sick': 'health-sick'
  };
  return icons[health] || 'health-healthy';
}

function updateHealthButtons(health) {
  const healthButtons = document.querySelectorAll('[data-health]');
  healthButtons.forEach(function(btn) {
    const btnHealth = btn.getAttribute('data-health');
    if (btnHealth === health) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}