// PlantPal - مدیریت گیاهان
// این فایل مسئول نمایش، افزودن، ویرایش و حذف گیاهان است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let currentPlantId = null;
let currentPlantImage = null;
let isEditMode = false;
let editingPlantId = null;
let selectedHealth = 'healthy';
let selectedWateringFrequency = 7;

// ============================================
// بخش ۲: تنظیمات فاصله آبیاری
// ============================================

const WATERING_FREQUENCY_LABELS = {
  1: 'هر روز',
  2: 'هر 2 روز یک‌بار',
  3: 'هر 3 روز یک‌بار',
  4: 'هر 4 روز یک‌بار',
  5: 'هر 5 روز یک‌بار',
  6: 'هر 6 روز یک‌بار',
  7: 'هفتگی (هر 7 روز)',
  10: 'هر 10 روز یک‌بار',
  14: 'هر 14 روز یک‌بار'
};

function getWateringFrequencyText(freq) {
  const num = parseInt(freq, 10);
  if (isNaN(num)) return 'هفتگی (هر 7 روز)';
  if (WATERING_FREQUENCY_LABELS[num]) return WATERING_FREQUENCY_LABELS[num];
  return 'هر ' + num + ' روز یک‌بار';
}

// ============================================
// بخش ۳: توابع کمکی برای آخرین آبیاری
// ============================================

function getLastWateringInfo(careLogs) {
  if (!careLogs || careLogs.length === 0) {
    return { text: 'هنوز آبیاری نشده', days: null };
  }

  const waterLogs = careLogs.filter(function(log) {
    return !log.type || log.type === 'water';
  });

  if (waterLogs.length === 0) {
    return { text: 'هنوز آبیاری نشده', days: null };
  }

  const last = waterLogs[0];
  const lastDate = new Date(last.date);
  const now = new Date();
  const diffMs = now - lastDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'امروز', days: 0 };
  if (diffDays === 1) return { text: 'دیروز', days: 1 };
  if (diffDays < 7) return { text: diffDays + ' روز پیش', days: diffDays };

  return { text: formatDate(last.date), days: diffDays };
}

// ============================================
// بخش ۴: مدیریت دکمه‌های فاصله آبیاری
// ============================================

function setSelectedWateringFrequency(freq) {
  const num = parseInt(freq, 10);
  selectedWateringFrequency = isNaN(num) ? 7 : num;

  const hiddenInput = document.getElementById('add-watering-frequency');
  if (hiddenInput) {
    hiddenInput.value = String(selectedWateringFrequency);
  }

  updateWateringButtons(selectedWateringFrequency);

  console.log('✓ فاصله آبیاری انتخاب شد:', selectedWateringFrequency, 'روز');
}

function updateWateringButtons(freq) {
  const buttons = document.querySelectorAll('[data-frequency]');
  buttons.forEach(function(btn) {
    const btnFreq = parseInt(btn.getAttribute('data-frequency'), 10);
    if (btnFreq === freq) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setupWateringButtons() {
  const buttons = document.querySelectorAll('[data-frequency]');

  if (buttons.length === 0) {
    return;
  }

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const freq = parseInt(btn.getAttribute('data-frequency'), 10);
      setSelectedWateringFrequency(freq);
    });
  });

  setSelectedWateringFrequency(7);

  console.log('✓ دکمه‌های فاصله آبیاری متصل شدند. تعداد:', buttons.length);
}

document.addEventListener('DOMContentLoaded', function() {
  setupWateringButtons();
});

// ============================================
// بخش ۵: نمایش فهرست گیاهان
// ============================================

async function renderPlantsList() {
  try {
    const plants = await getAllPlants();

    if (plants.length === 0) {
      toggleEmptyPlantsState(true);
      return;
    }

    toggleEmptyPlantsState(false);

    const listContainer = document.getElementById('plants-list');
    listContainer.innerHTML = '';

    plants.forEach(function(plant) {
      const card = createPlantCard(plant);
      listContainer.appendChild(card);
    });

    console.log('✓ فهرست گیاهان نمایش داده شد. تعداد:', plants.length);
  } catch (error) {
    console.error('✗ خطا در نمایش فهرست گیاهان:', error);
  }
}

function createPlantCard(plant) {
  const card = document.createElement('div');
  card.className = 'plant-card';
  card.setAttribute('data-plant-id', plant.id);

  const image = document.createElement('img');
  image.className = 'plant-card-image';
  image.alt = plant.name;
  if (plant.image) {
    image.src = plant.image;
  } else {
    image.src = 'assets/images/default-plant.png';
  }

  const content = document.createElement('div');
  content.className = 'plant-card-content';

  const name = document.createElement('h3');
  name.className = 'plant-card-name';
  name.textContent = plant.name;

  const location = document.createElement('p');
  location.className = 'plant-card-location';
  location.textContent = plant.location || '—';

  content.appendChild(name);
  content.appendChild(location);

  const health = plant.health || 'healthy';
  const healthIcon = getHealthIcon(health);
  const healthLabel = getHealthLabel(health);

  const healthBadge = document.createElement('div');
  healthBadge.className = 'plant-card-health health-' + health;
  healthBadge.innerHTML =
    '<span class="icon" data-icon="' + healthIcon + '"></span>' +
    '<span class="health-label">' + healthLabel + '</span>';

  content.appendChild(healthBadge);

  card.appendChild(image);
  card.appendChild(content);

  card.addEventListener('click', function() {
    openPlantDetails(plant.id);
  });

  return card;
}

// ============================================
// بخش ۶: صفحه جزئیات گیاه
// ============================================

