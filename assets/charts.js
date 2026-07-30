(function() {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var good = style.getPropertyValue('--good').trim();
  var warn = style.getPropertyValue('--warn').trim();

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function showToast(message) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message || '已保存';
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function() {
      toast.classList.remove('show');
    }, 1800);
  }

  // ===== localStorage 数据管理 =====
  var STORAGE_KEY = 'hotel_workbench_data_v1';

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  function getDefaultData() {
    return {
      tasks: [
        { id: 1, title: '回复洛龙店一条差评', meta: '客户体验 / 需今天处理', tag: '紧急', tagClass: 'bad', due: new Date().toISOString().slice(0, 10), done: false },
        { id: 2, title: '确认西工店维修进度', meta: '空调异响 / 负责人：店长', tag: '跟进', tagClass: 'warn', due: new Date().toISOString().slice(0, 10), done: false },
        { id: 3, title: '收集保洁主管晚班检查表', meta: '卫生标准 / 21:00 前', tag: '日常', tagClass: '', due: '', done: false },
        { id: 4, title: '整理青旅备选房源对比', meta: '拓店项目 / 本周复盘', tag: '项目', tagClass: '', due: '', done: false }
      ],
      alerts: [
        { tag: '客诉', tagClass: 'bad', title: '洛龙店 301 房卫生反馈', meta: '建议核查保洁流程并回访客户' },
        { tag: '数据', tagClass: 'warn', title: '西工店连续两天入住率低于 70%', meta: '建议检查平台价格和曝光' },
        { tag: '内容', tagClass: '', title: '本周探店视频还差 1 条未拍', meta: '可安排在周五晚高峰拍摄' }
      ],
      storeKpis: [
        { name: '西工店', desc: '商务客为主，重点关注入住率与线上曝光。', status: '运行正常', statusClass: 'good', occupancy: '76%', revenue: '¥8,460', rating: '4.7', progress: '68%' },
        { name: '洛龙店', desc: '年轻客群与周末订单较多，重点关注体验评价。', status: '需关注', statusClass: 'warn', occupancy: '88%', revenue: '¥10,160', rating: '4.8', progress: '74%' }
      ],
      storeRecords: [
        { store: '西工店', item: '空调异响维修', owner: '店长', status: '处理中', statusClass: 'warn', advice: '要求维修师傅今天反馈报价与完成时间。' },
        { store: '洛龙店', item: '301 房卫生反馈', owner: '保洁主管', status: '需回访', statusClass: 'bad', advice: '复查卫生标准，处理后给客人致歉并回访。' },
        { store: '西工店', item: '平台活动报名', owner: '店长', status: '待确认', statusClass: '', advice: '核算活动后利润，避免低价无效订单。' },
        { store: '洛龙店', item: '周末房价调整', owner: '店长', status: '已完成', statusClass: 'good', advice: '周六保留部分高价房，观察转化。' }
      ],
      contentVideos: [
        { title: '本地烧烤探店', platform: '抖音 / 小红书', play: '12,000', interact: '点赞 860 / 收藏 580', review: '真实体验类标题效果好，可继续做系列。' },
        { title: '西工区早餐路线', platform: '抖音', play: '待发布', interact: '-', review: '封面建议突出“本地人常吃”。' },
        { title: '青旅附近一日游', platform: '小红书', play: '选题中', interact: '-', review: '可导流到青旅住宿场景。' }
      ],
      agencyClients: [
        { name: 'A 精品酒店', focus: '价格体系与平台曝光', problem: '周中入住率低', action: '调整平日促销与连住策略', freq: '每周一次' },
        { name: 'B 民宿酒店', focus: '评价维护与房型包装', problem: '图片转化低', action: '重拍房型主图，优化标题', freq: '每两周一次' },
        { name: 'C 商务酒店', focus: '差评处理与服务流程', problem: '前台响应慢', action: '制定前台话术和客诉 SOP', freq: '每周一次' }
      ],
      dailyReports: [
        { date: new Date().toISOString().slice(0, 10), work: '查看入住率、跟进门店异常、整理今日待办。', plan: '继续跟进客诉和内容拍摄计划。', issue: '暂无' }
      ],
      learningRecords: [
        { date: new Date().toISOString().slice(0, 10), content: '学习酒店经营数据复盘方法。', book: '本月待读书', note: '把学到的方法用到门店日报和月度复盘里。' }
      ],
      monthlyNotes: {}
    };
  }

  var appData = loadData() || getDefaultData();
  migrateData();

  // ===== 导航（桌面和手机统一点击逻辑） =====
  function initNavigation() {
    document.addEventListener('click', function(e) {
      var button = e.target.closest('button[data-section]');
      if (!button) return;
      var target = button.getAttribute('data-section');
      var targetSection = document.getElementById(target);
      if (!targetSection) return;
      e.preventDefault();
      $all('button[data-section]').forEach(function(item) {
        item.classList.toggle('active', item.getAttribute('data-section') === target);
      });
      $all('.section').forEach(function(section) { section.classList.remove('active'); });
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(resizeCharts, 80);
    });
  }

  // ===== 日期 =====
  function initDate() {
    var target = $('#todayText');
    if (!target) return;
    var now = new Date();
    var text = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
    target.textContent = text;
  }

  // ===== 待办任务（支持增删改） =====
  function isOverdue(task) {
    var today = new Date().toISOString().slice(0, 10);
    return task.due && !task.done && task.due < today;
  }

  function renderTasks() {
    var container = $('#taskList');
    if (!container) return;
    container.innerHTML = appData.tasks.map(function(t) {
      var dueText = t.due ? '<span class="due">截止：' + escapeHtml(t.due) + (isOverdue(t) ? '（已逾期）' : '') + '</span>' : '';
      return '<label class="task' + (t.done ? ' done' : '') + (isOverdue(t) ? ' overdue' : '') + '">' +
        '<input type="checkbox" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '>' +
        '<span><b class="task-title">' + escapeHtml(t.title) + '</b><span class="task-meta">' + escapeHtml(t.meta) + '</span>' + dueText + '</span>' +
        '<span class="tag ' + t.tagClass + '">' + escapeHtml(isOverdue(t) ? '逾期' : t.tag) + '</span>' +
      '</label>';
    }).join('');
    bindTaskEvents();
    updateTaskCount();
    renderMonthlyReview();
  }

  function bindTaskEvents() {
    $all('#taskList input[type="checkbox"]').forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        var id = parseInt(checkbox.getAttribute('data-id'));
        var task = appData.tasks.find(function(t) { return t.id === id; });
        if (task) {
          task.done = checkbox.checked;
          saveData(appData);
          var taskEl = checkbox.closest('.task');
          if (taskEl) taskEl.classList.toggle('done', checkbox.checked);
          showToast(checkbox.checked ? '已标记为完成' : '已恢复为待处理');
          updateTaskCount();
        }
      });
    });
  }

  function updateTaskCount() {
    var undone = appData.tasks.filter(function(t) { return !t.done; }).length;
    var countEl = $('.nav button[data-section="dashboard"] .count');
    if (countEl) countEl.textContent = undone;
  }

  function initTaskForm() {
    var form = $('#addTaskForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var title = $('#taskTitle').value.trim();
      var module = $('#taskModule').value;
      var owner = $('#taskOwner').value.trim();
      var priority = $('#taskPriority').value;
      var note = $('#taskNote').value.trim();
      var due = $('#taskDue') ? $('#taskDue').value : '';
      if (!title) {
        showToast('请输入事项名称');
        return;
      }
      var tagMap = { '紧急': 'bad', '跟进': 'warn', '普通': '' };
      var newTask = {
        id: Date.now(),
        title: title,
        meta: (owner ? owner + ' / ' : '') + module + (note ? ' / ' + note : ''),
        tag: priority,
        tagClass: tagMap[priority] || '',
        due: due,
        done: false
      };
      appData.tasks.push(newTask);
      saveData(appData);
      renderTasks();
      form.reset();
      showToast('已添加待办事项');
    });
  }

  // ===== 按钮提示 =====
  function initButtons() {
    $all('[data-toast]').forEach(function(button) {
      button.addEventListener('click', function() {
        showToast(button.getAttribute('data-toast'));
      });
    });
  }

  // ===== 图表 =====
  var charts = [];

  function chartBaseOptions() {
    return {
      animation: false,
      textStyle: { color: ink, fontFamily: 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif' },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink }
      },
      grid: { left: 42, right: 20, top: 28, bottom: 36 },
      xAxis: {
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        axisLabel: { color: muted },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule } }
      }
    };
  }

  function initRevenueChart() {
    var el = $('#chartRevenue');
    if (!el || !window.echarts) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var base = chartBaseOptions();
    chart.setOption({
      animation: false,
      textStyle: base.textStyle,
      color: [accent, accent2],
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: muted }
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        valueFormatter: function(value) { return '¥' + value.toLocaleString('zh-CN'); },
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink }
      },
      grid: base.grid,
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: muted,
          formatter: function(value) { return value / 1000 + 'k'; }
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: '西工店',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.12 },
          data: [7600, 8200, 7950, 8460, 9100, 10200, 9800]
        },
        {
          name: '洛龙店',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.10 },
          data: [8900, 9300, 9750, 10160, 11200, 12600, 11800]
        }
      ]
    });
    charts.push(chart);
  }

  function initTaskChart() {
    var el = $('#chartTasks');
    if (!el || !window.echarts) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      color: [accent, accent2, warn, good],
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink }
      },
      legend: {
        bottom: 0,
        textStyle: { color: muted }
      },
      series: [{
        name: '今日事项',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        label: {
          color: ink,
          formatter: '{b}\n{c}项'
        },
        labelLine: { lineStyle: { color: rule } },
        data: [
          { value: 3, name: '门店运营' },
          { value: 2, name: '人员管理' },
          { value: 1, name: '内容视频' },
          { value: 1, name: '代运营' }
        ]
      }]
    });
    charts.push(chart);
  }

  function initPeopleChart() {
    var el = $('#chartPeople');
    if (!el || !window.echarts) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      textStyle: { color: ink, fontFamily: 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif' },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink },
        valueFormatter: function(value) { return value + '%'; }
      },
      grid: { left: 78, right: 16, top: 20, bottom: 28 },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: muted, formatter: '{value}%' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: ['西工店长', '洛龙店长', '保洁主管', '前台团队'],
        axisLabel: { color: muted },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        name: '完成率',
        type: 'bar',
        barWidth: 14,
        itemStyle: {
          color: function(params) {
            return params.value >= 90 ? accent2 : accent;
          },
          borderRadius: [0, 8, 8, 0]
        },
        data: [86, 92, 78, 84]
      }]
    });
    charts.push(chart);
  }

  function resizeCharts() {
    charts.forEach(function(chart) {
      if (chart && chart.resize) chart.resize();
    });
  }

  function editableCell(list, index, field, value) {
    return '<td contenteditable="true" data-list="' + list + '" data-index="' + index + '" data-field="' + field + '">' + escapeHtml(value || '') + '</td>';
  }

  function statusClass(status) {
    if (status === '运行正常') return 'good';
    if (status === '需关注') return 'warn';
    if (status === '已完成') return 'good';
    if (status === '处理中' || status === '待确认') return 'warn';
    if (status === '需回访') return 'bad';
    return '';
  }

  function migrateData() {
    var defaults = getDefaultData();
    if (!appData.storeKpis) appData.storeKpis = defaults.storeKpis;
    appData.tasks = (appData.tasks || defaults.tasks).map(function(t) {
      if (typeof t.due === 'undefined') t.due = '';
      return t;
    });
    if (!appData.monthlyNotes) appData.monthlyNotes = {};
    if (!appData.learningRecords) appData.learningRecords = defaults.learningRecords;
    appData.dailyReports = (appData.dailyReports || defaults.dailyReports).map(function(r) {
      return {
        date: r.date || new Date().toISOString().slice(0, 10),
        work: r.work || r.done || r.focus || '',
        plan: r.plan || r.tomorrow || '',
        issue: r.issue || r.problem || ''
      };
    });
    saveData(appData);
  }

  function editableField(list, index, field, value, tagName, className) {
    var tag = tagName || 'span';
    return '<' + tag + ' contenteditable="true" data-list="' + list + '" data-index="' + index + '" data-field="' + field + '"' +
      (className ? ' class="' + className + '"' : '') + '>' + escapeHtml(value || '') + '</' + tag + '>';
  }

  function renderStoreCards() {
    var container = $('#storeCards');
    if (!container) return;
    appData.storeKpis = appData.storeKpis || getDefaultData().storeKpis;
    container.innerHTML = appData.storeKpis.map(function(s, index) {
      var cls = s.statusClass || statusClass(s.status) || '';
      return '<div class="card store-card">' +
        '<div class="store-head">' +
          '<div>' + editableField('storeKpis', index, 'name', s.name, 'h3') + editableField('storeKpis', index, 'desc', s.desc, 'p', 'hint') + '</div>' +
          editableField('storeKpis', index, 'status', s.status, 'span', 'tag ' + cls) +
        '</div>' +
        '<div class="store-kpis">' +
          '<div class="mini-kpi">' + editableField('storeKpis', index, 'occupancy', s.occupancy, 'b') + '<span>今日入住率</span></div>' +
          '<div class="mini-kpi">' + editableField('storeKpis', index, 'revenue', s.revenue, 'b') + '<span>今日营收</span></div>' +
          '<div class="mini-kpi">' + editableField('storeKpis', index, 'rating', s.rating, 'b') + '<span>平台评分</span></div>' +
        '</div>' +
        '<div><span class="hint">本月目标完成度：' + editableField('storeKpis', index, 'progress', s.progress, 'b') + '</span><div class="progress" style="--w:' + escapeHtml(s.progress || '0%') + '"><i></i></div></div>' +
      '</div>';
    }).join('');
  }

  // ===== 门店记录表格渲染 =====
  function renderStoreRecords() {
    var tbody = $('#storeRecordsBody');
    if (!tbody) return;
    var keyword = ($('#storeFilterKeyword') && $('#storeFilterKeyword').value.trim()) || '';
    var store = ($('#storeFilterStore') && $('#storeFilterStore').value) || '';
    var status = ($('#storeFilterStatus') && $('#storeFilterStatus').value) || '';
    var owner = ($('#storeFilterOwner') && $('#storeFilterOwner').value.trim()) || '';
    tbody.innerHTML = appData.storeRecords.map(function(r, index) {
      return { row: r, index: index };
    }).filter(function(item) {
      var r = item.row;
      var text = [r.store, r.item, r.owner, r.status, r.advice].join(' ');
      return (!keyword || text.indexOf(keyword) >= 0) && (!store || r.store === store) && (!status || r.status === status) && (!owner || (r.owner || '').indexOf(owner) >= 0);
    }).map(function(item) {
      var r = item.row;
      var index = item.index;
      return '<tr>' +
        editableCell('storeRecords', index, 'store', r.store) +
        editableCell('storeRecords', index, 'item', r.item) +
        editableCell('storeRecords', index, 'owner', r.owner) +
        editableCell('storeRecords', index, 'status', r.status) +
        editableCell('storeRecords', index, 'advice', r.advice) +
        '<td class="table-actions"><button class="mini-btn danger" data-delete-list="storeRecords" data-delete-index="' + index + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  // ===== 内容视频表格渲染 =====
  function renderContentVideos() {
    var tbody = $('#contentVideosBody');
    if (!tbody) return;
    var keyword = ($('#contentFilterKeyword') && $('#contentFilterKeyword').value.trim()) || '';
    var platform = ($('#contentFilterPlatform') && $('#contentFilterPlatform').value.trim()) || '';
    var play = ($('#contentFilterPlay') && $('#contentFilterPlay').value.trim()) || '';
    var interact = ($('#contentFilterInteract') && $('#contentFilterInteract').value.trim()) || '';
    tbody.innerHTML = appData.contentVideos.map(function(v, index) {
      return { row: v, index: index };
    }).filter(function(item) {
      var v = item.row;
      var text = [v.title, v.platform, v.play, v.interact, v.review].join(' ');
      return (!keyword || text.indexOf(keyword) >= 0) && (!platform || (v.platform || '').indexOf(platform) >= 0) && (!play || (v.play || '').indexOf(play) >= 0) && (!interact || (v.interact || '').indexOf(interact) >= 0);
    }).map(function(item) {
      var v = item.row;
      var index = item.index;
      return '<tr>' +
        editableCell('contentVideos', index, 'title', v.title) +
        editableCell('contentVideos', index, 'platform', v.platform) +
        editableCell('contentVideos', index, 'play', v.play) +
        editableCell('contentVideos', index, 'interact', v.interact) +
        editableCell('contentVideos', index, 'review', v.review) +
        '<td class="table-actions"><button class="mini-btn danger" data-delete-list="contentVideos" data-delete-index="' + index + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  // ===== 工作日报渲染 =====
  function renderDailyReports() {
    var tbody = $('#dailyReportsBody');
    if (!tbody) return;
    appData.dailyReports = appData.dailyReports || [];
    var keyword = ($('#reportFilterKeyword') && $('#reportFilterKeyword').value.trim()) || '';
    var start = ($('#reportFilterStart') && $('#reportFilterStart').value) || '';
    var end = ($('#reportFilterEnd') && $('#reportFilterEnd').value) || '';
    var onlyIssue = ($('#reportFilterIssue') && $('#reportFilterIssue').value) || '';
    tbody.innerHTML = appData.dailyReports.map(function(r, index) {
      return { row: r, index: index };
    }).filter(function(item) {
      var r = item.row;
      var text = [r.date, r.work, r.plan, r.issue].join(' ');
      var hasIssue = r.issue && r.issue !== '暂无' && r.issue !== '无';
      return (!keyword || text.indexOf(keyword) >= 0) && (!start || r.date >= start) && (!end || r.date <= end) && (!onlyIssue || hasIssue);
    }).map(function(item) {
      var r = item.row;
      var index = item.index;
      return '<tr>' +
        editableCell('dailyReports', index, 'date', r.date) +
        editableCell('dailyReports', index, 'work', r.work || r.done || r.focus) +
        editableCell('dailyReports', index, 'plan', r.plan || r.tomorrow) +
        editableCell('dailyReports', index, 'issue', r.issue || r.problem) +
        '<td class="table-actions"><button class="mini-btn danger" data-delete-list="dailyReports" data-delete-index="' + index + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  function bindEditableTables() {
    document.addEventListener('blur', function(e) {
      var cell = e.target.closest('[contenteditable="true"][data-list]');
      if (!cell) return;
      var list = cell.getAttribute('data-list');
      var index = parseInt(cell.getAttribute('data-index'), 10);
      var field = cell.getAttribute('data-field');
      if (appData[list] && appData[list][index]) {
        appData[list][index][field] = cell.textContent.trim();
        if (list === 'storeRecords' && field === 'status') {
          appData[list][index].statusClass = statusClass(appData[list][index][field]);
        }
        if (list === 'storeKpis' && field === 'status') {
          appData[list][index].statusClass = statusClass(appData[list][index][field]);
          renderStoreCards();
        }
        if (list === 'storeKpis' && field === 'progress') {
          renderStoreCards();
        }
        saveData(appData);
        renderMonthlyReview();
        showToast('已自动保存');
      }
    }, true);

    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-delete-list]');
      if (!btn) return;
      var list = btn.getAttribute('data-delete-list');
      var index = parseInt(btn.getAttribute('data-delete-index'), 10);
      if (!appData[list]) return;
      appData[list].splice(index, 1);
      saveData(appData);
      renderAllEditable();
      showToast('已删除');
    });
  }

  function renderAllEditable() {
    renderStoreCards();
    renderStoreRecords();
    renderContentVideos();
    renderDailyReports();
    renderLearningRecords();
  }

  function initRecordForms() {
    var storeForm = $('#addStoreRecordForm');
    if (storeForm) {
      storeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var item = $('#storeRecordItem').value.trim();
        if (!item) return showToast('请输入门店事项');
        var status = $('#storeRecordStatus').value;
        appData.storeRecords.push({
          store: $('#storeRecordStore').value,
          item: item,
          owner: $('#storeRecordOwner').value.trim() || '待定',
          status: status,
          statusClass: statusClass(status),
          advice: $('#storeRecordAdvice').value.trim()
        });
        saveData(appData);
        renderStoreRecords();
        renderMonthlyReview();
        storeForm.reset();
        showToast('门店记录已保存');
      });
    }

    var contentForm = $('#addContentVideoForm');
    if (contentForm) {
      contentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var title = $('#contentVideoTitle').value.trim();
        if (!title) return showToast('请输入内容标题');
        appData.contentVideos.push({
          title: title,
          platform: $('#contentVideoPlatform').value.trim() || '-',
          play: $('#contentVideoPlay').value.trim() || '-',
          interact: $('#contentVideoInteract').value.trim() || '-',
          review: $('#contentVideoReview').value.trim()
        });
        saveData(appData);
        renderContentVideos();
        renderMonthlyReview();
        contentForm.reset();
        showToast('内容记录已保存');
      });
    }

    var reportDate = $('#reportDate');
    if (reportDate && !reportDate.value) reportDate.value = new Date().toISOString().slice(0, 10);
    var reportForm = $('#addDailyReportForm');
    if (reportForm) {
      reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        appData.dailyReports = appData.dailyReports || [];
        appData.dailyReports.unshift({
          date: $('#reportDate').value || new Date().toISOString().slice(0, 10),
          work: $('#reportWork').value.trim(),
          plan: $('#reportPlan').value.trim(),
          issue: $('#reportIssue').value.trim()
        });
        saveData(appData);
        renderDailyReports();
        renderMonthlyReview();
        reportForm.reset();
        if (reportDate) reportDate.value = new Date().toISOString().slice(0, 10);
        showToast('工作日报已保存');
      });
    }
  }

  // ===== 代运营客户渲染 =====
  function renderAgencyClients() {
    var tbody = $('#agencyClientsBody');
    if (!tbody) return;
    tbody.innerHTML = appData.agencyClients.map(function(c) {
      return '<tr>' +
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td>' + escapeHtml(c.focus) + '</td>' +
        '<td>' + escapeHtml(c.problem) + '</td>' +
        '<td>' + escapeHtml(c.action) + '</td>' +
        '<td>' + escapeHtml(c.freq) + '</td>' +
      '</tr>';
    }).join('');
  }

  // ===== 工具函数 =====
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 数据导出 =====
  function initExport() {
    var btn = $('#exportData');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var dataStr = JSON.stringify(appData, null, 2);
      var blob = new Blob([dataStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'hotel_workbench_data_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出');
    });
  }



  function renderLearningRecords() {
    var tbody = $('#learningRecordsBody');
    if (!tbody) return;
    appData.learningRecords = appData.learningRecords || [];
    var keyword = ($('#learningFilterKeyword') && $('#learningFilterKeyword').value.trim()) || '';
    var month = ($('#learningFilterMonth') && $('#learningFilterMonth').value) || '';
    var book = ($('#learningFilterBook') && $('#learningFilterBook').value.trim()) || '';
    var onlyNote = ($('#learningFilterNote') && $('#learningFilterNote').value) || '';
    tbody.innerHTML = appData.learningRecords.map(function(r, index) {
      return { row: r, index: index };
    }).filter(function(item) {
      var r = item.row;
      var text = [r.date, r.content, r.book, r.note].join(' ');
      var hasNote = r.note && r.note !== '暂无' && r.note !== '无';
      return (!keyword || text.indexOf(keyword) >= 0) && (!month || (r.date || '').slice(0, 7) === month) && (!book || (r.book || '').indexOf(book) >= 0) && (!onlyNote || hasNote);
    }).map(function(item) {
      var r = item.row;
      var index = item.index;
      return '<tr>' +
        editableCell('learningRecords', index, 'date', r.date) +
        editableCell('learningRecords', index, 'content', r.content) +
        editableCell('learningRecords', index, 'book', r.book) +
        editableCell('learningRecords', index, 'note', r.note) +
        '<td class="table-actions"><button class="mini-btn danger" data-delete-list="learningRecords" data-delete-index="' + index + '">删除</button></td>' +
      '</tr>';
    }).join('');
    renderLearningSummary();
  }

  function renderLearningSummary() {
    var target = $('#learningSummary');
    if (!target) return;
    var records = appData.learningRecords || [];
    var currentMonth = new Date().toISOString().slice(0, 7);
    var monthInput = $('#learningFilterMonth');
    var month = monthInput && monthInput.value ? monthInput.value : currentMonth;
    var monthRecords = records.filter(function(r) { return (r.date || '').slice(0, 7) === month; });
    var books = [];
    monthRecords.forEach(function(r) {
      if (r.book && books.indexOf(r.book) < 0) books.push(r.book);
    });
    var latest = monthRecords.slice(0, 3).map(function(r) { return r.content; }).join('；') || '暂无学习记录';
    target.textContent =
      '月份：' + month + '\n' +
      '学习记录：' + monthRecords.length + ' 条\n' +
      '本月读的书：' + (books.join('、') || '暂无') + '\n' +
      '最近学习：' + latest;
  }

  function initLearningForm() {
    var date = $('#learningDate');
    if (date && !date.value) date.value = new Date().toISOString().slice(0, 10);
    var monthFilter = $('#learningFilterMonth');
    if (monthFilter && !monthFilter.value) monthFilter.value = new Date().toISOString().slice(0, 7);
    var form = $('#addLearningForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var content = $('#learningContent').value.trim();
        var book = $('#learningBook').value.trim();
        var note = $('#learningNote').value.trim();
        if (!content && !book) return showToast('请填写今日学习内容或本月读的书');
        appData.learningRecords = appData.learningRecords || [];
        appData.learningRecords.unshift({
          date: $('#learningDate').value || new Date().toISOString().slice(0, 10),
          content: content,
          book: book,
          note: note
        });
        saveData(appData);
        renderLearningRecords();
        renderMonthlyReview();
        form.reset();
        if (date) date.value = new Date().toISOString().slice(0, 10);
        showToast('学习记录已保存');
      });
    }
  }

  function bindLearningFilters() {
    ['learningFilterKeyword','learningFilterMonth','learningFilterBook','learningFilterNote'].forEach(function(id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', renderLearningRecords);
      if (el) el.addEventListener('change', renderLearningRecords);
    });
  }

  function bindFilters() {
    ['storeFilterKeyword','storeFilterStore','storeFilterStatus','storeFilterOwner'].forEach(function(id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', renderStoreRecords);
      if (el) el.addEventListener('change', renderStoreRecords);
    });
    ['contentFilterKeyword','contentFilterPlatform','contentFilterPlay','contentFilterInteract'].forEach(function(id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', renderContentVideos);
    });
    ['reportFilterKeyword','reportFilterStart','reportFilterEnd','reportFilterIssue'].forEach(function(id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', renderDailyReports);
      if (el) el.addEventListener('change', renderDailyReports);
    });
  }

  function initImport() {
    var btn = $('#importDataBtn');
    var file = $('#importDataFile');
    if (!btn || !file) return;
    btn.addEventListener('click', function() { file.click(); });
    file.addEventListener('change', function() {
      var selected = file.files && file.files[0];
      if (!selected) return;
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var imported = JSON.parse(reader.result);
          if (!imported || typeof imported !== 'object') throw new Error('数据格式不正确');
          appData = imported;
          migrateData();
          renderTasks();
          renderAllEditable();
          renderAgencyClients();
          renderMonthlyReview();
          showToast('数据已导入');
        } catch (err) {
          showToast('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(selected, 'utf-8');
      file.value = '';
    });
  }

  function initEditModal() {
    var mask = $('#editModalMask');
    var text = $('#editModalText');
    var save = $('#editModalSave');
    var cancel = $('#editModalCancel');
    var current = null;
    if (!mask || !text || !save || !cancel) return;

    document.addEventListener('click', function(e) {
      var cell = e.target.closest('[contenteditable="true"][data-list]');
      if (!cell || window.innerWidth > 760) return;
      e.preventDefault();
      current = cell;
      text.value = cell.textContent.trim();
      mask.classList.add('show');
      setTimeout(function() { text.focus(); }, 80);
    }, true);

    function close() {
      mask.classList.remove('show');
      current = null;
    }

    cancel.addEventListener('click', close);
    mask.addEventListener('click', function(e) {
      if (e.target === mask) close();
    });
    save.addEventListener('click', function() {
      if (!current) return close();
      var list = current.getAttribute('data-list');
      var index = parseInt(current.getAttribute('data-index'), 10);
      var field = current.getAttribute('data-field');
      if (appData[list] && appData[list][index]) {
        appData[list][index][field] = text.value.trim();
        if (list === 'storeRecords' && field === 'status') appData[list][index].statusClass = statusClass(appData[list][index][field]);
        if (list === 'storeKpis' && field === 'status') appData[list][index].statusClass = statusClass(appData[list][index][field]);
        saveData(appData);
        renderAllEditable();
        renderMonthlyReview();
        showToast('已保存');
      }
      close();
    });
  }

  function monthOf(dateText) {
    return (dateText || '').slice(0, 7);
  }

  function renderMonthlyReview() {
    var monthInput = $('#monthlyMonth');
    var summary = $('#monthlySummary');
    var rows = $('#monthlyRows');
    if (!monthInput || !summary || !rows) return;
    if (!monthInput.value) monthInput.value = new Date().toISOString().slice(0, 7);
    var m = monthInput.value;
    var reports = (appData.dailyReports || []).filter(function(r) { return monthOf(r.date) === m; });
    var storeOpen = (appData.storeRecords || []).filter(function(r) { return r.status !== '已完成'; });
    var contentCount = (appData.contentVideos || []).length;
    var learningCount = (appData.learningRecords || []).filter(function(r) { return monthOf(r.date) === m; }).length;
    var learningBooks = [];
    (appData.learningRecords || []).forEach(function(r) {
      if (monthOf(r.date) === m && r.book && learningBooks.indexOf(r.book) < 0) learningBooks.push(r.book);
    });
    var tasks = appData.tasks || [];
    var undone = tasks.filter(function(t) { return !t.done; });
    var overdue = tasks.filter(isOverdue);
    var issueReports = reports.filter(function(r) { return r.issue && r.issue !== '暂无' && r.issue !== '无'; });
    var note = (appData.monthlyNotes && appData.monthlyNotes[m]) || '';
    var topIssues = issueReports.slice(0, 3).map(function(r) { return r.issue; }).join('；') || '暂无集中遗留问题';
    summary.textContent =
      '月份：' + m + '\n' +
      '日报数量：' + reports.length + ' 条\n' +
      '未完成待办：' + undone.length + ' 项，其中逾期 ' + overdue.length + ' 项\n' +
      '门店未闭环事项：' + storeOpen.length + ' 项\n' +
      '内容记录：' + contentCount + ' 条\n' +
      '学习记录：' + learningCount + ' 条\n' +
      '本月读书：' + (learningBooks.join('、') || '暂无') + '\n' +
      '主要遗留问题：' + topIssues + '\n' +
      '手动备注：' + (note || '暂无');
    rows.innerHTML = [
      ['工作日报', reports.length, reports.slice(0, 2).map(function(r) { return r.work; }).join('；') || '暂无'],
      ['遗留问题', issueReports.length, topIssues],
      ['未完成待办', undone.length, undone.slice(0, 3).map(function(t) { return t.title; }).join('；') || '暂无'],
      ['逾期待办', overdue.length, overdue.slice(0, 3).map(function(t) { return t.title; }).join('；') || '暂无'],
      ['门店事项', storeOpen.length, storeOpen.slice(0, 3).map(function(r) { return r.store + '：' + r.item; }).join('；') || '暂无'],
      ['内容记录', contentCount, (appData.contentVideos || []).slice(0, 3).map(function(v) { return v.title; }).join('；') || '暂无'],
      ['学习记录', learningCount, learningBooks.join('、') || '暂无']
    ].map(function(row) {
      return '<tr><td>' + escapeHtml(row[0]) + '</td><td>' + escapeHtml(row[1]) + '</td><td>' + escapeHtml(row[2]) + '</td></tr>';
    }).join('');
  }

  function initMonthlyReview() {
    var monthInput = $('#monthlyMonth');
    var note = $('#monthlyNote');
    var save = $('#saveMonthlyNote');
    if (!monthInput || !note || !save) return;
    monthInput.value = new Date().toISOString().slice(0, 7);
    monthInput.addEventListener('change', function() {
      note.value = (appData.monthlyNotes && appData.monthlyNotes[monthInput.value]) || '';
      renderMonthlyReview();
    });
    save.addEventListener('click', function() {
      appData.monthlyNotes = appData.monthlyNotes || {};
      appData.monthlyNotes[monthInput.value] = note.value.trim();
      saveData(appData);
      renderMonthlyReview();
      showToast('月度备注已保存');
    });
    renderMonthlyReview();
  }

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  function getCloudConfig() {
    return {
      token: ($('#cloudToken') && $('#cloudToken').value.trim()) || '',
      owner: ($('#cloudOwner') && $('#cloudOwner').value.trim()) || 'lfe-lll',
      repo: ($('#cloudRepo') && $('#cloudRepo').value.trim()) || 'jiudian-qinglv-workbench',
      path: ($('#cloudPath') && $('#cloudPath').value.trim()) || 'cloud-data.json'
    };
  }

  function setCloudStatus(message) {
    var el = $('#cloudStatus');
    if (el) el.textContent = message;
    showToast(message);
  }

  function initCloudSync() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('hotel_workbench_cloud_config') || '{}'); } catch (e) {}
    ['cloudToken','cloudOwner','cloudRepo','cloudPath'].forEach(function(id) {
      var el = $('#' + id);
      if (!el) return;
      var key = id.replace('cloud', '').toLowerCase();
      if (saved[key]) el.value = saved[key];
    });
    if ($('#cloudOwner') && !$('#cloudOwner').value) $('#cloudOwner').value = 'lfe-lll';
    if ($('#cloudRepo') && !$('#cloudRepo').value) $('#cloudRepo').value = 'jiudian-qinglv-workbench';
    if ($('#cloudPath') && !$('#cloudPath').value) $('#cloudPath').value = 'cloud-data.json';

    var saveBtn = $('#saveCloudConfig');
    var uploadBtn = $('#uploadCloudData');
    var downloadBtn = $('#downloadCloudData');
    if (saveBtn) saveBtn.addEventListener('click', function() {
      localStorage.setItem('hotel_workbench_cloud_config', JSON.stringify(getCloudConfig()));
      setCloudStatus('云同步设置已保存');
    });
    if (uploadBtn) uploadBtn.addEventListener('click', uploadCloudData);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCloudData);
  }

  function githubHeaders(token) {
    return { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' };
  }

  function getCloudUrl(cfg) {
    return 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + '/contents/' + cfg.path.replace(/^\/+/, '');
  }

  function uploadCloudData() {
    var cfg = getCloudConfig();
    if (!cfg.token) return setCloudStatus('请先填写 GitHub Token');
    setCloudStatus('正在上传云端数据...');
    fetch(getCloudUrl(cfg), { headers: githubHeaders(cfg.token) }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('读取云端文件失败');
      return res.json();
    }).then(function(info) {
      var body = {
        message: '同步工作台数据',
        content: utf8ToBase64(JSON.stringify(appData, null, 2)),
        branch: 'main'
      };
      if (info && info.sha) body.sha = info.sha;
      return fetch(getCloudUrl(cfg), {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, githubHeaders(cfg.token)),
        body: JSON.stringify(body)
      });
    }).then(function(res) {
      if (!res.ok) throw new Error('上传失败');
      localStorage.setItem('hotel_workbench_cloud_config', JSON.stringify(cfg));
      setCloudStatus('已上传到云端');
    }).catch(function(err) {
      setCloudStatus('云同步失败：' + err.message);
    });
  }

  function downloadCloudData() {
    var cfg = getCloudConfig();
    if (!cfg.token) return setCloudStatus('请先填写 GitHub Token');
    if (!confirm('将用云端数据覆盖当前浏览器数据，确定继续吗？')) return;
    setCloudStatus('正在从云端恢复...');
    fetch(getCloudUrl(cfg), { headers: githubHeaders(cfg.token) }).then(function(res) {
      if (!res.ok) throw new Error('未找到云端数据文件');
      return res.json();
    }).then(function(info) {
      appData = JSON.parse(base64ToUtf8(info.content.replace(/\n/g, '')));
      migrateData();
      renderTasks();
      renderAllEditable();
      renderAgencyClients();
      renderMonthlyReview();
      localStorage.setItem('hotel_workbench_cloud_config', JSON.stringify(cfg));
      setCloudStatus('已从云端恢复');
    }).catch(function(err) {
      setCloudStatus('云端恢复失败：' + err.message);
    });
  }

  // ===== 初始化所有功能 =====
  initNavigation();
  initDate();
  renderTasks();
  initTaskForm();
  initButtons();
  renderStoreCards();
  renderStoreRecords();
  renderContentVideos();
  renderDailyReports();
  renderLearningRecords();
  renderAgencyClients();
  bindEditableTables();
  initRecordForms();
  initExport();
  initImport();
  bindFilters();
  initLearningForm();
  bindLearningFilters();
  initEditModal();
  initMonthlyReview();
  initCloudSync();
  initRevenueChart();
  initTaskChart();
  initPeopleChart();

  window.addEventListener('resize', resizeCharts);
})();
