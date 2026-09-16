// PlantPal - فایل اصلی برنامه
// این فایل همه بخش‌ها را به هم وصل می‌کند.

console.log('🌱 PlantPal در حال بارگذاری...');

document.addEventListener('DOMContentLoaded', async function() {
  console.log('✓ صفحه بارگذاری شد');

  try {
    initTheme();
    initDate();

    await openDatabase();
    console.log('✓ پایگاه داده آماده است');

    translatePage();

    await renderDashboard();

    setupEventListeners();

    initSettings();

    await loadAllIcons();

    console.log('✓ PlantPal با موفقیت راه‌اندازی شد');

  } catch (error) {
    console.error('✗ خطا در راه‌اندازی:', error);
  }
});

function setupEventListeners() {
  const btnOpenSettings = document.getElementById('btn-open-settings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', function() {
      showPage('page-settings');
    });
  }

  const btnBackFromSettings = document.getElementById('btn-back-from-settings');
  if (btnBackFromSettings) {
    btnBackFromSettings.addEventListener('click', function() {
      showHomePage();
      renderDashboard();
    });
  }

  const btnAddPlant = document.getElementById('btn-add-plant');
  if (btnAddPlant) {
    btnAddPlant.addEventListener('click', function() {
      clearAddForm();
      isEditMode = false;
      editingPlantId = null;
      showAddPage();
    });
  }

  const btnBackFromAdd = document.getElementById('btn-back-from-add');
  if (btnBackFromAdd) {
    btnBackFromAdd.addEventListener('click', function() {
      showHomePage();
      renderDashboard();
    });
  }

  const btnCancelAdd = document.getElementById('btn-cancel-add');
  if (btnCancelAdd) {
    btnCancelAdd.addEventListener('click', function() {
      showHomePage();
      renderDashboard();
    });
  }

  const formAddPlant = document.getElementById('form-add-plant');
  if (formAddPlant) {
    formAddPlant.addEventListener('submit', function(event) {
      if (isEditMode) {
        handleUpdatePlant(event);
      } else {
        handleAddPlant(event);
      }
    });
  }

  const btnBackFromDetails = document.getElementById('btn-back-from-details');
  if (btnBackFromDetails) {
    btnBackFromDetails.addEventListener('click', function() {
      showHomePage();
      renderDashboard();
    });
  }

  const btnEditPlant = document.getElementById('btn-edit-plant');
  if (btnEditPlant) {
    btnEditPlant.addEventListener('click', handleEditPlant);
  }

  const btnDeletePlant = document.getElementById('btn-delete-plant');
  if (btnDeletePlant) {
    btnDeletePlant.addEventListener('click', handleDeletePlant);
  }

  const btnAddCare = document.getElementById('btn-add-care');
  if (btnAddCare) {
    btnAddCare.addEventListener('click', openAddCareModal);
  }

  const btnCloseCareModal = document.getElementById('btn-close-care-modal');
  if (btnCloseCareModal) {
    btnCloseCareModal.addEventListener('click', closeAddCareModal);
  }

  const btnCancelCare = document.getElementById('btn-cancel-care');
  if (btnCancelCare) {
    btnCancelCare.addEventListener('click', closeAddCareModal);
  }

  const formAddCare = document.getElementById('form-add-care');
  if (formAddCare) {
    formAddCare.addEventListener('submit', handleAddCare);
  }

  // راه‌اندازی جستجو و فیلتر
  if (typeof setupSearch === 'function') setupSearch();
  if (typeof setupFilters === 'function') setupFilters();

  // راه‌اندازی دکمه‌های نوع فعالیت
  if (typeof setupCareTypeButtons === 'function') setupCareTypeButtons();

  console.log('✓ رویدادها وصل شدند');
}