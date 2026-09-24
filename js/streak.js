/* PlantPal - Streak و سیستم انگیزشی */
/* این فایل مسئول محاسبه Streak، امتیاز، سطح، نشان‌ها و Heatmap است. */

/* بخش ۱: تنظیمات */

const STREAK_KEY = 'plantpal-streak-data';

const XP_REWARDS = {
  water: 10,
  fertilize: 20,
  prune: 15,
  repot: 25,
  cutting: 20,
  photo: 25,
  note: 5,
  plant: 30,
  streakDaily: 5
};

const LEVELS = [
  { level: 1, name: 'تازه‌کار', minXP: 0 },
  { level: 2, name: 'جوانه', minXP: 100 },
  { level: 3, name: 'علاقه‌مند', minXP: 300 },
  { level: 4, name: 'پرورش‌دهنده', minXP: 700 },
  { level: 5, name: 'باغبان', minXP: 1500 },
  { level: 6, name: 'استاد باغ', minXP: 3000 },
  { level: 7, name: 'افسانه', minXP: 6000 }
];

const STREAK_PLANTS = [
  { minDays: 0, name: 'پژمرده' },
  { minDays: 1, name: 'جوانه' },
  { minDays: 3, name: 'برگ‌دار' },
  { minDays: 7, name: 'گلدانی' },
  { minDays: 14, name: 'درخت' },
  { minDays: 30, name: 'درخت گل‌دار' },
  { minDays: 60, name: 'درخت پرگل' },
  { minDays: 100, name: 'افسانه‌ای' }
];

const BADGES = [
  { id: 'first-plant', icon: '🌱', name: 'اولین قدم', description: 'اولین گیاه را ثبت کردی', check: function(stats) { return stats.plants >= 1; } },
  { id: 'plant-nurse', icon: '🌿', name: 'پرستار گیاهان', description: '۵ گیاه داری', check: function(stats) { return stats.plants >= 5; } },
  { id: 'gardener', icon: '🌳', name: 'باغبان', description: '۱۰ گیاه داری', check: function(stats) { return stats.plants >= 10; } },
  { id: 'waterer-10', icon: '💧', name: 'آبیار', description: '۱۰ بار آبیاری کردی', check: function(stats) { return stats.water >= 10; } },
  { id: 'waterer-50', icon: '💦', name: 'آبیار حرفه‌ای', description: '۲۰ بار آبیاری کردی', check: function(stats) { return stats.water >= 20; } },
  { id: 'fertilizer-10', icon: '🍃', name: 'آشپز باغ', description: '۱۰ بار کوددهی کردی', check: function(stats) { return stats.fertilize >= 10; } },
  { id: 'photographer-10', icon: '📸', name: 'عکاس باغ', description: '۱۰ عکس رشد گرفتی', check: function(stats) { return stats.photos >= 10; } },
  { id: 'writer-10', icon: '📝', name: 'یادداشت‌نویس', description: '۸ یادداشت نوشتی', check: function(stats) { return stats.notes >= 8; } },
  { id: 'streak-3', icon: '🔥', name: 'سه‌روزه', description: '۳ روز پشت‌سرهم مراقبت کردی', check: function(stats) { return stats.streak >= 3; } },
  { id: 'streak-7', icon: '🏆', name: 'هفت‌روزه', description: '۷ روز پشت‌سرهم مراقبت کردی', check: function(stats) { return stats.streak >= 7; } }
];

let streakData = null;
let streakInitAttempts = 0;
const MAX_INIT_ATTEMPTS = 30;

const SVG_FIRE = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="streak-fire-svg"><path d="M12 2 C12 2 8 7 8 12 C8 13 8 14 8 14 C8 14 7 13 6 11 C5 13 4 15 4 17 C4 20 8 22 12 22 C16 22 20 20 20 17 C20 15 19 13 18 11 C17 13 16 14 16 14 C16 14 16 13 16 12 C16 7 12 2 12 2 Z" fill="#d32f2f"/><path d="M12 4 C12 4 9 8 9 12 C9 13 9 14 9 14 C9 14 8 13 7.5 12 C7 13.5 6 15.5 6 17 C6 19.5 9 21 12 21 C15 21 18 19.5 18 17 C18 15.5 17 13.5 16.5 12 C16 13 15 14 15 14 C15 14 15 13 15 12 C15 8 12 4 12 4 Z" fill="#ff6f00"/><path d="M12 7 C12 7 10 10 10 13 C10 13.5 10 14 10 14 C10 14 9.5 13.5 9 13 C8.5 14 8 15.5 8 16.5 C8 18.5 10 20 12 20 C14 20 16 18.5 16 16.5 C16 15.5 15.5 14 15 13 C14.5 13.5 14 14 14 14 C14 14 14 13.5 14 13 C14 10 12 7 12 7 Z" fill="#ffab00"/><path d="M12 11 C12 11 11 13 11 14 C11 14.5 11.5 15 12 15 C12.5 15 13 14.5 13 14 C13 13 12 11 12 11 Z" fill="#fff8e1"/></svg>';

