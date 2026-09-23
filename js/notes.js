// PlantPal - مدیریت یادداشت‌ها
// این فایل مسئول ثبت، نمایش و حذف یادداشت‌هاست.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let currentNotePlantId = null;
let editingNoteId = null;

// ============================================
// بخش ۲: باز و بسته کردن Modal
// ============================================

function openAddNoteModal() {
  if (!currentPlantId) {
    console.error('✗ شناسه گیاه موجود نیست');
    return;
  }

  currentNotePlantId = currentPlantId;
  editingNoteId = null;

  const textInput = document.getElementById('note-text');
  if (textInput) textInput.value = '';

  const dateInput = document.getElementById('note-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
  }

  const modalTitle = document.getElementById('modal-note-title');
  if (modalTitle) modalTitle.textContent = 'افزودن یادداشت جدید';

  const modal = document.getElementById('modal-add-note');
  if (modal) {
    modal.classList.add('active');
    console.log('✓ Modal یادداشت باز شد');
  }
}

function openEditNoteModal(note) {
  currentNotePlantId = currentPlantId;
  editingNoteId = note.id;

  const textInput = document.getElementById('note-text');
  if (textInput) textInput.value = note.text || '';

  const dateInput = document.getElementById('note-date');
  if (dateInput) {
    const date = new Date(note.date).toISOString().split('T')[0];
    dateInput.value = date;
    dateInput.max = new Date().toISOString().split('T')[0];
  }

  const modalTitle = document.getElementById('modal-note-title');
  if (modalTitle) modalTitle.textContent = 'ویرایش یادداشت';

  const modal = document.getElementById('modal-add-note');
  if (modal) {
    modal.classList.add('active');
    console.log('✓ Modal ویرایش یادداشت باز شد');
  }
}

function closeAddNoteModal() {
  const modal = document.getElementById('modal-add-note');
  if (modal) {
    modal.classList.remove('active');
    console.log('✓ Modal یادداشت بسته شد');
  }
  editingNoteId = null;
}

// ============================================
// بخش ۳: ذخیره یادداشت
// ============================================

async function handleAddNote(event) {
  event.preventDefault();

  try {
    const text = document.getElementById('note-text').value.trim();
    const date = document.getElementById('note-date').value;

    if (!text) {
      alert('متن یادداشت اجباری است.');
      return;
    }

    if (!date) {
      alert('تاریخ اجباری است.');
      return;
    }

    const noteData = {
      plantId: currentNotePlantId,
      text: text,
      date: new Date(date).toISOString()
    };

    const isEditMode = !!editingNoteId;

    if (isEditMode) {
      await updateNote(editingNoteId, noteData);
      console.log('✓ یادداشت ویرایش شد');
    } else {
      await saveNote(noteData);
      console.log('✓ یادداشت ذخیره شد');

      // ✨ به‌روزرسانی XP، Streak و Heatmap فقط برای یادداشت جدید
      if (typeof onActivityAdded === 'function') {
        await onActivityAdded();
      }
    }

    closeAddNoteModal();

    await renderNotes(currentNotePlantId);

  } catch (error) {
    console.error('✗ خطا در ذخیره یادداشت:', error);
    alert('خطا در ذخیره یادداشت.');
  }
}

// ============================================
// بخش ۴: نمایش یادداشت‌ها
// ============================================

async function renderNotes(plantId) {
  try {
    const notes = await getNotesByPlantId(plantId);

    const listContainer = document.getElementById('notes-list');
    const emptyState = document.getElementById('empty-notes');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (notes.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      listContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    listContainer.style.display = 'block';

    notes.forEach(function(note) {
      const item = createNoteItem(note);
      listContainer.appendChild(item);
    });

    console.log('✓ یادداشت‌ها نمایش داده شد. تعداد:', notes.length);

  } catch (error) {
    console.error('✗ خطا در نمایش یادداشت‌ها:', error);
  }
}

function createNoteItem(note) {
  const item = document.createElement('div');
  item.className = 'note-item';

  const content = document.createElement('div');
  content.className = 'note-content';

  const date = document.createElement('div');
  date.className = 'note-date';
  date.textContent = '📅 ' + formatDate(note.date);

  const text = document.createElement('div');
  text.className = 'note-text';
  text.textContent = note.text;

  content.appendChild(date);
  content.appendChild(text);

  const actions = document.createElement('div');
  actions.className = 'note-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'note-edit';
  editBtn.textContent = '✏️';
  editBtn.title = 'ویرایش';
  editBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    openEditNoteModal(note);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'note-delete';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'حذف';
  deleteBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    handleDeleteNote(note.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(content);
  item.appendChild(actions);

  return item;
}

// ============================================
// بخش ۵: حذف یادداشت
// ============================================

async function handleDeleteNote(noteId) {
  const confirmed = confirm('آیا مطمئنی می‌خواهی این یادداشت را حذف کنی؟');
  if (!confirmed) {
    return;
  }

  try {
    await deleteNote(noteId);
    console.log('✓ یادداشت حذف شد. شناسه:', noteId);

    // ✨ به‌روزرسانی XP، Streak و Heatmap
    if (typeof onActivityAdded === 'function') {
      await onActivityAdded();
    }

    await renderNotes(currentPlantId);

  } catch (error) {
    console.error('✗ خطا در حذف یادداشت:', error);
    alert('خطا در حذف یادداشت.');
  }
}