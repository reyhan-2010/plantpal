// PlantPal - گالری رشد گیاه
// این فایل مسئول نمایش، افزودن، نمایش بزرگ و حذف عکس‌های رشد است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let currentGalleryPlantId = null;
let currentViewingPhotoId = null;

// ============================================
// بخش ۲: راه‌اندازی
// ============================================

function initGallery() {
  setupGalleryButtons();
  console.log('✓ گالری راه‌اندازی شد');
}

function setupGalleryButtons() {
  // دکمه افزودن عکس
  const addBtn = document.getElementById('btn-add-photo');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      openAddPhotoModal();
    });
    console.log('✓ دکمه افزودن عکس متصل شد');
  } else {
    console.warn('⚠ دکمه btn-add-photo پیدا نشد');
  }

  // Modal افزودن: بستن
  const closeBtn = document.getElementById('btn-close-photo-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeAddPhotoModal();
    });
  }

  // Modal افزودن: انصراف
  const cancelBtn = document.getElementById('btn-cancel-photo');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      closeAddPhotoModal();
    });
  }

  // Modal افزودن: ذخیره
  const form = document.getElementById('form-add-photo');
  if (form) {
    form.addEventListener('submit', handleAddPhoto);
  }

  // Modal نمایش بزرگ: بستن
  const closeViewBtn = document.getElementById('btn-close-view-photo');
  if (closeViewBtn) {
    closeViewBtn.addEventListener('click', function() {
      closeViewPhotoModal();
    });
  }

  // Modal نمایش بزرگ: انصراف
  const cancelViewBtn = document.getElementById('btn-cancel-view-photo');
  if (cancelViewBtn) {
    cancelViewBtn.addEventListener('click', function() {
      closeViewPhotoModal();
    });
  }

  // Modal نمایش بزرگ: حذف
  const deleteViewBtn = document.getElementById('btn-delete-photo');
  if (deleteViewBtn) {
    deleteViewBtn.addEventListener('click', function() {
      handleDeletePhoto();
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initGallery();
});

// ============================================
// بخش ۳: نمایش گالری
// ============================================

async function renderGallery(plantId) {
  try {
    currentGalleryPlantId = plantId;

    const photos = await getPhotosByPlantId(plantId);

    const listContainer = document.getElementById('gallery-list');
    const emptyState = document.getElementById('empty-gallery');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (photos.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      listContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    listContainer.style.display = 'grid';

    photos.forEach(function(photo) {
      const item = createGalleryItem(photo);
      listContainer.appendChild(item);
    });

    console.log('✓ گالری نمایش داده شد. تعداد عکس:', photos.length);

  } catch (error) {
    console.error('✗ خطا در نمایش گالری:', error);
  }
}

function createGalleryItem(photo) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.setAttribute('data-photo-id', photo.id);

  const image = document.createElement('img');
  image.className = 'gallery-thumb';
  image.alt = 'عکس رشد';
  image.loading = 'lazy';
  if (photo.image) {
    image.src = photo.image;
  } else {
    image.src = 'assets/images/default-plant.png';
  }

  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';

  const date = document.createElement('span');
  date.className = 'gallery-date';
  date.textContent = formatDate(photo.date);

  overlay.appendChild(date);

  if (photo.note) {
    const note = document.createElement('span');
    note.className = 'gallery-note';
    note.textContent = photo.note;
    overlay.appendChild(note);
  }

  item.appendChild(image);
  item.appendChild(overlay);

  // کلیک روی عکس → نمایش بزرگ
  item.addEventListener('click', function() {
    openViewPhotoModal(photo.id);
  });

  return item;
}

// ============================================
// بخش ۴: Modal افزودن عکس
// ============================================

function openAddPhotoModal() {
  if (!currentGalleryPlantId) {
    alert('لطفاً یک گیاه انتخاب کن.');
    return;
  }

  // پاک کردن فرم
  const form = document.getElementById('form-add-photo');
  if (form) form.reset();

  // پیش‌فرض تاریخ: امروز
  const dateInput = document.getElementById('photo-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
  }

  // پاک کردن یادداشت
  const noteInput = document.getElementById('photo-note');
  if (noteInput) noteInput.value = '';

  // پاک کردن فایل
  const fileInput = document.getElementById('photo-file');
  if (fileInput) fileInput.value = '';

  const modal = document.getElementById('modal-add-photo');
  if (modal) {
    modal.classList.add('active');
    console.log('✓ Modal افزودن عکس باز شد');
  }
}

function closeAddPhotoModal() {
  const modal = document.getElementById('modal-add-photo');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal افزودن عکس بسته شد');
  }
}