function isDatabaseReady() {
  return typeof db !== 'undefined' && db !== null;
}

function initStreak() {
  if (!isDatabaseReady()) {
    streakInitAttempts++;
    if (streakInitAttempts >= MAX_INIT_ATTEMPTS) {
      console.error('✗ دیتابیس آماده نشد پس از ' + MAX_INIT_ATTEMPTS + ' تلاش');
      return;
    }
    setTimeout(initStreak, 100);
    return;
  }

  streakData = loadStreakData();

  recalculateStreak()
    .then(function() { return recalculateXP(); })
    .then(function() { return checkBadges(); })
    .then(function() {
      updateStreakUI();
      renderHeatmap();
      console.log('✓ سیستم Streak راه‌اندازی شد');
      console.log('  - Streak فعلی:', streakData.currentStreak);
      console.log('  - رکورد:', streakData.longestStreak);
      console.log('  - امتیاز:', streakData.totalXP);
      console.log('  - سطح:', streakData.currentLevel);
      console.log('  - نشان‌ها:', streakData.unlockedBadges.length, 'از', BADGES.length);
    })
    .catch(function(error) {
      console.error('✗ خطا در راه‌اندازی Streak:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  initStreak();
});

function getDefaultStreakData() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    totalXP: 0,
    currentLevel: 1,
    unlockedBadges: [],
    lastCheckedDate: null
  };
}

function loadStreakData() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return getDefaultStreakData();
    const data = JSON.parse(raw);
    return Object.assign({}, getDefaultStreakData(), data);
  } catch (error) {
    console.error('✗ خطا در خواندن Streak:', error);
    return getDefaultStreakData();
  }
}

function saveStreakData() {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
  } catch (error) {
    console.error('✗ خطا در ذخیره Streak:', error);
  }
}

function getTodayKey() {
  return dateToKey(new Date());
}

function dateToKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function getDateKeyFromISO(isoString) {
  return dateToKey(new Date(isoString));
}

function daysBetween(dateKey1, dateKey2) {
  const d1 = new Date(dateKey1);
  const d2 = new Date(dateKey2);
  const diffMs = Math.abs(d2 - d1);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

async function recalculateStreak() {
  try {
    const activityDates = await getAllActivityDates();

    if (activityDates.size === 0) {
      streakData.currentStreak = 0;
      saveStreakData();
      return;
    }

    const sortedDates = Array.from(activityDates).sort().reverse();
    const todayKey = getTodayKey();
    const mostRecent = sortedDates[0];
    const daysFromToday = daysBetween(mostRecent, todayKey);

    let currentStreak = 0;

    if (daysFromToday <= 1) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = daysBetween(sortedDates[i - 1], sortedDates[i]);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    streakData.currentStreak = currentStreak;
    streakData.lastActivityDate = mostRecent;

    if (currentStreak > streakData.longestStreak) {
      streakData.longestStreak = currentStreak;
    }

    saveStreakData();
  } catch (error) {
    console.error('✗ خطا در محاسبه Streak:', error);
  }
}

async function getAllActivityDates() {
  const allLogs = await getAllCareLogs();
  const allPlants = await getAllPlants();
  const allPhotos = await getAllPhotos();
  const allNotes = await getAllNotes();

  const activityDates = new Set();

  allLogs.forEach(function(log) {
    if (log.date) activityDates.add(getDateKeyFromISO(log.date));
  });

  allPlants.forEach(function(plant) {
    if (plant.createdAt) activityDates.add(getDateKeyFromISO(plant.createdAt));
  });

  allPhotos.forEach(function(photo) {
    if (photo.createdAt) activityDates.add(getDateKeyFromISO(photo.createdAt));
  });

  allNotes.forEach(function(note) {
    if (note.createdAt) activityDates.add(getDateKeyFromISO(note.createdAt));
  });

  return activityDates;
}

async function recalculateXP() {
  try {
    const allLogs = await getAllCareLogs();
    const allPlants = await getAllPlants();
    const allPhotos = await getAllPhotos();
    const allNotes = await getAllNotes();

    let xp = 0;

    allLogs.forEach(function(log) {
      const type = log.type || 'water';
      xp += XP_REWARDS[type] || 10;
    });

    allPlants.forEach(function() {
      xp += XP_REWARDS.plant;
    });

    allPhotos.forEach(function() {
      xp += XP_REWARDS.photo;
    });

    allNotes.forEach(function() {
      xp += XP_REWARDS.note;
    });

    const oldLevel = streakData.currentLevel;
    streakData.totalXP = xp;
    streakData.currentLevel = getLevelFromXP(xp).level;

    saveStreakData();

    if (streakData.currentLevel > oldLevel) {
      console.log('🎉 سطح بالا رفت! سطح جدید:', streakData.currentLevel);
    }

    console.log('✓ امتیاز بازمحاسبه شد:', xp);
    return xp;
  } catch (error) {
    console.error('✗ خطا در بازمحاسبه امتیاز:', error);
    return 0;
  }
}

function getLevelFromXP(xp) {
  let current = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
    } else {
      break;
    }
  }
  return current;
}

