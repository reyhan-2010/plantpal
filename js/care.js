// PlantPal - مدیریت مراقبت از گیاه
// این فایل مسئول ثبت، نمایش و حذف تاریخچه فعالیت‌هاست.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let currentCarePlantId = null;
let currentCareType = 'water';

// ============================================
// بخش ۲: تنظیمات انواع فعالیت
// ============================================

const CARE_TYPES = {
  water: { emoji: '💧', label: 'آبیاری' },
  fertilize: { emoji: '🍃', label: 'کوددهی' },
  prune: { emoji: '✂️', label: 'هرس' },
  repot: { emoji: '🪴', label: 'تعویض گلدان' },
  cutting: { emoji: '🌿', label: 'قلمه‌زنی' }
};

function getCareTypeLabel(type) {
  return (CARE_TYPES[type] && CARE_TYPES[type].label) || 'آبیاری';
}

function getCareTypeEmoji(type) {
  return (CARE_TYPES[type] && CARE_TYPES[type].emoji) || '💧';
}

// ============================================
// بخش ۳: باز و بسته کردن Modal
// ============================================

function openAddCareModal() {
  if (!currentPlantId) {
    console.error('✗ شناسه گیاه موجود نیست');
    return;
  }

  currentCarePlantId = currentPlantId;

  setSelectedCareType('water');

  const dateInput = document.getElementById('care-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
  }

  const noteInput = document.getElementById('care-note');
  if (noteInput) {
    noteInput.value = '';
  }

  const modal = document.getElementById('modal-add-care');
  if (modal) {
    modal.classList.add('active');
    console.log('✓ Modal ثبت فعالیت باز شد');
  }
}

function closeAddCareModal() {
  const modal = document.getElementById('modal-add-care');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal ثبت فعالیت بسته شد');
  }
}

// ============================================
// بخش ۴: انتخاب نوع فعالیت
// ============================================

function setSelectedCareType(type) {
  currentCareType = type;

  const typeInput = document.getElementById('care-type');
  if (typeInput) {
    typeInput.value = type;
  }

  const typeButtons = document.querySelectorAll('[data-care-type]');
  typeButtons.forEach(function(btn) {
    const btnType = btn.getAttribute('data-care-type');
    if (btnType === type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setupCareTypeButtons() {
  const typeButtons = document.querySelectorAll('[data-care-type]');
  typeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const type = btn.getAttribute('data-care-type');
      setSelectedCareType(type);
    });
  });
  console.log('✓ دکمه‌های نوع فعالیت متصل شدند. تعداد:', typeButtons.length);
}

// ============================================
// بخش ۵: ذخیره فعالیت
// ============================================

async function handleAddCare(event) {
  event.preventDefault();

  try {
    const date = document.getElementById('care-date').value;
    const note = document.getElementById('care-note').value.trim();

    if (!date) {
      alert('تاریخ اجباری است.');
      return;
    }

    const careLogData = {
      plantId: currentCarePlantId,
      type: currentCareType,
      date: new Date(date).toISOString(),
      note: note
    };

    await saveCareLog(careLogData);
    console.log('✓ فعالیت ثبت شد. نوع:', currentCareType);

    // ✨ به‌روزرسانی XP، Streak و Heatmap
    if (typeof onActivityAdded === 'function') {
      await onActivityAdded();
    }

    closeAddCareModal();

    await renderCareLogs(currentCarePlantId);
    await renderDashboard();

  } catch (error) {
    console.error('✗ خطا در ثبت فعالیت:', error);
    alert('خطا در ثبت فعالیت.');
  }
}

// ============================================
// بخش ۶: نمایش تاریخچه فعالیت‌ها
// ============================================

async function renderCareLogs(plantId) {
  try {
    const careLogs = await getCareLogsByPlantId(plantId);

    const listContainer = document.getElementById('care-logs-list');
    const emptyState = document.getElementById('empty-care-logs');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (careLogs.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      listContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    listContainer.style.display = 'block';

    careLogs.forEach(function(log) {
      const item = createCareLogItem(log);
      listContainer.appendChild(item);
    });

    console.log('✓ تاریخچه فعالیت‌ها نمایش داده شد. تعداد:', careLogs.length);

  } catch (error) {
    console.error('✗ خطا در نمایش تاریخچه فعالیت‌ها:', error);
  }
}

function createCareLogItem(log) {
  const item = document.createElement('div');
  item.className = 'care-log-item';

  const info = document.createElement('div');
  info.className = 'care-log-info';

  const date = document.createElement('span');
  date.className = 'care-log-date';

  const type = log.type || 'water';
  const emoji = getCareTypeEmoji(type);
  const label = getCareTypeLabel(type);

  date.textContent = emoji + ' ' + label + ' — ' + formatDate(log.date);

  info.appendChild(date);

  if (log.note) {
    const note = document.createElement('span');
    note.className = 'care-log-note';
    note.textContent = log.note;
    info.appendChild(note);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'care-log-delete';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'حذف این فعالیت';
  deleteBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    handleDeleteCareLog(log.id);
  });

  item.appendChild(info);
  item.appendChild(deleteBtn);

  return item;
}

// ============================================
// بخش ۷: حذف فعالیت
// ============================================

async function handleDeleteCareLog(logId) {
  const confirmed = confirm('آیا مطمئنی می‌خواهی این فعالیت را حذف کنی؟');
  if (!confirmed) {
    return;
  }

  try {
    await deleteCareLog(logId);
    console.log('✓ فعالیت حذف شد. شناسه:', logId);

    // ✨ به‌روزرسانی XP، Streak و Heatmap
    if (typeof onActivityAdded === 'function') {
      await onActivityAdded();
    }

    await renderCareLogs(currentCarePlantId);
    await renderDashboard();

  } catch (error) {
    console.error('✗ خطا در حذف فعالیت:', error);
    alert('خطا در حذف فعالیت.');
  }
}