async function openPlantDetails(plantId) {
  try {
    const plant = await getPlantById(plantId);

    if (!plant) {
      alert(t('plantNotFound'));
      return;
    }

    currentPlantId = plantId;

    document.getElementById('details-name').textContent = plant.name || '—';
    document.getElementById('details-type').textContent = plant.type || '—';
    document.getElementById('details-location').textContent = plant.location || '—';

    const healthDisplay = document.getElementById('details-health');
    if (healthDisplay) {
      const health = plant.health || 'healthy';
      const healthLabel = getHealthLabel(health);
      const healthIcon = getHealthIcon(health);
      healthDisplay.innerHTML =
        '<span class="health-display health-' + health + '">' +
        '<span class="icon" data-icon="' + healthIcon + '"></span>' +
        '<span>' + healthLabel + '</span>' +
        '</span>';
    }

    const freqDisplay = document.getElementById('details-watering-frequency');
    if (freqDisplay) {
      freqDisplay.textContent = getWateringFrequencyText(plant.wateringFrequencyDays || 7);
    }

    const lastWateringDisplay = document.getElementById('details-last-watering');
    if (lastWateringDisplay) {
      const careLogs = await getCareLogsByPlantId(plantId);
      const lastInfo = getLastWateringInfo(careLogs);
      lastWateringDisplay.textContent = lastInfo.text;
    }

    const detailsImage = document.getElementById('details-image');
    if (plant.image) {
      detailsImage.src = plant.image;
    } else {
      detailsImage.src = 'assets/images/default-plant.png';
    }

    showDetailsPage();

    await renderNotes(plantId);
    await renderCareLogs(plantId);

    if (typeof renderGallery === 'function') {
      await renderGallery(plantId);
    }

    if (typeof loadAllIcons === 'function') {
      await loadAllIcons();
    }

    console.log('✓ جزئیات گیاه نمایش داده شد:', plant.name);
  } catch (error) {
    console.error('✗ خطا در نمایش جزئیات گیاه:', error);
  }
}

// ============================================
// بخش ۷: افزودن گیاه جدید
// ============================================

async function handleAddPlant(event) {
  event.preventDefault();

  try {
    const name = document.getElementById('add-name').value.trim();

    if (!name) {
      alert('نام گیاه اجباری است.');
      return;
    }

    const type = document.getElementById('add-type').value.trim();
    const location = document.getElementById('add-location').value.trim();
    const imageInput = document.getElementById('add-image');
    const freqInput = document.getElementById('add-watering-frequency');

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
      imageData = await fileToBase64(imageInput.files[0]);
    }

    const wateringFrequencyDays = freqInput
      ? parseInt(freqInput.value, 10) || 7
      : 7;

    const plantData = {
      name: name,
      type: type,
      location: location,
      image: imageData,
      health: selectedHealth,
      wateringFrequencyDays: wateringFrequencyDays
    };

    await savePlant(plantData);
    console.log('✓ گیاه با موفقیت اضافه شد');

    clearAddForm();
    showHomePage();
    await renderDashboard();

  } catch (error) {
    console.error('✗ خطا در افزودن گیاه:', error);
    alert('خطا در ذخیره گیاه.');
  }
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function(error) {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

// ============================================
// بخش ۸: ویرایش گیاه
// ============================================

function handleEditPlant() {
  if (!currentPlantId) {
    console.error('✗ شناسه گیاه موجود نیست');
    return;
  }

  getPlantById(currentPlantId).then(function(plant) {
    if (!plant) {
      alert(t('plantNotFound'));
      return;
    }

    fillAddForm(plant);

    setSelectedWateringFrequency(plant.wateringFrequencyDays || 7);

    isEditMode = true;
    editingPlantId = currentPlantId;

    showAddPage();

    console.log('✓ حالت ویرایش فعال شد برای:', plant.name);
  });
}

async function handleUpdatePlant(event) {
  event.preventDefault();

  try {
    const name = document.getElementById('add-name').value.trim();

    if (!name) {
      alert('نام گیاه اجباری است.');
      return;
    }

    const type = document.getElementById('add-type').value.trim();
    const location = document.getElementById('add-location').value.trim();
    const imageInput = document.getElementById('add-image');
    const freqInput = document.getElementById('add-watering-frequency');

    let imageData = undefined;
    if (imageInput.files && imageInput.files[0]) {
      imageData = await fileToBase64(imageInput.files[0]);
    }

    const wateringFrequencyDays = freqInput
      ? parseInt(freqInput.value, 10) || 7
      : 7;

    const plantData = {
      name: name,
      type: type,
      location: location,
      health: selectedHealth,
      wateringFrequencyDays: wateringFrequencyDays
    };

    if (imageData !== undefined) {
      plantData.image = imageData;
    }

    await updatePlant(editingPlantId, plantData);
    console.log('✓ گیاه ویرایش شد');

    isEditMode = false;
    editingPlantId = null;

    clearAddForm();
    await openPlantDetails(currentPlantId);

  } catch (error) {
    console.error('✗ خطا در ویرایش گیاه:', error);
    alert('خطا در ویرایش گیاه.');
  }
}

// ============================================
// بخش ۹: حذف گیاه
// ============================================

async function handleDeletePlant() {
  if (!currentPlantId) {
    console.error('✗ شناسه گیاه موجود نیست');
    return;
  }

  const confirmed = confirm(t('confirmDelete'));
  if (!confirmed) {
    return;
  }

  try {
    await deletePlant(currentPlantId);
    console.log('✓ گیاه حذف شد');

    currentPlantId = null;
    showHomePage();
    await renderDashboard();

  } catch (error) {
    console.error('✗ خطا در حذف گیاه:', error);
    alert('خطا در حذف گیاه.');
  }
}