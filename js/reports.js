// PlantPal - گزارش‌ها و نمودارها
// این فایل مسئول نمایش نمودارهای وضعیت گیاهان است.

// ============================================
// بخش ۱: متغیرهای سراسری
// ============================================

let pieChart = null;
let lineChart = null;
let barChart = null;
let currentChartType = 'pie';
let currentBarGroupBy = 'location';

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

const CARE_TYPE_ORDER = ['water', 'fertilize', 'prune', 'repot', 'cutting'];

const STAT_COLOR_CLASSES = {
  green: 'stat-color-green',
  blue: 'stat-color-blue',
  lightGreen: 'stat-color-light-green',
  orange: 'stat-color-orange',
  brown: 'stat-color-brown',
  red: 'stat-color-red'
};

const BAR_COLORS = [
  '#2e7d32',
  '#1976d2',
  '#fb8c00',
  '#8d6e63',
  '#43a047',
  '#e53935',
  '#9c27b0',
  '#00acc1',
  '#f4511e',
  '#5e35b1',
  '#039be5',
  '#7cb342'
];

// ============================================
// بخش ۲: راه‌اندازی
// ============================================

function initReports() {
  setupReportTabs();
  setupBarGroupingButtons();
  console.log('✓ گزارش‌ها راه‌اندازی شد');
}

function setupReportTabs() {
  const tabPie = document.getElementById('tab-pie-chart');
  const tabLine = document.getElementById('tab-line-chart');
  const tabBar = document.getElementById('tab-bar-chart');

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

  if (tabBar) {
    tabBar.addEventListener('click', function() {
      switchChart('bar');
    });
  }
}

function setupBarGroupingButtons() {
  const buttons = document.querySelectorAll('[data-group-by]');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const groupBy = btn.getAttribute('data-group-by');
      setBarGrouping(groupBy);
    });
  });
}

function setBarGrouping(groupBy) {
  currentBarGroupBy = groupBy;

  const buttons = document.querySelectorAll('[data-group-by]');
  buttons.forEach(function(btn) {
    const btnGroup = btn.getAttribute('data-group-by');
    if (btnGroup === groupBy) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderBarChart();
  console.log('✓ گروه‌بندی نمودار میله‌ای:', groupBy);
}

function switchChart(type) {
  currentChartType = type;

  const tabPie = document.getElementById('tab-pie-chart');
  const tabLine = document.getElementById('tab-line-chart');
  const tabBar = document.getElementById('tab-bar-chart');
  const chartPie = document.getElementById('chart-pie');
  const chartLine = document.getElementById('chart-line');
  const chartBar = document.getElementById('chart-bar');
  const groupingSelector = document.getElementById('bar-grouping-selector');

  if (tabPie) tabPie.classList.remove('active');
  if (tabLine) tabLine.classList.remove('active');
  if (tabBar) tabBar.classList.remove('active');
  if (chartPie) chartPie.style.display = 'none';
  if (chartLine) chartLine.style.display = 'none';
  if (chartBar) chartBar.style.display = 'none';
  if (groupingSelector) groupingSelector.style.display = 'none';

  if (type === 'pie') {
    if (tabPie) tabPie.classList.add('active');
    if (chartPie) chartPie.style.display = 'block';
    renderPieChart();
  } else if (type === 'line') {
    if (tabLine) tabLine.classList.add('active');
    if (chartLine) chartLine.style.display = 'block';
    renderLineChart();
  } else if (type === 'bar') {
    if (tabBar) tabBar.classList.add('active');
    if (chartBar) chartBar.style.display = 'block';
    if (groupingSelector) groupingSelector.style.display = 'block';
    renderBarChart();
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
  } else if (currentChartType === 'line') {
    await renderLineChart();
  } else if (currentChartType === 'bar') {
    await renderBarChart();
  }

  await renderStats();
}

// ============================================
// بخش ۴: نمودار دایره‌ای
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
// بخش ۵: نمودار خطی
// ============================================

async function renderLineChart() {
  try {
    const plants = await getAllPlants();

    if (plants.length === 0) return;

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

    const sortedKeys = Object.keys(monthlyData).sort();

    const datasets = [];

    CARE_TYPE_ORDER.forEach(function(type) {
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
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
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
            titleFont: { family: 'Vazirmatn', size: 14 },
            bodyFont: { family: 'Vazirmatn', size: 13 }
          }
        }
      }
    });

    console.log('✓ نمودار خطی نمایش داده شد');

  } catch (error) {
    console.error('✗ خطا در نمایش نمودار خطی:', error);
  }
}

