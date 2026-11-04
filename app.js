'use strict';

const STORAGE_KEY = 'ecom_crm_mvp_v1';

const CUSTOMER_STATUS = {
  new: { label: '新线索', className: 'new' },
  contacted: { label: '已联系', className: 'contacted' },
  qualified: { label: '有意向', className: 'qualified' },
  quoted: { label: '已报价', className: 'quoted' },
  won: { label: '已成交', className: 'won' },
  lost: { label: '已流失', className: 'lost' }
};

const ORDER_STATUS = {
  pending: { label: '待付款', className: 'pending' },
  paid: { label: '已付款', className: 'paid' },
  shipped: { label: '已发货', className: 'shipped' },
  completed: { label: '已完成', className: 'completed' },
  refunded: { label: '已退款', className: 'refunded' }
};

const PRIORITIES = { high: '高', medium: '中', low: '低' };
const SOURCES = ['抖音', '小红书', '视频号', '广告投放', '转介绍', '私域', '其他'];
const PAID_STATUSES = ['paid', 'shipped', 'completed'];
const ACTIVE_STATUSES = ['new', 'contacted', 'qualified', 'quoted'];

const VIEW_META = {
  dashboard: ['工作台', '今天最值得做的事，都在这里。'],
  customers: ['客户管理', '管理线索、客户状态和负责人。'],
  followups: ['跟进提醒', '别让高意向客户凉在列表里。'],
  orders: ['订单', '从报价到回款，记录每一笔成交。']
};

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