function getNextLevel(currentLevelNumber) {
  return LEVELS.find(function(l) {
    return l.level === currentLevelNumber + 1;
  }) || null;
}

function getPlantStageFromStreak(days) {
  let stage = STREAK_PLANTS[0];
  for (let i = 0; i < STREAK_PLANTS.length; i++) {
    if (days >= STREAK_PLANTS[i].minDays) {
      stage = STREAK_PLANTS[i];
    } else {
      break;
    }
  }
  return stage;
}

async function getBadgeStats() {
  const allLogs = await getAllCareLogs();
  const allPlants = await getAllPlants();
  const allPhotos = await getAllPhotos();
  const allNotes = await getAllNotes();

  let water = 0;
  let fertilize = 0;
  let prune = 0;
  let repot = 0;
  let cutting = 0;

  allLogs.forEach(function(log) {
    const t = log.type || 'water';
    if (t === 'water') water++;
    else if (t === 'fertilize') fertilize++;
    else if (t === 'prune') prune++;
    else if (t === 'repot') repot++;
    else if (t === 'cutting') cutting++;
  });

  return {
    plants: allPlants.length,
    photos: allPhotos.length,
    notes: allNotes.length,
    water: water,
    fertilize: fertilize,
    prune: prune,
    repot: repot,
    cutting: cutting,
    streak: streakData.currentStreak
  };
}

async function checkBadges() {
  try {
    const stats = await getBadgeStats();
    const newlyUnlocked = [];

    for (let i = 0; i < BADGES.length; i++) {
      const badge = BADGES[i];
      const alreadyUnlocked = streakData.unlockedBadges.indexOf(badge.id) !== -1;

      if (!alreadyUnlocked && badge.check(stats)) {
        streakData.unlockedBadges.push(badge.id);
        newlyUnlocked.push(badge);
      }
    }

    if (newlyUnlocked.length > 0) {
      saveStreakData();
      newlyUnlocked.forEach(function(b) {
        console.log('🏆 نشان جدید:', b.icon, b.name, '—', b.description);
      });
    }

    updateBadgesCountUI();
    return newlyUnlocked;
  } catch (error) {
    console.error('✗ خطا در بررسی نشان‌ها:', error);
    return [];
  }
}

function getUnlockedBadges() {
  if (!streakData) return [];
  return BADGES.filter(function(badge) {
    return streakData.unlockedBadges.indexOf(badge.id) !== -1;
  });
}