// ============================================
// بخش ۶: نمودار میله‌ای با گروه‌بندی
// ============================================

function getGroupKeyAndLabel(plant, groupBy) {
  if (groupBy === 'location') {
    const loc = (plant.location || '').trim();
    return {
      key: loc || 'نامشخص',
      label: loc || 'نامشخص'
    };
  } else if (groupBy === 'health') {
    const health = plant.health || 'healthy';
    return {
      key: health,
      label: HEALTH_LABELS[health] || 'نامشخص'
    };
  }
  return { key: 'نامشخص', label: 'نامشخص' };
}

function getBarChartTitle(groupBy) {
  if (groupBy === 'location') return 'گیاهان به تفکیک محل نگهداری';
  if (groupBy === 'health') return 'گیاهان به تفکیک وضعیت سلامت';
  if (groupBy === 'activity') return 'فعالیت‌ها به تفکیک نوع';
  return 'گیاهان';
}

function getBarChartYLabel(groupBy) {
  if (groupBy === 'activity') return 'تعداد بار';
  return 'تعداد گیاهان';
}

async function renderBarChart() {
  try {
    const plants = await getAllPlants();

    if (plants.length === 0) return;

    // حالت فعالیت‌ها (بر اساس careLogs)
    if (currentBarGroupBy === 'activity') {
      return await renderActivityBarChart();
    }

    // حالت‌های based-plant (location / health)
    const groupCounts = {};
    const groupLabels = {};

    plants.forEach(function(plant) {
      const result = getGroupKeyAndLabel(plant, currentBarGroupBy);
      if (!groupCounts[result.key]) {
        groupCounts[result.key] = 0;
        groupLabels[result.key] = result.label;
      }
      groupCounts[result.key]++;
    });

    const sortedKeys = Object.keys(groupCounts).sort(function(a, b) {
      return groupCounts[b] - groupCounts[a];
    });

    const labels = sortedKeys.map(function(k) { return groupLabels[k]; });
    const data = sortedKeys.map(function(k) { return groupCounts[k]; });

    let colors;
    if (currentBarGroupBy === 'health') {
      colors = sortedKeys.map(function(k) {
        return HEALTH_COLORS[k] || '#2e7d32';
      });
    } else {
      colors = sortedKeys.map(function(k, index) {
        return BAR_COLORS[index % BAR_COLORS.length];
      });
    }

    drawBarChart(labels, data, colors);

    console.log('✓ نمودار میله‌ای نمایش داده شد. گروه‌بندی:', currentBarGroupBy, '| تعداد گروه:', labels.length);

  } catch (error) {
    console.error('✗ خطا در نمایش نمودار میله‌ای:', error);
  }
}

