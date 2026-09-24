// PlantPal - گالری رشد گیاه
// این فایل مسئول نمایش، افزودن، نمایش بزرگ، مقایسه و حذف عکس‌های رشد است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let currentGalleryPlantId = null;
let currentViewingPhotoId = null;
let compareModeActive = false;
let compareSelection = [];

// ============================================
// بخش ۲: راه‌اندازی
// ============================================

function initGallery() {
  setupGalleryButtons();
  console.log('✓ گالری راه‌اندازی شد');
}

function setupGalleryButtons() {
  const addBtn = document.getElementById('btn-add-photo');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      openAddPhotoModal();
    });
    console.log('✓ دکمه افزودن عکس متصل شد');
  } else {
    console.warn('⚠ دکمه btn-add-photo پیدا نشد');
  }

  const compareBtn = document.getElementById('btn-compare-photos');
  if (compareBtn) {
    compareBtn.addEventListener('click', function() {
      toggleCompareMode();
    });
    console.log('✓ دکمه مقایسه متصل شد');
  }

  const closeBtn = document.getElementById('btn-close-photo-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeAddPhotoModal();
    });
  }

  const cancelBtn = document.getElementById('btn-cancel-photo');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      closeAddPhotoModal();
    });
  }

  const form = document.getElementById('form-add-photo');
  if (form) {
    form.addEventListener('submit', handleAddPhoto);
  }

  const closeViewBtn = document.getElementById('btn-close-view-photo');
  if (closeViewBtn) {
    closeViewBtn.addEventListener('click', function() {
      closeViewPhotoModal();
    });
  }

  const cancelViewBtn = document.getElementById('btn-cancel-view-photo');
  if (cancelViewBtn) {
    cancelViewBtn.addEventListener('click', function() {
      closeViewPhotoModal();
    });
  }

  const deleteViewBtn = document.getElementById('btn-delete-photo');
  if (deleteViewBtn) {
    deleteViewBtn.addEventListener('click', function() {
      handleDeletePhoto();
    });
  }

  const closeCompareBtn = document.getElementById('btn-close-compare-modal');
  if (closeCompareBtn) {
    closeCompareBtn.addEventListener('click', function() {
      closeCompareModal();
    });
  }

  const cancelCompareBtn = document.getElementById('btn-cancel-compare');
  if (cancelCompareBtn) {
    cancelCompareBtn.addEventListener('click', function() {
      closeCompareModal();
    });
  }

  const slider = document.getElementById('compare-slider');
  if (slider) {
    slider.addEventListener('input', function() {
      updateCompareSlider(slider.value);
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
    const compareBtn = document.getElementById('btn-compare-photos');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (photos.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      listContainer.style.display = 'none';
      if (compareBtn) compareBtn.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    listContainer.style.display = 'grid';

    if (compareBtn) {
      if (photos.length >= 2) {
        compareBtn.style.display = 'inline-flex';
      } else {
        compareBtn.style.display = 'none';
      }
    }

    // ⚠️ بلوک پاک کردن انتخاب‌ها حذف شد — این همان باگ بود

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

  // در حالت مقایسه، نشان انتخاب
  if (compareModeActive) {
    const check = document.createElement('div');
    check.className = 'gallery-compare-check';

    const index = compareSelection.indexOf(photo.id);
    if (index !== -1) {
      item.classList.add('selected');
      check.textContent = String(index + 1);
      check.style.display = 'flex';
    } else {
      check.style.display = 'none';
    }

    item.appendChild(check);
  }

  // کلیک
  item.addEventListener('click', function() {
    if (compareModeActive) {
      handleCompareClick(photo.id);
    } else {
      openViewPhotoModal(photo.id);
    }
  });

  return item;
}

// ============================================
// بخش ۴: حالت مقایسه
// ============================================

function toggleCompareMode() {
  compareModeActive = !compareModeActive;
  compareSelection = [];

  const compareBtn = document.getElementById('btn-compare-photos');
  const statusBar = document.getElementById('compare-status-bar');

  if (compareModeActive) {
    if (compareBtn) {
      compareBtn.classList.add('active');
      compareBtn.textContent = '✕ لغو مقایسه';
    }
    if (statusBar) statusBar.style.display = 'flex';
    updateCompareStatus();
    console.log('✓ حالت مقایسه فعال شد');
  } else {
    if (compareBtn) {
      compareBtn.classList.remove('active');
      compareBtn.textContent = '🔀 مقایسه';
    }
    if (statusBar) statusBar.style.display = 'none';
    console.log('✓ حالت مقایسه غیرفعال شد');
  }

  renderGallery(currentGalleryPlantId);
}

function handleCompareClick(photoId) {
  const index = compareSelection.indexOf(photoId);

  if (index !== -1) {
    // قبلاً انتخاب شده → حذف
    compareSelection.splice(index, 1);
  } else {
    if (compareSelection.length >= 2) {
      // دو مورد انتخاب شده → شروع از نو
      compareSelection = [photoId];
    } else {
      compareSelection.push(photoId);
    }
  }

  updateCompareStatus();
  renderGallery(currentGalleryPlantId);

  // اگر دو مورد انتخاب شد → باز کن Modal
  if (compareSelection.length === 2) {
    setTimeout(function() {
      openCompareModal(compareSelection[0], compareSelection[1]);
    }, 300);
  }
}

function updateCompareStatus() {
  const statusBar = document.getElementById('compare-status-bar');
  if (!statusBar) return;

  const count = compareSelection.length;
  statusBar.textContent = '📸 ' + count + ' از ۲ عکس انتخاب شده';
}

// ============================================
// بخش ۵: Modal مقایسه
// ============================================

async function openCompareModal(photoId1, photoId2) {
  try {
    const photo1 = await getPhotoById(photoId1);
    const photo2 = await getPhotoById(photoId2);

    if (!photo1 || !photo2) {
      alert('عکس‌ها پیدا نشدند.');
      return;
    }

    const d1 = new Date(photo1.date);
    const d2 = new Date(photo2.date);
    const older = d1 <= d2 ? photo1 : photo2;
    const newer = d1 <= d2 ? photo2 : photo1;

    const imgBefore = document.getElementById('compare-img-before');
    const imgAfter = document.getElementById('compare-img-after');
    const dateBefore = document.getElementById('compare-date-before');
    const dateAfter = document.getElementById('compare-date-after');
    const noteBefore = document.getElementById('compare-note-before');
    const noteAfter = document.getElementById('compare-note-after');

    if (imgBefore) imgBefore.src = older.image || 'assets/images/default-plant.png';
    if (imgAfter) imgAfter.src = newer.image || 'assets/images/default-plant.png';
    if (dateBefore) dateBefore.textContent = formatDate(older.date);
    if (dateAfter) dateAfter.textContent = formatDate(newer.date);

    if (noteBefore) {
      if (older.note && older.note.trim()) {
        noteBefore.textContent = older.note;
        noteBefore.style.display = 'block';
      } else {
        noteBefore.style.display = 'none';
      }
    }

    if (noteAfter) {
      if (newer.note && newer.note.trim()) {
        noteAfter.textContent = newer.note;
        noteAfter.style.display = 'block';
      } else {
        noteAfter.style.display = 'none';
      }
    }

    const diffMs = Math.abs(d2 - d1);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffEl = document.getElementById('compare-diff-text');

    if (diffEl) {
      if (diffDays === 0) {
        diffEl.textContent = 'هر دو عکس در یک روز گرفته شده‌اند';
      } else if (diffDays === 1) {
        diffEl.textContent = '۱ روز بین دو عکس';
      } else if (diffDays < 30) {
        diffEl.textContent = diffDays + ' روز بین دو عکس';
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        diffEl.textContent = months + ' ماه بین دو عکس';
      } else {
        const years = (diffDays / 365).toFixed(1);
        diffEl.textContent = years + ' سال بین دو عکس';
      }
    }

    const slider = document.getElementById('compare-slider');
    if (slider) {
      slider.value = 50;
      updateCompareSlider(50);
    }

    const modal = document.getElementById('modal-compare-photos');
    if (modal) {
      modal.classList.add('active');
      console.log('✓ Modal مقایسه باز شد');
    }

  } catch (error) {
    console.error('✗ خطا در باز کردن Modal مقایسه:', error);
  }
}

function closeCompareModal() {
  const modal = document.getElementById('modal-compare-photos');
  if (modal) {
    modal.classList.remove('active');
  }

  compareModeActive = false;
  compareSelection = [];

  const compareBtn = document.getElementById('btn-compare-photos');
  const statusBar = document.getElementById('compare-status-bar');

  if (compareBtn) {
    compareBtn.classList.remove('active');
    compareBtn.textContent = '🔀 مقایسه';
  }
  if (statusBar) statusBar.style.display = 'none';

  renderGallery(currentGalleryPlantId);
  console.log('✓ Modal مقایسه بسته شد');
}

function updateCompareSlider(value) {
  const container = document.getElementById('compare-images-container');
  if (!container) return;

  const percent = parseInt(value, 10);
  container.style.setProperty('--compare-pos', percent + '%');
}

// ============================================
// بخش ۶: Modal افزودن عکس
// ============================================

function openAddPhotoModal() {
  if (!currentGalleryPlantId) {
    alert('لطفاً یک گیاه انتخاب کن.');
    return;
  }

  const form = document.getElementById('form-add-photo');
  if (form) form.reset();

  const dateInput = document.getElementById('photo-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
  }

  const noteInput = document.getElementById('photo-note');
  if (noteInput) noteInput.value = '';

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
// بخش ۷: ذخیره عکس جدید
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

    if (typeof onActivityAdded === 'function') {
      await onActivityAdded();
    }

    closeAddPhotoModal();

    await renderGallery(currentGalleryPlantId);

  } catch (error) {
    console.error('✗ خطا در افزودن عکس:', error);
    alert('خطا در ذخیره عکس.');
  }
}

// ============================================
// بخش ۸: نمایش بزرگ عکس
// ============================================

async function openViewPhotoModal(photoId) {
  try {
    const photo = await getPhotoById(photoId);

    if (!photo) {
      alert('عکس پیدا نشد.');
      return;
    }

    currentViewingPhotoId = photoId;

    const imageEl = document.getElementById('photo-view-image');
    if (imageEl) {
      imageEl.src = photo.image || 'assets/images/default-plant.png';
    }

    const dateEl = document.getElementById('photo-view-date');
    if (dateEl) {
      dateEl.textContent = formatDate(photo.date);
    }

    const noteRow = document.getElementById('photo-view-note-row');
    const noteEl = document.getElementById('photo-view-note');

    if (photo.note && photo.note.trim()) {
      if (noteRow) noteRow.style.display = 'flex';
      if (noteEl) noteEl.textContent = photo.note;
    } else {
      if (noteRow) noteRow.style.display = 'none';
    }

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
// بخش ۹: حذف عکس
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

    if (typeof onActivityAdded === 'function') {
      await onActivityAdded();
    }

    await renderGallery(currentGalleryPlantId);

  } catch (error) {
    console.error('✗ خطا در حذف عکس:', error);
    alert('خطا در حذف عکس.');
  }
}