// PlantPal - داشبورد
// این فایل مسئول نمایش کارهای امروز، گیاهان نیازمند توجه و گیاهان سالم است.

// ============================================
// بخش ۱: تنظیمات
// ============================================

const DEFAULT_WATERING_THRESHOLD_DAYS = 7;
const FERTILIZING_THRESHOLD_DAYS = 30;

// ============================================
// بخش ۲: متغیرهای جستجو، فیلتر و مرتب‌سازی
// ============================================

let searchQuery = '';
let filterHealth = 'all';
let sortMode = 'newest';

const HEALTH_SORT_ORDER = {
  sick: 0,
  warning: 1,
  growing: 2,
  healthy: 3
};

// ============================================
// بخش ۳: توابع کمکی
// ============================================

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

function getDaysSinceLastWatering(careLogs) {
  return getDaysSinceLastActivity(careLogs, 'water');
}

function getDaysSinceLastFertilizing(careLogs) {
  return getDaysSinceLastActivity(careLogs, 'fertilize');
}

function getPlantWateringFrequency(plant) {
  const freq = parseInt(plant && plant.wateringFrequencyDays, 10);
  if (isNaN(freq) || freq < 1) {
    return DEFAULT_WATERING_THRESHOLD_DAYS;
  }
  return freq;
}

function needsWatering(plant, careLogs) {
  const days = getDaysSinceLastWatering(careLogs);
  const threshold = getPlantWateringFrequency(plant);

  if (days === null) return true;
  return days >= threshold;
}

function needsFertilizing(careLogs) {
  const days = getDaysSinceLastFertilizing(careLogs);
  if (days === null) return true;
  return days >= FERTILIZING_THRESHOLD_DAYS;
}

function getWateringStatusText(days) {
  if (days === null) return 'هرگز آبیاری نشده';
  if (days === 0) return 'امروز آبیاری شده';
  if (days === 1) return '۱ روز پیش آبیاری شده';
  return days + ' روز پیش آبیاری شده';
}

function getFertilizingStatusText(days) {
  if (days === null) return 'هرگز کوددهی نشده';
  if (days === 0) return 'امروز کوددهی شده';
  if (days === 1) return '۱ روز پیش کوددهی شده';
  return days + ' روز پیش کوددهی شده';
}

function getLastActivityText(careLogs) {
  if (!careLogs || careLogs.length === 0) return 'هیچ فعالیتی ثبت نشده';

  const last = careLogs[0];
  const type = last.type || 'water';
  const emoji = getCareTypeEmoji(type);
  const label = getCareTypeLabel(type);
  const days = getDaysSinceLastActivity(careLogs, type);

  if (days === 0) return emoji + ' ' + label + ' — امروز';
  if (days === 1) return emoji + ' ' + label + ' — ۱ روز پیش';
  return emoji + ' ' + label + ' — ' + days + ' روز پیش';
}

function getWateringScheduleText(plant) {
  const freq = getPlantWateringFrequency(plant);
  if (freq === 1) return 'هر روز';
  if (freq === 7) return 'هفتگی (هر 7 روز)';
  return 'هر ' + freq + ' روز';
}

// ============================================
// بخش ۴: جستجوی پیشرفته
// ============================================

function matchesSearch(plant, query) {
  if (!query) return true;

  const words = query.toLowerCase().trim().split(/\s+/).filter(function(w) {
    return w.length > 0;
  });

  if (words.length === 0) return true;

  const name = (plant.name || '').toLowerCase();
  const type = (plant.type || '').toLowerCase();
  const location = (plant.location || '').toLowerCase();

  // همه کلمات باید در حداقل یکی از فیلدها پیدا شوند (AND)
  return words.every(function(word) {
    return name.includes(word) || type.includes(word) || location.includes(word);
  });
}

// ============================================
// بخش ۵: فیلتر و مرتب‌سازی
// ============================================

function filterPlants(plants) {
  return plants.filter(function(plant) {
    if (!matchesSearch(plant, searchQuery)) {
      return false;
    }

    if (filterHealth !== 'all') {
      const health = plant.health || 'healthy';
      if (health !== filterHealth) {
        return false;
      }
    }

    return true;
  });
}