async function renderActivityBarChart() {
  try {
    const plants = await getAllPlants();

    const allLogs = [];
    for (const plant of plants) {
      const logs = await getCareLogsByPlantId(plant.id);
      logs.forEach(function(log) { allLogs.push(log); });
    }

    const typeCounts = { water: 0, fertilize: 0, prune: 0, repot: 0, cutting: 0 };
    allLogs.forEach(function(log) {
      const type = log.type || 'water';
      if (typeCounts[type] !== undefined) typeCounts[type]++;
    });

    const labels = [];
    const data = [];
    const colors = [];

    CARE_TYPE_ORDER.forEach(function(type) {
      if (typeCounts[type] > 0) {
        labels.push(CARE_TYPE_LABELS[type]);
        data.push(typeCounts[type]);
        colors.push(CARE_TYPE_COLORS[type]);
      }
    });

    if (labels.length === 0) {
      const ctx = document.getElementById('chart-bar');
      if (ctx) {
        if (barChart) barChart.destroy();
        barChart = new Chart(ctx, {
          type: 'bar',
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
      console.log('✓ نمودار فعالیت‌ها: خالی');
      return;
    }

    drawBarChart(labels, data, colors);

    console.log('✓ نمودار فعالیت‌ها نمایش داده شد. تعداد نوع:', labels.length, '| کل فعالیت:', allLogs.length);
  } catch (error) {
    console.error('✗ خطا در نمایش نمودار فعالیت‌ها:', error);
  }
}

function drawBarChart(labels, data, colors) {
  const ctx = document.getElementById('chart-bar');
  if (!ctx) return;

  if (barChart) {
    barChart.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e8f0e8' : '#1f2d2a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: getBarChartYLabel(currentBarGroupBy),
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0,
            color: textColor,
            font: { family: 'Vazirmatn', size: 12 }
          },
          grid: {
            color: gridColor,
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: textColor,
            font: { family: 'Vazirmatn', size: 12 }
          },
          grid: {
            display: false,
            drawBorder: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: getBarChartTitle(currentBarGroupBy),
          font: { family: 'Vazirmatn', size: 16, weight: 'bold' },
          padding: 20,
          color: textColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const unit = currentBarGroupBy === 'activity' ? ' بار' : ' گیاه';
              return value + unit;
            }
          },
          titleFont: { family: 'Vazirmatn', size: 14 },
          bodyFont: { family: 'Vazirmatn', size: 13 }
        }
      }
    }
  });
}

// ============================================
// بخش ۷: آمار کلی
// ============================================

async function renderStats() {
  try {
    const plants = await getAllPlants();
    const statsList = document.getElementById('stats-list');
    if (!statsList) return;

    const totalPlants = plants.length;

    const healthCounts = { healthy: 0, growing: 0, warning: 0, sick: 0 };
    plants.forEach(function(plant) {
      const h = plant.health || 'healthy';
      if (healthCounts[h] !== undefined) healthCounts[h]++;
    });

    const allLogs = [];
    let totalNotes = 0;

    for (const plant of plants) {
      const logs = await getCareLogsByPlantId(plant.id);
      logs.forEach(function(log) { allLogs.push(log); });

      const notes = await getNotesByPlantId(plant.id);
      totalNotes += notes.length;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthLogs = allLogs.filter(function(log) {
      const d = new Date(log.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const careCounts = { water: 0, fertilize: 0, prune: 0, repot: 0, cutting: 0 };
    thisMonthLogs.forEach(function(log) {
      const t = log.type || 'water';
      if (careCounts[t] !== undefined) careCounts[t]++;
    });

    const stats = [
      {
        icon: '🌱',
        label: 'کل گیاهان',
        value: totalPlants,
        colorClass: STAT_COLOR_CLASSES.green
      },
      {
        icon: '💧',
        label: 'آبیاری این ماه',
        value: careCounts.water,
        colorClass: STAT_COLOR_CLASSES.blue
      },
      {
        icon: '🍃',
        label: 'کوددهی این ماه',
        value: careCounts.fertilize,
        colorClass: STAT_COLOR_CLASSES.lightGreen
      },
      {
        icon: '✂️',
        label: 'هرس این ماه',
        value: careCounts.prune,
        colorClass: STAT_COLOR_CLASSES.orange
      },
      {
        icon: '📝',
        label: 'یادداشت‌ها',
        value: totalNotes,
        colorClass: STAT_COLOR_CLASSES.brown
      },
      {
        icon: '✅',
        label: 'گیاهان سالم',
        value: healthCounts.healthy,
        colorClass: STAT_COLOR_CLASSES.green
      },
      {
        icon: '⚠️',
        label: 'نیازمند توجه',
        value: healthCounts.warning + healthCounts.sick,
        colorClass: STAT_COLOR_CLASSES.red
      }
    ];

    statsList.innerHTML = stats.map(function(s) {
      return (
        '<div class="stat-card ' + s.colorClass + '">' +
          '<div class="stat-card-icon">' + s.icon + '</div>' +
          '<div class="stat-card-content">' +
            '<div class="stat-card-label">' + s.label + '</div>' +
            '<div class="stat-card-value">' + s.value + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    console.log('✓ آمار کلی نمایش داده شد');

  } catch (error) {
    console.error('✗ خطا در نمایش آمار کلی:', error);
  }
}