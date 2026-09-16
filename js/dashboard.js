// PlantPal - داشبورد
// این فایل مسئول نمایش کارهای امروز و گیاهان سالم است.

// ============================================
// بخش ۱: تنظیمات
// ============================================

const WATERING_THRESHOLD_DAYS = 7;

// ============================================
// بخش ۲: متغیرهای جستجو و فیلتر
// ============================================

let searchQuery = '';
let filterHealth = 'all';

// ============================================
// بخش ۳: توابع کمکی
// ============================================

function getDaysSinceLastWatering(careLogs) {
  if (!careLogs || careLogs.length === 0) {
    return null;
  }

  // آخرین فعالیت آبیاری
  const waterLogs = careLogs.filter(function(log) {
    return !log.type || log.type === 'water';
  });

  if (waterLogs.length === 0) {
    return null;
  }

  const lastLog = waterLogs[0];
  const lastDate = new Date(lastLog.date);
  const now = new Date();
  const diffMs = now - lastDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function needsWatering(careLogs) {
  const days = getDaysSinceLastWatering(careLogs);
  if (days === null) return true;
  return days >= WATERING_THRESHOLD_DAYS;
}

function getWateringStatusText(days) {
  if (days === null) return 'هرگز آبیاری نشده';
  if (days === 0) return 'امروز آبیاری شده';
  if (days === 1) return '۱ روز پیش آبیاری شده';
  return days + ' روز پیش آبیاری شده';
}

// ============================================
// بخش ۴: فیلتر کردن گیاهان
// ============================================

function filterPlants(plants) {
  return plants.filter(function(plant) {
    // فیلتر جستجو
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      const name = (plant.name || '').toLowerCase();
      const type = (plant.type || '').toLowerCase();
      const location = (plant.location || '').toLowerCase();

      if (!name.includes(query) && !type.includes(query) && !location.includes(query)) {
        return false;
      }
    }

    // فیلتر سلامت
    if (filterHealth !== 'all') {
      const health = plant.health || 'healthy';
      if (health !== filterHealth) {
        return false;
      }
    }

    return true;
  });
}

// ============================================
// بخش ۵: نمایش داشبورد
// ============================================

async function renderDashboard() {
  try {
    const allPlants = await getAllPlants();

    const todayTasksDiv = document.getElementById('today-tasks');
    const todayTasksList = document.getElementById('today-tasks-list');
    const healthySection = document.getElementById('healthy-plants-section');
    const emptyState = document.getElementById('empty-state');
    const noResultsState = document.getElementById('no-results-state');

    if (allPlants.length === 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
      if (healthySection) healthySection.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (noResultsState) noResultsState.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // اعمال فیلترها
    const plants = filterPlants(allPlants);

    if (plants.length === 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
      if (healthySection) healthySection.style.display = 'none';
      if (noResultsState) noResultsState.style.display = 'block';
      return;
    }

    if (noResultsState) noResultsState.style.display = 'none';

    const plantsNeedingWater = [];
    const healthyPlants = [];

    for (const plant of plants) {
      const careLogs = await getCareLogsByPlantId(plant.id);
      const days = getDaysSinceLastWatering(careLogs);

      if (needsWatering(careLogs)) {
        plantsNeedingWater.push({
          plant: plant,
          days: days
        });
      } else {
        healthyPlants.push(plant);
      }
    }

    if (plantsNeedingWater.length > 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'block';
      if (todayTasksList) {
        todayTasksList.innerHTML = '';
        plantsNeedingWater.forEach(function(item) {
          const taskElement = createTodayTaskItem(item.plant, item.days);
          todayTasksList.appendChild(taskElement);
        });
      }
    } else {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
    }

    if (healthyPlants.length > 0) {
      if (healthySection) healthySection.style.display = 'block';
      const plantsList = document.getElementById('plants-list');
      if (plantsList) {
        plantsList.innerHTML = '';
        healthyPlants.forEach(function(plant) {
          const card = createPlantCard(plant);
          plantsList.appendChild(card);
        });
      }
    } else {
      if (healthySection) healthySection.style.display = 'none';
    }

    console.log('✓ داشبورد نمایش داده شد');
    console.log('  - کل گیاهان:', allPlants.length);
    console.log('  - پس از فیلتر:', plants.length);
    console.log('  - نیاز به آبیاری:', plantsNeedingWater.length);
    console.log('  - سالم:', healthyPlants.length);

    // بارگذاری مجدد آیکون‌ها
    if (typeof loadAllIcons === 'function') {
      await loadAllIcons();
    }

  } catch (error) {
    console.error('✗ خطا در نمایش داشبورد:', error);
  }
}

// ============================================
// بخش ۶: ساخت آیتم کار امروز
// ============================================

function createTodayTaskItem(plant, days) {
  const item = document.createElement('div');
  item.className = 'today-task-item';

  const info = document.createElement('div');
  info.className = 'today-task-info';

  const name = document.createElement('h4');
  name.className = 'today-task-name';
  name.textContent = plant.name;
  name.addEventListener('click', function() {
    openPlantDetails(plant.id);
  });

  const status = document.createElement('span');
  status.className = 'today-task-status';
  status.textContent = getWateringStatusText(days);

  info.appendChild(name);
  info.appendChild(status);

  const actions = document.createElement('div');
  actions.className = 'today-task-actions';

  const waterBtn = document.createElement('button');
  waterBtn.className = 'btn btn-primary';
  waterBtn.textContent = 'ثبت فعالیت';
  waterBtn.addEventListener('click', function() {
    currentPlantId = plant.id;
    openAddCareModal();
  });

  actions.appendChild(waterBtn);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}

// ============================================
// بخش ۷: مدیریت جستجو
// ============================================

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchQuery = searchInput.value;

      if (clearBtn) {
        if (searchQuery) {
          clearBtn.style.display = 'flex';
        } else {
          clearBtn.style.display = 'none';
        }
      }

      renderDashboard();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      clearBtn.style.display = 'none';
      renderDashboard();
    });
  }

  console.log('✓ جستجو راه‌اندازی شد');
}

// ============================================
// بخش ۸: مدیریت فیلترها
// ============================================

function setupFilters() {
  const toggleBtn = document.getElementById('btn-toggle-filters');
  const filtersPanel = document.getElementById('filters-panel');

  if (toggleBtn && filtersPanel) {
    toggleBtn.addEventListener('click', function() {
      const isVisible = filtersPanel.style.display !== 'none';
      filtersPanel.style.display = isVisible ? 'none' : 'block';
    });
  }

  const filterButtons = document.querySelectorAll('[data-filter-health]');
  filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterHealth = btn.getAttribute('data-filter-health');

      filterButtons.forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      renderDashboard();
    });
  });

  console.log('✓ فیلترها راه‌اندازی شد');
}