function updateStreakUI() {
  if (!streakData) return;

  const fireIcon = document.getElementById('streak-fire-icon');
  if (fireIcon && !fireIcon.innerHTML.trim()) {
    fireIcon.innerHTML = SVG_FIRE;
  }

  const currentEl = document.getElementById('streak-current');
  const recordEl = document.getElementById('streak-record');
  const levelEl = document.getElementById('streak-level');
  const xpTextEl = document.getElementById('streak-xp-text');
  const xpFillEl = document.getElementById('streak-xp-fill');
  const fireEl = document.querySelector('.streak-fire');

  if (currentEl) currentEl.textContent = String(streakData.currentStreak);
  if (recordEl) recordEl.textContent = 'رکورد: ' + streakData.longestStreak + ' روز';

  const currentLevel = getLevelFromXP(streakData.totalXP);
  const nextLevel = getNextLevel(currentLevel.level);

  if (levelEl) {
    if (nextLevel) {
      levelEl.textContent = 'سطح ' + currentLevel.level + ': ' + currentLevel.name;
    } else {
      levelEl.textContent = 'سطح ' + currentLevel.level + ': ' + currentLevel.name + ' 🏆';
    }
  }

  if (xpTextEl) {
    if (nextLevel) {
      xpTextEl.textContent = 'امتیاز: ' + streakData.totalXP + ' / ' + nextLevel.minXP;
    } else {
      xpTextEl.textContent = 'امتیاز: ' + streakData.totalXP;
    }
  }

  if (xpFillEl) {
    if (nextLevel) {
      const xpInLevel = streakData.totalXP - currentLevel.minXP;
      const xpNeeded = nextLevel.minXP - currentLevel.minXP;
      const percent = Math.min(100, (xpInLevel / xpNeeded) * 100);
      xpFillEl.style.width = percent + '%';
    } else {
      xpFillEl.style.width = '100%';
    }
  }

  if (fireEl) {
    if (streakData.currentStreak > 0) {
      fireEl.classList.add('active');
    } else {
      fireEl.classList.remove('active');
    }
  }

  updateBadgesCountUI();
}

function updateBadgesCountUI() {
  const el = document.getElementById('streak-badges');
  if (!el || !streakData) return;

  const unlocked = streakData.unlockedBadges.length;
  const total = BADGES.length;

  el.textContent = '🏆 ' + unlocked + ' / ' + total + ' نشان';
}

async function renderHeatmap() {
  const container = document.getElementById('heatmap-grid');
  const totalEl = document.getElementById('heatmap-total');
  if (!container) return;

  try {
    const allLogs = await getAllCareLogs();
    const allPhotos = await getAllPhotos();
    const allNotes = await getAllNotes();
    const allPlants = await getAllPlants();

    const activityCounts = {};

    function addDate(iso) {
      if (!iso) return;
      const key = getDateKeyFromISO(iso);
      activityCounts[key] = (activityCounts[key] || 0) + 1;
    }

    allLogs.forEach(function(log) { addDate(log.date); });
    allPhotos.forEach(function(p) { addDate(p.createdAt); });
    allNotes.forEach(function(n) { addDate(n.createdAt); });
    allPlants.forEach(function(p) { addDate(p.createdAt); });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceSat = (today.getDay() + 1) % 7;
    const lastSaturday = new Date(today);
    lastSaturday.setDate(today.getDate() - daysSinceSat);

    const startDate = new Date(lastSaturday);
    startDate.setDate(startDate.getDate() - 11 * 7);

    container.innerHTML = '';

    let totalCount = 0;

    for (let week = 0; week < 12; week++) {
      const col = document.createElement('div');
      col.className = 'heatmap-week';

      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + week * 7 + day);

        const key = dateToKey(cellDate);
        const count = activityCounts[key] || 0;
        const isFuture = cellDate > today;

        if (!isFuture) totalCount += count;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        if (isFuture) {
          cell.classList.add('future');
        } else if (count === 0) {
          cell.classList.add('level-0');
        } else if (count === 1) {
          cell.classList.add('level-1');
        } else if (count <= 3) {
          cell.classList.add('level-2');
        } else {
          cell.classList.add('level-3');
        }

        cell.title = key + ' — ' + count + ' فعالیت';
        cell.setAttribute('data-date', key);

        col.appendChild(cell);
      }

      container.appendChild(col);
    }

    if (totalEl) {
      totalEl.textContent = totalCount + ' فعالیت در ۱۲ هفته';
    }

    console.log('✓ Heatmap رسم شد. مجموع:', totalCount);
  } catch (error) {
    console.error('✗ خطا در رسم Heatmap:', error);
  }
}

async function onActivityAdded() {
  if (!isDatabaseReady()) return;
  await recalculateStreak();
  await recalculateXP();
  await checkBadges();
  updateStreakUI();
  await renderHeatmap();
}