function parseDateValue(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayDiff(value) {
  const d = parseDateValue(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function dateMeta(value) {
  const diff = dayDiff(value);
  if (diff === null) return { text: '未设置', cls: 'muted' };
  if (diff < 0) return { text: `逾期 ${Math.abs(diff)} 天`, cls: 'overdue' };
  if (diff === 0) return { text: '今天', cls: 'today' };
  if (diff === 1) return { text: '明天', cls: 'soon' };
  return { text: `${value.slice(5)} · ${diff} 天后`, cls: 'soon' };
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isThisMonth(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatMoney(value) {
  const n = Number(value) || 0;
  return `¥${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function truncate(value, length = 70) {
  const s = String(value || '');
  return s.length > length ? `${s.slice(0, length)}…` : s;
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function customerById(id) {
  return state.customers.find((c) => c.id === id);
}

function orderById(id) {
  return state.orders.find((o) => o.id === id);
}

function statusBadge(status) {
  const meta = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.new;
  return `<span class="badge ${meta.className}">${meta.label}</span>`;
}

function orderStatusBadge(status) {
  const safe = ORDER_STATUS[status] ? status : 'pending';
  const meta = ORDER_STATUS[safe];
  return `<span class="badge badge-order ${safe}">${meta.label}</span>`;
}

function priorityBadge(priority) {
  const safe = ['high', 'medium', 'low'].includes(priority) ? priority : 'medium';
  return `<span class="priority ${safe}">${PRIORITIES[safe]}</span>`;
}

function sourceChip(source) {
  return `<span class="source-chip">${esc(source || '其他')}</span>`;
}

function emptyState(title, desc = '') {
  return `<div class="empty"><strong>${esc(title)}</strong>${desc ? `<p>${esc(desc)}</p>` : ''}</div>`;
}

function miniEmpty(text) {
  return `<div class="empty small"><p>${esc(text)}</p></div>`;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = String(value);
}

let toastTimer = null;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function seedState() {
  const dateTime = (offset, time = '10:00:00') => `${addDays(offset)}T${time}`;

  const customers = [
    {
      id: 'c1', name: '林晓雨', phone: '138****2201', wechat: 'linxiaoyu88',
      source: '抖音', product: '夏季防晒衣', budget: 299, status: 'qualified',
      priority: 'high', owner: '小周', tags: ['高意向', '防晒'],
      notes: '问过面料和尺码，担心显胖。已发检测报告和尺码建议。',
      nextFollowUp: addDays(0), createdAt: dateTime(-2, '09:20:00'), lastContactAt: dateTime(-1, '10:30:00')
    },
    {
      id: 'c2', name: '陈先生', phone: '139****8710', wechat: 'chen_b2b',
      source: '小红书', product: '企业团购 T 恤', budget: 5000, status: 'quoted',
      priority: 'high', owner: '阿杰', tags: ['团购', '待确认'],
      notes: '公司团购，等老板确认数量和 logo 位置。',
      nextFollowUp: addDays(1), createdAt: dateTime(-4, '11:10:00'), lastContactAt: dateTime(-1, '16:40:00')
    },
    {
      id: 'c3', name: '王姐', phone: '136****1098', wechat: 'wangjie_shop',
      source: '转介绍', product: '童装套装 x 3', budget: 1197, status: 'won',
      priority: 'medium', owner: '小周', tags: ['老客', '已付款'],
      notes: '已付款，安排发货。到货后回访尺码是否合适。',
      nextFollowUp: addDays(7), createdAt: dateTime(-9, '14:00:00'), lastContactAt: dateTime(-3, '14:20:00')
    },
    {
      id: 'c4', name: '赵磊', phone: '137****6620', wechat: 'zhaolei_run',
      source: '抖音', product: '轻量运动鞋', budget: 599, status: 'contacted',
      priority: 'medium', owner: '阿杰', tags: ['跑步', '未回复'],
      notes: '第一次联系，问了缓震和尺码，后来没回。',
      nextFollowUp: addDays(-2), createdAt: dateTime(-5, '18:30:00'), lastContactAt: dateTime(-4, '19:10:00')
    },
    {
      id: 'c5', name: '周女士', phone: '135****7088', wechat: 'zhou_live',
      source: '抖音', product: '通勤女包', budget: 899, status: 'new',
      priority: 'high', owner: '小周', tags: ['直播间', '新线索'],
      notes: '直播间进来的线索，还没开始聊。',
      nextFollowUp: addDays(0), createdAt: dateTime(0, '08:50:00'), lastContactAt: null
    },
    {
      id: 'c6', name: '孙先生', phone: '188****3321', wechat: 'sun_custom',
      source: '广告投放', product: '工装定制', budget: 12000, status: 'qualified',
      priority: 'high', owner: '阿杰', tags: ['定制', '企业客户'],
      notes: '需要定制 logo，先确认起订量和交期。',
      nextFollowUp: addDays(3), createdAt: dateTime(-3, '10:15:00'), lastContactAt: dateTime(-1, '09:50:00')
    },
    {
      id: 'c7', name: '李同学', phone: '150****9012', wechat: 'li_student',
      source: '抖音', product: '饰品套装', budget: 129, status: 'lost',
      priority: 'low', owner: '小周', tags: ['预算不足'],
      notes: '觉得价格高，暂时不买。30 天后可回访。',
      nextFollowUp: '', createdAt: dateTime(-14, '12:20:00'), lastContactAt: dateTime(-12, '13:00:00')
    },
    {
      id: 'c8', name: '郑女士', phone: '186****4477', wechat: 'zheng_home',
      source: '私域', product: '家居服 x 2', budget: 918, status: 'won',
      priority: 'medium', owner: '小周', tags: ['老客', '复购'],
      notes: '老客复购，已签收。准备做一次好评和转介绍回访。',
      nextFollowUp: addDays(7), createdAt: dateTime(-20, '15:00:00'), lastContactAt: dateTime(-8, '11:20:00')
    }
  ];

  const followups = [
    { id: 'f1', customerId: 'c1', type: '微信', content: '发了面料检测报告和尺码建议，客户说晚上确认。', nextFollowUp: addDays(0), createdAt: dateTime(-1, '10:30:00') },
    { id: 'f2', customerId: 'c2', type: '电话', content: '确认团购数量 80 件，等老板确认 logo 位置后报价。', nextFollowUp: addDays(1), createdAt: dateTime(-1, '16:40:00') },
    { id: 'f3', customerId: 'c3', type: '微信', content: '已付款 1197 元，安排仓库发货。', nextFollowUp: addDays(7), createdAt: dateTime(-3, '14:20:00') },
    { id: 'f4', customerId: 'c4', type: '微信', content: '第一次联系，问了缓震和尺码，客户未回复。', nextFollowUp: addDays(-2), createdAt: dateTime(-4, '19:10:00') },
    { id: 'f5', customerId: 'c6', type: '面谈', content: '确认需要定制 logo，起订量 100 件，等客户发设计稿。', nextFollowUp: addDays(3), createdAt: dateTime(-1, '09:50:00') },
    { id: 'f6', customerId: 'c7', type: '微信', content: '客户觉得价格高，预算不足，暂时不买。', nextFollowUp: '', createdAt: dateTime(-12, '13:00:00') },
    { id: 'f7', customerId: 'c8', type: '微信', content: '老客复购家居服，已签收，准备回访。', nextFollowUp: addDays(7), createdAt: dateTime(-8, '11:20:00') }
  ];

  const orders = [
    { id: 'o1', customerId: 'c3', product: '童装套装 x 3', amount: 1197, status: 'paid', createdAt: dateTime(-3, '14:10:00'), paidAt: dateTime(-3, '14:20:00') },
    { id: 'o2', customerId: 'c8', product: '家居服 x 2', amount: 918, status: 'completed', createdAt: dateTime(-8, '10:50:00'), paidAt: dateTime(-8, '11:00:00') },
    { id: 'o3', customerId: 'c2', product: '企业团购 T 恤 x 80', amount: 5000, status: 'pending', createdAt: dateTime(-1, '17:00:00'), paidAt: null }
  ];

  return { customers, followups, orders, settings: { companyName: '星辰电商' } };
}

function normalizeState(data) {
  if (!data || !Array.isArray(data.customers)) throw new Error('invalid state');
  return {
    customers: data.customers.map((c, index) => ({
      ...c,
      id: c.id || `imported_c_${index}_${Date.now()}`,
      tags: Array.isArray(c.tags) ? c.tags : []
    })),
    followups: Array.isArray(data.followups) ? data.followups : [],
    orders: Array.isArray(data.orders) ? data.orders : [],
    settings: data.settings || { companyName: '星辰电商' }
  };
}

let memoryState = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (err) {
    console.warn('读取本地数据失败，使用演示数据。', err);
  }
  if (memoryState) return normalizeState(memoryState);
  return seedState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    memoryState = JSON.parse(JSON.stringify(state));
    console.warn('本地存储不可用，数据仅保存在当前页面。', err);
  }
}

let state = loadState();
let currentView = 'dashboard';
let customerFilter = { q: '', status: 'all', source: 'all' };
let orderFilter = 'all';
let activeCustomerId = null;

function renderAll() {
  renderKpis();
  renderFunnel();
  renderTodayList();
  renderRecent();
  renderCustomers();
  renderFollowupPage();
  renderOrders();
  renderNavBadges();
  if (activeCustomerId) renderDrawer();
}

function renderKpis() {
  const total = state.customers.length;
  const active = state.customers.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const wonCustomers = state.customers.filter((c) => c.status === 'won').length;
  const overdue = active.filter((c) => {
    const diff = c.nextFollowUp ? dayDiff(c.nextFollowUp) : null;
    return diff !== null && diff < 0;
  }).length;
  const dueToday = active.filter((c) => c.nextFollowUp && dayDiff(c.nextFollowUp) === 0).length;
  const monthOrders = state.orders.filter((o) => isThisMonth(o.createdAt) && PAID_STATUSES.includes(o.status));
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  setText('kpiTotal', total);
  setText('kpiTotalNote', `活跃 ${active.length} · 已成交 ${wonCustomers}`);
  setText('kpiDue', overdue + dueToday);
  setText('kpiDueNote', `逾期 ${overdue} · 今天 ${dueToday}`);
  setText('kpiWon', monthOrders.length);
  setText('kpiWonNote', `累计成交客户 ${wonCustomers}`);
  setText('kpiRevenue', formatMoney(monthRevenue));
  setText('kpiRevenueNote', '已付款 / 已发货 / 已完成');
}

function renderFunnel() {
  const total = state.customers.length;
  const stages = [
    { label: '全部线索', count: total, cls: '' },
    { label: '已触达', count: state.customers.filter((c) => ['contacted', 'qualified', 'quoted', 'won'].includes(c.status)).length, cls: 'f2' },
    { label: '有意向', count: state.customers.filter((c) => ['qualified', 'quoted', 'won'].includes(c.status)).length, cls: 'f3' },
    { label: '已报价', count: state.customers.filter((c) => ['quoted', 'won'].includes(c.status)).length, cls: 'f4' },
    { label: '已成交', count: state.customers.filter((c) => c.status === 'won').length, cls: 'f5' }
  ];

  if (!total) {
    $('funnel').innerHTML = emptyState('还没有客户', '新增第一个客户后，这里会出现销售漏斗。');
    return;
  }

  const max = Math.max(...stages.map((s) => s.count), 1);
  $('funnel').innerHTML = stages.map((s) => `
    <div class="funnel-row">
      <div class="funnel-top">
        <span>${s.label}</span>
        <span><strong>${s.count}</strong><em>${Math.round((s.count / total) * 100)}%</em></span>
      </div>
      <div class="funnel-track"><div class="funnel-fill ${s.cls}" style="width:${s.count ? Math.max(6, (s.count / max) * 100) : 0}%"></div></div>
    </div>`).join('');
}

function renderTodayList() {
  const due = state.customers
    .filter((c) => {
      if (!ACTIVE_STATUSES.includes(c.status) || !c.nextFollowUp) return false;
      const diff = dayDiff(c.nextFollowUp);
      return diff !== null && diff <= 0;
    })
    .sort((a, b) => (dayDiff(a.nextFollowUp) ?? 999) - (dayDiff(b.nextFollowUp) ?? 999))
    .slice(0, 5);

  if (!due.length) {
    $('todayList').innerHTML = emptyState('今天没有待跟进客户', '可以去客户管理里安排下一步。');
    return;
  }

  $('todayList').innerHTML = due.map((c) => {
    const meta = dateMeta(c.nextFollowUp);
    return `<div class="list-item">
      <div class="list-main">
        <div class="list-title"><strong>${esc(c.name)}</strong>${statusBadge(c.status)}</div>
        <div class="list-meta">${esc(c.product || '未填写产品')} · <span class="due ${meta.cls}">${meta.text}</span></div>
      </div>
      <button type="button" class="btn small" data-action="add-followup" data-id="${esc(c.id)}">跟进</button>
    </div>`;
  }).join('');
}

function renderRecent() {
  const recent = [...state.followups]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  if (!recent.length) {
    $('recentList').innerHTML = emptyState('还没有跟进动态', '记录一次跟进后，这里会显示最新进展。');
    return;
  }

  $('recentList').innerHTML = recent.map((f) => {
    const customer = customerById(f.customerId);
    return `<div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-body">
        <div class="activity-head">
          <strong>${esc(customer ? customer.name : '已删除客户')}</strong>
          <span>${esc(f.type || '跟进')} · ${esc(formatDateTime(f.createdAt))}</span>
        </div>
        <p>${esc(truncate(f.content, 90))}</p>
      </div>
    </div>`;
  }).join('');
}

function renderCustomers() {
  const q = customerFilter.q.trim().toLowerCase();
  const list = state.customers.filter((c) => {
    if (customerFilter.status !== 'all' && c.status !== customerFilter.status) return false;
    if (customerFilter.source !== 'all' && c.source !== customerFilter.source) return false;
    if (!q) return true;
    const haystack = [c.name, c.phone, c.wechat, c.product, c.owner, ...(c.tags || [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }).sort((a, b) => {
    const aActive = ACTIVE_STATUSES.includes(a.status) ? 0 : 1;
    const bActive = ACTIVE_STATUSES.includes(b.status) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    const aDue = a.nextFollowUp ? (dayDiff(a.nextFollowUp) ?? 9999) : 9999;
    const bDue = b.nextFollowUp ? (dayDiff(b.nextFollowUp) ?? 9999) : 9999;
    if (aDue !== bDue) return aDue - bDue;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  setText('customerCountLabel', `显示 ${list.length} / 共 ${state.customers.length} 位客户`);

  if (!list.length) {
    $('customerTableBody').innerHTML = `<tr><td colspan="8">${emptyState('没有匹配的客户', '换个筛选条件，或新增一个客户。')}</td></tr>`;
    return;
  }

  $('customerTableBody').innerHTML = list.map((c) => {
    const meta = dateMeta(c.nextFollowUp);
    const tags = (c.tags || []).slice(0, 2).map((tag) => `<span class="mini-tag">${esc(tag)}</span>`).join('');
    return `<tr data-customer-id="${esc(c.id)}">
      <td>
        <div class="customer-inline">
          <div class="avatar">${esc((c.name || '?').slice(0, 1))}</div>
          <div><strong>${esc(c.name || '未命名')}</strong><span>${esc(c.wechat || c.phone || '未填写联系方式')}</span></div>
        </div>
      </td>
      <td>${sourceChip(c.source)}</td>
      <td><div class="product-cell">${esc(c.product || '—')}${tags ? `<div class="mini-tags">${tags}</div>` : ''}</div></td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td><span class="due ${meta.cls}">${meta.text}</span></td>
      <td>${esc(c.owner || '未分配')}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn tiny" data-action="add-followup" data-id="${esc(c.id)}">跟进</button>
          <button type="button" class="btn tiny" data-action="open-customer" data-id="${esc(c.id)}">详情</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function followedCustomers() {
  return state.customers.filter((c) => ACTIVE_STATUSES.includes(c.status) && c.nextFollowUp);
}

function renderFollowupPage() {
  const pending = followedCustomers();
  const overdue = pending.filter((c) => (dayDiff(c.nextFollowUp) ?? 0) < 0)
    .sort((a, b) => dayDiff(a.nextFollowUp) - dayDiff(b.nextFollowUp));
  const today = pending.filter((c) => dayDiff(c.nextFollowUp) === 0)
    .sort((a, b) => dayDiff(a.nextFollowUp) - dayDiff(b.nextFollowUp));
  const upcoming = pending.filter((c) => {
    const diff = dayDiff(c.nextFollowUp);
    return diff !== null && diff > 0 && diff <= 7;
  }).sort((a, b) => dayDiff(a.nextFollowUp) - dayDiff(b.nextFollowUp));

  setText('followupOverdue', overdue.length);
  setText('followupToday', today.length);
  setText('followupUpcoming', upcoming.length);

  const group = (title, desc, list, emptyText) => {
    const items = list.map((c) => {
      const meta = dateMeta(c.nextFollowUp);
      return `<div class="list-item">
        <div class="list-main">
          <div class="list-title"><strong>${esc(c.name)}</strong>${statusBadge(c.status)}</div>
          <div class="list-meta">${esc(c.product || '未填写产品')} · ${esc(c.owner || '未分配')} · <span class="due ${meta.cls}">${meta.text}</span></div>
        </div>
        <button type="button" class="btn small" data-action="add-followup" data-id="${esc(c.id)}">去跟进</button>
      </div>`;
    }).join('');
    return `<div class="followup-group">
      <div class="group-head"><div><h4>${title}</h4><p>${desc}</p></div><span class="count-pill">${list.length}</span></div>
      ${items || miniEmpty(emptyText)}
    </div>`;
  };

  const html = [
    group('已逾期', '先处理这些，别让意向客户凉掉。', overdue, '没有逾期客户，节奏不错。'),
    group('今天', '今天约定好的跟进，尽量在客户活跃时段联系。', today, '今天没有安排跟进。'),
    group('未来 7 天', '提前准备好资料和下一步问题。', upcoming, '未来 7 天没有安排。')
  ].join('');

  $('followupGroups').innerHTML = pending.length ? html : emptyState('暂无待跟进客户', '在客户详情里设置下次跟进日期，这里会自动生成队列。');
}

function renderOrders() {
  const allOrders = state.orders;
  const pendingAmount = allOrders.filter((o) => o.status === 'pending').reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const receivedAmount = allOrders.filter((o) => PAID_STATUSES.includes(o.status)).reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const refundAmount = allOrders.filter((o) => o.status === 'refunded').reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  setText('orderTotal', allOrders.length);
  setText('orderPendingAmount', formatMoney(pendingAmount));
  setText('orderReceivedAmount', formatMoney(receivedAmount));
  setText('orderRefundAmount', formatMoney(refundAmount));

  const list = allOrders
    .filter((o) => orderFilter === 'all' || o.status === orderFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!list.length) {
    $('orderTableBody').innerHTML = `<tr><td colspan="6">${emptyState('没有订单', '创建一个订单，开始记录成交和回款。')}</td></tr>`;
    return;
  }

  $('orderTableBody').innerHTML = list.map((o) => {
    const customer = customerById(o.customerId);
    const actions = [];
    if (o.status === 'pending') actions.push(`<button type="button" class="btn tiny" data-action="order-paid" data-id="${esc(o.id)}">标记已付</button>`);
    if (o.status === 'paid') actions.push(`<button type="button" class="btn tiny" data-action="order-shipped" data-id="${esc(o.id)}">标记发货</button>`);
    if (o.status === 'shipped') actions.push(`<button type="button" class="btn tiny" data-action="order-completed" data-id="${esc(o.id)}">标记完成</button>`);
    actions.push(`<button type="button" class="btn tiny danger" data-action="delete-order" data-id="${esc(o.id)}">删除</button>`);

    return `<tr>
      <td>${esc(customer ? customer.name : '已删除客户')}</td>
      <td>${esc(o.product || '—')}</td>
      <td><strong>${formatMoney(o.amount)}</strong></td>
      <td>${orderStatusBadge(o.status)}</td>
      <td>${esc(formatDateTime(o.createdAt))}</td>
      <td><div class="row-actions">${actions.join('')}</div></td>
    </tr>`;
  }).join('');
}

function setNavBadge(id, count) {
  const el = $(id);
  if (!el) return;
  el.textContent = String(count);
  el.classList.toggle('hidden', count === 0);
}

function renderNavBadges() {
  const due = state.customers.filter((c) => {
    if (!ACTIVE_STATUSES.includes(c.status) || !c.nextFollowUp) return false;
    const diff = dayDiff(c.nextFollowUp);
    return diff !== null && diff <= 0;
  }).length;
  const pendingOrders = state.orders.filter((o) => o.status === 'pending').length;
  setNavBadge('navDueBadge', due);
  setNavBadge('navFollowupBadge', due);
  setNavBadge('navOrderBadge', pendingOrders);
}

function getSuggestion(c) {
  const diff = c.nextFollowUp ? dayDiff(c.nextFollowUp) : null;
  if (c.status === 'won') return '已成交：确认交付和售后，7 天后做一次复购/转介绍回访。';
  if (c.status === 'lost') return '已流失：补充流失原因，30 天后可做一次低成本回访。';
  if (diff === null) return '还没有设置下次跟进时间。建议 24 小时内约定下一步。';
  if (diff < 0) return `已逾期 ${Math.abs(diff)} 天。优先联系，先确认客户是否还有需求。`;
  if (diff === 0) return '今天需要跟进。每次沟通结束前，约定下一次具体时间。';
  if (c.status === 'new') return '新线索：先确认需求、预算、决策人和购买时间。';
  if (c.status === 'quoted') return '已报价：24 小时内确认客户是否收到报价，卡在哪一项。';
  if (c.status === 'qualified') return '有意向：推进到报价或试用，别只停留在“再看看”。';
  return '保持节奏：本次沟通要留下一个明确的下一步。';
}

function customerOptions(selectedId = '') {
  return state.customers.map((c) => `<option value="${esc(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${esc(c.name)}${c.product ? ` · ${esc(c.product)}` : ''}</option>`).join('');
}

function renderDrawer() {
  if (!activeCustomerId) return;
  const c = customerById(activeCustomerId);
  if (!c) {
    closePanels();
    return;
  }

  const fups = state.followups
    .filter((f) => f.customerId === c.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const orders = state.orders
    .filter((o) => o.customerId === c.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const next = dateMeta(c.nextFollowUp);
  const tags = (c.tags || []).length
    ? c.tags.map((tag) => `<span class="mini-tag">${esc(tag)}</span>`).join('')
    : '<span class="mini-tag">暂无标签</span>';

  $('drawerName').textContent = c.name || '未命名客户';
  $('drawerStatus').innerHTML = statusBadge(c.status);

  const timeline = fups.length
    ? `<div class="timeline">${fups.map((f) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-body">
          <div class="timeline-head"><strong>${esc(f.type || '跟进')}</strong><span>${esc(formatDateTime(f.createdAt))}</span></div>
          <p>${esc(f.content || '')}</p>
          ${f.nextFollowUp ? `<small>下次跟进：${esc(f.nextFollowUp)}</small>` : ''}
        </div>
      </div>`).join('')}</div>`
    : miniEmpty('还没有跟进记录');

  const orderHtml = orders.length
    ? `<div class="mini-orders">${orders.map((o) => `
      <div class="mini-order">
        <div><strong>${esc(o.product || '订单')}</strong><span>${esc(formatDateTime(o.createdAt))}</span></div>
        <div><strong>${formatMoney(o.amount)}</strong>${orderStatusBadge(o.status)}</div>
      </div>`).join('')}</div>`
    : miniEmpty('还没有订单');

  $('drawerBody').innerHTML = `
    <div class="drawer-actions">
      <button type="button" class="btn small primary" data-action="add-followup" data-id="${esc(c.id)}">+ 记录跟进</button>
      <button type="button" class="btn small" data-action="add-order" data-id="${esc(c.id)}">+ 创建订单</button>
      <button type="button" class="btn small" data-action="edit-customer" data-id="${esc(c.id)}">编辑</button>
      <button type="button" class="btn small danger" data-action="delete-customer" data-id="${esc(c.id)}">删除</button>
    </div>
    <div class="detail-grid">
      <div><span>手机 / 微信</span><strong>${esc([c.phone, c.wechat].filter(Boolean).join(' / ') || '—')}</strong></div>
      <div><span>来源</span><strong>${esc(c.source || '其他')}</strong></div>
      <div><span>意向产品</span><strong>${esc(c.product || '—')}</strong></div>
      <div><span>预算</span><strong>${c.budget ? formatMoney(c.budget) : '—'}</strong></div>
      <div><span>负责人</span><strong>${esc(c.owner || '未分配')}</strong></div>
      <div><span>下次跟进</span><strong class="due ${next.cls}">${next.text}</strong></div>
      <div><span>优先级</span><strong>${priorityBadge(c.priority)}</strong></div>
      <div><span>创建时间</span><strong>${esc(formatDateTime(c.createdAt))}</strong></div>
    </div>
    <div class="detail-section"><h4>标签</h4><div class="mini-tags">${tags}</div></div>
    <div class="suggestion"><span>下一步建议</span><p>${esc(getSuggestion(c))}</p></div>
    <div class="detail-section"><h4>备注</h4><p class="notes">${esc(c.notes || '—')}</p></div>
    <div class="detail-section">
      <div class="section-head"><h4>跟进记录</h4><button type="button" class="btn tiny" data-action="add-followup" data-id="${esc(c.id)}">+ 新增</button></div>
      ${timeline}
    </div>
    <div class="detail-section">
      <div class="section-head"><h4>订单</h4><button type="button" class="btn tiny" data-action="add-order" data-id="${esc(c.id)}">+ 新建</button></div>
      ${orderHtml}
    </div>`;
}

function showModal(id) {
  $(id).classList.remove('hidden');
  $('overlay').classList.remove('hidden');
}

function closeModals() {
  document.querySelectorAll('.modal').forEach((el) => el.classList.add('hidden'));
  if ($('customerDrawer').classList.contains('hidden')) $('overlay').classList.add('hidden');
}

function closePanels() {
  closeModals();
  $('customerDrawer').classList.add('hidden');
  $('overlay').classList.add('hidden');
  activeCustomerId = null;
}

function openCustomer(id) {
  if (!customerById(id)) return;
  activeCustomerId = id;
  renderDrawer();
  $('customerDrawer').classList.remove('hidden');
  $('overlay').classList.remove('hidden');
}

function openCustomerModal(id) {
  const form = $('customerForm');
  form.reset();
  $('customerModalTitle').textContent = id ? '编辑客户' : '新增客户';
  $('cfId').value = id || '';

  if (id) {
    const c = customerById(id);
    if (!c) return;
    $('cfName').value = c.name || '';
    $('cfPhone').value = c.phone || '';
    $('cfWechat').value = c.wechat || '';
    $('cfSource').value = SOURCES.includes(c.source) ? c.source : '其他';
    $('cfProduct').value = c.product || '';
    $('cfBudget').value = c.budget ?? '';
    $('cfStatus').value = CUSTOMER_STATUS[c.status] ? c.status : 'new';
    $('cfPriority').value = ['high', 'medium', 'low'].includes(c.priority) ? c.priority : 'medium';
    $('cfOwner').value = c.owner || '';
    $('cfNextFollowUp').value = c.nextFollowUp || '';
    $('cfTags').value = (c.tags || []).join('、');
    $('cfNotes').value = c.notes || '';
  } else {
    $('cfSource').value = '抖音';
    $('cfStatus').value = 'new';
    $('cfPriority').value = 'medium';
    $('cfNextFollowUp').value = addDays(0);
  }

  showModal('customerModal');
  setTimeout(() => $('cfName').focus(), 40);
}

function openFollowupModal(customerId = '') {
  if (!state.customers.length) {
    toast('请先新增客户');
    return;
  }
  const form = $('followupForm');
  form.reset();
  const selectedId = customerId || activeCustomerId || state.customers[0].id;
  $('ffCustomer').innerHTML = customerOptions(selectedId);
  $('ffCustomer').value = selectedId;
  $('ffType').value = '微信';
  $('ffNextFollowUp').value = addDays(1);
  showModal('followupModal');
  setTimeout(() => $('ffContent').focus(), 40);
}

function openOrderModal(customerId = '') {
  if (!state.customers.length) {
    toast('请先新增客户');
    return;
  }
  const form = $('orderForm');
  form.reset();
  const selectedId = customerId || activeCustomerId || state.customers[0].id;
  $('ofCustomer').innerHTML = customerOptions(selectedId);
  $('ofCustomer').value = selectedId;
  $('ofStatus').value = 'pending';
  const c = customerById(selectedId);
  if (c) {
    $('ofProduct').value = c.product || '';
    $('ofAmount').value = c.budget || '';
  }
  showModal('orderModal');
  setTimeout(() => $('ofProduct').focus(), 40);
}

function handleAction(action, id = '') {
  switch (action) {
    case 'close-modals': closeModals(); break;
    case 'close-panels': closePanels(); break;
    case 'open-customer': if (id) openCustomer(id); break;
    case 'edit-customer': if (id) openCustomerModal(id); break;
    case 'delete-customer': if (id) deleteCustomer(id); break;
    case 'add-followup': openFollowupModal(id || activeCustomerId || ''); break;
    case 'add-order': openOrderModal(id || activeCustomerId || ''); break;
    case 'order-paid': updateOrderStatus(id, 'paid'); break;
    case 'order-shipped': updateOrderStatus(id, 'shipped'); break;
    case 'order-completed': updateOrderStatus(id, 'completed'); break;
    case 'delete-order': deleteOrder(id); break;
    default: console.warn('Unknown action:', action);
  }
}

function deleteCustomer(id) {
  const c = customerById(id);
  if (!c) return;
  if (!confirm(`确定删除客户「${c.name}」？相关跟进和订单也会一起删除。`)) return;
  state.customers = state.customers.filter((item) => item.id !== id);
  state.followups = state.followups.filter((item) => item.customerId !== id);
  state.orders = state.orders.filter((item) => item.customerId !== id);
  saveState();
  closePanels();
  renderAll();
  toast('客户已删除');
}

function updateOrderStatus(id, status) {
  const order = orderById(id);
  if (!order) return;
  order.status = status;
  if (status === 'paid') order.paidAt = new Date().toISOString();
  if (PAID_STATUSES.includes(status)) {
    const c = customerById(order.customerId);
    if (c) c.status = 'won';
  }
  saveState();
  renderAll();
  toast('订单状态已更新');
}

function deleteOrder(id) {
  const order = orderById(id);
  if (!order) return;
  if (!confirm('确定删除这笔订单？')) return;
  state.orders = state.orders.filter((item) => item.id !== id);
  saveState();
  renderAll();
  toast('订单已删除');
}

function showView(view) {
  if (!VIEW_META[view]) return;
  currentView = view;
  document.querySelectorAll('.view').forEach((el) => el.classList.toggle('active', el.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.view === view));
  $('pageTitle').textContent = VIEW_META[view][0];
  $('pageSubtitle').textContent = VIEW_META[view][1];
  renderAll();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}

function exportJson() {
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `ecom-crm-backup-${addDays(0)}.json`);
  toast('JSON 备份已导出');
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportCustomersCsv() {
  const headers = ['姓名', '手机', '微信', '来源', '意向产品', '预算', '状态', '优先级', '负责人', '标签', '下次跟进', '备注'];
  const rows = state.customers.map((c) => [
    c.name || '',
    c.phone || '',
    c.wechat || '',
    c.source || '',
    c.product || '',
    c.budget || '',
    CUSTOMER_STATUS[c.status] ? CUSTOMER_STATUS[c.status].label : c.status || '',
    PRIORITIES[c.priority] || c.priority || '',
    c.owner || '',
    (c.tags || []).join('、'),
    c.nextFollowUp || '',
    c.notes || ''
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  downloadBlob(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `ecom-customers-${addDays(0)}.csv`);
  toast('客户 CSV 已导出');
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const next = normalizeState(data);
      if (!confirm('导入会覆盖当前浏览器里的数据，确定继续？')) return;
      state = next;
      saveState();
      closePanels();
      renderAll();
      toast('数据已导入');
    } catch (err) {
      console.error(err);
      toast('导入失败：不是有效的 JSON 备份');
    }
  };
  reader.readAsText(file);
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  $('addCustomerBtn').addEventListener('click', () => openCustomerModal());
  $('newFollowupBtn').addEventListener('click', () => openFollowupModal());
  $('newOrderBtn').addEventListener('click', () => openOrderModal());
  $('exportBtn').addEventListener('click', exportJson);
  $('exportCsvBtn').addEventListener('click', exportCustomersCsv);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importJsonFile(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('确定重置为演示数据？当前浏览器里的数据会被覆盖。')) return;
    state = seedState();
    saveState();
    closePanels();
    renderAll();
    toast('已重置为演示数据');
  });

  $('statusFilter').addEventListener('change', (e) => {
    customerFilter.status = e.target.value;
    renderCustomers();
  });
  $('sourceFilter').addEventListener('change', (e) => {
    customerFilter.source = e.target.value;
    renderCustomers();
  });
  $('orderStatusFilter').addEventListener('change', (e) => {
    orderFilter = e.target.value;
    renderOrders();
  });

  $('globalSearch').addEventListener('input', (e) => {
    customerFilter.q = e.target.value;
    if (currentView !== 'customers') {
      showView('customers');
    } else {
      renderCustomers();
    }
  });

  $('customerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('cfId').value;
    const name = $('cfName').value.trim();
    if (!name) {
      toast('请填写客户姓名');
      return;
    }
    const data = {
      name,
      phone: $('cfPhone').value.trim(),
      wechat: $('cfWechat').value.trim(),
      source: $('cfSource').value,
      product: $('cfProduct').value.trim(),
      budget: Number($('cfBudget').value) || 0,
      status: $('cfStatus').value,
      priority: $('cfPriority').value,
      owner: $('cfOwner').value.trim(),
      nextFollowUp: $('cfNextFollowUp').value,
      tags: $('cfTags').value.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean),
      notes: $('cfNotes').value.trim()
    };

    let savedId = id;
    if (id) {
      const existing = customerById(id);
      if (!existing) return;
      Object.assign(existing, data);
      toast('客户已更新');
    } else {
      savedId = uid('c');
      state.customers.unshift({
        ...data,
        id: savedId,
        createdAt: new Date().toISOString(),
        lastContactAt: null
      });
      toast('客户已创建');
    }

    saveState();
    closeModals();
    renderAll();
    openCustomer(savedId);
  });

  $('followupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const customerId = $('ffCustomer').value;
    const c = customerById(customerId);
    const content = $('ffContent').value.trim();
    if (!c) {
      toast('请选择客户');
      return;
    }
    if (!content) {
      toast('请填写沟通内容');
      return;
    }
    const nextFollowUp = $('ffNextFollowUp').value;
    const now = new Date().toISOString();
    state.followups.unshift({
      id: uid('f'),
      customerId,
      type: $('ffType').value,
      content,
      nextFollowUp,
      createdAt: now
    });
    c.lastContactAt = now;
    c.nextFollowUp = nextFollowUp;
    if (c.status === 'new') c.status = 'contacted';
    saveState();
    closeModals();
    renderAll();
    toast('跟进记录已保存');
  });

  $('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const customerId = $('ofCustomer').value;
    const c = customerById(customerId);
    const product = $('ofProduct').value.trim();
    const amount = Number($('ofAmount').value);
    if (!c) {
      toast('请选择客户');
      return;
    }
    if (!product || !(amount > 0)) {
      toast('请填写产品和有效金额');
      return;
    }
    const status = $('ofStatus').value;
    const now = new Date().toISOString();
    state.orders.unshift({
      id: uid('o'),
      customerId,
      product,
      amount,
      status,
      createdAt: now,
      paidAt: PAID_STATUSES.includes(status) ? now : null
    });
    if (PAID_STATUSES.includes(status)) c.status = 'won';
    saveState();
    closeModals();
    renderAll();
    toast('订单已创建');
  });

  $('overlay').addEventListener('click', closePanels);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanels();
  });
}

function handleGlobalClick(e) {
  const viewLink = e.target.closest('[data-view-link]');
  if (viewLink) {
    e.preventDefault();
    showView(viewLink.dataset.viewLink);
    return;
  }

  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    e.preventDefault();
    e.stopPropagation();
    handleAction(actionEl.dataset.action, actionEl.dataset.id || '');
    return;
  }

  const row = e.target.closest('tr[data-customer-id]');
  if (row) openCustomer(row.dataset.customerId);
}

function init() {
  bindEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