// ============================================
// بخش ۵: ذخیره عکس جدید
// ============================================

async function handleAddPhoto(event) {
  event.preventDefault();

  try {
    const fileInput = document.getElementById('photo-file');
    const dateInput = document.getElementById('photo-date');
    const noteInput = document.getElementById('photo-note');

    if (!fileInput.files || !fileInput.files[0]) {
      alert('لطفاً یک عکس انتخاب کن.');
      return;
    }

    const dateValue = dateInput ? dateInput.value : '';
    if (!dateValue) {
      alert('تاریخ اجباری است.');
      return;
    }

    const file = fileInput.files[0];
    const imageData = await fileToBase64(file);

    const photoData = {
      plantId: currentGalleryPlantId,
      image: imageData,
      date: new Date(dateValue).toISOString(),
      note: noteInput ? noteInput.value.trim() : ''
    };

    await savePhoto(photoData);
    console.log('✓ عکس رشد با موفقیت اضافه شد');

    closeAddPhotoModal();

    // به‌روزرسانی گالری
    await renderGallery(currentGalleryPlantId);

  } catch (error) {
    console.error('✗ خطا در افزودن عکس:', error);
    alert('خطا در ذخیره عکس.');
  }
}

// ============================================
// بخش ۶: نمایش بزرگ عکس
// ============================================

async function openViewPhotoModal(photoId) {
  try {
    const photo = await getPhotoById(photoId);

    if (!photo) {
      alert('عکس پیدا نشد.');
      return;
    }

    currentViewingPhotoId = photoId;

    // تصویر
    const imageEl = document.getElementById('photo-view-image');
    if (imageEl) {
      imageEl.src = photo.image || 'assets/images/default-plant.png';
    }

    // تاریخ
    const dateEl = document.getElementById('photo-view-date');
    if (dateEl) {
      dateEl.textContent = formatDate(photo.date);
    }

    // یادداشت
    const noteRow = document.getElementById('photo-view-note-row');
    const noteEl = document.getElementById('photo-view-note');

    if (photo.note && photo.note.trim()) {
      if (noteRow) noteRow.style.display = 'flex';
      if (noteEl) noteEl.textContent = photo.note;
    } else {
      if (noteRow) noteRow.style.display = 'none';
    }

    // باز کردن Modal
    const modal = document.getElementById('modal-view-photo');
    if (modal) {
      modal.classList.add('active');
      console.log('✓ Modal نمایش عکس باز شد. شناسه:', photoId);
    }

  } catch (error) {
    console.error('✗ خطا در نمایش عکس:', error);
    alert('خطا در نمایش عکس.');
  }
}

function closeViewPhotoModal() {
  const modal = document.getElementById('modal-view-photo');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal نمایش عکس بسته شد');
  }

  currentViewingPhotoId = null;
}

// ============================================
// بخش ۷: حذف عکس
// ============================================

async function handleDeletePhoto() {
  if (!currentViewingPhotoId) {
    return;
  }

  const confirmed = confirm('آیا مطمئنی می‌خواهی این عکس را حذف کنی؟\n\nاین عملیات قابل بازگشت نیست.');
  if (!confirmed) {
    return;
  }

  try {
    await deletePhoto(currentViewingPhotoId);
    console.log('✓ عکس رشد حذف شد. شناسه:', currentViewingPhotoId);

    closeViewPhotoModal();

    // به‌روزرسانی گالری
    await renderGallery(currentGalleryPlantId);

  } catch (error) {
    console.error('✗ خطا در حذف عکس:', error);
    alert('خطا در حذف عکس.');
  }
}