async function sortPlants(plants) {
  const sorted = plants.slice();

  if (sortMode === 'newest') {
    sorted.sort(function(a, b) {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  } else if (sortMode === 'name') {
    sorted.sort(function(a, b) {
      const na = (a.name || '').toLocaleLowerCase('fa');
      const nb = (b.name || '').toLocaleLowerCase('fa');
      return na.localeCompare(nb, 'fa');
    });
  } else if (sortMode === 'health') {
    sorted.sort(function(a, b) {
      const ha = HEALTH_SORT_ORDER[a.health] !== undefined ? HEALTH_SORT_ORDER[a.health] : 4;
      const hb = HEALTH_SORT_ORDER[b.health] !== undefined ? HEALTH_SORT_ORDER[b.health] : 4;
      return ha - hb;
    });
  } else if (sortMode === 'watering') {
    // نیازمندترین اول: نسبت روزهای گذشته به فاصله گیاه
    const ratios = {};
    for (const plant of sorted) {
      const logs = await getCareLogsByPlantId(plant.id);
      const days = getDaysSinceLastWatering(logs);
      const freq = getPlantWateringFrequency(plant);
      const ratio = days === null ? 9999 : (days / freq);
      ratios[plant.id] = ratio;
    }
    sorted.sort(function(a, b) {
      return (ratios[b.id] || 0) - (ratios[a.id] || 0);
    });
  }

  return sorted;
}

// ============================================
// بخش ۶: نمایش داشبورد
// ============================================

async function renderDashboard() {
  try {
    const allPlants = await getAllPlants();

    const todayTasksDiv = document.getElementById('today-tasks');
    const todayTasksList = document.getElementById('today-tasks-list');
    const attentionSection = document.getElementById('attention-plants-section');
    const attentionList = document.getElementById('attention-plants-list');
    const healthySection = document.getElementById('healthy-plants-section');
    const emptyState = document.getElementById('empty-state');
    const noResultsState = document.getElementById('no-results-state');

    if (allPlants.length === 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
      if (attentionSection) attentionSection.style.display = 'none';
      if (healthySection) healthySection.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (noResultsState) noResultsState.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const filtered = filterPlants(allPlants);

    if (filtered.length === 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
      if (attentionSection) attentionSection.style.display = 'none';
      if (healthySection) healthySection.style.display = 'none';
      if (noResultsState) noResultsState.style.display = 'block';
      return;
    }

    if (noResultsState) noResultsState.style.display = 'none';

    const plants = await sortPlants(filtered);

    const tasks = [];
    const healthyPlants = [];
    const attentionPlants = [];

    for (const plant of plants) {
      const careLogs = await getCareLogsByPlantId(plant.id);

      const waterDays = getDaysSinceLastWatering(careLogs);
      const fertilizeDays = getDaysSinceLastFertilizing(careLogs);

      const waterNeed = needsWatering(plant, careLogs);
      const fertilizeNeed = needsFertilizing(careLogs);

      if (waterNeed || fertilizeNeed) {
        tasks.push({
          plant: plant,
          waterDays: waterDays,
          fertilizeDays: fertilizeDays,
          waterNeed: waterNeed,
          fertilizeNeed: fertilizeNeed
        });
      } else {
        healthyPlants.push(plant);
      }

      const health = plant.health || 'healthy';
      if (health === 'warning' || health === 'sick') {
        attentionPlants.push(plant);
      }
    }

    attentionPlants.sort(function(a, b) {
      const order = { sick: 0, warning: 1 };
      const aOrder = order[a.health] !== undefined ? order[a.health] : 2;
      const bOrder = order[b.health] !== undefined ? order[b.health] : 2;
      return aOrder - bOrder;
    });

    if (tasks.length > 0) {
      if (todayTasksDiv) todayTasksDiv.style.display = 'block';
      if (todayTasksList) {
        todayTasksList.innerHTML = '';
        tasks.forEach(function(item) {
          const taskElement = createTodayTaskItem(item);
          todayTasksList.appendChild(taskElement);
        });
      }
    } else {
      if (todayTasksDiv) todayTasksDiv.style.display = 'none';
    }

    if (attentionPlants.length > 0) {
      if (attentionSection) attentionSection.style.display = 'block';
      if (attentionList) {
        attentionList.innerHTML = '';
        attentionPlants.forEach(function(plant) {
          const item = createAttentionItem(plant);
          attentionList.appendChild(item);
        });
      }
    } else {
      if (attentionSection) attentionSection.style.display = 'none';
    }

    if (healthyPlants.length > 0) {
      if (healthySection) healthySection.style.display = 'block';
      const plantsList = document.getElementById('plants-list');
      if (plantsList) {
        plantsList.innerHTML = '';
        for (const plant of healthyPlants) {
          const careLogs = await getCareLogsByPlantId(plant.id);
          const card = createPlantCard(plant, careLogs);
          plantsList.appendChild(card);
        }
      }
    } else {
      if (healthySection) healthySection.style.display = 'none';
    }

    console.log('✓ داشبورد نمایش داده شد');
    console.log('  - کل گیاهان:', allPlants.length);
    console.log('  - پس از فیلتر:', filtered.length);
    console.log('  - مرتب‌سازی:', sortMode);
    console.log('  - نیاز به مراقبت:', tasks.length);
    console.log('  - نیازمند توجه:', attentionPlants.length);
    console.log('  - سالم:', healthyPlants.length);

    if (typeof loadAllIcons === 'function') {
      await loadAllIcons();
    }

  } catch (error) {
    console.error('✗ خطا در نمایش داشبورد:', error);
  }
}

// ============================================
// بخش ۷: ساخت آیتم کار امروز
// ============================================

function createTodayTaskItem(item) {
  const plant = item.plant;
  const element = document.createElement('div');
  element.className = 'today-task-item';

  const info = document.createElement('div');
  info.className = 'today-task-info';

  const name = document.createElement('h4');
  name.className = 'today-task-name';
  name.textContent = plant.name;
  name.addEventListener('click', function() {
    openPlantDetails(plant.id);
  });

  info.appendChild(name);

  if (item.waterNeed) {
    const schedule = document.createElement('span');
    schedule.className = 'today-task-schedule';
    schedule.textContent = '📅 ' + getWateringScheduleText(plant) + ' آبیاری می‌شود';
    info.appendChild(schedule);

    const status = document.createElement('span');
    status.className = 'today-task-status';
    status.textContent = '💧 ' + getWateringStatusText(item.waterDays);
    info.appendChild(status);
  }

  if (item.fertilizeNeed) {
    const status = document.createElement('span');
    status.className = 'today-task-status';
    status.textContent = '🍃 ' + getFertilizingStatusText(item.fertilizeDays);
    info.appendChild(status);
  }

  const actions = document.createElement('div');
  actions.className = 'today-task-actions';

  if (item.waterNeed) {
    const waterBtn = document.createElement('button');
    waterBtn.className = 'btn btn-primary';
    waterBtn.textContent = '💧 آبیاری';
    waterBtn.addEventListener('click', function() {
      currentPlantId = plant.id;
      openAddCareModal();
      setTimeout(function() {
        if (typeof setSelectedCareType === 'function') {
          setSelectedCareType('water');
        }
      }, 100);
    });
    actions.appendChild(waterBtn);
  }

  if (item.fertilizeNeed) {
    const fertilizeBtn = document.createElement('button');
    fertilizeBtn.className = 'btn btn-secondary';
    fertilizeBtn.textContent = '🍃 کوددهی';
    fertilizeBtn.addEventListener('click', function() {
      currentPlantId = plant.id;
      openAddCareModal();
      setTimeout(function() {
        if (typeof setSelectedCareType === 'function') {
          setSelectedCareType('fertilize');
        }
      }, 100);
    });
    actions.appendChild(fertilizeBtn);
  }

  element.appendChild(info);
  element.appendChild(actions);

  return element;
}

// ============================================
// بخش ۸: ساخت آیتم گیاه نیازمند توجه
// ============================================

function createAttentionItem(plant) {
  const health = plant.health || 'healthy';

  const emoji = health === 'sick' ? '☹️' : '😐';
  const label = getHealthLabel(health);

  const item = document.createElement('div');
  item.className = 'attention-item';
  item.setAttribute('data-health', health);

  const info = document.createElement('div');
  info.className = 'attention-info';

  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'attention-emoji';
  emojiSpan.textContent = emoji;

  const text = document.createElement('div');
  text.className = 'attention-text';

  const name = document.createElement('h4');
  name.className = 'attention-name';
  name.textContent = plant.name;

  const status = document.createElement('span');
  status.className = 'attention-status';
  status.textContent = label;

  text.appendChild(name);
  text.appendChild(status);
  info.appendChild(emojiSpan);
  info.appendChild(text);

  const action = document.createElement('div');
  action.className = 'attention-action';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-secondary';
  viewBtn.textContent = 'مشاهده';
  viewBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    openPlantDetails(plant.id);
  });

  action.appendChild(viewBtn);

  item.appendChild(info);
  item.appendChild(action);

  item.addEventListener('click', function() {
    openPlantDetails(plant.id);
  });

  return item;
}

// ============================================
// بخش ۹: مدیریت جستجو
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
// بخش ۱۰: مدیریت فیلترها
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

// ============================================
// بخش ۱۱: مدیریت مرتب‌سازی
// ============================================

function setupSort() {
  const select = document.getElementById('sort-select');
  if (!select) return;

  select.addEventListener('change', function() {
    sortMode = select.value;
    console.log('✓ حالت مرتب‌سازی:', sortMode);
    renderDashboard();
  });

  console.log('✓ مرتب‌سازی راه‌اندازی شد');
}
// ============================================
// بخش ۱۲: مدیریت باز/بسته کردن پنل جستجو
// ============================================

function setupSearchToggle() {
  const btn = document.getElementById('btn-open-search');
  const panel = document.getElementById('search-panel');

  if (!btn || !panel) {
    console.warn('⚠ دکمه جستجو یا پنل پیدا نشد');
    return;
  }

  btn.addEventListener('click', function() {
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      const input = document.getElementById('search-input');
      if (input) {
        setTimeout(function() { input.focus(); }, 100);
      }
    }

    btn.classList.toggle('active', !isVisible);
  });

  console.log('✓ پنل جستجو راه‌اندازی شد');
}

document.addEventListener('DOMContentLoaded', function() {
  setupSearchToggle();
});