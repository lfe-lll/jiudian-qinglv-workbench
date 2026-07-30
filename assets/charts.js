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
        { id: 1, title: '回复洛龙店一条差评', meta: '客户体验 / 需今天处理', tag: '紧急', tagClass: 'bad', done: false },
        { id: 2, title: '确认西工店维修进度', meta: '空调异响 / 负责人：店长', tag: '跟进', tagClass: 'warn', done: false },
        { id: 3, title: '收集保洁主管晚班检查表', meta: '卫生标准 / 21:00 前', tag: '日常', tagClass: '', done: false },
        { id: 4, title: '整理青旅备选房源对比', meta: '拓店项目 / 本周复盘', tag: '项目', tagClass: '', done: false }
      ],
      alerts: [
        { tag: '客诉', tagClass: 'bad', title: '洛龙店 301 房卫生反馈', meta: '建议核查保洁流程并回访客户' },
        { tag: '数据', tagClass: 'warn', title: '西工店连续两天入住率低于 70%', meta: '建议检查平台价格和曝光' },
        { tag: '内容', tagClass: '', title: '本周探店视频还差 1 条未拍', meta: '可安排在周五晚高峰拍摄' }
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
        { date: new Date().toISOString().slice(0, 10), owner: '我', focus: '双门店经营复盘', done: '查看入住率、跟进门店异常、整理今日待办。', problem: '暂无', tomorrow: '继续跟进客诉和内容拍摄计划。' }
      ]
    };
  }

  var appData = loadData() || getDefaultData();

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
  function renderTasks() {
    var container = $('#taskList');
    if (!container) return;
    container.innerHTML = appData.tasks.map(function(t) {
      return '<label class="task' + (t.done ? ' done' : '') + '">' +
        '<input type="checkbox" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '>' +
        '<span><b class="task-title">' + escapeHtml(t.title) + '</b><span class="task-meta">' + escapeHtml(t.meta) + '</span></span>' +
        '<span class="tag ' + t.tagClass + '">' + escapeHtml(t.tag) + '</span>' +
      '</label>';
    }).join('');
    bindTaskEvents();
    updateTaskCount();
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
    if (status === '已完成') return 'good';
    if (status === '处理中' || status === '待确认') return 'warn';
    if (status === '需回访') return 'bad';
    return '';
  }

  // ===== 门店记录表格渲染 =====
  function renderStoreRecords() {
    var tbody = $('#storeRecordsBody');
    if (!tbody) return;
    tbody.innerHTML = appData.storeRecords.map(function(r, index) {
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
    tbody.innerHTML = appData.contentVideos.map(function(v, index) {
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
    tbody.innerHTML = appData.dailyReports.map(function(r, index) {
      return '<tr>' +
        editableCell('dailyReports', index, 'date', r.date) +
        editableCell('dailyReports', index, 'owner', r.owner) +
        editableCell('dailyReports', index, 'focus', r.focus) +
        editableCell('dailyReports', index, 'done', r.done) +
        editableCell('dailyReports', index, 'problem', r.problem) +
        editableCell('dailyReports', index, 'tomorrow', r.tomorrow) +
        '<td class="table-actions"><button class="mini-btn danger" data-delete-list="dailyReports" data-delete-index="' + index + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  function bindEditableTables() {
    document.addEventListener('blur', function(e) {
      var cell = e.target.closest('td[contenteditable="true"]');
      if (!cell) return;
      var list = cell.getAttribute('data-list');
      var index = parseInt(cell.getAttribute('data-index'), 10);
      var field = cell.getAttribute('data-field');
      if (appData[list] && appData[list][index]) {
        appData[list][index][field] = cell.textContent.trim();
        if (list === 'storeRecords' && field === 'status') {
          appData[list][index].statusClass = statusClass(appData[list][index][field]);
        }
        saveData(appData);
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
    renderStoreRecords();
    renderContentVideos();
    renderDailyReports();
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
          owner: $('#reportOwner').value.trim() || '我',
          focus: $('#reportFocus').value.trim(),
          done: $('#reportDone').value.trim(),
          problem: $('#reportProblem').value.trim(),
          tomorrow: $('#reportTomorrow').value.trim()
        });
        saveData(appData);
        renderDailyReports();
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

  // ===== 初始化所有功能 =====
  initNavigation();
  initDate();
  renderTasks();
  initTaskForm();
  initButtons();
  renderStoreRecords();
  renderContentVideos();
  renderDailyReports();
  renderAgencyClients();
  bindEditableTables();
  initRecordForms();
  initExport();
  initRevenueChart();
  initTaskChart();
  initPeopleChart();

  window.addEventListener('resize', resizeCharts);
})();
