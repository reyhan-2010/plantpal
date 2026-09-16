// PlantPal - گزارش‌ها و نمودارها
// این فایل مسئول نمایش نمودارهای وضعیت گیاهان است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let pieChart = null;
let lineChart = null;
let currentChartType = 'pie';

// رنگ‌ها
const HEALTH_COLORS = {
  healthy: '#2e7d32',
  growing: '#1976d2',
  warning: '#fb8c00',
  sick: '#e53935'
};

const HEALTH_LABELS = {
  healthy: '🙂 سالم',
  growing: '🌱 در حال رشد',
  warning: '😐 نیاز به توجه',
  sick: '☹️ بیمار'
};

const CARE_TYPE_LABELS = {
  water: '💧 آبیاری',
  fertilize: '🍃 کوددهی',
  prune: '✂️ هرس',
  repot: '🪴 تعویض گلدان',
  cutting: '🌿 قلمه‌زنی'
};

const CARE_TYPE_COLORS = {
  water: '#1976d2',
  fertilize: '#66bb6a',
  prune: '#fb8c00',
  repot: '#8d6e63',
  cutting: '#43a047'
};

// ============================================
// بخش ۲: راه‌اندازی
// ============================================

function initReports() {
  setupReportTabs();
  console.log('✓ گزارش‌ها راه‌اندازی شد');
}

function setupReportTabs() {
  const tabPie = document.getElementById('tab-pie-chart');
  const tabLine = document.getElementById('tab-line-chart');

  if (tabPie) {
    tabPie.addEventListener('click', function() {
      switchChart('pie');
    });
  }

  if (tabLine) {
    tabLine.addEventListener('click', function() {
      switchChart('line');
    });
  }
}

function switchChart(type) {
  currentChartType = type;

  const tabPie = document.getElementById('tab-pie-chart');
  const tabLine = document.getElementById('tab-line-chart');
  const chartPie = document.getElementById('chart-pie');
  const chartLine = document.getElementById('chart-line');

  if (type === 'pie') {
    if (tabPie) tabPie.classList.add('active');
    if (tabLine) tabLine.classList.remove('active');
    if (chartPie) chartPie.style.display = 'block';
    if (chartLine) chartLine.style.display = 'none';
    renderPieChart();
  } else {
    if (tabPie) tabPie.classList.remove('active');
    if (tabLine) tabLine.classList.add('active');
    if (chartPie) chartPie.style.display = 'none';
    if (chartLine) chartLine.style.display = 'block';
    renderLineChart();
  }

  console.log('✓ نمودار تغییر کرد:', type);
}

// ============================================
// بخش ۳: نمایش صفحه گزارش‌ها
// ============================================

async function renderReports() {
  const plants = await getAllPlants();

  const chartEmpty = document.getElementById('chart-empty');
  const chartContainer = document.querySelector('.chart-container');
  const statsSection = document.querySelector('.stats-section');

  if (plants.length === 0) {
    if (chartEmpty) chartEmpty.style.display = 'block';
    if (chartContainer) chartContainer.style.display = 'none';
    if (statsSection) statsSection.style.display = 'none';
    return;
  }

  if (chartEmpty) chartEmpty.style.display = 'none';
  if (chartContainer) chartContainer.style.display = 'block';
  if (statsSection) statsSection.style.display = 'block';

  if (currentChartType === 'pie') {
    await renderPieChart();
  } else {
    await renderLineChart();
  }

  await renderStats();
}

// ============================================
// بخش ۴: نمودار دایره‌ای — وضعیت سلامت
// ============================================

async function renderPieChart() {
  try {
    const plants = await getAllPlants();

    const counts = {
      healthy: 0,
      growing: 0,
      warning: 0,
      sick: 0
    };

    plants.forEach(function(plant) {
      const health = plant.health || 'healthy';
      if (counts[health] !== undefined) {
        counts[health]++;
      }
    });

    const labels = [];
    const data = [];
    const colors = [];

    Object.keys(counts).forEach(function(key) {
      if (counts[key] > 0) {
        labels.push(HEALTH_LABELS[key]);
        data.push(counts[key]);
        colors.push(HEALTH_COLORS[key]);
      }
    });

    const ctx = document.getElementById('chart-pie');
    if (!ctx) return;

    if (pieChart) {
      pieChart.destroy();
    }

    const total = data.reduce(function(a, b) { return a + b; }, 0);

    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Vazirmatn', size: 13 },
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'وضعیت سلامت گیاهان',
            font: { family: 'Vazirmatn', size: 16, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const percent = ((value / total) * 100).toFixed(1);
                return context.label + ': ' + value + ' گیاه (' + percent + '%)';
              }
            },
            titleFont: { family: 'Vazirmatn', size: 14 },
            bodyFont: { family: 'Vazirmatn', size: 13 }
          }
        }
      }
    });

    console.log('✓ نمودار دایره‌ای نمایش داده شد');

  } catch (error) {
    console.error('✗ خطا در نمایش نمودار دایره‌ای:', error);
  }
}

// ============================================
// بخش ۵: نمودار خطی — تاریخچه فعالیت‌ها
// ============================================

async function renderLineChart() {
  try {
    const plants = await getAllPlants();

    if (plants.length === 0) return;

    // جمع‌آوری همه فعالیت‌ها
    const allLogs = [];

    for (const plant of plants) {
      const logs = await getCareLogsByPlantId(plant.id);
      logs.forEach(function(log) {
        allLogs.push(log);
      });
    }

    if (allLogs.length === 0) {
      const ctx = document.getElementById('chart-line');
      if (ctx) {
        if (lineChart) lineChart.destroy();
        lineChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'هنوز فعالیتی ثبت نشده است',
                font: { family: 'Vazirmatn', size: 16 }
              }
            }
          }
        });
      }
      return;
    }

    // گروه‌بندی بر اساس ماه
    const monthlyData = {};

    allLogs.forEach(function(log) {
      const date = new Date(log.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = year + '/' + month;

      const type = log.type || 'water';

      if (!monthlyData[key]) {
        monthlyData[key] = {
          water: 0,
          fertilize: 0,
          prune: 0,
          repot: 0,
          cutting: 0
        };
      }

      if (monthlyData[key][type] !== undefined) {
        monthlyData[key][type]++;
      }
    });

    // مرتب‌سازی کلیدها
    const sortedKeys = Object.keys(monthlyData).sort();

    // ساخت داده‌ها برای هر نوع
    const careTypes = ['water', 'fertilize', 'prune', 'repot', 'cutting'];
    const datasets = [];

    careTypes.forEach(function(type) {
      const hasData = sortedKeys.some(function(key) {
        return monthlyData[key][type] > 0;
      });

      if (hasData) {
        datasets.push({
          label: CARE_TYPE_LABELS[type],
          data: sortedKeys.map(function(key) {
            return monthlyData[key][type];
          }),
          borderColor: CARE_TYPE_COLORS[type],
          backgroundColor: CARE_TYPE_COLORS[type] + '33',
          tension: 0.4,
          fill: false,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: CARE_TYPE_COLORS[type],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        });
      }
    });

    const ctx = document.getElementById('chart-line');
    if (!ctx) return;

    if (lineChart) {
      lineChart.destroy();
    }

    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedKeys,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Vazirmatn', size: 13 },
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'تاریخچه فعالیت‌ها بر اساس ماه',
            font: { family: 'Vazirmatn', size: 16, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y + ' بار';
              }
            },
            titleFont: { family: