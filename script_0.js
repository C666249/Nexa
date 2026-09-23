// Dark mode removed

// ===== State =====
const STORAGE_KEY = 'todo_glass_data';
const RECYCLE_KEY = 'todo_glass_recycle';
const HISTORY_KEY = 'todo_glass_history';
const MAX_RECYCLE = 10;
const MAX_HISTORY = 4;
let todos = [];
let recycleBin = [];
let searchHistory = [];
let currentTab = 'all';
let searchQuery = '';
let editingEl = null;
let selectedCategory = '全部';
let categories = ['全部'];

// ===== Notes State =====
const NOTES_KEY = 'todo_glass_notes'; // legacy Schema V1 key: never delete automatically
const NOTE_SCHEMA_VERSION_KEY = 'todo_glass_note_schema_version';
const NOTE_SCHEMA_VERSION = 2;
const NOTE_TOPICS_KEY = 'todo_glass_note_topics_v2';
const NOTE_DOCS_KEY = 'todo_glass_note_docs_v2';
const NOTE_MIGRATION_BACKUP_KEY = 'todo_glass_note_schema_v1_backup';
let notes = [];   // Schema V2 leaf Note documents only
let noteTopics = []; // Schema V2 structural Topic nodes
let currentMode = 'todo'; // 'todo' | 'notes'
let currentNoteId = null; // currently open leaf note id
let currentTopicId = null; // null = Note root surface
let currentVirtualNoteFolder = null; // null | 'unfiled' · UI-only system folder, never persisted as a Topic
let noteUnfiledCollapsed = false; // virtual folder expansion state for this app session
let noteHomeView = 'recent'; // 'recent' | 'tree'
let noteViewStack = []; // surface navigation contexts for Topic workspaces
let noteOpenOrigin = null; // exact surface context that opened the current Note
let noteEditorMode = 'read'; // every fresh open starts in read mode
let topicSummaryEditing = false;

// ===== Daily recurring tasks state =====
const DAILY_TASKS_KEY = 'todo_glass_daily_tasks_v1';
let dailyTasks = [];
let dailyEditingId = null;
let dailyCalendarTaskId = null;
let dailyCalendarCursor = new Date();
let dailyHistoryCursor = new Date();
let dailyHistorySelectedKey = '';

// ===== DOM refs =====
const todoListEl = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchIcon = document.getElementById('search-icon');
const searchHistoryEl = document.getElementById('searchHistory');
const searchHistoryList = document.getElementById('searchHistoryList');
const fabBtn = document.getElementById('fab');
const fabRecycleBtn = document.getElementById('fabRecycle');
const toastEl = document.getElementById('toast');
const tabs = document.querySelectorAll('.tab');
const completedCountEl = document.getElementById('completed-count');
const totalCountEl = document.getElementById('total-count');
const recycleModal = document.getElementById('recycleModal');
const recycleBackdrop = document.getElementById('recycleBackdrop');
const recycleClose = document.getElementById('recycleClose');
const recycleList = document.getElementById('recycleList');
const recycleClearAll = document.getElementById('recycleClearAll');
const calendarBtn = document.getElementById('calendarBtn');
const calendarModal = document.getElementById('calendarModal');
const calendarBackdrop = document.getElementById('calendarBackdrop');
const calendarTitle = document.getElementById('calendarTitle');
const calendarPrev = document.getElementById('calendarPrev');
const calendarNext = document.getElementById('calendarNext');
const calendarGrid = document.getElementById('calendarGrid');
const calendarGo = document.getElementById('calendarGo');
const categoryBar = document.getElementById('categoryBar');
const categoryScroll = document.getElementById('categoryScroll');
const categoryPicker = document.getElementById('categoryPicker');


// ===== First-run onboarding =====
const ONBOARDING_KEY = 'todo_glass_onboarding_v1';
const COACH_PREFIX = 'todo_glass_coach_v1_';
let onboardingIndex = 0;
let onboardingDemoState = 0;
let onboardingSwipeUnlocked = false;
let contextCoachKey = '';

const onboardingSteps = [
  {
    title: '先认识你的工作台',
    text: 'To-Do 放要完成的事。底部 ＋ 新建，垃圾桶看删除内容，🤖 可以用自然语言帮你管理待办。',
    target: null,
    demo: 'home'
  },
  {
    title: '一个待办，有三个状态',
    text: '下面是教程里的虚拟事项，不会写进你的真实数据。亲手点两次复选框试试。',
    target: null,
    demo: 'states',
    interactive: 'states'
  },
  {
    title: '更多功能藏在左滑里',
    text: '试着把下面这条虚拟待办向左拖。拖到一半可以退回，继续滑就会露出提醒与删除。',
    target: null,
    demo: 'swipe',
    interactive: 'swipe'
  },
  {
    title: 'To-Do ↔ Note，左右切换',
    text: '顶部可以左右跟手滑动，也可以点 📝。Note 用来长期记录，不参与待办完成统计。',
    target: '#modeToggle',
    demo: 'mode'
  },
  {
    title: '三个时间工具，各司其职',
    text: '📅 看待办日期；🕐 设置每天固定时间的总结提醒；Daily 管喝水、吃药这类每天重新开始的事项。以后点 ? 可以随时重看教程。',
    target: '.header__stats',
    demo: 'tools'
  }
];

function onboardingValue() {
  try { return localStorage.getItem(ONBOARDING_KEY) || ''; } catch(e) { return ''; }
}
function setOnboardingValue(value) {
  try { localStorage.setItem(ONBOARDING_KEY, value); } catch(e) {}
}
function maybeStartOnboarding() {
  if (onboardingValue()) return;
  const welcome = document.getElementById('onboardingWelcome');
  if (welcome) welcome.classList.add('active');
}
function startOnboarding(showWelcome) {
  closeContextCoach(false);
  if (typeof applyMode === 'function' && currentMode !== 'todo') applyMode('todo');
  const welcome = document.getElementById('onboardingWelcome');
  if (welcome) welcome.classList.toggle('active', !!showWelcome);
  if (showWelcome) return;
  onboardingIndex = 0;
  onboardingDemoState = 0;
  onboardingSwipeUnlocked = false;
  document.getElementById('onboardingOverlay').classList.add('active');
  renderOnboardingStep();
}
function finishOnboarding(skipped) {
  document.getElementById('onboardingWelcome')?.classList.remove('active');
  document.getElementById('onboardingOverlay')?.classList.remove('active');
  setOnboardingValue(skipped ? 'skipped' : 'done');
  if (!skipped) showToast('教程完成 · 以后点右上角 ? 可重新观看');
}
function positionOnboardingTarget(selector) {
  const overlay = document.getElementById('onboardingOverlay');
  const spot = document.getElementById('onboardingSpotlight');
  const pulse = document.getElementById('onboardingPulse');
  const hand = document.getElementById('onboardingHand');
  const card = document.getElementById('onboardingCard');
  if (!selector) {
    overlay.classList.add('no-focus');
    card.classList.remove('above');
    hand.style.display = 'none';
    return;
  }
  const target = document.querySelector(selector);
  if (!target) {
    overlay.classList.add('no-focus');
    hand.style.display = 'none';
    return;
  }
  overlay.classList.remove('no-focus');
  const r = target.getBoundingClientRect();
  const padX = selector === '.header__stats' ? 8 : 10;
  const padY = selector === '.header__stats' ? 7 : 9;
  const left = Math.max(8, r.left - padX);
  const top = Math.max(8, r.top - padY);
  const width = Math.min(window.innerWidth - left - 8, r.width + padX * 2);
  const height = r.height + padY * 2;
  const radius = selector === '.header__stats' ? 22 : Math.max(16, Math.min(26, height / 2));
  [spot,pulse].forEach(el => {
    el.style.left = `${left}px`; el.style.top = `${top}px`; el.style.width = `${width}px`; el.style.height = `${height}px`; el.style.borderRadius = `${radius}px`;
  });
  const targetCenter = top + height / 2;
  const cardAbove = targetCenter > window.innerHeight * .58;
  card.classList.toggle('above', cardAbove);
  hand.style.display = 'block';
  hand.style.left = `${Math.min(window.innerWidth - 42, Math.max(12, left + width - 28))}px`;
  hand.style.top = `${cardAbove ? Math.min(window.innerHeight - 90, top + height + 8) : Math.max(10, top - 44)}px`;
}
function renderOnboardingDots() {
  const dots = document.getElementById('onboardingDots');
  dots.innerHTML = onboardingSteps.map((_,i)=>`<i class="${i===onboardingIndex?'active':''}"></i>`).join('');
}
function onboardingDemoHtml(type) {
  if (type === 'home') return `<div class="onboarding-tools"><div class="onboarding-tool"><b>＋</b><span>新建待办</span><small>最快的入口</small></div><div class="onboarding-tool"><b>🗑️</b><span>回收站</span><small>找回误删内容</small></div><div class="onboarding-tool"><b>🤖</b><span>AI 助手</span><small>自然语言管理</small></div></div>`;
  if (type === 'states') return `<div class="onboarding-demo"><div class="onboarding-demo-row"><div class="onboarding-demo-inner"><div class="onboarding-demo-check" id="onboardingStateCheck"></div><div class="onboarding-demo-copy"><b>点击我试试看</b><span id="onboardingStateLabel">未完成 · 第一次点击进入进行中</span></div></div></div><div class="onboarding-demo-note">这是虚拟演示，不会加入你的待办。</div></div>`;
  if (type === 'swipe') return `<div class="onboarding-demo"><div class="onboarding-demo-row" id="onboardingSwipeRow"><div class="onboarding-demo-actions"><span class="onboarding-demo-action remind">提醒</span><span class="onboarding-demo-action delete">删除</span></div><div class="onboarding-demo-inner" id="onboardingSwipeInner"><div class="onboarding-demo-check"></div><div class="onboarding-demo-copy"><b>向左拖动我</b><span>拖一半松手，会自然回弹</span></div></div></div><div class="onboarding-demo-note" id="onboardingSwipeHint">👈 用手指向左滑</div></div>`;
  if (type === 'mode') return `<div class="onboarding-mini-switch"><div class="onboarding-mini-track"><div class="onboarding-mini-panel">✓ To-Do · 做完一件事</div><div class="onboarding-mini-panel">📝 Note · 留下一段内容</div></div></div>`;
  if (type === 'tools') return `<div class="onboarding-tools"><div class="onboarding-tool"><b>📅</b><span>日期</span><small>按天查看待办</small></div><div class="onboarding-tool"><b>🕐</b><span>每日总结</span><small>每天固定时间提醒</small></div><div class="onboarding-tool"><b>↻</b><span>Daily</span><small>每天重新开始</small></div></div>`;
  return '';
}
function renderOnboardingStep() {
  const step = onboardingSteps[onboardingIndex];
  if (!step) return finishOnboarding(false);
  document.getElementById('onboardingStep').textContent = `${onboardingIndex + 1} / ${onboardingSteps.length}`;
  document.getElementById('onboardingTitle').textContent = step.title;
  document.getElementById('onboardingText').textContent = step.text;
  document.getElementById('onboardingDemo').innerHTML = onboardingDemoHtml(step.demo);
  renderOnboardingDots();
  const next = document.getElementById('onboardingNext');
  next.textContent = onboardingIndex === onboardingSteps.length - 1 ? '开始使用' : '下一步';
  next.disabled = !!step.interactive;
  positionOnboardingTarget(step.target);
  if (step.interactive === 'states') bindOnboardingStateDemo();
  if (step.interactive === 'swipe') bindOnboardingSwipeDemo();
}
function bindOnboardingStateDemo() {
  onboardingDemoState = 0;
  const check = document.getElementById('onboardingStateCheck');
  const label = document.getElementById('onboardingStateLabel');
  check?.addEventListener('click', () => {
    onboardingDemoState = Math.min(2, onboardingDemoState + 1);
    check.classList.toggle('progress', onboardingDemoState === 1);
    check.classList.toggle('done', onboardingDemoState === 2);
    if (onboardingDemoState === 1) label.textContent = '进行中 · 再点一次就完成';
    if (onboardingDemoState === 2) {
      label.textContent = '已完成 ✓ · 这就是三态待办';
      document.getElementById('onboardingNext').disabled = false;
      try { if (navigator.vibrate) navigator.vibrate(18); } catch(e) {}
    }
  });
}
function bindOnboardingSwipeDemo() {
  onboardingSwipeUnlocked = false;
  const inner = document.getElementById('onboardingSwipeInner');
  const row = document.getElementById('onboardingSwipeRow');
  if (!inner || !row) return;
  let startX=0, dx=0, dragging=false;
  const finish = () => {
    if (!dragging) return;
    dragging=false;
    const open = dx < -58;
    inner.style.transition='transform .22s cubic-bezier(.22,.82,.28,1)';
    inner.style.transform = open ? 'translateX(-116px)' : 'translateX(0)';
    if (open) {
      onboardingSwipeUnlocked = true;
      document.getElementById('onboardingSwipeHint').textContent = '就是这样 · 提醒与删除只在需要时出现';
      document.getElementById('onboardingNext').disabled = false;
    }
  };
  const move = x => {
    if (!dragging) return;
    dx = Math.max(-116, Math.min(0, x-startX));
    inner.style.transform=`translateX(${dx}px)`;
  };
  inner.addEventListener('touchstart',e=>{ if(!e.touches.length)return; startX=e.touches[0].clientX;dx=0;dragging=true;inner.style.transition='none'; },{passive:true});
  inner.addEventListener('touchmove',e=>{ if(!dragging||!e.touches.length)return; e.preventDefault();move(e.touches[0].clientX); },{passive:false});
  inner.addEventListener('touchend',finish,{passive:true});
  inner.addEventListener('pointerdown',e=>{ startX=e.clientX;dx=0;dragging=true;inner.style.transition='none'; inner.setPointerCapture?.(e.pointerId); });
  inner.addEventListener('pointermove',e=>move(e.clientX));
  inner.addEventListener('pointerup',finish);
}
function nextOnboardingStep() {
  if (document.getElementById('onboardingNext').disabled) return;
  if (onboardingIndex >= onboardingSteps.length - 1) return finishOnboarding(false);
  onboardingIndex++;
  renderOnboardingStep();
}
function replayOnboarding() {
  startOnboarding(false);
}

// ===== Feature Coach: contextual one-time teaching =====
const FeatureCoachManager = (() => {
  let activeKey = '';
  let activeTarget = null;

  const seenKey = key => COACH_PREFIX + key;
  const enabled = () => onboardingValue() === 'done';
  const hasSeen = key => {
    try { return localStorage.getItem(seenKey(key)) === '1'; } catch(e) { return false; }
  };
  const markSeen = key => {
    try { localStorage.setItem(seenKey(key), '1'); } catch(e) {}
  };

  function resolveTarget(target) {
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  function position(target) {
    const coach = document.getElementById('contextCoach');
    const ring = document.getElementById('contextCoachRing');
    const arrow = document.getElementById('contextCoachArrow');
    const card = document.getElementById('contextCoachCard');
    if (!coach || !ring || !arrow || !card || !target) return false;
    const r = target.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const padX = Math.min(10, Math.max(6, r.width * .04));
    const padY = 7;
    const left = Math.max(7, r.left - padX);
    const top = Math.max(7, r.top - padY);
    const width = Math.min(window.innerWidth - left - 7, r.width + padX * 2);
    const height = Math.min(window.innerHeight - top - 7, r.height + padY * 2);
    ring.style.left = `${left}px`;
    ring.style.top = `${top}px`;
    ring.style.width = `${width}px`;
    ring.style.height = `${height}px`;
    ring.style.borderRadius = `${Math.max(15, Math.min(26, height * .34))}px`;

    const placeCardTop = top + height / 2 > window.innerHeight * .55;
    card.classList.toggle('top', placeCardTop);
    const arrowX = Math.max(10, Math.min(window.innerWidth - 48, left + width * .72));
    const arrowY = placeCardTop ? Math.max(12, top - 48) : Math.min(window.innerHeight - 54, top + height + 7);
    arrow.style.left = `${arrowX}px`;
    arrow.style.top = `${arrowY}px`;
    arrow.style.transform = placeCardTop ? 'rotate(180deg)' : '';
    return true;
  }

  function show(key, target, options={}) {
    if (!enabled() || !key || hasSeen(key)) return false;
    const coach = document.getElementById('contextCoach');
    if (!coach || coach.classList.contains('active')) return false;
    const el = resolveTarget(target);
    if (!el || !position(el)) return false;

    document.getElementById('contextCoachEyebrow').textContent = options.eyebrow || '隐藏技巧';
    document.getElementById('contextCoachTitle').textContent = options.title || '发现一个小功能';
    document.getElementById('contextCoachText').textContent = options.text || '';
    const visual = document.getElementById('contextCoachVisual');
    if (visual) {
      visual.innerHTML = options.visual || '';
      visual.classList.toggle('show', !!options.visual);
    }
    activeKey = key;
    activeTarget = el;
    coach.classList.add('active');
    try { if (navigator.vibrate) navigator.vibrate(10); } catch(e) {}
    return true;
  }

  function close(mark=true) {
    const coach = document.getElementById('contextCoach');
    if (!coach) return;
    if (mark && activeKey) markSeen(activeKey);
    activeKey = '';
    activeTarget = null;
    coach.classList.remove('active');
  }

  function reset() {
    try {
      const remove=[];
      for (let i=0;i<localStorage.length;i++) {
        const k=localStorage.key(i);
        if (k && k.startsWith(COACH_PREFIX)) remove.push(k);
      }
      remove.forEach(k=>localStorage.removeItem(k));
    } catch(e) {}
    close(false);
  }

  function refreshPosition() {
    if (activeTarget && document.getElementById('contextCoach')?.classList.contains('active')) position(activeTarget);
  }

  return { show, close, reset, hasSeen, refreshPosition };
})();

// Observe the already-existing Note container instead of modifying Note mode/data code.
// This keeps the Note core byte-identical while still teaching the first real entry, whether
// the user switches by button or by the horizontal gesture.
const featureCoachNoteContainer = document.getElementById('noteContainer');
if (featureCoachNoteContainer && typeof MutationObserver !== 'undefined') {
  new MutationObserver(() => {
    if (currentMode === 'notes' && featureCoachNoteContainer.classList.contains('note-container--open')) {
      setTimeout(() => FeatureCoachManager.show('noteOpen', '#noteToolbarRow', {
        eyebrow:'Note 小技巧',
        title:'这里是长期记录区',
        text:'Note 适合保存想长期留下的内容，不会进入 To-Do 完成统计。顶部两个图标可在最近笔记与知识树之间切换；右下角 ＋ 可在当前主题中新建笔记或主题。',
        visual:'◷ 最近：快速继续写　·　🌳 知识树：按主题整理　·　✓ 不影响任务统计'
      }), 260);
    }
  }).observe(featureCoachNoteContainer, { attributes:true, attributeFilter:['class','style'] });
}

// Backward-compatible helper used by V1.13 trigger points; V1.14 routes all coaches through the manager.
function showContextCoach(key, target, title, text, visual='') {
  return FeatureCoachManager.show(key, target, { title, text, visual });
}
function closeContextCoach(markSeen=true) { FeatureCoachManager.close(markSeen); }

function openHelpGuide() {
  closeContextCoach(false);
  document.getElementById('helpGuideOverlay')?.classList.add('active');
}
function closeHelpGuide() { document.getElementById('helpGuideOverlay')?.classList.remove('active'); }

// First-run onboarding controls.
document.getElementById('onboardingWelcomeStart')?.addEventListener('click', () => startOnboarding(false));
document.getElementById('onboardingWelcomeSkip')?.addEventListener('click', () => finishOnboarding(true));
document.getElementById('onboardingSkip')?.addEventListener('click', () => finishOnboarding(true));
document.getElementById('onboardingNext')?.addEventListener('click', nextOnboardingStep);

// Help hub: replay the main tutorial or re-arm all contextual coaches.
document.getElementById('helpBtn')?.addEventListener('click', openHelpGuide);
document.getElementById('helpGuideClose')?.addEventListener('click', closeHelpGuide);
document.getElementById('helpGuideOverlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeHelpGuide(); });
document.getElementById('replayMainTutorialBtn')?.addEventListener('click', () => { closeHelpGuide(); replayOnboarding(); });
document.getElementById('resetFeatureCoachBtn')?.addEventListener('click', () => {
  FeatureCoachManager.reset();
  closeHelpGuide();
  showToast('功能提示已重新开启 · 下次进入对应功能时会再次出现');
});

document.getElementById('contextCoachOk')?.addEventListener('click', () => FeatureCoachManager.close(true));
document.getElementById('contextCoachLater')?.addEventListener('click', () => FeatureCoachManager.close(false));
window.addEventListener('resize', () => {
  if (document.getElementById('onboardingOverlay')?.classList.contains('active')) positionOnboardingTarget(onboardingSteps[onboardingIndex]?.target || null);
  FeatureCoachManager.refreshPosition();
});

// ===== Toast =====
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

// Custom confirm dialog (replaces browser confirm)
var _confirmCallback = null;
function showConfirm(msg, onOk) {
  var overlay = document.getElementById('confirmOverlay');
  var msgEl = document.getElementById('confirmMsg');
  if (!overlay || !msgEl) { if (onOk) onOk(); return; }
  msgEl.textContent = msg;
  overlay.style.display = '';
  _confirmCallback = onOk;
}
function hideConfirm() {
  document.getElementById('confirmOverlay').style.display = 'none';
  _confirmCallback = null;
}
document.getElementById('confirmOk').addEventListener('click', function() {
  var cb = _confirmCallback;
  hideConfirm();
  if (cb) cb();
});
document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
document.getElementById('confirmOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('confirmOverlay')) hideConfirm();
});

// Custom prompt (replaces browser prompt)
var _promptCallback = null;
function showPrompt(msg, placeholder, onOk) {
  var overlay = document.getElementById('promptOverlay');
  var msgEl = document.getElementById('promptMsg');
  var input = document.getElementById('promptInput');
  if (!overlay || !input) { if (onOk) onOk(''); return; }
  msgEl.textContent = msg;
  input.value = '';
  input.placeholder = placeholder || '';
  overlay.style.display = '';
  input.focus();
  _promptCallback = onOk;
}
function hidePrompt() {
  document.getElementById('promptOverlay').style.display = 'none';
  _promptCallback = null;
}
document.getElementById('promptOk').addEventListener('click', function() {
  var cb = _promptCallback;
  var val = document.getElementById('promptInput').value;
  hidePrompt();
  if (cb) cb(val);
});
document.getElementById('promptCancel').addEventListener('click', hidePrompt);
document.getElementById('promptOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('promptOverlay')) hidePrompt();
});
document.getElementById('promptInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('promptOk').click();
});

let undoId = null;
let undoTimer = null;
function showUndoToast(id) {
  undoId = id;
  toastEl.innerHTML = '已删除 <button class="toast__undo" id="toast-undo">【撤销】</button>';
  toastEl.classList.add('show');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { toastEl.classList.remove('show'); undoId = null; }, 3500);
}

// Undo handler
toastEl.addEventListener('click', (e) => {
  if (e.target.id === 'toast-undo' && undoId) {
    restoreFromRecycle(undoId);
    toastEl.classList.remove('show');
    undoId = null;
    clearTimeout(undoTimer);
  }
});

// ===== Data =====
function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : getDefaultTodos();
    todos.forEach(t => {
      if (t.status === undefined) {
        t.status = t.completed ? 'completed' : 'todo';
        delete t.completed;
      }
      if (t.category === undefined) {
        t.category = '全部';
      }
    });
    updateCategories();
  } catch (e) {
    todos = getDefaultTodos();
    updateCategories();
  }
}

function updateCategories() {
  const catSet = new Set(['全部']);
  todos.forEach(t => {
    if (t.category && t.category.trim()) {
      catSet.add(t.category.trim());
    }
  });
  categories = Array.from(catSet);
}

function getDefaultTodos() {
  const n = Date.now();
  const today = new Date(); today.setHours(0,0,0,0);
  const day0 = today.getTime();
  const day1 = day0 - 86400000;
  const day2 = day0 - 2 * 86400000;
  const day3 = day0 - 3 * 86400000;
  const day4 = day0 - 4 * 86400000;
  const day5 = day0 - 5 * 86400000;
  const day6 = day0 - 6 * 86400000;
  return [
    { id: n, text: '完成项目周报', status: 'todo', createdAt: n, category: '工作' },
    { id: n-1, text: '回复客户邮件', status: 'in-progress', createdAt: n - 1800000, category: '工作' },
    { id: n-2, text: '整理桌面文件', status: 'completed', createdAt: day0 + 72000000, category: '生活' },
    { id: n-3, text: '学习新框架', status: 'todo', createdAt: day0 + 3600000, category: '学习' },
    { id: n-4, text: '阅读技术文章', status: 'completed', createdAt: day1 + 86400000 - 3600000, category: '学习' },
    { id: n-5, text: '购买生日礼物', status: 'todo', createdAt: day1 + 36000000, category: '生活' },
    { id: n-6, text: '健身跑步5公里', status: 'in-progress', createdAt: day1 + 7200000, category: '生活' },
    { id: n-7, text: '代码审查', status: 'todo', createdAt: day2 + 60000000, category: '工作' },
    { id: n-8, text: '参加团队会议', status: 'completed', createdAt: day2 + 36000000, category: '工作' },
    { id: n-9, text: '写技术文档', status: 'todo', createdAt: day2 + 18000000, category: '工作' },
    { id: n-10, text: '测试新功能', status: 'completed', createdAt: day3 + 72000000, category: '工作' },
    { id: n-11, text: '优化数据库查询', status: 'todo', createdAt: day3 + 36000000, category: '工作' },
    { id: n-12, text: '更新项目依赖', status: 'todo', createdAt: day4 + 60000000, category: '工作' },
    { id: n-13, text: '备份数据', status: 'completed', createdAt: day4 + 18000000, category: '生活' },
    { id: n-14, text: '整理需求文档', status: 'todo', createdAt: day5 + 72000000, category: '工作' },
    { id: n-15, text: '设计数据库表', status: 'in-progress', createdAt: day5 + 36000000, category: '工作' },
    { id: n-16, text: '编写API接口', status: 'todo', createdAt: day6 + 60000000, category: '工作' },
  ];
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  updateCategories();
  updateCounts();
  renderCategoryBar();
  syncToAndroid();
}

function syncToAndroid() {
  if (typeof AndroidBridge === 'undefined') return;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + 86400000;
  const todayTodos = todos.filter(t => t.createdAt >= todayStart && t.createdAt < todayEnd);
  const completed = todayTodos.filter(t => t.status === 'completed').length;
  const total = todayTodos.length;
  const percent = total > 0 ? (completed / total * 100) : 0;
  const inProgress = todayTodos.filter(t => t.status === 'in-progress').map(t => t.text);
  const todo = todayTodos.filter(t => t.status === 'todo').map(t => t.text);
  const completedItems = todayTodos.filter(t => t.status === 'completed').map(t => t.text);
  if (AndroidBridge.syncDailyData) {
    AndroidBridge.syncDailyData(percent, completed, total,
      JSON.stringify(inProgress), JSON.stringify(todo), JSON.stringify(completedItems));
  }
  if (AndroidBridge.syncTodoSnapshot) {
    const nativeSnapshot = todos.map(t => ({
      id: t.id,
      text: t.text,
      status: t.status,
      createdAt: t.createdAt,
      reminderAt: t.reminderAt || null
    }));
    AndroidBridge.syncTodoSnapshot(JSON.stringify(nativeSnapshot));
  }
}

// ===== Notes Data Layer · Schema V2 (Topic structure + leaf Note documents) =====
var noteEntityIdSeed = Date.now();
function nextNoteEntityId() {
  noteEntityIdSeed = Math.max(noteEntityIdSeed + 1, Date.now());
  return noteEntityIdSeed;
}
function safeJsonArray(raw) {
  try { var value = JSON.parse(raw || '[]'); return Array.isArray(value) ? value : []; }
  catch(e) { return []; }
}
function normalizeTopicRecord(topic) {
  if (!topic || typeof topic !== 'object') return null;
  var now = Date.now();
  return {
    id: Number(topic.id) || nextNoteEntityId(),
    title: String(topic.title || '未命名主题').trim() || '未命名主题',
    parentTopicId: topic.parentTopicId == null ? null : Number(topic.parentTopicId),
    summary: String(topic.summary || ''),
    collapsed: !!topic.collapsed,
    createdAt: Number(topic.createdAt) || now,
    updatedAt: Number(topic.updatedAt) || Number(topic.createdAt) || now
  };
}
function normalizeNoteRecord(note) {
  if (!note || typeof note !== 'object') return null;
  var now = Date.now();
  return {
    id: Number(note.id) || nextNoteEntityId(),
    title: String(note.title || ''),
    content: String(note.content || ''),
    topicId: note.topicId == null ? null : Number(note.topicId),
    createdAt: Number(note.createdAt) || now,
    updatedAt: Number(note.updatedAt) || Number(note.createdAt) || now
  };
}
function getLegacyContentText(content) {
  var holder = document.createElement('div');
  holder.innerHTML = String(content || '');
  holder.querySelectorAll('.note-image-grid,.note-file-stack,.note-image-picker-marker,.note-file-picker-marker,.note-file-annotation').forEach(function(el){ el.remove(); });
  return String(holder.textContent || '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}
function legacyContentHasComplexBlocks(content) {
  var html = String(content || '');
  return /data-note-image-name=|data-note-file-name=|<img\b|<video\b|<audio\b|note-file-stack|note-file-card|note-image-grid/i.test(html);
}
function legacyNodeIsEmpty(note) {
  if (!note) return true;
  return !getLegacyContentText(note.content || '') && !legacyContentHasComplexBlocks(note.content || '');
}
function migrateLegacyNotesToV2(legacyNotes) {
  var source = Array.isArray(legacyNotes) ? legacyNotes : [];
  var migratedTopics = [];
  var migratedNotes = [];
  var byId = {};
  source.forEach(function(n){ if (n && n.id != null) byId[Number(n.id)] = n; });

  function legacyChildren(node) {
    var result = [];
    var used = {};
    var order = Array.isArray(node && node.childrenOrder) ? node.childrenOrder : [];
    order.forEach(function(id){
      var child = byId[Number(id)];
      if (child && Number(child.parentId) === Number(node.id) && !used[child.id]) {
        used[child.id] = true; result.push(child);
      }
    });
    source.forEach(function(child){
      if (!child || used[child.id]) return;
      if (child.parentId != null && Number(child.parentId) === Number(node.id)) {
        used[child.id] = true; result.push(child);
      }
    });
    return result;
  }
  function createMigratedTopic(title, parentTopicId, sourceNode) {
    var t = normalizeTopicRecord({
      id: sourceNode && sourceNode.id != null ? Number(sourceNode.id) : nextNoteEntityId(),
      title: title || '未命名主题',
      parentTopicId: parentTopicId == null ? null : parentTopicId,
      summary: '',
      collapsed: sourceNode ? !!sourceNode.collapsed : false,
      createdAt: sourceNode && sourceNode.createdAt,
      updatedAt: sourceNode && sourceNode.updatedAt
    });
    while (migratedTopics.some(function(x){ return x.id === t.id; }) || migratedNotes.some(function(x){ return x.id === t.id; })) t.id = nextNoteEntityId();
    migratedTopics.push(t);
    return t;
  }
  function createMigratedNote(node, topicId, titleOverride) {
    var n = normalizeNoteRecord({
      id: node && node.id != null ? Number(node.id) : nextNoteEntityId(),
      title: titleOverride != null ? titleOverride : (node && node.title),
      content: node && node.content,
      topicId: topicId == null ? null : topicId,
      createdAt: node && node.createdAt,
      updatedAt: node && node.updatedAt
    });
    while (migratedTopics.some(function(x){ return x.id === n.id; }) || migratedNotes.some(function(x){ return x.id === n.id; })) n.id = nextNoteEntityId();
    migratedNotes.push(n);
    return n;
  }
  function stableLegacySyntheticId(label) {
    var h = 2166136261;
    var text = String(label || '');
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    var id = -(Math.abs(h >>> 0) + 1);
    while (migratedTopics.some(function(t){return Number(t.id)===Number(id);}) || migratedNotes.some(function(n){return Number(n.id)===Number(id);})) id--;
    return id;
  }
  function moveLegacyBodyIntoTopic(node, topic) {
    var content = String(node && node.content || '');
    if (!content) return;
    var text = getLegacyContentText(content);
    if (!legacyContentHasComplexBlocks(content)) {
      topic.summary = text;
      return;
    }
    // Summary stays lightweight in Schema V2. Complex legacy bodies are preserved losslessly as a leaf Note.
    if (text && text.length <= 600) topic.summary = text;
    var preserved = Object.assign({}, node || {}, { id: stableLegacySyntheticId('legacy-content:' + String(node && node.id || '') + ':' + String(node && node.title || '')) });
    createMigratedNote(preserved, topic.id, (node.title || '原笔记') + ' · 原内容');
  }

  function stableLegacyFolderTopicId(folder) {
    return stableLegacySyntheticId('legacy-folder:' + String(folder || ''));
  }
  var folderTopics = {};
  source.forEach(function(node){
    if (!node || node.parentId != null) return;
    var folder = String(node.folder || '').trim();
    if (!folder || folderTopics[folder]) return;
    var shell = source.find(function(candidate){
      return candidate && candidate.parentId == null && String(candidate.folder || '').trim() === folder && String(candidate.title || '').trim() === folder;
    });
    if (shell) folderTopics[folder] = createMigratedTopic(folder, null, shell);
    else folderTopics[folder] = createMigratedTopic(folder, null, {id:stableLegacyFolderTopicId(folder)});
  });

  var visited = {};
  function migrateNode(node, parentTopicId) {
    if (!node || visited[node.id]) return;
    visited[node.id] = true;
    var children = legacyChildren(node);
    var folder = String(node.folder || '').trim();
    var title = String(node.title || '').trim() || '无标题';

    // Legacy "folder + same-name shell note" collapses into one real Topic.
    if (node.parentId == null && folder && title === folder && folderTopics[folder]) {
      var rootTopic = folderTopics[folder];
      rootTopic.createdAt = Number(node.createdAt) || rootTopic.createdAt;
      rootTopic.updatedAt = Number(node.updatedAt) || rootTopic.updatedAt;
      rootTopic.collapsed = !!node.collapsed;
      if (!legacyNodeIsEmpty(node)) moveLegacyBodyIntoTopic(node, rootTopic);
      children.forEach(function(child){ migrateNode(child, rootTopic.id); });
      return;
    }

    if (children.length) {
      var topic = createMigratedTopic(title, parentTopicId, node);
      if (!legacyNodeIsEmpty(node)) moveLegacyBodyIntoTopic(node, topic);
      children.forEach(function(child){ migrateNode(child, topic.id); });
      return;
    }
    // An empty legacy leaf carried no user content. Treat it as structure rather than
    // manufacturing a meaningless blank Note; this is reversible and loses no data.
    if (legacyNodeIsEmpty(node)) { createMigratedTopic(title, parentTopicId, node); return; }
    createMigratedNote(node, parentTopicId, null);
  }

  source.forEach(function(node){
    if (!node || node.parentId != null) return;
    var folder = String(node.folder || '').trim();
    var parentTopicId = folder && folderTopics[folder] ? folderTopics[folder].id : null;
    migrateNode(node, parentTopicId);
  });
  // Orphan protection: no legacy record is dropped even if parent metadata was broken.
  source.forEach(function(node){ if (node && !visited[node.id]) migrateNode(node, null); });

  // Empty Topics are valid structure in Schema V2. Never discard a legacy empty node merely
  // because it currently has no children; that would destroy the user's intended hierarchy.
  return { topics: migratedTopics, notes: migratedNotes };
}
function persistNoteSchemaV2() {
  localStorage.setItem(NOTE_TOPICS_KEY, JSON.stringify(noteTopics));
  localStorage.setItem(NOTE_DOCS_KEY, JSON.stringify(notes));
  localStorage.setItem(NOTE_SCHEMA_VERSION_KEY, String(NOTE_SCHEMA_VERSION));
}
function loadNotes() {
  var version = Number(localStorage.getItem(NOTE_SCHEMA_VERSION_KEY) || 0);
  if (version === NOTE_SCHEMA_VERSION && (localStorage.getItem(NOTE_TOPICS_KEY) !== null || localStorage.getItem(NOTE_DOCS_KEY) !== null)) {
    noteTopics = safeJsonArray(localStorage.getItem(NOTE_TOPICS_KEY)).map(normalizeTopicRecord).filter(Boolean);
    notes = safeJsonArray(localStorage.getItem(NOTE_DOCS_KEY)).map(normalizeNoteRecord).filter(Boolean);
  } else {
    var legacyRaw = localStorage.getItem(NOTES_KEY);
    var legacy = safeJsonArray(legacyRaw);
    if (legacyRaw && localStorage.getItem(NOTE_MIGRATION_BACKUP_KEY) === null) {
      try { localStorage.setItem(NOTE_MIGRATION_BACKUP_KEY, legacyRaw); } catch(e) {}
    }
    var migrated = migrateLegacyNotesToV2(legacy);
    noteTopics = migrated.topics;
    notes = migrated.notes;
    persistNoteSchemaV2();
  }
  var maxId = Date.now();
  noteTopics.forEach(function(t){ maxId = Math.max(maxId, Number(t.id)||0); });
  notes.forEach(function(n){ maxId = Math.max(maxId, Number(n.id)||0); });
  noteEntityIdSeed = maxId;
  return notes;
}
function saveNotes() { persistNoteSchemaV2(); }
function getNoteById(id) {
  id = Number(id);
  for (var i = 0; i < notes.length; i++) if (Number(notes[i].id) === id) return notes[i];
  return null;
}
function getTopicById(id) {
  if (id == null) return null;
  id = Number(id);
  for (var i = 0; i < noteTopics.length; i++) if (Number(noteTopics[i].id) === id) return noteTopics[i];
  return null;
}
function getChildTopics(parentTopicId) {
  return noteTopics.filter(function(t){
    return parentTopicId == null ? t.parentTopicId == null : Number(t.parentTopicId) === Number(parentTopicId);
  }).sort(function(a,b){ return String(a.title).localeCompare(String(b.title), 'zh-CN'); });
}
function getTopicNotes(topicId) {
  return notes.filter(function(n){
    return topicId == null ? n.topicId == null : Number(n.topicId) === Number(topicId);
  }).sort(function(a,b){ return Number(b.updatedAt||0) - Number(a.updatedAt||0); });
}
function getTopicPath(topicId) {
  var path = [];
  var seen = {};
  var cur = getTopicById(topicId);
  while (cur && !seen[cur.id]) {
    seen[cur.id] = true; path.unshift(cur); cur = getTopicById(cur.parentTopicId);
  }
  return path;
}
function topicContains(candidateParentId, topicId) {
  var cur = getTopicById(candidateParentId);
  var seen = {};
  while (cur && !seen[cur.id]) {
    if (Number(cur.id) === Number(topicId)) return true;
    seen[cur.id] = true; cur = getTopicById(cur.parentTopicId);
  }
  return false;
}
function createNote(title, topicId) {
  var now = Date.now();
  var note = normalizeNoteRecord({
    id: nextNoteEntityId(), title: title || '', content: '', topicId: topicId == null ? null : Number(topicId), createdAt: now, updatedAt: now
  });
  notes.push(note); saveNotes(); return note;
}
function createTopic(title, parentTopicId) {
  var now = Date.now();
  var topic = normalizeTopicRecord({
    id: nextNoteEntityId(), title: title || '新主题', parentTopicId: parentTopicId == null ? null : Number(parentTopicId), summary: '', collapsed: false, createdAt: now, updatedAt: now
  });
  noteTopics.push(topic); saveNotes(); return topic;
}
function updateNote(id, updates) {
  var note = getNoteById(id); if (!note) return null;
  ['title','content','topicId'].forEach(function(k){ if (Object.prototype.hasOwnProperty.call(updates,k)) note[k] = updates[k]; });
  note.updatedAt = Date.now(); saveNotes(); return note;
}
function updateTopic(id, updates, touch) {
  var topic = getTopicById(id); if (!topic) return null;
  ['title','summary','parentTopicId','collapsed'].forEach(function(k){ if (Object.prototype.hasOwnProperty.call(updates,k)) topic[k] = updates[k]; });
  if (touch !== false) topic.updatedAt = Date.now();
  saveNotes(); return topic;
}
function extractNoteImageNames(content) {
  var names = []; var re = /data-note-image-name=["']([A-Za-z0-9._-]{1,180})["']/g; var match;
  while ((match = re.exec(String(content || ''))) !== null) names.push(match[1]); return names;
}
function deleteNativeNoteImagesFromContent(content) {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.deleteNoteImage) return;
  extractNoteImageNames(content).forEach(function(name){ try { AndroidBridge.deleteNoteImage(name); } catch(e) {} });
}
function extractNoteFileNames(content) {
  var names = []; var re = /data-note-file-name=["']([A-Za-z0-9._-]{1,180})["']/g; var match;
  while ((match = re.exec(String(content || ''))) !== null) names.push(match[1]); return names;
}
function deleteNativeNoteFilesFromContent(content) {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.deleteNoteFile) return;
  extractNoteFileNames(content).forEach(function(name){ try { AndroidBridge.deleteNoteFile(name); } catch(e) {} });
}
function deleteNote(id) {
  var note = getNoteById(id); if (!note) return;
  deleteNativeNoteImagesFromContent(note.content || '');
  deleteNativeNoteFilesFromContent(note.content || '');
  notes = notes.filter(function(n){ return Number(n.id) !== Number(id); });
  saveNotes();
}
function moveNoteToTopic(noteId, topicId) {
  var note = getNoteById(noteId); if (!note) return false;
  if (topicId != null && !getTopicById(topicId)) return false;
  note.topicId = topicId == null ? null : Number(topicId); note.updatedAt = Date.now(); saveNotes(); return true;
}
function getTopicDescendantCount(topicId) {
  var count = 0, queue = [Number(topicId)], seen = {};
  while (queue.length) {
    var id = queue.shift(); if (seen[id]) continue; seen[id] = true;
    var children = getChildTopics(id); count += children.length + getTopicNotes(id).length;
    children.forEach(function(t){ queue.push(t.id); });
  }
  return count;
}
function topicHasChildren(topicId) { return getChildTopics(topicId).length > 0 || getTopicNotes(topicId).length > 0; }
function notePlainPreview(note) {
  var holder = document.createElement('div'); holder.innerHTML = String(note && note.content || '');
  holder.querySelectorAll('.note-image-remove,.note-file-card__remove,.note-image-picker-marker,.note-file-picker-marker').forEach(function(el){ el.remove(); });
  var text = String(holder.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    if (holder.querySelector('.note-image-item') && holder.querySelector('.note-file-card')) return '图片 · 文件附件';
    if (holder.querySelector('.note-image-item')) return '图片';
    if (holder.querySelector('.note-file-card')) return '文件附件';
  }
  return text.length > 110 ? text.slice(0,110) + '…' : text;
}

let modeSwitchAnimating = false;
let modeSwipePreviewActive = false;

function applyMode(mode) {
  currentMode = mode;
  if (mode === 'notes') loadNotes();
  renderModeUI();
}

function prepareModeDrawer(targetMode, direction) {
  const underlay = document.getElementById('modeDrawerUnderlay');
  const label = document.getElementById('modeDrawerLabel');
  if (!underlay) return;
  if (label) label.textContent = targetMode === 'notes' ? 'Note' : 'To-Do';
  underlay.classList.remove('from-left', 'from-right');
  underlay.classList.add(direction > 0 ? 'from-right' : 'from-left', 'active');
}

function clearModeDrawerPreview() {
  const appEl = document.querySelector('.app');
  const underlay = document.getElementById('modeDrawerUnderlay');
  if (appEl) {
    appEl.classList.remove('mode-drawer-moving');
    appEl.style.removeProperty('transform');
    appEl.style.removeProperty('transition');
  }
  if (underlay) underlay.classList.remove('active', 'from-left', 'from-right');
  modeSwipePreviewActive = false;
}

function springBackModeDrawer() {
  const appEl = document.querySelector('.app');
  if (!appEl) return clearModeDrawerPreview();
  appEl.classList.add('mode-drawer-moving');
  appEl.style.transition = 'transform 205ms cubic-bezier(0.22,0.82,0.28,1)';
  appEl.style.transform = 'translate3d(0,0,0)';
  setTimeout(clearModeDrawerPreview, 210);
}

function switchMode(mode, motion) {
  if (mode === currentMode || modeSwitchAnimating) return;
  const nestedNoteWasOpen = mode === 'todo' && currentMode === 'notes' && isNoteEditorVisible();
  if (nestedNoteWasOpen) suspendNoteEditorForModeSwitch();
  const appEl = document.querySelector('.app');
  if (!appEl) {
    applyMode(mode);
    if (mode === 'notes') restoreSuspendedNoteEditorIfNeeded(false);
    return;
  }
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    clearModeDrawerPreview(); applyMode(mode);
    if (mode === 'notes') restoreSuspendedNoteEditorIfNeeded(false);
    return;
  }

  const direction = motion === 'left' ? -1 : motion === 'right' ? 1 : (mode === 'notes' ? 1 : -1);
  const width = appEl.getBoundingClientRect().width || window.innerWidth;
  modeSwitchAnimating = true;
  prepareModeDrawer(mode, direction);
  appEl.classList.add('mode-drawer-moving');
  appEl.style.transition = 'transform 165ms cubic-bezier(0.22,0.78,0.25,1)';
  appEl.style.transform = `translate3d(${direction * (width + 8)}px,0,0)`;

  setTimeout(() => {
    applyMode(mode);
    appEl.style.transition = 'none';
    appEl.style.transform = `translate3d(${-direction * 28}px,0,0)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      appEl.style.transition = 'transform 135ms cubic-bezier(0.22,0.82,0.28,1)';
      appEl.style.transform = 'translate3d(0,0,0)';
      const underlay = document.getElementById('modeDrawerUnderlay');
      if (underlay) underlay.classList.remove('active');
      setTimeout(() => {
        clearModeDrawerPreview();
        modeSwitchAnimating = false;
        if (mode === 'notes') restoreSuspendedNoteEditorIfNeeded(true);
      }, 140);
    }));
  }, 170);
}

function renderModeUI() {
  var isNotes = currentMode === 'notes';
  var appEl = document.querySelector('.app');

  // Toggle button state
  var toggleBtn = document.getElementById('modeToggle');
  if (toggleBtn) {
    toggleBtn.textContent = isNotes ? '📋' : '📝';
    toggleBtn.title = isNotes ? '切换到To-Do' : '切换到Note';
    if (isNotes) {
      toggleBtn.classList.add('mode-toggle--notes');
    } else {
      toggleBtn.classList.remove('mode-toggle--notes');
    }
  }

  // Header title updates only after the drawer-like switch commits.
  var titleEl = document.querySelector('.header__title');
  if (titleEl) titleEl.textContent = isNotes ? 'Note' : 'To-Do';

  // Header stats (calendar, alarm — todo only)
  var calendarBtn = document.getElementById('calendarBtn');
  var timePickerBtn = document.getElementById('timePickerBtn');
  var dailyBtn = document.getElementById('dailyBtn');
  if (isNotes) {
    if (calendarBtn) calendarBtn.style.display = 'none';
    if (timePickerBtn) timePickerBtn.style.display = 'none';
    if (dailyBtn) dailyBtn.style.display = 'none';
  } else {
    if (calendarBtn) calendarBtn.style.display = '';
    if (timePickerBtn) timePickerBtn.style.display = '';
    if (dailyBtn) dailyBtn.style.display = '';
  }

  // Show/hide todo vs notes
  var todoListEl = document.getElementById('todo-list');
  var noteContainer = document.getElementById('noteContainer');
  var tabsWrap = document.querySelector('.tabs-wrap');
  var categoryBar = document.getElementById('categoryBar');
  var searchWrap = document.querySelector('.search-wrap');
  var fabRecycle = document.getElementById('fabRecycle');
  var fabAi = document.getElementById('fabAi');
  var fabAdd = document.getElementById('fab');
  var noteViewSwitch = document.getElementById('noteViewSwitch');

  if (isNotes) {
    todoListEl.style.display = 'none';
    noteContainer.style.display = '';
    noteContainer.classList.add('note-container--open');
    tabsWrap.style.display = 'none';
    categoryBar.style.display = 'none';
    searchWrap.style.display = 'none';
    fabRecycle.style.display = 'none';
    fabAi.style.display = 'none';
    if (noteViewSwitch) noteViewSwitch.style.display = 'flex';
    fabAdd.textContent = '+';
    fabAdd.setAttribute('aria-label','新建笔记或主题');
    renderNoteList();
  } else {
    noteContainer.classList.remove('note-container--open');
    noteContainer.style.display = 'none';
    todoListEl.style.display = '';
    tabsWrap.style.display = '';
    categoryBar.style.display = '';
    searchWrap.style.display = '';
    fabRecycle.style.display = '';
    fabAi.style.display = '';
    if (noteViewSwitch) noteViewSwitch.style.display = 'none';
    closeNoteCreateMenu();
    fabAdd.textContent = '+';
    fabAdd.setAttribute('aria-label','添加待办');
    render();
    updateCounts();
    renderCategoryBar();
  }
}

function captureNoteSurfaceContext() {
  var container = document.getElementById('noteContainer');
  return {
    topicId: currentTopicId == null ? null : Number(currentTopicId),
    virtualFolder: currentVirtualNoteFolder,
    homeView: noteHomeView,
    scrollTop: container ? container.scrollTop : 0
  };
}
function restoreNoteSurfaceContext(ctx) {
  ctx = ctx || {topicId:null,virtualFolder:null,homeView:'recent',scrollTop:0};
  currentTopicId = ctx.topicId == null ? null : Number(ctx.topicId);
  currentVirtualNoteFolder = ctx.virtualFolder === 'unfiled' ? 'unfiled' : null;
  noteHomeView = ctx.homeView === 'tree' ? 'tree' : 'recent';
  topicSummaryEditing = false;
  renderNoteList();
  var target = Number(ctx.scrollTop || 0);
  requestAnimationFrame(function(){
    var container = document.getElementById('noteContainer'); if (container) container.scrollTop = target;
  });
}
function noteBreadcrumbHtml(path, options) {
  options = options || {};
  var html = '';
  if (options.includeRoot !== false) {
    html += '<button class="note-breadcrumb__segment" onclick="event.stopPropagation();navigateNoteRoot()">Note</button>';
    if (path && path.length) html += '<span class="note-breadcrumb__sep">›</span>';
  }
  (path || []).forEach(function(topic, index){
    html += '<button class="note-breadcrumb__segment" onclick="event.stopPropagation();navigateBreadcrumbTopic(' + topic.id + ')">' + escapeHtml(topic.title) + '</button>';
    if (index < path.length - 1) html += '<span class="note-breadcrumb__sep">›</span>';
  });
  return html;
}
function renderNoteViewSwitch() {
  var switcher = document.getElementById('noteViewSwitch');
  if (!switcher) return;
  switcher.querySelectorAll('[data-note-view]').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-note-view') === noteHomeView);
  });
}
function renderNoteSurfaceBreadcrumb() {
  var el = document.getElementById('noteSurfaceBreadcrumb');
  if (!el) return;
  if (currentVirtualNoteFolder === 'unfiled') {
    el.innerHTML = '<button class="note-breadcrumb__segment" onclick="navigateNoteRoot()">Note</button><span class="note-breadcrumb__sep">›</span><span class="note-breadcrumb__segment" style="pointer-events:none;color:var(--text-tertiary)">未分类</span>';
  } else if (currentTopicId == null) {
    el.innerHTML = '<span class="note-breadcrumb__segment" style="pointer-events:none;color:var(--text-tertiary)">' + (noteHomeView === 'tree' ? '知识树' : '最近修改') + '</span>';
  } else {
    el.innerHTML = noteBreadcrumbHtml(getTopicPath(currentTopicId));
  }
}
function renderNoteList() {
  var listEl = document.getElementById('noteList');
  var emptyEl = document.getElementById('noteListEmpty');
  var summaryEl = document.getElementById('noteWorkspaceSummary');
  if (!listEl) return;
  closeNoteCreateMenu();
  resetNoteSwipeState();
  resetTopicSwipeState();
  renderNoteViewSwitch();
  renderNoteSurfaceBreadcrumb();

  if (currentTopicId != null && !getTopicById(currentTopicId)) {
    currentTopicId = null; noteViewStack = [];
  }

  if (currentVirtualNoteFolder === 'unfiled') {
    renderUnfiledWorkspace(listEl, emptyEl, summaryEl);
    return;
  }
  if (currentTopicId != null) {
    renderTopicWorkspace(listEl, emptyEl, summaryEl, getTopicById(currentTopicId));
    return;
  }
  if (summaryEl) { summaryEl.style.display = 'none'; summaryEl.innerHTML = ''; }
  if (noteHomeView === 'tree') renderKnowledgeTree(listEl, emptyEl);
  else renderRecentNotes(listEl, emptyEl);
}
function renderRecentNotes(listEl, emptyEl) {
  var recent = notes.slice().sort(function(a,b){ return Number(b.updatedAt||0) - Number(a.updatedAt||0); });
  if (!recent.length) {
    listEl.innerHTML = ''; if (emptyEl) { emptyEl.style.display=''; emptyEl.innerHTML='📝<br>还没有笔记<br><small>点击右下角 + 新建笔记</small>'; } return;
  }
  if (emptyEl) emptyEl.style.display='none';
  listEl.innerHTML = recent.map(function(note){
    var path = getTopicPath(note.topicId);
    var pathHtml = '';
    if (path.length) {
      pathHtml = path.map(function(t,i){
        var sep = i ? '<span class="note-breadcrumb__sep">›</span>' : '';
        return sep + '<button class="note-breadcrumb__segment" onclick="event.stopPropagation();openTopicFromRecent(' + t.id + ')">' + escapeHtml(t.title) + '</button>';
      }).join('');
    } else {
      pathHtml = '<span style="font-size:10.5px;color:var(--text-tertiary)">未分类</span>';
    }
    var preview = notePlainPreview(note);
    var card = '<div class="note-recent-card" data-note-open-id="' + note.id + '">' +
      '<div class="note-recent-card__top"><span class="note-node-icon">📄</span><div class="note-node-title" style="flex:1">' + escapeHtml(note.title || '无标题') + '</div></div>' +
      (preview ? '<div class="note-recent-card__preview">' + escapeHtml(preview) + '</div>' : '') +
      '<div class="note-recent-card__bottom"><div class="note-recent-card__path">' + pathHtml + '</div><span class="note-recent-card__time">' + formatTime(note.updatedAt) + '</span></div>' +
      '</div>';
    return noteSwipeRowHtml(note.id, card);
  }).join('');
}
function renderKnowledgeTree(listEl, emptyEl) {
  var roots = getChildTopics(null);
  var unfiled = getTopicNotes(null);
  if (!roots.length && !unfiled.length) {
    listEl.innerHTML=''; if (emptyEl) { emptyEl.style.display=''; emptyEl.innerHTML='🌳<br>知识树还是空的<br><small>点击 + 创建主题或笔记</small>'; } return;
  }
  if (emptyEl) emptyEl.style.display='none';
  var html = '';
  roots.forEach(function(topic){ html += renderKnowledgeTreeTopic(topic); });
  if (unfiled.length) html += renderUnfiledVirtualFolder(unfiled);
  listEl.innerHTML = html;
}
function directChildByClass(parent,className) {
  if(!parent)return null;
  for(var i=0;i<parent.children.length;i++)if(parent.children[i].classList&&parent.children[i].classList.contains(className))return parent.children[i];
  return null;
}
function renderUnfiledTreeBranch(unfiled) {
  var html='<div class="note-tree-branch" data-unfiled-tree-branch="1">';
  unfiled.forEach(function(note){html+=renderKnowledgeTreeNote(note);});
  return html+'</div>';
}
function renderUnfiledVirtualFolder(unfiled) {
  var open=unfiled.length&&!noteUnfiledCollapsed;
  var html='<div class="note-tree-node-wrap note-tree-node-wrap--unfiled" data-unfiled-tree-node="1">';
  html+='<div class="note-topic-card note-system-folder-card" data-unfiled-open="1">' +
    '<button class="note-topic-card__toggle'+(open?' open':'')+'" onclick="event.stopPropagation();toggleUnfiledCollapse()">▶</button>' +
    '<span class="note-node-icon">📂</span><div class="note-node-main"><div class="note-node-title">未分类</div><div class="note-node-meta"><span class="note-node-count">'+unfiled.length+'</span></div></div></div>';
  if(open)html+=renderUnfiledTreeBranch(unfiled);
  html+='</div>';return html;
}
function renderKnowledgeTreeBranch(topic) {
  var html='<div class="note-tree-branch" data-topic-tree-branch="'+Number(topic.id)+'">';
  getChildTopics(topic.id).forEach(function(child){html+=renderKnowledgeTreeTopic(child);});
  getTopicNotes(topic.id).forEach(function(note){html+=renderKnowledgeTreeNote(note);});
  return html+'</div>';
}
function renderKnowledgeTreeTopic(topic) {
  var childrenTopics = getChildTopics(topic.id);
  var childNotes = getTopicNotes(topic.id);
  var hasChildren = childrenTopics.length || childNotes.length;
  var open = hasChildren && !topic.collapsed;
  var count = getTopicDescendantCount(topic.id);
  var html = '<div class="note-tree-node-wrap" data-topic-id="' + topic.id + '">';
  var topicCard='<div class="note-topic-card" data-topic-open-id="' + topic.id + '">' +
    '<button class="note-topic-card__toggle' + (hasChildren ? (open?' open':'') : ' empty') + '" onclick="event.stopPropagation();toggleTopicCollapse(' + topic.id + ')">▶</button>' +
    '<span class="note-node-icon">📁</span><div class="note-node-main"><div class="note-node-title">' + escapeHtml(topic.title) + '</div>' +
    '<div class="note-node-meta">' + (count ? '<span class="note-node-count">' + count + '</span>' : '<span>空主题</span>') + '</div></div></div>';
  html += topicSwipeRowHtml(topic.id,topicCard);
  if (open) html += renderKnowledgeTreeBranch(topic);
  html += '</div>';
  return html;
}
function syncKnowledgeTreeTopicNode(id) {
  if(currentMode!=='notes'||currentTopicId!=null||currentVirtualNoteFolder!=null||noteHomeView!=='tree')return false;
  var list=document.getElementById('noteList');var topic=getTopicById(id);if(!list||!topic)return false;
  var wrap=list.querySelector('.note-tree-node-wrap[data-topic-id="'+Number(id)+'"]');if(!wrap)return false;
  var row=directChildByClass(wrap,'topic-swipe-row');var toggle=row?row.querySelector('.note-topic-card__toggle'):null;
  var hasChildren=getChildTopics(id).length||getTopicNotes(id).length;var open=!!hasChildren&&!topic.collapsed;
  if(toggle){toggle.classList.toggle('open',open);toggle.classList.toggle('empty',!hasChildren);}
  var branch=directChildByClass(wrap,'note-tree-branch');
  if(open&&!branch)wrap.insertAdjacentHTML('beforeend',renderKnowledgeTreeBranch(topic));
  else if(!open&&branch)branch.remove();
  return true;
}
function syncKnowledgeTreeUnfiledNode() {
  if(currentMode!=='notes'||currentTopicId!=null||currentVirtualNoteFolder!=null||noteHomeView!=='tree')return false;
  var list=document.getElementById('noteList'),unfiled=getTopicNotes(null);if(!list)return false;
  var wrap=list.querySelector('[data-unfiled-tree-node="1"]');if(!wrap)return false;
  var toggle=wrap.querySelector('.note-topic-card__toggle');var open=unfiled.length&&!noteUnfiledCollapsed;
  if(toggle)toggle.classList.toggle('open',!!open);
  var count=wrap.querySelector('.note-node-count');if(count)count.textContent=String(unfiled.length);
  var branch=directChildByClass(wrap,'note-tree-branch');
  if(open&&!branch)wrap.insertAdjacentHTML('beforeend',renderUnfiledTreeBranch(unfiled));
  else if(!open&&branch)branch.remove();
  return true;
}
function renderKnowledgeTreeNote(note) {
  return '<div class="note-doc-card" data-note-id="' + note.id + '" onclick="openNoteFromSurface(' + note.id + ')">' +
    '<span style="width:20px;flex:0 0 20px"></span><span class="note-node-icon">📄</span><div class="note-node-main"><div class="note-node-title">' + escapeHtml(note.title || '无标题') + '</div><div class="note-node-meta"><span class="note-node-time">' + formatTime(note.updatedAt) + '</span></div></div></div>';
}
function renderTopicWorkspace(listEl, emptyEl, summaryEl, topic) {
  if (!topic) return;
  renderTopicSummary(summaryEl, topic);
  var childTopics = getChildTopics(topic.id);
  var childNotes = getTopicNotes(topic.id);
  if (!childTopics.length && !childNotes.length) {
    listEl.innerHTML=''; if (emptyEl) { emptyEl.style.display=''; emptyEl.innerHTML='📁<br>这个主题还是空的<br><small>点击 + 在这里创建内容</small>'; } return;
  }
  if (emptyEl) emptyEl.style.display='none';
  var html='';
  if (childTopics.length) {
    html += '<div class="note-surface-section-label">子主题</div>';
    childTopics.forEach(function(child){
      var count=getTopicDescendantCount(child.id);
      var childCard='<div class="note-topic-card" data-topic-open-id="' + child.id + '"><span class="note-node-icon">📁</span><div class="note-node-main"><div class="note-node-title">' + escapeHtml(child.title) + '</div><div class="note-node-meta">' + (count?'<span class="note-node-count">'+count+'</span>':'<span>空主题</span>') + '</div></div><span style="color:var(--text-tertiary)">›</span></div>';
      html += topicSwipeRowHtml(child.id,childCard);
    });
  }
  if (childNotes.length) {
    html += '<div class="note-surface-section-label">笔记</div>';
    childNotes.forEach(function(note){
      var card='<div class="note-doc-card" data-note-open-id="' + note.id + '"><span class="note-node-icon">📄</span><div class="note-node-main"><div class="note-node-title">' + escapeHtml(note.title || '无标题') + '</div><div class="note-node-meta"><span class="note-node-time">' + formatTime(note.updatedAt) + '</span></div></div></div>';
      html += noteSwipeRowHtml(note.id, card);
    });
  }
  listEl.innerHTML=html;
}
function renderUnfiledWorkspace(listEl, emptyEl, summaryEl) {
  if(summaryEl){summaryEl.style.display='none';summaryEl.innerHTML='';}
  var childNotes=getTopicNotes(null);
  if(!childNotes.length){listEl.innerHTML='';if(emptyEl){emptyEl.style.display='';emptyEl.innerHTML='📂<br>未分类还是空的<br><small>点击 + 新建一篇未分类笔记</small>';}return;}
  if(emptyEl)emptyEl.style.display='none';
  var html='<div class="note-surface-section-label">笔记</div>';
  childNotes.forEach(function(note){
    var card='<div class="note-doc-card" data-note-open-id="'+note.id+'"><span class="note-node-icon">📄</span><div class="note-node-main"><div class="note-node-title">'+escapeHtml(note.title||'无标题')+'</div><div class="note-node-meta"><span class="note-node-time">'+formatTime(note.updatedAt)+'</span></div></div></div>';
    html+=noteSwipeRowHtml(note.id,card);
  });
  listEl.innerHTML=html;
}
function renderTopicSummary(summaryEl, topic) {
  if (!summaryEl) return;
  summaryEl.style.display='';
  if (topicSummaryEditing) {
    summaryEl.innerHTML='<div class="note-workspace-summary__head"><span class="note-workspace-summary__label">主题概览</span></div>' +
      '<textarea id="topicSummaryInput" maxlength="1200" placeholder="用几句话说明这个主题，不需要写成长篇笔记…">' + escapeHtml(topic.summary || '') + '</textarea>' +
      '<div class="note-workspace-summary__actions"><button class="note-workspace-summary__cancel" onclick="cancelTopicSummaryEdit()">取消</button><button class="note-workspace-summary__save" onclick="saveTopicSummaryEdit()">保存概览</button></div>';
    return;
  }
  if (topic.summary) {
    summaryEl.innerHTML='<div class="note-workspace-summary__head"><span class="note-workspace-summary__label">主题概览</span><button class="note-workspace-summary__edit" onclick="startTopicSummaryEdit()">编辑</button></div><div class="note-workspace-summary__text">' + escapeHtml(topic.summary) + '</div>';
  } else {
    summaryEl.innerHTML='<button class="note-workspace-summary__empty" onclick="startTopicSummaryEdit()">＋ 添加主题概览</button>';
  }
}
function startTopicSummaryEdit(){ if (currentTopicId==null) return; topicSummaryEditing=true; renderNoteList(); setTimeout(function(){ var el=document.getElementById('topicSummaryInput'); if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);} },40); }
function cancelTopicSummaryEdit(){ topicSummaryEditing=false; renderNoteList(); }
function saveTopicSummaryEdit(){ var el=document.getElementById('topicSummaryInput'); if(currentTopicId==null||!el)return; updateTopic(currentTopicId,{summary:el.value.trim()}); topicSummaryEditing=false; renderNoteList(); showToast('主题概览已保存'); }
function toggleTopicCollapse(id) {
  var topic=getTopicById(id);if(!topic)return;
  updateTopic(id,{collapsed:!topic.collapsed},false);
  // V1.2.2: collapse/expand is a node-local tree operation. Do not tear down #noteList,
  // because rebuilding every GPU-backed swipe row is what exposed hidden rails for one frame on WebView.
  syncKnowledgeTreeTopicNode(id);
  syncFolderSidebarTopicNode(id);
}
function enterTopicWorkspace(id, options) {
  options=options||{}; var topic=getTopicById(id); if(!topic)return;
  if (options.push !== false) noteViewStack.push(captureNoteSurfaceContext());
  currentVirtualNoteFolder=null;currentTopicId=Number(id); topicSummaryEditing=false; renderNoteList();
  var container=document.getElementById('noteContainer'); if(container)container.scrollTop=0;
}
function enterUnfiledWorkspace(options) {
  options=options||{};
  if(options.push!==false)noteViewStack.push(captureNoteSurfaceContext());
  currentTopicId=null;currentVirtualNoteFolder='unfiled';topicSummaryEditing=false;renderNoteList();
  var container=document.getElementById('noteContainer');if(container)container.scrollTop=0;
}
function noteSurfaceBack() {
  if (currentTopicId == null && currentVirtualNoteFolder == null) return false;
  var prev=noteViewStack.length?noteViewStack.pop():{topicId:null,virtualFolder:null,homeView:noteHomeView,scrollTop:0};
  restoreNoteSurfaceContext(prev); return true;
}
function navigateNoteRoot() {
  currentTopicId=null; currentVirtualNoteFolder=null; topicSummaryEditing=false; noteViewStack=[]; renderNoteList();
  var container=document.getElementById('noteContainer'); if(container)container.scrollTop=0;
}
function navigateBreadcrumbTopic(topicId) {
  topicId=Number(topicId); if(!getTopicById(topicId))return;
  if (currentNoteId && isNoteEditorVisible()) { navigateFromEditorToTopic(topicId); return; }
  var idx=-1;
  for(var i=0;i<noteViewStack.length;i++) if(Number(noteViewStack[i].topicId)===topicId){idx=i;break;}
  if(idx>=0){ var ctx=noteViewStack[idx]; noteViewStack=noteViewStack.slice(0,idx); restoreNoteSurfaceContext(ctx); return; }
  var rootCtx=noteViewStack.length?noteViewStack[0]:{topicId:null,virtualFolder:null,homeView:noteHomeView,scrollTop:0};
  noteViewStack=[rootCtx]; currentVirtualNoteFolder=null; currentTopicId=topicId; topicSummaryEditing=false; renderNoteList();
}
function openTopicFromRecent(topicId){ noteViewStack=[captureNoteSurfaceContext()]; currentVirtualNoteFolder=null;currentTopicId=Number(topicId); topicSummaryEditing=false; renderNoteList(); var c=document.getElementById('noteContainer');if(c)c.scrollTop=0; }
function openNoteFromSurface(id) { noteOpenOrigin=captureNoteSurfaceContext(); openNoteEditor(id,{preserveKeyboard:false,forceRead:true}); }
function createNoteInCurrentTopic() {
  closeNoteCreateMenu(); var parentTopic=currentVirtualNoteFolder==='unfiled'?null:currentTopicId;var note=createNote('',parentTopic); noteOpenOrigin=captureNoteSurfaceContext(); renderNoteList(); openNoteEditor(note.id,{preserveKeyboard:false,forceRead:true,enterEdit:true,focusTitle:true});
}
function createTopicInCurrentTopic() {
  closeNoteCreateMenu();
  showPrompt('新建主题','输入主题名…',function(name){
    name=String(name||'').trim();if(!name)return;
    var parentTopic=currentVirtualNoteFolder==='unfiled'?null:currentTopicId;
    var topic=createTopic(name,parentTopic); renderNoteList(); enterTopicWorkspace(topic.id); showToast('已创建主题「'+name+'」');
  });
}
function deleteNoteFromList(id) {
  showConfirm('确定删除这篇笔记？',function(){ deleteNote(id); renderNoteList(); if(Number(currentNoteId)===Number(id)) closeNoteEditor(); });
}
function toggleUnfiledCollapse() {
  noteUnfiledCollapsed=!noteUnfiledCollapsed;
  syncKnowledgeTreeUnfiledNode();
  syncFolderSidebarUnfiledNode();
}
function topicSwipeRowHtml(topicId, cardHtml) {
  return '<div class="topic-swipe-row" data-topic-swipe-id="'+Number(topicId)+'" data-swipe-x="0">' +
    '<div class="topic-swipe-actions" aria-hidden="true">' +
      '<button class="note-swipe-action topic-swipe-action--rename" data-topic-swipe-action="rename" aria-label="重命名主题"><span class="note-swipe-action__icon">✎</span><span>重命名</span></button>' +
      '<button class="note-swipe-action topic-swipe-action--delete" data-topic-swipe-action="delete" aria-label="删除主题"><span class="note-swipe-action__icon">⌫</span><span>删除</span></button>' +
    '</div><div class="topic-swipe-inner">'+cardHtml+'</div></div>';
}
function renameTopicFromList(id) {
  var topic=getTopicById(id);if(!topic)return;
  showPrompt('重命名主题','输入新的主题名…',function(name){
    name=String(name||'').trim();if(!name||name===topic.title)return;
    updateTopic(id,{title:name});renderNoteList();renderFolderSidebar();showToast('主题已重命名');
  });
  setTimeout(function(){var input=document.getElementById('promptInput');if(input){input.value=topic.title;input.select();}},0);
}
function deleteTopicPromoteChildren(id) {
  var topic=getTopicById(id);if(!topic)return false;
  var parent=topic.parentTopicId==null?null:Number(topic.parentTopicId);
  noteTopics.forEach(function(t){if(Number(t.parentTopicId)===Number(id))t.parentTopicId=parent;});
  notes.forEach(function(n){if(Number(n.topicId)===Number(id))n.topicId=parent;});
  noteTopics=noteTopics.filter(function(t){return Number(t.id)!==Number(id);});
  saveNotes();return true;
}
function deleteTopicFromList(id) {
  var topic=getTopicById(id);if(!topic)return;
  var has=topicHasChildren(id);
  var msg=has?'删除主题“'+topic.title+'”？里面的子主题和笔记会保留，并提升到上一级。':'确定删除空主题“'+topic.title+'”？';
  showConfirm(msg,function(){
    if(deleteTopicPromoteChildren(id)){renderNoteList();renderFolderSidebar();showToast(has?'主题已删除，内容已提升':'主题已删除');}
  });
}
function noteSwipeRowHtml(noteId, cardHtml) {
  return '<div class="note-swipe-row" data-note-swipe-id="' + Number(noteId) + '" data-swipe-x="0">' +
    '<div class="note-swipe-actions" aria-hidden="true">' +
      '<button class="note-swipe-action note-swipe-action--move" data-note-swipe-action="move" aria-label="移到主题"><span class="note-swipe-action__icon">📁</span><span>移动</span></button>' +
      '<button class="note-swipe-action note-swipe-action--delete" data-note-swipe-action="delete" aria-label="删除笔记"><span class="note-swipe-action__icon">⌫</span><span>删除</span></button>' +
    '</div><div class="note-swipe-inner">' + cardHtml + '</div></div>';
}

/* Shared Physical Swipe Actions.
 * These constants intentionally match the existing Golden To-Do rail exactly:
 * 124px action width, 48px reveal threshold, 200ms ease-out settle. The helper
 * is generic so Daily/other surfaces can opt in later without cloning gesture math. */
const NOTE_SWIPE_ACTION_WIDTH = 124;
const NOTE_SWIPE_REVEAL_THRESHOLD = 48;
const NOTE_SWIPE_SETTLE_MS = 200;
let noteSwipeOpenRow = null;
let noteSwipeSuppressClickUntil = 0;
let noteSwipeMoveNoteId = null;
let noteSwipeGesture = { row:null, startX:0, startY:0, baseX:0, horizontal:false, moved:false };

function noteSwipeInner(row) { return row ? row.querySelector('.note-swipe-inner') : null; }
function noteSwipeRowX(row) { var n=Number(row && row.getAttribute('data-swipe-x')); return Number.isFinite(n)?n:0; }
function cancelNoteRailHide(row){if(row&&row._noteRailHideTimer){clearTimeout(row._noteRailHideTimer);row._noteRailHideTimer=null;}}
function setNoteRailActive(row,active){
  if(!row)return;cancelNoteRailHide(row);row.classList.toggle('rail-active',!!active);
  var actions=row.querySelector('.note-swipe-actions');if(actions)actions.setAttribute('aria-hidden',active?'false':'true');
}
function setNoteSwipeRowX(row, x, animate) {
  if (!row) return;
  var previous=noteSwipeRowX(row);
  x=Math.max(-NOTE_SWIPE_ACTION_WIDTH,Math.min(0,Number(x)||0));
  var inner=noteSwipeInner(row); if(!inner)return;
  cancelNoteRailHide(row);
  if(x<0)setNoteRailActive(row,true);
  inner.style.transition=animate?'transform '+NOTE_SWIPE_SETTLE_MS+'ms ease-out':'none';
  inner.style.transform=x?('translateX('+x+'px)'):'';
  row.setAttribute('data-swipe-x',String(x));
  if(x<=-NOTE_SWIPE_ACTION_WIDTH){ noteSwipeOpenRow=row; row.classList.add('open'); setNoteRailActive(row,true); }
  else if(x===0){
    if(noteSwipeOpenRow===row)noteSwipeOpenRow=null;
    row.classList.remove('open');
    if(animate&&previous<-1){
      row._noteRailHideTimer=setTimeout(function(){
        row._noteRailHideTimer=null;
        if(noteSwipeRowX(row)===0&&!row.classList.contains('open'))setNoteRailActive(row,false);
      },NOTE_SWIPE_SETTLE_MS+34);
    } else setNoteRailActive(row,false);
  }
}
function closeNoteSwipeRow(row, animate) { setNoteSwipeRowX(row,0,animate!==false); }
function closeOtherNoteSwipeRows(except) {
  document.querySelectorAll('#noteList .note-swipe-row').forEach(function(row){ if(row!==except && noteSwipeRowX(row)<-1)closeNoteSwipeRow(row,true); });
}
function resetNoteSwipeState() {
  document.querySelectorAll('#noteList .note-swipe-row').forEach(function(row){
    cancelNoteRailHide(row);
    row.classList.remove('open','rail-active');
    row.setAttribute('data-swipe-x','0');
    var inner=noteSwipeInner(row);if(inner){inner.style.transition='none';inner.style.transform='';}
    var actions=row.querySelector('.note-swipe-actions');if(actions)actions.setAttribute('aria-hidden','true');
  });
  noteSwipeOpenRow=null;
  noteSwipeGesture={row:null,startX:0,startY:0,baseX:0,horizontal:false,moved:false};
  noteSwipeSuppressClickUntil=0;
}
function settleNoteSwipeGesture() {
  var g=noteSwipeGesture,row=g.row;if(!row)return;
  var x=noteSwipeRowX(row);
  var reveal=x<-NOTE_SWIPE_REVEAL_THRESHOLD;
  setNoteSwipeRowX(row,reveal?-NOTE_SWIPE_ACTION_WIDTH:0,true);
  if(g.moved)noteSwipeSuppressClickUntil=Date.now()+360;
  noteSwipeGesture={row:null,startX:0,startY:0,baseX:0,horizontal:false,moved:false};
}
let topicSwipeOpenRow=null;
let topicSwipeSuppressClickUntil=0;
let topicSwipeGesture={row:null,startX:0,startY:0,baseX:0,horizontal:false,moved:false};
function topicSwipeInner(row){return row?row.querySelector('.topic-swipe-inner'):null;}
function topicSwipeRowX(row){var n=Number(row&&row.getAttribute('data-swipe-x'));return Number.isFinite(n)?n:0;}
function cancelTopicRailHide(row){if(row&&row._topicRailHideTimer){clearTimeout(row._topicRailHideTimer);row._topicRailHideTimer=null;}}
function setTopicRailActive(row,active){
  if(!row)return;cancelTopicRailHide(row);row.classList.toggle('rail-active',!!active);
  var actions=row.querySelector('.topic-swipe-actions');if(actions)actions.setAttribute('aria-hidden',active?'false':'true');
}
function setTopicSwipeRowX(row,x,animate){
  if(!row)return;var previous=topicSwipeRowX(row);x=Math.max(-NOTE_SWIPE_ACTION_WIDTH,Math.min(0,Number(x)||0));
  var inner=topicSwipeInner(row);if(!inner)return;cancelTopicRailHide(row);
  if(x<0)setTopicRailActive(row,true);
  inner.style.transition=animate?'transform '+NOTE_SWIPE_SETTLE_MS+'ms ease-out':'none';
  inner.style.transform=x?('translateX('+x+'px)'):'';row.setAttribute('data-swipe-x',String(x));
  if(x<=-NOTE_SWIPE_ACTION_WIDTH){topicSwipeOpenRow=row;row.classList.add('open');setTopicRailActive(row,true);}
  else if(x===0){
    if(topicSwipeOpenRow===row)topicSwipeOpenRow=null;row.classList.remove('open');
    if(animate&&previous<-1){row._topicRailHideTimer=setTimeout(function(){row._topicRailHideTimer=null;if(topicSwipeRowX(row)===0&&!row.classList.contains('open'))setTopicRailActive(row,false);},NOTE_SWIPE_SETTLE_MS+34);}
    else setTopicRailActive(row,false);
  }
}
function closeTopicSwipeRow(row,animate){setTopicSwipeRowX(row,0,animate!==false);}
function closeOtherTopicSwipeRows(except){document.querySelectorAll('#noteList .topic-swipe-row').forEach(function(row){if(row!==except&&topicSwipeRowX(row)<-1)closeTopicSwipeRow(row,true);});}
function resetTopicSwipeState(){
  document.querySelectorAll('#noteList .topic-swipe-row').forEach(function(row){
    cancelTopicRailHide(row);
    row.classList.remove('open','rail-active');
    row.setAttribute('data-swipe-x','0');
    var inner=topicSwipeInner(row);if(inner){inner.style.transition='none';inner.style.transform='';}
    var actions=row.querySelector('.topic-swipe-actions');if(actions)actions.setAttribute('aria-hidden','true');
  });
  topicSwipeOpenRow=null;
  topicSwipeGesture={row:null,startX:0,startY:0,baseX:0,horizontal:false,moved:false};
  topicSwipeSuppressClickUntil=0;
}
function settleTopicSwipeGesture(){var g=topicSwipeGesture,row=g.row;if(!row)return;var x=topicSwipeRowX(row);var reveal=x<-NOTE_SWIPE_REVEAL_THRESHOLD;setTopicSwipeRowX(row,reveal?-NOTE_SWIPE_ACTION_WIDTH:0,true);if(g.moved)topicSwipeSuppressClickUntil=Date.now()+360;topicSwipeGesture={row:null,startX:0,startY:0,baseX:0,horizontal:false,moved:false};}
function buildNoteSwipeTopicRows(parentId, depth, currentTopicId) {
  var html='';
  getChildTopics(parentId).forEach(function(topic){
    var current=Number(topic.id)===Number(currentTopicId);
    html+='<button class="note-swipe-topic-option'+(current?' current':'')+'" data-note-swipe-topic-id="'+topic.id+'" style="padding-left:'+(11+depth*15)+'px"><span>📁</span><span>'+escapeHtml(topic.title)+'</span>'+(current?'<span class="note-swipe-topic-option__meta">当前</span>':'')+'</button>';
    html+=buildNoteSwipeTopicRows(topic.id,depth+1,currentTopicId);
  });
  return html;
}
function openNoteSwipeTopicPicker(noteId) {
  var note=getNoteById(noteId),overlay=document.getElementById('noteSwipeTopicOverlay'),list=document.getElementById('noteSwipeTopicList'),label=document.getElementById('noteSwipeTopicNote');
  if(!note||!overlay||!list)return;
  noteSwipeMoveNoteId=Number(noteId);
  if(label)label.textContent='“'+(note.title||'无标题')+'”';
  var unfiledCurrent=note.topicId==null;
  list.innerHTML='<button class="note-swipe-topic-option'+(unfiledCurrent?' current':'')+'" data-note-swipe-topic-id=""><span>📄</span><span>未分类</span>'+(unfiledCurrent?'<span class="note-swipe-topic-option__meta">当前</span>':'')+'</button>'+buildNoteSwipeTopicRows(null,0,note.topicId);
  overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');
}
function closeNoteSwipeTopicPicker() {
  var overlay=document.getElementById('noteSwipeTopicOverlay');if(overlay){overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');}
  noteSwipeMoveNoteId=null;
}
function moveSwipeNoteToTopic(topicId) {
  var note=getNoteById(noteSwipeMoveNoteId);if(!note){closeNoteSwipeTopicPicker();return;}
  var normalized=topicId==null||topicId===''?null:Number(topicId);
  if((note.topicId==null&&normalized==null)||Number(note.topicId)===Number(normalized)){
    closeNoteSwipeTopicPicker();showToast('已经在这里');return;
  }
  var container=document.getElementById('noteContainer'),top=container?container.scrollTop:0;
  if(moveNoteToTopic(note.id,normalized)){
    closeNoteSwipeTopicPicker();renderNoteList();
    requestAnimationFrame(function(){if(container)container.scrollTop=top;});
    showToast(normalized==null?'已移到未分类':'已移动到主题');
  }
}
// Compatibility aliases from Schema V1 UI. A Note is now always a leaf; "child" creation becomes a sibling inside the current Topic.
function addChildNote(){ createNoteInCurrentTopic(); }

var suspendedNoteWorkspace = null;
function isNoteEditorVisible() {
  var editor = document.getElementById('noteEditor');
  return !!(editor && editor.style.display !== 'none');
}
function captureNoteWorkspaceState() {
  var bodyEl = document.getElementById('noteEditorBody');
  var titleInput = document.getElementById('noteEditorTitle');
  var searchInput = document.getElementById('noteEditorSearch');
  var state = {
    noteId: currentNoteId,
    bodyScrollTop: bodyEl ? bodyEl.scrollTop : 0,
    searchValue: searchInput ? searchInput.value : '',
    titleSelectionStart: titleInput && typeof titleInput.selectionStart === 'number' ? titleInput.selectionStart : null,
    titleSelectionEnd: titleInput && typeof titleInput.selectionEnd === 'number' ? titleInput.selectionEnd : null,
    bodyHadFocus: bodyEl && document.activeElement === bodyEl,
    editorMode: noteEditorMode
  };
  rememberNoteSelection();
  return state;
}
function suspendNoteEditorForModeSwitch() {
  if (!isNoteEditorVisible() || !currentNoteId) return false;
  saveCurrentNote();
  suspendedNoteWorkspace = captureNoteWorkspaceState();
  var editor = document.getElementById('noteEditor');
  var bodyEl = document.getElementById('noteEditorBody');
  var titleEl = document.getElementById('noteEditorTitle');
  if (bodyEl) bodyEl.blur();
  if (titleEl) titleEl.blur();
  if (editor) {
    editor.style.display = 'none';
    editor.style.transform = '';
    editor.style.transition = '';
    editor.style.opacity = '';
    editor.style.setProperty('--note-ime-space','0px');
    editor.style.setProperty('--note-viewport-offset','0px');
    editor.classList.remove('note-ime-visible');
  }
  noteImeSpacePx = 0;
  noteImeBaseHeight = 0;
  noteNativeImeKnown = false;
  noteNativeImeSpacePx = 0;
  noteVisualImeSpacePx = 0;
  clearTimeout(noteCaretRevealTimer);
  if (noteCaretRevealRaf) cancelAnimationFrame(noteCaretRevealRaf);
  noteCaretRevealRaf = 0;
  document.documentElement.classList.remove('note-editor-open');
  document.body.classList.remove('note-editor-open');
  return true;
}
function restoreSuspendedNoteEditorIfNeeded(animateIn) {
  if (currentMode !== 'notes' || !suspendedNoteWorkspace || !suspendedNoteWorkspace.noteId) return false;
  if (currentNoteId !== suspendedNoteWorkspace.noteId) return false;
  var editor = document.getElementById('noteEditor');
  var bodyEl = document.getElementById('noteEditorBody');
  var searchInput = document.getElementById('noteEditorSearch');
  if (!editor || !bodyEl) return false;
  editor.style.display = '';
  document.documentElement.classList.add('note-editor-open');
  document.body.classList.add('note-editor-open');
  if (searchInput) searchInput.value = suspendedNoteWorkspace.searchValue || '';
  var targetScroll = Number(suspendedNoteWorkspace.bodyScrollTop || 0);
  if (animateIn) {
    editor.style.opacity = '0';
    editor.style.transform = 'translate3d(24px,0,0)';
    editor.style.transition = 'none';
  }
  requestAnimationFrame(function(){
    bodyEl.scrollTop = targetScroll;
    if (animateIn) requestAnimationFrame(function(){
      editor.style.transition = 'transform 160ms cubic-bezier(.22,.82,.28,1), opacity 140ms ease-out';
      editor.style.opacity = '1';
      editor.style.transform = 'translate3d(0,0,0)';
      setTimeout(function(){ editor.style.transition=''; editor.style.transform=''; editor.style.opacity=''; }, 170);
    });
  });
  setNoteEditorMode(suspendedNoteWorkspace.editorMode === 'edit' ? 'edit' : 'read', {hideKeyboard:false});
  renderNoteEditorBreadcrumb();
  syncNoteImeLayout();
  return true;
}
function clearSuspendedNoteWorkspace() { suspendedNoteWorkspace = null; }

function setNoteEditorMode(mode, options) {
  options = options || {};
  var editor=document.getElementById('noteEditor');
  var bodyEl=document.getElementById('noteEditorBody');
  var titleEl=document.getElementById('noteEditorTitle');
  var history=document.getElementById('noteEditorHistoryActions');
  var undoBtn=document.getElementById('noteHeaderUndo');
  var redoBtn=document.getElementById('noteHeaderRedo');
  if(!editor||!bodyEl)return;
  noteEditorMode = mode === 'edit' ? 'edit' : 'read';
  var editing = noteEditorMode === 'edit';
  editor.classList.toggle('edit-mode',editing);
  editor.classList.toggle('read-mode',!editing);
  // V1.0.4: mode changes must not alter Golden editor flex geometry; only visibility/read-only UI changes.

  // Tree Beta V1.0.2: keep the Golden V1.22.12 contenteditable lifecycle intact.
  // Read Mode is a focus/UI state, not a DOM editability toggle. This prevents the
  // false->true transition from changing MagicOS WebView/IME timing before keyboard open.
  bodyEl.setAttribute('contenteditable','true');
  bodyEl.setAttribute('aria-readonly', editing ? 'false' : 'true');
  if(titleEl) titleEl.readOnly = !editing;
  if(history) history.style.display = editing ? 'flex' : 'none';
  if(undoBtn)undoBtn.disabled=!editing;
  if(redoBtn)redoBtn.disabled=!editing;
  if(!editing && options.hideKeyboard !== false){
    rememberNoteSelection();
    bodyEl.blur(); if(titleEl) titleEl.blur();
    try { if(typeof AndroidBridge!=='undefined'&&AndroidBridge.hideNoteKeyboard) AndroidBridge.hideNoteKeyboard(); } catch(e) {}
    noteImeSpacePx=0; noteNativeImeKnown=false; noteNativeImeSpacePx=0; noteVisualImeSpacePx=0;
    editor.style.setProperty('--note-ime-space','0px'); editor.style.setProperty('--note-viewport-offset','0px'); editor.classList.remove('note-ime-visible');
  }
}
function placeNoteCaretAtPoint(x,y) {
  var bodyEl=document.getElementById('noteEditorBody'); if(!bodyEl)return false;
  var range=null;
  try {
    if(document.caretPositionFromPoint){
      var pos=document.caretPositionFromPoint(x,y);
      if(pos&&bodyEl.contains(pos.offsetNode)){ range=document.createRange(); range.setStart(pos.offsetNode,pos.offset); range.collapse(true); }
    } else if(document.caretRangeFromPoint){
      var r=document.caretRangeFromPoint(x,y); if(r&&bodyEl.contains(r.commonAncestorContainer)) range=r;
    }
  } catch(e) {}
  if(!range){ range=document.createRange(); range.selectNodeContents(bodyEl); range.collapse(false); }
  var sel=window.getSelection(); if(!sel)return false;
  sel.removeAllRanges(); sel.addRange(range); noteLastSelectionRange=range.cloneRange(); return true;
}
function enterNoteEditMode(options) {
  options=options||{}; var bodyEl=document.getElementById('noteEditorBody'); var titleEl=document.getElementById('noteEditorTitle');
  if(!bodyEl)return;
  setNoteEditorMode('edit',{hideKeyboard:false});
  requestAnimationFrame(function(){
    if(options.focusTitle&&titleEl){
      titleEl.focus(); if(options.selectTitle) titleEl.select(); else { var len=titleEl.value.length; try{titleEl.setSelectionRange(len,len);}catch(e){} }
      return;
    }
    try{bodyEl.focus({preventScroll:true});}catch(e){bodyEl.focus();}
    if(Number.isFinite(options.x)&&Number.isFinite(options.y)) placeNoteCaretAtPoint(options.x,options.y);
    else if(noteLastSelectionRange){ try{var sel=window.getSelection();sel.removeAllRanges();sel.addRange(noteLastSelectionRange);}catch(e){} }
    else placeNoteCaretAtPoint(window.innerWidth/2, Math.min(window.innerHeight*.55, bodyEl.getBoundingClientRect().bottom-10));
    syncCollapsedNoteTypingFormat(); updateToolbarState(); syncNoteImeLayout(); scheduleNoteCaretReveal('enter-edit', true);
  });
}
function exitNoteEditModeToRead() {
  if(!currentNoteId)return;
  saveCurrentNote(); setNoteEditorMode('read'); renderNoteEditorBreadcrumb(); showToast('已保存');
}
function renderNoteEditorBreadcrumb() {
  var el=document.getElementById('noteEditorBreadcrumb'); var note=getNoteById(currentNoteId); if(!el||!note)return;
  var path=getTopicPath(note.topicId);
  if(!path.length){ el.innerHTML='<button class="note-breadcrumb__segment" onclick="navigateNoteRootFromEditor()">Note</button><span class="note-breadcrumb__sep">›</span><span style="color:var(--text-tertiary)">未分类</span>'; }
  else el.innerHTML=noteBreadcrumbHtml(path);
}
function openNoteEditor(id, options) {
  options=options||{}; var note=getNoteById(id); if(!note)return;
  if(!noteOpenOrigin) noteOpenOrigin=captureNoteSurfaceContext();
  if(currentNoteId!==id) clearSuspendedNoteWorkspace();
  currentNoteId=Number(id);
  var editor=document.getElementById('noteEditor'); var titleInput=document.getElementById('noteEditorTitle'); var bodyEl=document.getElementById('noteEditorBody'); var searchInput=document.getElementById('noteEditorSearch');
  if(editor){ editor.style.display=''; editor.style.bottom='0px'; editor.style.setProperty('--note-ime-space','0px'); editor.style.setProperty('--note-viewport-offset','0px'); editor.classList.remove('note-ime-visible'); }
  noteImeSpacePx=0; noteImeBaseHeight=Math.max(window.innerHeight||0,document.documentElement.clientHeight||0);
  document.documentElement.classList.add('note-editor-open'); document.body.classList.add('note-editor-open');
  if(titleInput)titleInput.value=note.title;
  if(bodyEl){ bodyEl.innerHTML=note.content; cleanupNoteFileAnnotations(bodyEl); noteLinkifyExistingUrls(bodyEl); bodyEl.scrollTop=0; }
  _boldActive=false; _strikeActive=false; _highlightActive=false; noteLastSelectionRange=null;
  if(searchInput)searchInput.value='';
  renderNoteEditorBreadcrumb();
  setNoteEditorMode('read',{hideKeyboard:false});
  setTimeout(function(){
    if(options.enterEdit) enterNoteEditMode({focusTitle:!!options.focusTitle,selectTitle:!!options.selectTitle});
    else { if(bodyEl)bodyEl.blur(); if(titleInput)titleInput.blur(); syncNoteImeLayout(); }
  }, options.enterEdit ? 60 : 0);
}
function hideNoteEditorShell() {
  var editor=document.getElementById('noteEditor');
  if(editor){ editor.style.display='none'; editor.style.bottom='0px'; editor.style.setProperty('--note-ime-space','0px'); editor.style.setProperty('--note-viewport-offset','0px'); editor.classList.remove('note-ime-visible','read-mode','edit-mode'); }
  noteImeSpacePx=0; noteImeBaseHeight=0; noteNativeImeKnown=false; noteNativeImeSpacePx=0; noteVisualImeSpacePx=0;
  clearTimeout(noteCaretRevealTimer); if(noteCaretRevealRaf)cancelAnimationFrame(noteCaretRevealRaf); noteCaretRevealRaf=0;
  document.documentElement.classList.remove('note-editor-open'); document.body.classList.remove('note-editor-open');
}
function closeNoteEditor(options) {
  options=options||{}; saveCurrentNote(); hideNoteEditorShell(); currentNoteId=null; noteEditorMode='read'; clearSuspendedNoteWorkspace();
  var origin=noteOpenOrigin; noteOpenOrigin=null;
  if(options.restoreOrigin!==false && origin) restoreNoteSurfaceContext(origin); else renderNoteList();
}
function navigateFromEditorToTopic(topicId) {
  saveCurrentNote(); closeNoteEditor({restoreOrigin:false});
  // Keep the existing workspace stack, then let the same breadcrumb algorithm trim
  // every deeper level. Back can never jump from an ancestor into a deeper topic.
  navigateBreadcrumbTopic(Number(topicId));
  var c=document.getElementById('noteContainer');if(c)c.scrollTop=0;
}
function navigateNoteRootFromEditor() {
  saveCurrentNote(); closeNoteEditor({restoreOrigin:false}); navigateNoteRoot();
}
function moreDeleteNote() {
  if(!currentNoteId)return; var id=currentNoteId; var menu=document.getElementById('noteEditorMoreMenu');if(menu)menu.style.display='none';
  showConfirm('确定删除这篇笔记？',function(){ deleteNote(id); closeNoteEditor(); showToast('笔记已删除'); });
}
function moreAddChild() {
  var note=getNoteById(currentNoteId); if(!note)return; var created=createNote('',note.topicId); saveCurrentNote(); noteOpenOrigin=noteOpenOrigin||captureNoteSurfaceContext(); openNoteEditor(created.id,{enterEdit:true,focusTitle:true});
}
function buildTopicPickerHtml(parentId,depth) {
  var html=''; getChildTopics(parentId).forEach(function(topic){
    html += '<button onclick="moveCurrentNoteToTopic(' + topic.id + ')" style="padding-left:' + (14+depth*14) + 'px">📁 ' + escapeHtml(topic.title) + '</button>';
    html += buildTopicPickerHtml(topic.id,depth+1);
  }); return html;
}
function showTopicPicker() {
  var menu=document.getElementById('noteEditorMoreMenu'); if(!menu||!currentNoteId)return;
  menu.innerHTML='<button onclick="moveCurrentNoteToTopic(null)" style="color:var(--text-secondary)">📄 未分类</button>'+buildTopicPickerHtml(null,0);
  menu.style.display=''; _moreMenuSkipClose=true;
}
function moveCurrentNoteToTopic(topicId) {
  if(!currentNoteId)return; if(moveNoteToTopic(currentNoteId,topicId)){ renderNoteEditorBreadcrumb(); var menu=document.getElementById('noteEditorMoreMenu');if(menu)menu.style.display='none'; showToast(topicId==null?'已移到未分类':'已移动到主题'); }
}

// Escape a string for use in onclick attribute (only handles quotes)
function escAttr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Schema V1 folder-picker helpers removed in Tree Beta V1.0. Topic picker is the only organizer UI.

function formatTime(ts) {
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return m + '/' + day;
}

// ===== Search History =====
function loadSearchHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    searchHistory = stored ? JSON.parse(stored) : [];
  } catch (e) {
    searchHistory = [];
  }
}

function saveSearchHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
}

function addSearchHistory(term) {
  if (!term || !term.trim()) return;
  const t = term.trim();
  searchHistory = searchHistory.filter(h => h !== t);
  searchHistory.unshift(t);
  if (searchHistory.length > MAX_HISTORY) {
    searchHistory = searchHistory.slice(0, MAX_HISTORY);
  }
  saveSearchHistory();
  renderSearchHistory();
}

function removeSearchHistory(term) {
  searchHistory = searchHistory.filter(h => h !== term);
  saveSearchHistory();
  renderSearchHistory();
}

function renderSearchHistory() {
  if (searchHistory.length === 0) {
    searchHistoryList.innerHTML = '<div class="search-history__empty">暂无搜索记录</div>';
    return;
  }
  searchHistoryList.innerHTML = searchHistory.map(term => `
    <div class="search-history__item" data-term="${escapeHtml(term)}">
      <span class="search-history__text">${escapeHtml(term)}</span>
      <button class="search-history__remove" data-term="${escapeHtml(term)}">✕</button>
    </div>
  `).join('');
}

function toggleSearchHistory() {
  if (searchHistoryEl.classList.contains('active')) {
    searchHistoryEl.classList.remove('active');
  } else {
    renderSearchHistory();
    searchHistoryEl.classList.add('active');
  }
}

// ===== Recycle Bin =====
function loadRecycleBin() {
  try {
    const stored = localStorage.getItem(RECYCLE_KEY);
    recycleBin = stored ? JSON.parse(stored) : [];
  } catch (e) {
    recycleBin = [];
  }
  updateRecycleBadge();
}

function saveRecycleBin() {
  localStorage.setItem(RECYCLE_KEY, JSON.stringify(recycleBin));
  updateRecycleBadge();
}

function updateRecycleBadge() {
  let badge = fabRecycleBtn.querySelector('.badge');
  if (recycleBin.length > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      fabRecycleBtn.appendChild(badge);
    }
    badge.textContent = recycleBin.length;
  } else if (badge) {
    badge.remove();
  }
}

function addToRecycleBin(todo) {
  recycleBin.unshift({ ...todo, deletedAt: Date.now() });
  if (recycleBin.length > MAX_RECYCLE) {
    recycleBin = recycleBin.slice(0, MAX_RECYCLE);
  }
  saveRecycleBin();
}

function restoreFromRecycle(id) {
  const idx = recycleBin.findIndex(t => t.id === id);
  if (idx !== -1) {
    const [restored] = recycleBin.splice(idx, 1);
    delete restored.deletedAt;
    todos.push(restored);
    saveRecycleBin();
    saveTodos();
    renderRecycleList();
    render();
    showToast('已恢复');
  }
}

function permanentlyDelete(id) {
  recycleBin = recycleBin.filter(t => t.id !== id);
  saveRecycleBin();
  renderRecycleList();
  showToast('已永久删除');
}

function clearRecycleBin() {
  recycleBin = [];
  saveRecycleBin();
  renderRecycleList();
  showToast('回收站已清空');
}

function renderRecycleList() {
  if (recycleBin.length === 0) {
    recycleList.innerHTML = '<div class="recycle-modal__empty">回收站为空</div>';
    return;
  }
  
  recycleList.innerHTML = recycleBin.map(item => `
    <div class="recycle-modal__item" data-id="${item.id}">
      <div class="recycle-modal__item-text">${escapeHtml(item.text)}</div>
      <div class="recycle-modal__item-time">${formatTime(item.deletedAt)}</div>
      <button class="recycle-modal__restore">恢复</button>
      <button class="recycle-modal__delete">删除</button>
    </div>
  `).join('');
}

function openRecycleModal() {
  renderRecycleList();
  recycleModal.classList.add('active');
}

function closeRecycleModal() {
  recycleModal.classList.remove('active');
}

function updateCounts() {
  let filtered = [...todos];
  
  if (selectedCategory !== '全部') {
    filtered = filtered.filter(t => t.category === selectedCategory);
  }
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => {
      return t.text.toLowerCase().includes(q) ||
             formatDate(t.createdAt).toLowerCase().includes(q) ||
             (t.category && t.category.toLowerCase().includes(q));
    });
  }
  
  const total = filtered.length;
  const completed = filtered.filter(t => t.status === 'completed').length;
  const inProgress = filtered.filter(t => t.status === 'in-progress').length;
  const pending = filtered.filter(t => t.status === 'todo').length;
  completedCountEl.textContent = completed;
  totalCountEl.textContent = total;
  document.getElementById('tab-all-count').textContent = total;
  document.getElementById('tab-pending-count').textContent = pending;
  document.getElementById('tab-in-progress-count').textContent = inProgress;
  document.getElementById('tab-completed-count').textContent = completed;
}

// ===== Formatting =====
function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const dayStart = new Date(d); dayStart.setHours(0,0,0,0);

  if (dayStart.getTime() === today.getTime()) return '今天';
  if (dayStart.getTime() === yesterday.getTime()) return '昨天';

  const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
  return `${d.getMonth()+1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
}

function getDateKey(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth()).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ===== Filter & Sort =====
function filterTodos() {
  let filtered = [...todos];

  if (currentTab === 'pending') {
    filtered = filtered.filter(t => t.status === 'todo');
  } else if (currentTab === 'in-progress') {
    filtered = filtered.filter(t => t.status === 'in-progress');
  } else if (currentTab === 'completed') {
    filtered = filtered.filter(t => t.status === 'completed');
  }

  if (selectedCategory !== '全部') {
    filtered = filtered.filter(t => t.category === selectedCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => {
      return t.text.toLowerCase().includes(q) ||
             formatDate(t.createdAt).toLowerCase().includes(q) ||
             (t.category && t.category.toLowerCase().includes(q));
    });
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);
  return filtered;
}

// ===== Render =====
function render() {
  const filtered = filterTodos();
  const grouped = {};
  filtered.forEach(t => {
    const key = getDateKey(t.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  todoListEl.innerHTML = '';

  if (filtered.length === 0) {
    const msg = searchQuery ? '未找到匹配的待办事项' : '还没有待办事项';
    const hint = searchQuery ? '试试其他关键词' : '点击右下角 + 开始记录';
    todoListEl.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">${searchQuery ? '🔍' : '📝'}</div>
      <p class="empty-state__text">${msg}</p>
      <p class="empty-state__hint">${hint}</p>
    </div>`;
    return;
  }

  // Sort date keys numerically (not string compare — "2" > "11" alphabetically)
  const dateKeys = Object.keys(grouped).sort(function(a, b) {
    return grouped[b][0].createdAt - grouped[a][0].createdAt;
  });

  dateKeys.forEach(dateKey => {
    const items = grouped[dateKey];
    // Ensure newest-first within each date group
    items.sort((a, b) => b.createdAt - a.createdAt);
    const dateText = formatDate(items[0].createdAt);
    const isToday = dateText === '今天';

    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.setAttribute('data-date', dateKey);
    divider.innerHTML = `<div class="date-divider__line"></div>
      <span class="date-divider__text${isToday ? ' today' : ''}">${dateText}</span>
      <div class="date-divider__line"></div>`;
    todoListEl.appendChild(divider);

    items.forEach(todo => {
      const el = document.createElement('div');
      const statusClass = todo.status === 'completed' ? ' completed' : todo.status === 'in-progress' ? ' in-progress' : '';
      const checkboxClass = todo.status === 'completed' ? ' checked' : todo.status === 'in-progress' ? ' in-progress' : '';
      const dotClass = todo.status === 'completed' ? 'todo-item__status--completed' : todo.status === 'in-progress' ? 'todo-item__status--in-progress' : 'todo-item__status--todo';
      const catActive = todo.category === selectedCategory && selectedCategory !== '全部';
      el.className = `todo-item${statusClass}`;
      if (searchQuery && todo.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        el.classList.add('highlight');
      }
      el.setAttribute('data-id', todo.id);
      el.setAttribute('data-category', todo.category || '全部');
      const hasReminder = todo.reminderAt && Number(todo.reminderAt) > 0;
      const reminderLabel = hasReminder ? formatTodoReminderLabel(Number(todo.reminderAt)) : '';
      el.innerHTML = `
        <div class="todo-item__swipe-bg">
          <button class="todo-item__swipe-btn todo-item__remind-btn" data-remind="${todo.id}" aria-label="设置提醒"><span class="todo-item__swipe-icon">⏰</span><span>提醒</span></button>
          <button class="todo-item__swipe-btn todo-item__delete-btn" data-del="${todo.id}" aria-label="删除"><span class="todo-item__swipe-icon">⌫</span><span>删除</span></button>
        </div>
        <div class="todo-item__inner">
          <div class="checkbox${checkboxClass}"></div>
          <div class="todo-item__content">
            <div class="todo-item__text"><span class="todo-item__status ${dotClass}"></span>${escapeHtml(todo.text)}</div>
            <div class="todo-item__category has-menu${catActive ? ' active' : ''}" data-category="${escapeHtml(todo.category || '全部')}">${escapeHtml(todo.category || '全部')}</div>
          </div>
          ${hasReminder ? `<div class="todo-item__reminder-time" title="提醒时间">${reminderLabel}</div>` : ''}
        </div>`;
      todoListEl.appendChild(el);
    });
  });

  // Scroll to first highlight on search
  if (searchQuery) {
    const firstHL = todoListEl.querySelector('.highlight');
    if (firstHL) {
      firstHL.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function formatTodoReminderLabel(timestamp) {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function scrollToDate(dateKey) {
  const divider = document.querySelector(`.date-divider[data-date="${dateKey}"]`);
  if (divider) {
    const nextSibling = divider.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('todo-item')) {
      nextSibling.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      divider.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    showToast('当天没有待办');
  }
}

// ===== Category Bar =====
function renderCategoryBar() {
  categoryScroll.innerHTML = categories.map(cat => {
    const isActive = cat === selectedCategory;
    return `<div class="category-bar__item${isActive ? ' active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</div>`;
  }).join('');
}

function selectCategory(cat) {
  selectedCategory = cat;
  if (editingEl) commitEdit();
  renderCategoryBar();
  updateCounts();
  render();
}

// ===== Category Picker =====
let pickerTodoId = null;

let pickerAnchorEl = null;
function openCategoryPicker(catEl, todoId) {
  pickerTodoId = todoId;
  pickerAnchorEl = catEl;
  const rect = catEl.getBoundingClientRect();

  categoryPicker.innerHTML = `
    ${categories.map(cat => `<div class="category-picker__item${cat === (getTodoById(todoId)?.category || '全部') ? ' active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}${cat !== '全部' ? '<span class="category-picker__delete" data-category="' + escapeHtml(cat) + '">✕</span>' : ''}</div>`).join('')}
    <div class="category-picker__divider"></div>
    <div class="category-picker__add" id="pickerAdd">+ 添加新标签</div>
    <input type="text" class="category-picker__input" id="pickerInput" placeholder="输入新标签名称" style="display:none">
  `;
  
  categoryPicker.style.left = `${Math.min(rect.left, window.innerWidth - 160)}px`;
  categoryPicker.style.top = `${rect.top - 10}px`;
  categoryPicker.classList.add('active');
  
  todoListEl.addEventListener('scroll', onListScrollWhilePickerOpen);
}

function closeCategoryPicker() {
  categoryPicker.classList.remove('active');
  pickerTodoId = null;
  pickerAnchorEl = null;
  todoListEl.removeEventListener('scroll', onListScrollWhilePickerOpen);
}

function onListScrollWhilePickerOpen() {
  if (!pickerAnchorEl || !categoryPicker.classList.contains('active')) return;
  
  const rect = pickerAnchorEl.getBoundingClientRect();
  
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    closeCategoryPicker();
    return;
  }
  
  categoryPicker.style.top = `${rect.top - 10}px`;
}

function getTodoById(id) {
  return todos.find(t => t.id === id);
}

function addNewCategory(name) {
  const trimmed = name.trim();
  if (!trimmed || categories.includes(trimmed)) return;
  
  categories.push(trimmed);
  updateCategories();
  renderCategoryBar();
  
  if (pickerTodoId) {
    const todo = getTodoById(pickerTodoId);
    if (todo) {
      todo.category = trimmed;
      saveTodos();
      render();
      closeCategoryPicker();
      showToast(`已添加标签「${trimmed}」`);
    }
  }
}

function deleteCategory(name) {
  if (name === '全部') return;
  
  categories = categories.filter(c => c !== name);
  
  todos.forEach(t => {
    if (t.category === name) {
      t.category = '全部';
    }
  });
  
  if (selectedCategory === name) {
    selectedCategory = '全部';
  }
  
  saveTodos();
  render();
  renderCategoryBar();
  showToast(`已删除标签「${name}」`);
}

// ===== Inline Editing =====
function startEdit(textEl, todo, clickEvent) {
  if (editingEl === textEl) return;

  // Commit previous
  if (editingEl) commitEdit();

  editingEl = textEl;
  textEl.contentEditable = 'true';
  textEl.classList.add('editing');

  // For empty todos: strip status dot to avoid cursor misplacement
  if (!todo.text || !todo.text.trim()) {
    textEl.textContent = '';
    textEl.focus();
    return;
  }

  textEl.focus();

  if (clickEvent) {
    // Try placing cursor at click position
    const range = document.caretRangeFromPoint(clickEvent.clientX, clickEvent.clientY);
    if (range && textEl.contains(range.startContainer)) {
      // Clicked on text → cursor at click position
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Clicked on card but not on text → cursor at end (append mode)
      placeCursorAtEnd(textEl);
    }
  } else {
    // No click event → cursor at end
    placeCursorAtEnd(textEl);
  }
}

function placeCursorAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function commitEdit() {
  if (!editingEl) return;
  const textEl = editingEl;
  const newText = textEl.textContent.trim();
  textEl.contentEditable = 'false';
  textEl.classList.remove('editing');
  editingEl = null;
  window.getSelection().removeAllRanges();

  // Find todo and update
  const itemEl = textEl.closest('.todo-item');
  if (!itemEl) return;
  const id = parseInt(itemEl.getAttribute('data-id'));
  const todo = todos.find(t => t.id === id);
  if (todo && newText && newText !== todo.text) {
    const wasNew = !todo.text;  // FAB-created empty todo → needs full render
    todo.text = newText;
    saveTodos();
    if (wasNew) {
      render();  // Only full render for newly created todos
    } else {
      // Surgical text update: preserve status dot, no flash
      const dotEl = textEl.querySelector('.todo-item__status');
      textEl.innerHTML = (dotEl ? dotEl.outerHTML : '') + escapeHtml(newText);
    }
  } else if (!newText) {
    // Empty text → auto-delete
    deleteTodoById(id);
  }
}

// ===== Actions =====
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  // Cycle: todo → in-progress → completed → todo
  if (todo.status === 'todo') {
    todo.status = 'in-progress';
  } else if (todo.status === 'in-progress') {
    todo.status = 'completed';
  } else {
    todo.status = 'todo';
  }
  saveTodos();
  // DOM-only update: avoid full re-render flash
  const el = todoListEl.querySelector(`[data-id="${id}"]`);
  if (el) refreshTodoItemDOM(el, todo);
  updateStats();
}

// ===== DOM helpers: surgical updates (no full render) =====
function refreshTodoItemDOM(el, todo) {
  // Update item class
  el.className = 'todo-item';
  if (todo.status === 'completed') el.classList.add('completed');
  else if (todo.status === 'in-progress') el.classList.add('in-progress');
  if (searchQuery && todo.text.toLowerCase().includes(searchQuery.toLowerCase())) {
    el.classList.add('highlight');
  }
  // Update checkbox
  const cb = el.querySelector('.checkbox');
  if (cb) {
    cb.className = 'checkbox';
    if (todo.status === 'completed') cb.classList.add('checked');
    else if (todo.status === 'in-progress') cb.classList.add('in-progress');
  }
  // Update status dot
  const dot = el.querySelector('.todo-item__status');
  if (dot) {
    dot.className = 'todo-item__status';
    if (todo.status === 'completed') dot.classList.add('todo-item__status--completed');
    else if (todo.status === 'in-progress') dot.classList.add('todo-item__status--in-progress');
    else dot.classList.add('todo-item__status--todo');
  }
}

function updateStats() {
  completedCountEl.textContent = todos.filter(function(t) { return t.status === 'completed'; }).length;
  totalCountEl.textContent = todos.length;
}

function removeDateDividerIfEmpty(dateKey) {
  var divider = document.querySelector('.date-divider[data-date="' + dateKey + '"]');
  if (!divider) return;
  var next = divider.nextElementSibling;
  if (!next || !next.classList.contains('todo-item')) {
    divider.remove();
  }
}

function deleteTodoById(id, silent) {
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return;
  const deletedTodo = todos[idx];
  const el = todoListEl.querySelector(`[data-id="${id}"]`);
  const dateKey = getDateKey(todos[idx].createdAt);
  if (el) {
    el.classList.add('slide-out');
    el.addEventListener('animationend', () => {
      const currentIdx = todos.findIndex(t => t.id === id);
      if (currentIdx !== -1) todos.splice(currentIdx, 1);
      addToRecycleBin(deletedTodo);
      saveTodos();
      el.remove();  // Surgical remove from DOM — no full render
      removeDateDividerIfEmpty(dateKey);
      updateStats();
    }, { once: true });
  } else {
    todos.splice(idx, 1);
    addToRecycleBin(deletedTodo);
    saveTodos();
    updateStats();
  }
  if (!silent) showUndoToast(deletedTodo.id);
}

// ===== FAB: quick add =====
// ===== Time Picker =====
const BANNER_TIME_KEY = 'banner_reminder_time';
let bannerHour = 0, bannerMinute = 6;
let bannerConfigured = false;

function updateBannerTimeStatus() {
  const currentEl = document.getElementById('timePickerCurrent');
  const confirmEl = document.getElementById('timePickerConfirm');
  const timeBtn = document.getElementById('timePickerBtn');
  const timeText = `${String(bannerHour).padStart(2,'0')}:${String(bannerMinute).padStart(2,'0')}`;
  if (currentEl) {
    currentEl.textContent = bannerConfigured ? `当前：每天 ${timeText} · 自动重复` : '当前：未设置 · 每天重复';
    currentEl.classList.toggle('unset', !bannerConfigured);
  }
  if (confirmEl) confirmEl.textContent = bannerConfigured ? '更新每天提醒' : '开启每天重复';
  if (timeBtn) timeBtn.title = bannerConfigured ? `每天 ${timeText} 总结提醒` : '设置每天总结提醒';
}

function loadBannerTime() {
  try {
    const stored = localStorage.getItem(BANNER_TIME_KEY);
    bannerConfigured = !!stored;
    if (!stored) { bannerHour = 0; bannerMinute = 6; }
    if (stored) {
      const parts = stored.split(':');
      const parsedHour = parseInt(parts[0], 10);
      const parsedMinute = parseInt(parts[1], 10);
      bannerHour = Number.isFinite(parsedHour) ? Math.max(0, Math.min(23, parsedHour)) : 0;
      bannerMinute = Number.isFinite(parsedMinute) ? Math.max(0, Math.min(59, parsedMinute)) : 6;
    }
  } catch(e) { bannerConfigured = false; }
  updateBannerTimeStatus();
}
loadBannerTime();

function saveBannerTime() {
  localStorage.setItem(BANNER_TIME_KEY, `${bannerHour}:${String(bannerMinute).padStart(2,'0')}`);
  bannerConfigured = true;
  updateBannerTimeStatus();
  // Sync to Android. Native V1.7 scheduler persists this configuration and re-arms the next day after each fire.
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.syncBannerTime) {
    AndroidBridge.syncBannerTime(bannerHour, bannerMinute);
  }
}

function buildTimePicker() {
  const hourWheel = document.getElementById('hourWheel');
  const minuteWheel = document.getElementById('minuteWheel');
  const hourScroll = document.getElementById('hourScroll');
  const minuteScroll = document.getElementById('minuteScroll');
  
  const createWheelItems = (count, selected, type) => {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<div class="time-picker__option${i === selected ? ' selected' : ''}" data-value="${i}">${String(i).padStart(2, '0')}</div>`;
    }
    return html;
  };
  
  hourWheel.innerHTML = createWheelItems(24, bannerHour, 'hour');
  minuteWheel.innerHTML = createWheelItems(60, bannerMinute, 'minute');
  
  const setupLoopScroll = (scrollEl, wheelEl, count, selected, setter) => {
    const itemHeight = 40;
    const scrollHeight = 140;
    const loopCount = 3;
    const centerOffset = (scrollHeight - itemHeight) / 2;
    
    let wheelHtml = wheelEl.innerHTML;
    wheelEl.innerHTML = wheelHtml.repeat(loopCount);
    
    const totalHeight = count * itemHeight;
    const startOffset = totalHeight + selected * itemHeight - centerOffset;
    
    requestAnimationFrame(() => {
      scrollEl.scrollTop = startOffset;
    });
    
    scrollEl.onscroll = () => {
      const scrollPos = scrollEl.scrollTop;
      if (scrollPos >= totalHeight * 2 - centerOffset - itemHeight) {
        scrollEl.scrollTop = scrollPos - totalHeight;
      } else if (scrollPos <= totalHeight + centerOffset) {
        scrollEl.scrollTop = scrollPos + totalHeight;
      }
      
      const relPos = (scrollEl.scrollTop - totalHeight) + centerOffset;
      const selectedIdx = Math.round(relPos / itemHeight) % count;
      const normalizedIdx = selectedIdx < 0 ? selectedIdx + count : selectedIdx;
      
      setter(normalizedIdx);
      
      wheelEl.querySelectorAll('.time-picker__option').forEach((opt, idx) => {
        opt.classList.toggle('selected', idx % count === normalizedIdx);
      });
    };
  };
  
  setupLoopScroll(hourScroll, hourWheel, 24, bannerHour, (h) => { bannerHour = h; });
  setupLoopScroll(minuteScroll, minuteWheel, 60, bannerMinute, (m) => { bannerMinute = m; });
}

document.getElementById('timePickerBtn').addEventListener('click', () => {
  // Re-read the saved value so closing the picker without confirming never changes the configured daily time.
  loadBannerTime();
  buildTimePicker();
  document.getElementById('timePickerOverlay').classList.add('active');
  setTimeout(() => FeatureCoachManager.show('summaryReminder', '#timePickerOverlay .time-picker', {
    eyebrow:'每天一次',
    title:'这是“每日总结提醒”',
    text:'它不是某一条 To-Do，也不是 Daily 事项。只要设置一次，以后每天都会在这个时间提醒你回顾当天完成情况。',
    visual:'🕐 每天固定时间　→　显示当天整体进度 Banner　→　第二天继续重复'
  }), 180);
});

document.getElementById('timePickerClose').addEventListener('click', () => {
  document.getElementById('timePickerOverlay').classList.remove('active');
  FeatureCoachManager.close(false);
});

document.getElementById('timePickerOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('timePickerOverlay').classList.remove('active');
    FeatureCoachManager.close(false);
  }
});

document.getElementById('timePickerConfirm').addEventListener('click', () => {
  saveBannerTime();
  document.getElementById('timePickerOverlay').classList.remove('active');
  const now = new Date();
  const target = new Date(); target.setHours(bannerHour, bannerMinute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diffMin = Math.round((target - now) / 60000);
  const nextLabel = diffMin < 120 ? `下次约 ${diffMin} 分钟后` : `下次 ${String(target.getMonth()+1).padStart(2,'0')}/${String(target.getDate()).padStart(2,'0')} ${String(bannerHour).padStart(2,'0')}:${String(bannerMinute).padStart(2,'0')}`;
  showToast(`已开启每天 ${String(bannerHour).padStart(2,'0')}:${String(bannerMinute).padStart(2,'0')} · ${nextLabel}`);
});

document.getElementById('timePickerTest').addEventListener('click', () => {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.scheduleTestAlarm) {
    showToast('测试提醒仅在 Android APP 内可用');
    return;
  }
  try {
    const result = AndroidBridge.scheduleTestAlarm();
    if (String(result).startsWith('失败')) showToast(result);
    else {
      let battery = 'ok';
      try { if (AndroidBridge.checkBatteryOptimization) battery = AndroidBridge.checkBatteryOptimization(); } catch(e) {}
      showToast(battery === 'battery_optimizing' ? '10 秒测试已安排 · 当前仍受系统电池优化' : '10 秒测试已安排 · 可返回桌面等待');
    }
  } catch(e) {
    showToast('测试提醒安排失败');
  }
});


// ===== Daily recurring tasks =====
function dailyDateKey(date) {
  date = date || new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function dailyTimeLabel(task) {
  return `${String(task.hour).padStart(2,'0')}:${String(task.minute).padStart(2,'0')}`;
}
function isDailyCompleted(task, key) {
  return Array.isArray(task.completedDates) && task.completedDates.includes(key || dailyDateKey());
}
function loadDailyTasks() {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_KEY);
    dailyTasks = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(dailyTasks)) dailyTasks = [];
  } catch(e) { dailyTasks = []; }
  dailyTasks = dailyTasks.filter(t => t && Number(t.id) > 0).map(t => ({
    id: Number(t.id),
    text: String(t.text || '每日事项'),
    hour: Math.max(0, Math.min(23, Number.isFinite(Number(t.hour)) ? Number(t.hour) : 9)),
    minute: Math.max(0, Math.min(59, Number.isFinite(Number(t.minute)) ? Number(t.minute) : 0)),
    createdAt: Number(t.createdAt) > 0 ? Number(t.createdAt) : Date.now(),
    completedDates: Array.from(new Set(Array.isArray(t.completedDates) ? t.completedDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) : [])).sort()
  }));
}
function syncDailyTasksToAndroid() {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.syncDailyTasks) return;
  try {
    AndroidBridge.syncDailyTasks(JSON.stringify(dailyTasks.map(t => ({
      id:t.id, text:t.text, hour:t.hour, minute:t.minute, createdAt:t.createdAt,
      completedDates:t.completedDates || []
    }))));
  } catch(e) {}
}
function saveDailyTasks() {
  localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(dailyTasks));
  syncDailyTasksToAndroid();
  if (document.getElementById('dailyDrawerOverlay')?.classList.contains('active')) renderDailyDrawer();
  if (document.getElementById('dailyCalendarOverlay')?.classList.contains('active')) renderDailyCalendar();
  if (document.getElementById('dailyHistoryOverlay')?.classList.contains('active')) { renderDailyHistoryCalendar(); renderDailyHistorySheet(); }
}
function getDailyTask(id) { return dailyTasks.find(t => t.id === Number(id)); }
function toggleDailyToday(id) {
  const task = getDailyTask(id); if (!task) return;
  const today = dailyDateKey();
  task.completedDates = Array.isArray(task.completedDates) ? task.completedDates : [];
  const idx = task.completedDates.indexOf(today);
  if (idx >= 0) {
    task.completedDates.splice(idx,1);
    showToast('已恢复为今日未完成');
  } else {
    task.completedDates.push(today); task.completedDates.sort();
    showToast('今日已完成 ✓');
  }
  saveDailyTasks();
}
function renderDailyDrawer() {
  const list = document.getElementById('dailyList');
  const progress = document.getElementById('dailyProgress');
  if (!list) return;
  const today = dailyDateKey();
  const sorted = dailyTasks.slice().sort((a,b) => (a.hour*60+a.minute) - (b.hour*60+b.minute) || a.createdAt-b.createdAt);
  const done = sorted.filter(t => isDailyCompleted(t,today)).length;
  if (progress) progress.textContent = `今天 ${done}/${sorted.length}`;
  if (!sorted.length) {
    list.innerHTML = '<div class="daily-empty"><div class="daily-empty__icon">↻</div>还没有每日事项<br><small>每天固定时间提醒，第二天自动重新开始</small></div>';
    return;
  }
  list.innerHTML = sorted.map(task => {
    const completed = isDailyCompleted(task,today);
    return `<div class="daily-item${completed?' completed':''}" data-daily-id="${task.id}">
      <div class="daily-item__actions">
        <button class="daily-item__action daily-item__edit" data-daily-edit="${task.id}"><span>✎</span><span>编辑</span></button>
        <button class="daily-item__action daily-item__delete" data-daily-delete="${task.id}"><span>⌫</span><span>删除</span></button>
      </div>
      <div class="daily-item__inner">
        <div class="daily-check${completed?' checked':''}" data-daily-check="${task.id}" aria-label="切换今日完成状态"></div>
        <div class="daily-item__text">${escapeHtml(task.text)}</div>
        <div class="daily-item__time">${dailyTimeLabel(task)}</div>
        <button class="daily-item__calendar" data-daily-calendar="${task.id}" title="完成统计">🗓️</button>
      </div>
    </div>`;
  }).join('');
}
function openDailyDrawer(focusId) {
  if (currentMode !== 'todo') applyMode('todo');
  const overlay = document.getElementById('dailyDrawerOverlay');
  const drawer = document.getElementById('dailyDrawer');

  // Prepare the drawer fully off-screen for one rendered frame before revealing it.
  // This avoids the one-frame "content flash" that some WebView/MagicOS compositors show
  // when innerHTML updates and backdrop-filter + transform become visible in the same frame.
  overlay.classList.remove('active');
  overlay.classList.add('prepared');
  if (drawer) {
    drawer.style.removeProperty('transform');
    drawer.style.removeProperty('transition');
  }
  renderDailyDrawer();
  void overlay.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.remove('prepared');
    overlay.classList.add('active');
  }));

  setTimeout(() => FeatureCoachManager.show('dailyOpenGesturesV2', '#dailyDrawer', {
    eyebrow:'每天重新开始',
    title:'Daily 不等于普通待办',
    text:'喝水、吃药、运动这类每天都要做的事情放这里。今天勾选完成，到了第二天会自然重新变成未完成。桌面 Banner 支持四向手势：右滑 +5/+10 分钟稍后提醒，左滑关闭，上滑直接完成，下滑打开应用。',
    visual:'↑ 完成　← 关闭　Banner　→ +5 / +10 min　↓ 打开应用'
  }), 280);
  if (focusId) {
    setTimeout(() => {
      const el = document.querySelector(`.daily-item[data-daily-id="${Number(focusId)}"]`);
      if (el) {
        el.scrollIntoView({behavior:'smooth', block:'center'});
        el.classList.add('highlight-flash');
        setTimeout(() => el.classList.remove('highlight-flash'), 1500);
      }
    }, 300);
  }
}
function closeDailyDrawer() {
  const overlay = document.getElementById('dailyDrawerOverlay');
  const drawer = document.getElementById('dailyDrawer');
  if (drawer) { drawer.style.removeProperty('transform'); drawer.style.removeProperty('transition'); }
  overlay.classList.remove('active');
  overlay.classList.remove('prepared');
  if (document.getElementById('contextCoach')?.classList.contains('active')) FeatureCoachManager.close(false);
}
function openDailyEditor(id) {
  dailyEditingId = id ? Number(id) : null;
  const task = dailyEditingId ? getDailyTask(dailyEditingId) : null;
  const now = new Date();
  document.getElementById('dailyEditorTitle').textContent = task ? '编辑每日事项' : '新增每日事项';
  document.getElementById('dailyEditorName').value = task ? task.text : '';
  document.getElementById('dailyEditorHour').value = String(task ? task.hour : now.getHours()).padStart(2,'0');
  document.getElementById('dailyEditorMinute').value = String(task ? task.minute : now.getMinutes()).padStart(2,'0');
  document.getElementById('dailyEditorOverlay').classList.add('active');
  setTimeout(() => document.getElementById('dailyEditorName').focus(), 80);
}
function closeDailyEditor() { document.getElementById('dailyEditorOverlay').classList.remove('active'); dailyEditingId = null; }
function saveDailyEditor() {
  const text = document.getElementById('dailyEditorName').value.trim();
  const hour = parseInt(document.getElementById('dailyEditorHour').value,10);
  const minute = parseInt(document.getElementById('dailyEditorMinute').value,10);
  if (!text) return showToast('写一下每天要做的事情');
  if (!Number.isFinite(hour) || hour<0 || hour>23 || !Number.isFinite(minute) || minute<0 || minute>59) return showToast('提醒时间不正确');
  if (dailyEditingId) {
    const task = getDailyTask(dailyEditingId); if (!task) return closeDailyEditor();
    task.text = text; task.hour = hour; task.minute = minute;
  } else {
    const id = Date.now();
    dailyTasks.push({id, text, hour, minute, createdAt:Date.now(), completedDates:[]});
  }
  saveDailyTasks(); closeDailyEditor(); renderDailyDrawer();
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.requestReminderPermissions) { try { AndroidBridge.requestReminderPermissions(); } catch(e) {} }
  showToast(`已保存 · 每天 ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
}
function deleteDailyTask(id) {
  const task = getDailyTask(id); if (!task) return;
  showConfirm(`删除每日事项“${task.text}”？`, function() {
    dailyTasks = dailyTasks.filter(t => t.id !== Number(id));
    saveDailyTasks(); renderDailyDrawer(); showToast('已删除每日事项');
  });
}

function formatHistoryDate(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key||''));
  if (!m) return '';
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}
function getDailyEligibleTasksForDate(key) {
  return dailyTasks.filter(task => dailyDateKey(new Date(task.createdAt)) <= key);
}
function getDailyAggregateForDate(key) {
  const todayKey = dailyDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key||'')) || key > todayKey) return { eligible:0, done:0, ratio:0, level:'none' };
  const eligibleTasks = getDailyEligibleTasksForDate(key);
  const eligible = eligibleTasks.length;
  const done = eligibleTasks.filter(task => isDailyCompleted(task, key)).length;
  const ratio = eligible ? done / eligible : 0;
  let level = 'none';
  if (eligible) level = ratio >= 0.999 ? 'good' : ratio >= 0.45 ? 'mid' : 'bad';
  return { eligible, done, ratio, level };
}
function openDailyHistory() {
  const today = new Date();
  dailyHistoryCursor = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  dailyHistorySelectedKey = dailyDateKey(today);
  renderDailyHistoryCalendar();
  renderDailyHistorySheet();
  document.getElementById('dailyHistoryOverlay').classList.add('active');
  setTimeout(() => showContextCoach('dailyCalendar', '.daily-history-card', '读懂 Daily 的完成轨迹', '绿点代表完成度高，黄点代表部分完成，红点代表完成较少。点任意一天，底部会展开这一天每项 Daily 的具体情况。', '🟢 完成度高　🟡 部分完成　🔴 完成较少　·　点日期看明细'), 220);
}
function closeDailyHistory() {
  document.getElementById('dailyHistoryOverlay').classList.remove('active');
  document.getElementById('dailyHistorySheet').classList.remove('active');
  if (document.getElementById('contextCoach')?.classList.contains('active')) FeatureCoachManager.close(false);
}
function renderDailyHistoryCalendar() {
  const y = dailyHistoryCursor.getFullYear(), m = dailyHistoryCursor.getMonth();
  const first = new Date(y,m,1,12), last = new Date(y,m+1,0,12);
  const todayKey = dailyDateKey();
  document.getElementById('dailyHistoryMonth').textContent = `${y}年${m+1}月`;
  const weeks = ['日','一','二','三','四','五','六'];
  let html = weeks.map(w => `<div class="daily-history-week">${w}</div>`).join('');
  for (let i=0;i<first.getDay();i++) html += '<div class="daily-history-day empty"></div>';
  for (let d=1; d<=last.getDate(); d++) {
    const date = new Date(y,m,d,12);
    const key = dailyDateKey(date);
    const aggregate = getDailyAggregateForDate(key);
    let cls = '';
    if (key === todayKey) cls += ' today';
    if (key === dailyHistorySelectedKey) cls += ' selected';
    if (key > todayKey) cls += ' future';
    const dotClass = aggregate.eligible ? aggregate.level : 'none';
    const meta = key > todayKey ? '' : `<div class="daily-history-day__dot ${dotClass}"></div>`;
    html += `<button type="button" class="daily-history-day${cls}" data-daily-history-key="${key}"><div class="daily-history-day__num">${d}</div><div class="daily-history-day__meta">${meta}</div></button>`;
  }
  document.getElementById('dailyHistoryGrid').innerHTML = html;
}
function renderDailyHistorySheet() {
  const sheet = document.getElementById('dailyHistorySheet');
  if (!dailyHistorySelectedKey) { sheet.classList.remove('active'); return; }
  const info = getDailyAggregateForDate(dailyHistorySelectedKey);
  document.getElementById('dailyHistorySheetTitle').textContent = formatHistoryDate(dailyHistorySelectedKey);
  document.getElementById('dailyHistorySheetSummary').textContent = `${info.done} / ${info.eligible} 完成`;
  const badge = document.getElementById('dailyHistorySheetBadge');
  badge.className = `daily-history-sheet__badge ${info.level}`;
  badge.textContent = !info.eligible ? '无事项' : info.ratio >= 0.999 ? '全部完成' : info.ratio >= 0.45 ? '部分完成' : '完成较少';
  const listEl = document.getElementById('dailyHistorySheetList');
  const tasks = getDailyEligibleTasksForDate(dailyHistorySelectedKey).slice().sort((a,b)=>(a.hour*60+a.minute)-(b.hour*60+b.minute)||a.createdAt-b.createdAt);
  if (!tasks.length) {
    listEl.innerHTML = '<div class="daily-history-empty-sheet">这一天还没有任何每日事项。<br><small>等你从某天开始创建以后，就会在这里看到具体完成情况。</small></div>';
    sheet.classList.add('active');
    return;
  }
  listEl.innerHTML = tasks.map(task => {
    const completed = isDailyCompleted(task, dailyHistorySelectedKey);
    return `<div class="daily-history-row">
      <span class="daily-history-row__status ${completed?'good':'bad'}"></span>
      <div class="daily-history-row__main">
        <div class="daily-history-row__text">${escapeHtml(task.text)}</div>
        <div class="daily-history-row__sub">Daily · ${dailyTimeLabel(task)}</div>
      </div>
      <div class="daily-history-row__state ${completed?'good':'bad'}">${completed?'已完成':'未完成'}</div>
    </div>`;
  }).join('');
  sheet.classList.add('active');
}

function openDailyCalendar(id) {
  dailyCalendarTaskId = Number(id);
  dailyCalendarCursor = new Date();
  dailyCalendarCursor.setDate(1); dailyCalendarCursor.setHours(12,0,0,0);
  renderDailyCalendar();
  document.getElementById('dailyCalendarOverlay').classList.add('active');
  setTimeout(() => showContextCoach('daily_item_calendar', '.daily-calendar', '看一件事坚持了多久', '每个日期正下方的 ✓、×、● 分别代表完成、过去未完成和今天待完成。切换月份就能回看这件 Daily 的长期记录。'), 180);
}
function closeDailyCalendar() { document.getElementById('dailyCalendarOverlay').classList.remove('active'); dailyCalendarTaskId = null; if (document.getElementById('contextCoach')?.classList.contains('active')) FeatureCoachManager.close(false); }
function renderDailyCalendar() {
  const task = getDailyTask(dailyCalendarTaskId); if (!task) return;
  const y = dailyCalendarCursor.getFullYear(), m = dailyCalendarCursor.getMonth();
  const first = new Date(y,m,1,12), last = new Date(y,m+1,0,12);
  const todayKey = dailyDateKey();
  const createdKey = dailyDateKey(new Date(task.createdAt));
  document.getElementById('dailyCalendarTask').textContent = `${task.text} · Daily ${dailyTimeLabel(task)}`;
  document.getElementById('dailyCalendarMonth').textContent = `${y}年${m+1}月`;
  const grid = document.getElementById('dailyCalendarGrid');
  const weeks = ['日','一','二','三','四','五','六'];
  let html = weeks.map(w => `<div class="daily-cal-week">${w}</div>`).join('');
  for (let i=0;i<first.getDay();i++) html += '<div class="daily-cal-day"></div>';
  let eligible = 0, done = 0;
  for (let d=1; d<=last.getDate(); d++) {
    const date = new Date(y,m,d,12); const key = dailyDateKey(date);
    const completed = isDailyCompleted(task,key);
    let cls = '', mark = '', markCls = '';
    if (key < createdKey) cls = ' before-created';
    else if (key > todayKey) cls = ' future';
    else {
      eligible++;
      if (key === todayKey) cls += ' today';
      if (completed) { done++; mark='✓'; markCls=' done'; }
      else if (key === todayKey) { mark='●'; markCls=' today-dot'; }
      else { mark='×'; markCls=' miss'; }
    }
    html += `<div class="daily-cal-day${cls}"><div class="daily-cal-day__num">${d}</div><div class="daily-cal-day__mark${markCls}">${mark}</div></div>`;
  }
  grid.innerHTML = html;
  const pct = eligible ? Math.round(done/eligible*100) : 0;
  document.getElementById('dailyCalendarStats').textContent = `本月完成 ${done} / ${eligible} 天 · ${pct}%`;
}

// Drawer interactions
const dailyListEl = document.getElementById('dailyList');
document.getElementById('dailyBtn').addEventListener('click', () => openDailyDrawer());
document.getElementById('dailyDrawerClose').addEventListener('click', closeDailyDrawer);
document.getElementById('dailyDrawerOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDailyDrawer(); });
document.getElementById('dailyProgress').addEventListener('click', openDailyHistory);
document.getElementById('dailyHistoryClose').addEventListener('click', closeDailyHistory);
document.getElementById('dailyHistoryOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDailyHistory(); });
document.getElementById('dailyHistoryPrev').addEventListener('click', () => { dailyHistoryCursor.setMonth(dailyHistoryCursor.getMonth()-1); renderDailyHistoryCalendar(); });
document.getElementById('dailyHistoryNext').addEventListener('click', () => { dailyHistoryCursor.setMonth(dailyHistoryCursor.getMonth()+1); renderDailyHistoryCalendar(); });
document.getElementById('dailyHistorySheetClose').addEventListener('click', () => document.getElementById('dailyHistorySheet').classList.remove('active'));
document.getElementById('dailyHistoryGrid').addEventListener('click', e => { const cell=e.target.closest('[data-daily-history-key]'); if(!cell) return; dailyHistorySelectedKey=cell.dataset.dailyHistoryKey; renderDailyHistoryCalendar(); renderDailyHistorySheet(); });
document.getElementById('dailyAddBtn').addEventListener('click', () => openDailyEditor());
document.getElementById('dailyEditorClose').addEventListener('click', closeDailyEditor);
document.getElementById('dailyEditorOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDailyEditor(); });
document.getElementById('dailyEditorSave').addEventListener('click', saveDailyEditor);
document.getElementById('dailyCalendarClose').addEventListener('click', closeDailyCalendar);
document.getElementById('dailyCalendarOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDailyCalendar(); });
document.getElementById('dailyCalendarPrev').addEventListener('click', () => { dailyCalendarCursor.setMonth(dailyCalendarCursor.getMonth()-1); renderDailyCalendar(); });
document.getElementById('dailyCalendarNext').addEventListener('click', () => { dailyCalendarCursor.setMonth(dailyCalendarCursor.getMonth()+1); renderDailyCalendar(); });

dailyListEl.addEventListener('click', e => {
  const check = e.target.closest('[data-daily-check]');
  const cal = e.target.closest('[data-daily-calendar]');
  const edit = e.target.closest('[data-daily-edit]');
  const del = e.target.closest('[data-daily-delete]');
  if (check) { e.stopPropagation(); toggleDailyToday(Number(check.dataset.dailyCheck)); return; }
  if (cal) { e.stopPropagation(); openDailyCalendar(Number(cal.dataset.dailyCalendar)); return; }
  if (edit) { e.stopPropagation(); openDailyEditor(Number(edit.dataset.dailyEdit)); return; }
  if (del) { e.stopPropagation(); deleteDailyTask(Number(del.dataset.dailyDelete)); return; }
});

let dailySwipeItem = null, dailySwipeStartX = 0, dailySwipeStartY = 0, dailySwipeOpen = false;
const DAILY_SWIPE_WIDTH = 116;
dailyListEl.addEventListener('touchstart', e => {
  const item = e.target.closest('.daily-item');
  if (!item || e.target.closest('.daily-check') || e.target.closest('.daily-item__calendar') || e.target.closest('.daily-item__actions')) { dailySwipeItem=null; return; }
  dailySwipeItem=item; dailySwipeStartX=e.touches[0].clientX; dailySwipeStartY=e.touches[0].clientY; dailySwipeOpen=false;
  const inner=item.querySelector('.daily-item__inner'); if(inner) inner.style.transition='none';
},{passive:true});
dailyListEl.addEventListener('touchmove', e => {
  if(!dailySwipeItem) return;
  const dx=e.touches[0].clientX-dailySwipeStartX, dy=e.touches[0].clientY-dailySwipeStartY;
  if(Math.abs(dy)>Math.abs(dx)) return;
  e.preventDefault();
  const inner=dailySwipeItem.querySelector('.daily-item__inner'); if(!inner) return;
  const x=Math.max(-DAILY_SWIPE_WIDTH, Math.min(0, dx)); inner.style.transform=`translateX(${x}px)`; dailySwipeOpen=x<-44;
},{passive:false});
dailyListEl.addEventListener('touchend', () => {
  if(!dailySwipeItem) return; const inner=dailySwipeItem.querySelector('.daily-item__inner');
  if(inner){ inner.style.transition='transform 200ms ease-out'; inner.style.transform=dailySwipeOpen?`translateX(-${DAILY_SWIPE_WIDTH}px)`:''; }
  dailySwipeItem=null; dailySwipeOpen=false;
},{passive:true});

// Right swipe on empty/header area closes the floating Daily drawer, with the same half-drag/rebound feel.
(function(){
  const drawer=document.getElementById('dailyDrawer'); if(!drawer) return;
  let sx=0, sy=0, active=false, horizontal=false;
  drawer.addEventListener('touchstart', e => {
    if(e.target.closest('.daily-item') || e.target.closest('button') || e.target.closest('input')) return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; active=true; horizontal=false; drawer.style.transition='none';
  },{passive:true});
  drawer.addEventListener('touchmove', e => {
    if(!active) return; const dx=e.touches[0].clientX-sx, dy=e.touches[0].clientY-sy;
    if(!horizontal && (Math.abs(dx)>6||Math.abs(dy)>6)) horizontal=Math.abs(dx)>Math.abs(dy)*1.15;
    if(!horizontal) return; e.preventDefault();
    const x=Math.max(0,dx); drawer.style.transform=`translateX(${x}px)`;
  },{passive:false});
  drawer.addEventListener('touchend', e => {
    if(!active) return; active=false; const dx=e.changedTouches[0].clientX-sx; const width=drawer.getBoundingClientRect().width;
    drawer.style.transition='transform 220ms cubic-bezier(0.22,0.82,0.28,1)';
    if(horizontal && dx>width*.26){ drawer.style.transform='translateX(108%)'; setTimeout(closeDailyDrawer,220); }
    else { drawer.style.transform='translateX(0)'; setTimeout(()=>{drawer.style.removeProperty('transition');drawer.style.removeProperty('transform');},225); }
  },{passive:true});
})();

window.__pullNativeDailyTaskMutations = function() {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.getDailyTaskMutations) return;
  let mutations=[]; try { mutations=JSON.parse(AndroidBridge.getDailyTaskMutations() || '[]'); } catch(e){ return; }
  if(!Array.isArray(mutations) || !mutations.length) return;
  let changed=false;
  mutations.forEach(m => {
    if(m.type !== 'dailyCompleted') return;
    const task=getDailyTask(Number(m.id)); if(!task) return;
    const date=String(m.date||''); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    task.completedDates=Array.isArray(task.completedDates)?task.completedDates:[];
    if(!task.completedDates.includes(date)){ task.completedDates.push(date); task.completedDates.sort(); changed=true; }
  });
  try { if(AndroidBridge.ackDailyTaskMutations) AndroidBridge.ackDailyTaskMutations(); } catch(e){}
  if(changed){ localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(dailyTasks)); renderDailyDrawer(); if(document.getElementById('dailyCalendarOverlay').classList.contains('active')) renderDailyCalendar(); }
};
window.__focusDailyFromNative = function(id) { openDailyDrawer(Number(id)); };

// ===== Per-item reminders + native two-way sync =====
let reminderEditingTodoId = null;
function setReminderFields(date) {
  document.getElementById('reminderYear').value = date.getFullYear();
  document.getElementById('reminderMonth').value = date.getMonth() + 1;
  document.getElementById('reminderDay').value = date.getDate();
  document.getElementById('reminderHour').value = String(date.getHours()).padStart(2, '0');
  document.getElementById('reminderMinute').value = String(date.getMinutes()).padStart(2, '0');
}
function openTodoReminderPicker(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  reminderEditingTodoId = id;
  document.getElementById('reminderPickerTodo').textContent = todo.text || '未命名待办';
  const existing = Number(todo.reminderAt || 0);
  let base = existing > Date.now() ? new Date(existing) : new Date();
  base.setSeconds(0, 0);
  setReminderFields(base);
  document.getElementById('reminderCancelExisting').classList.toggle('visible', existing > 0);
  document.getElementById('reminderPickerOverlay').classList.add('active');
  setTimeout(() => showContextCoach('todoReminderGesturesV2', '#reminderPickerOverlay .reminder-picker', '这是单条待办提醒', '设置具体日期和时间后，到点会显示 Todo Banner。复选框仍可切换三态；手势则更快：右滑按距离选择 +5/+10 分钟，左滑等同 × 关闭，上滑直接判定已完成并同步到 App，下滑等同点击 Banner 打开应用。', '↑ 完成　← 关闭　Banner　→ +5 / +10 min　↓ 打开应用'), 180);
}
function closeTodoReminderPicker() {
  document.getElementById('reminderPickerOverlay').classList.remove('active');
  reminderEditingTodoId = null;
  FeatureCoachManager.close(false);
}
function readReminderDate() {
  const y = parseInt(document.getElementById('reminderYear').value, 10);
  const mo = parseInt(document.getElementById('reminderMonth').value, 10);
  const d = parseInt(document.getElementById('reminderDay').value, 10);
  const h = parseInt(document.getElementById('reminderHour').value, 10);
  const mi = parseInt(document.getElementById('reminderMinute').value, 10);
  if (![y,mo,d,h,mi].every(Number.isFinite) || y < 2024 || y > 2099 || mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d || date.getHours() !== h || date.getMinutes() !== mi) return null;
  return date;
}
function setReminderQuick(kind) {
  const current = readReminderDate() || new Date();
  const now = new Date();
  if (kind === 'today') current.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  else if (kind === 'tomorrow') { const t = new Date(now); t.setDate(t.getDate() + 1); current.setFullYear(t.getFullYear(), t.getMonth(), t.getDate()); }
  else if (kind === 'week') { const t = new Date(now); t.setDate(t.getDate() + 7); current.setFullYear(t.getFullYear(), t.getMonth(), t.getDate()); }
  setReminderFields(current);
}
document.getElementById('reminderPickerClose').addEventListener('click', closeTodoReminderPicker);
document.getElementById('reminderPickerOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeTodoReminderPicker(); });
document.querySelectorAll('[data-reminder-quick]').forEach(btn => btn.addEventListener('click', () => setReminderQuick(btn.dataset.reminderQuick)));
document.getElementById('reminderPickerConfirm').addEventListener('click', () => {
  const todo = todos.find(t => t.id === reminderEditingTodoId);
  const date = readReminderDate();
  if (!todo || !date) { showToast('日期或时间不正确'); return; }
  if (date.getTime() <= Date.now() + 5000) { showToast('提醒时间必须晚于现在'); return; }
  todo.reminderAt = date.getTime();
  saveTodos();
  let nativeScheduleResult = 'ok';
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.scheduleTodoReminder) {
    try {
      nativeScheduleResult = String(AndroidBridge.scheduleTodoReminder(String(todo.id), todo.text || '', todo.status || 'todo', String(todo.reminderAt)));
    } catch(e) { nativeScheduleResult = '失败'; }
  }
  render(); closeTodoReminderPicker();
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.requestReminderPermissions) { try { AndroidBridge.requestReminderPermissions(); } catch(e) {} }
  const label = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  showToast(nativeScheduleResult.startsWith('失败') || nativeScheduleResult === 'invalid' ? `提醒已保存 · 原生调度失败` : `提醒已设定 · ${label}`);
});
document.getElementById('reminderCancelExisting').addEventListener('click', () => {
  const todo = todos.find(t => t.id === reminderEditingTodoId);
  if (!todo) return;
  const cancelledId = todo.id;
  todo.reminderAt = null;
  saveTodos();
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.cancelTodoReminder) { try { AndroidBridge.cancelTodoReminder(String(cancelledId)); } catch(e) {} }
  render(); closeTodoReminderPicker(); showToast('已取消该条提醒');
});
window.__pullNativeTodoMutations = function() {
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.getTodoMutations) return;
  let mutations = [];
  try { mutations = JSON.parse(AndroidBridge.getTodoMutations() || '[]'); } catch(e) { return; }
  if (!Array.isArray(mutations) || mutations.length === 0) return;
  let changed = false;
  mutations.forEach(m => {
    const todo = todos.find(t => t.id === Number(m.id));
    if (!todo) return;
    if (m.type === 'status' && ['todo','in-progress','completed'].includes(m.status)) { todo.status = m.status; changed = true; }
    else if (m.type === 'clearReminder') { todo.reminderAt = null; changed = true; }
  });
  try { if (AndroidBridge.ackTodoMutations) AndroidBridge.ackTodoMutations(); } catch(e) {}
  if (changed) { saveTodos(); render(); updateStats(); }
};
window.__onNativeReminderPermissionState = function(state) {
  if (state === 'ok') { showToast('提醒权限已就绪'); return; }
  const missing = [];
  if (state.includes('overlay')) missing.push('悬浮窗');
  if (state.includes('exact_alarm')) missing.push('精确闹钟');
  if (state.includes('notification')) missing.push('通知');
  if (missing.length) showToast(`提醒已保存 · ${missing.join(' / ')}权限未开启`);
};
window.__focusTodoFromNative = function(id) {
  // Banner taps should focus immediately; the page-turn animation is reserved for user mode-switch gestures/buttons.
  if (typeof currentMode !== 'undefined' && currentMode !== 'todo') applyMode('todo');
  currentTab = 'all'; selectedCategory = '全部'; searchQuery = ''; searchInput.value = '';
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'all'));
  renderCategoryBar(); render();
  setTimeout(() => {
    const el = todoListEl.querySelector(`[data-id="${id}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlight-flash'); setTimeout(() => el.classList.remove('highlight-flash'), 1500); }
  }, 120);
};

function closeNoteCreateMenu() {
  var menu=document.getElementById('noteCreateMenu'); if(!menu)return;
  menu.classList.remove('active'); menu.setAttribute('aria-hidden','true');
}
function toggleNoteCreateMenu() {
  var menu=document.getElementById('noteCreateMenu'); if(!menu)return;
  var active=!menu.classList.contains('active'); menu.classList.toggle('active',active); menu.setAttribute('aria-hidden',active?'false':'true');
}
document.getElementById('noteCreateMenu')?.addEventListener('click',function(e){
  var btn=e.target.closest('[data-note-create]'); if(!btn)return;
  e.stopPropagation(); if(btn.getAttribute('data-note-create')==='topic')createTopicInCurrentTopic();else createNoteInCurrentTopic();
});
document.addEventListener('click',function(e){
  var menu=document.getElementById('noteCreateMenu'); if(!menu||!menu.classList.contains('active'))return;
  if(!menu.contains(e.target)&&e.target!==fabBtn)closeNoteCreateMenu();
});
var noteFabLongPressTimer=null, noteFabLongPressFired=false;
fabBtn.addEventListener('touchstart',function(){
  if(currentMode!=='notes')return; noteFabLongPressFired=false; clearTimeout(noteFabLongPressTimer);
  noteFabLongPressTimer=setTimeout(function(){noteFabLongPressFired=true;closeNoteCreateMenu();createTopicInCurrentTopic();},520);
},{passive:true});
fabBtn.addEventListener('touchend',function(){clearTimeout(noteFabLongPressTimer);},{passive:true});
fabBtn.addEventListener('touchcancel',function(){clearTimeout(noteFabLongPressTimer);},{passive:true});

fabBtn.addEventListener('click', () => {
  if (currentMode === 'notes') {
    if(noteFabLongPressFired){noteFabLongPressFired=false;return;}
    toggleNoteCreateMenu();
    return;
  }

  if (editingEl) commitEdit();

  const todo = {
    id: Date.now(),
    text: '',
    status: 'todo',
    createdAt: Date.now(),
    category: selectedCategory
  };
  todos.unshift(todo);
  saveTodos();
  render();

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    requestAnimationFrame(() => {
      const newEl = todoListEl.querySelector(`[data-id="${todo.id}"]`);
      if (newEl) {
        newEl.classList.add('slide-in');
        const textEl = newEl.querySelector('.todo-item__text');
        if (textEl) {
          textEl.textContent = '';
          startEdit(textEl, todo);
        }
      }
    });
  });
});

// ===== List event delegation =====
todoListEl.addEventListener('click', (e) => {
  // Category tag click
  const catTag = e.target.closest('.todo-item__category');
  if (catTag) {
    e.stopPropagation();
    const itemEl = catTag.closest('.todo-item');
    if (itemEl) {
      const id = parseInt(itemEl.getAttribute('data-id'));
      openCategoryPicker(catTag, id);
    }
    return;
  }

  // Checkbox
  const cb = e.target.closest('.checkbox');
  if (cb) {
    e.stopPropagation();
    const itemEl = cb.closest('.todo-item');
    if (itemEl) toggleTodo(parseInt(itemEl.getAttribute('data-id')));
    return;
  }

  // Close any open swipe first
  const allInners = document.querySelectorAll('.todo-item__inner');
  let closed = false;
  allInners.forEach(inner => {
    const tx = inner.style.transform.match(/-?\d+/);
    if (tx && parseInt(tx[0]) < -10) {
      inner.style.transition = 'transform 0.2s ease-out';
      inner.style.transform = '';
      closed = true;
    }
  });
  // If we just closed a swipe, don't trigger edit on this tap
  if (closed) return;

  // Item card → edit
  const itemEl = e.target.closest('.todo-item');
  if (itemEl && !e.target.closest('.todo-item__text.editing')) {
    const textEl = itemEl.querySelector('.todo-item__text');
    const id = parseInt(itemEl.getAttribute('data-id'));
    const todo = todos.find(t => t.id === id);
    if (textEl && todo) startEdit(textEl, todo, e);
  }
});

// Click elsewhere → commit edit
document.addEventListener('click', (e) => {
  if (editingEl && !e.target.closest('.todo-item')) {
    commitEdit();
  }
});

// Keyboard support for editing
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && editingEl) {
    e.preventDefault();
    commitEdit();
  }
  if (e.key === 'Escape' && editingEl) {
    editingEl.contentEditable = 'false';
    editingEl.classList.remove('editing');
    const oldText = editingEl.textContent;
    editingEl = null;
    window.getSelection().removeAllRanges();
    // Revert empty items
    const itemEl = document.activeElement?.closest?.('.todo-item');
    if (itemEl) {
      const id = parseInt(itemEl.getAttribute('data-id'));
      const todo = todos.find(t => t.id === id);
      if (todo && !oldText.trim()) {
        deleteTodoById(id);
      }
    }
    render();
  }
});

// ===== Swipe actions (Left Swipe: reminder + delete) =====
let swipeStartX = 0;
let swipeStartY = 0;
let swipeItemEl = null;
let swipeRevealed = false;
const SWIPE_ACTION_WIDTH = 124;
todoListEl.addEventListener('touchstart', (e) => {
  const itemEl = e.target.closest('.todo-item');
  if (!itemEl || e.target.closest('.checkbox') || e.target.closest('.todo-item__text.editing') || e.target.closest('.todo-item__swipe-bg')) { swipeItemEl = null; return; }
  swipeItemEl = itemEl; swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY; swipeRevealed = false;
  const inner = swipeItemEl.querySelector('.todo-item__inner'); if (inner) inner.style.transition = '';
}, { passive: true });
todoListEl.addEventListener('touchmove', (e) => {
  if (!swipeItemEl) return;
  const dx = e.touches[0].clientX - swipeStartX; const dy = e.touches[0].clientY - swipeStartY;
  if (Math.abs(dy) > Math.abs(dx)) return;
  e.preventDefault();
  if (dx < 0) {
    const translateX = Math.max(dx, -SWIPE_ACTION_WIDTH);
    const inner = swipeItemEl.querySelector('.todo-item__inner'); if (inner) inner.style.transform = `translateX(${translateX}px)`;
    swipeRevealed = translateX < -48;
  }
}, { passive: false });
todoListEl.addEventListener('touchend', () => {
  if (!swipeItemEl) return;
  const coachedItem = swipeItemEl;
  const didReveal = swipeRevealed;
  const inner = coachedItem.querySelector('.todo-item__inner');
  if (!inner) { swipeItemEl = null; swipeRevealed = false; return; }
  inner.style.transition = 'transform 0.2s ease-out';
  inner.style.transform = didReveal ? `translateX(-${SWIPE_ACTION_WIDTH}px)` : '';
  swipeItemEl = null; swipeRevealed = false;
  if (didReveal) {
    setTimeout(() => FeatureCoachManager.show('todoSwipe', coachedItem.querySelector('.todo-item__swipe-bg'), {
      eyebrow:'你发现了隐藏操作',
      title:'左滑可以快速管理待办',
      text:'绿色按钮设置具体日期与时间的桌面提醒；红色按钮删除这条待办。以后不需要先进入编辑页面。',
      visual:'⏰ 提醒：到点浮在桌面　　⌫ 删除：移除当前事项'
    }), 230);
  }
});
todoListEl.addEventListener('click', (e) => {
  const remindBtn = e.target.closest('.todo-item__remind-btn');
  const deleteBtn = e.target.closest('.todo-item__delete-btn');
  if (!remindBtn && !deleteBtn) return;
  e.stopPropagation();
  const actionBtn = remindBtn || deleteBtn; const itemEl = actionBtn.closest('.todo-item'); if (!itemEl) return;
  const id = parseInt(itemEl.getAttribute('data-id'), 10); const inner = itemEl.querySelector('.todo-item__inner');
  if (remindBtn) { if (inner) { inner.style.transition = 'transform 0.2s ease-out'; inner.style.transform = ''; } openTodoReminderPicker(id); return; }
  if (inner) { inner.style.transition = 'none'; inner.style.transform = ''; }
  itemEl.style.opacity = '0'; itemEl.style.transform = 'scale(0.9)'; itemEl.style.transition = 'all 0.2s ease-in';
  itemEl.addEventListener('transitionend', () => deleteTodoById(id), { once: true });
});

// ===== Note Shared Physical Swipe Actions (Recent + Topic Workspace only) =====
(function bindNotePhysicalSwipeActions(){
  var list=document.getElementById('noteList'); if(!list)return;
  list.addEventListener('touchstart',function(e){
    if(!e.touches.length)return;
    var row=e.target.closest('.note-swipe-row');
    if(!row||e.target.closest('.note-swipe-actions')||e.target.closest('.note-recent-card__path')){noteSwipeGesture.row=null;return;}
    closeOtherNoteSwipeRows(row);if(topicSwipeOpenRow)closeTopicSwipeRow(topicSwipeOpenRow,true);
    noteSwipeGesture={row:row,startX:e.touches[0].clientX,startY:e.touches[0].clientY,baseX:noteSwipeRowX(row),horizontal:false,moved:false};
    var inner=noteSwipeInner(row);if(inner)inner.style.transition='none';
  },{passive:true});
  list.addEventListener('touchmove',function(e){
    var g=noteSwipeGesture;if(!g.row||!e.touches.length)return;
    var dx=e.touches[0].clientX-g.startX,dy=e.touches[0].clientY-g.startY;
    if(!g.horizontal){
      if(Math.abs(dx)<6&&Math.abs(dy)<6)return;
      if(Math.abs(dy)>Math.abs(dx)){noteSwipeGesture.row=null;return;}
      if(g.baseX>=-1&&dx>0){noteSwipeGesture.row=null;return;} // closed card + right swipe belongs to Drawer
      g.horizontal=true;
    }
    e.preventDefault();
    var x=Math.max(-NOTE_SWIPE_ACTION_WIDTH,Math.min(0,g.baseX+dx));
    setNoteSwipeRowX(g.row,x,false);g.moved=g.moved||Math.abs(dx)>7;
  },{passive:false});
  list.addEventListener('touchend',settleNoteSwipeGesture,{passive:true});
  list.addEventListener('touchcancel',settleNoteSwipeGesture,{passive:true});
  list.addEventListener('click',function(e){
    var action=e.target.closest('[data-note-swipe-action]');
    if(action){
      e.preventDefault();e.stopPropagation();
      var row=action.closest('.note-swipe-row');if(!row)return;
      var id=Number(row.getAttribute('data-note-swipe-id'));
      closeNoteSwipeRow(row,true);
      if(action.getAttribute('data-note-swipe-action')==='move')openNoteSwipeTopicPicker(id);
      else deleteNoteFromList(id);
      return;
    }
    if(Date.now()<noteSwipeSuppressClickUntil){e.preventDefault();e.stopPropagation();return;}
    if(noteSwipeOpenRow){closeNoteSwipeRow(noteSwipeOpenRow,true);e.preventDefault();e.stopPropagation();return;}
    var card=e.target.closest('[data-note-open-id]');
    if(card){e.preventDefault();openNoteFromSurface(Number(card.getAttribute('data-note-open-id')));}
  });
  document.addEventListener('click',function(e){
    if(noteSwipeOpenRow&&!e.target.closest('.note-swipe-row'))closeNoteSwipeRow(noteSwipeOpenRow,true);
  });
})();

// Topic cards use the same physical rail. A closed card never captures right-swipe; that gesture belongs to the Drawer.
(function bindTopicPhysicalSwipeActions(){
  var list=document.getElementById('noteList');if(!list)return;
  list.addEventListener('touchstart',function(e){
    if(!e.touches.length)return;var row=e.target.closest('.topic-swipe-row');
    if(!row||e.target.closest('.topic-swipe-actions')||e.target.closest('.note-topic-card__toggle')){topicSwipeGesture.row=null;return;}
    closeOtherTopicSwipeRows(row);if(noteSwipeOpenRow)closeNoteSwipeRow(noteSwipeOpenRow,true);
    topicSwipeGesture={row:row,startX:e.touches[0].clientX,startY:e.touches[0].clientY,baseX:topicSwipeRowX(row),horizontal:false,moved:false};
    var inner=topicSwipeInner(row);if(inner)inner.style.transition='none';
  },{passive:true});
  list.addEventListener('touchmove',function(e){
    var g=topicSwipeGesture;if(!g.row||!e.touches.length)return;var dx=e.touches[0].clientX-g.startX,dy=e.touches[0].clientY-g.startY;
    if(!g.horizontal){if(Math.abs(dx)<6&&Math.abs(dy)<6)return;if(Math.abs(dy)>Math.abs(dx)){topicSwipeGesture.row=null;return;}if(g.baseX>=-1&&dx>0){topicSwipeGesture.row=null;return;}g.horizontal=true;setTopicRailActive(g.row,true);}
    e.preventDefault();var x=Math.max(-NOTE_SWIPE_ACTION_WIDTH,Math.min(0,g.baseX+dx));setTopicSwipeRowX(g.row,x,false);g.moved=g.moved||Math.abs(dx)>7;
  },{passive:false});
  list.addEventListener('touchend',settleTopicSwipeGesture,{passive:true});
  list.addEventListener('touchcancel',settleTopicSwipeGesture,{passive:true});
  list.addEventListener('click',function(e){
    var action=e.target.closest('[data-topic-swipe-action]');
    if(action){e.preventDefault();e.stopPropagation();var row=action.closest('.topic-swipe-row');if(!row)return;var id=Number(row.getAttribute('data-topic-swipe-id'));closeTopicSwipeRow(row,true);if(action.getAttribute('data-topic-swipe-action')==='rename')renameTopicFromList(id);else deleteTopicFromList(id);return;}
    if(Date.now()<topicSwipeSuppressClickUntil){e.preventDefault();e.stopPropagation();return;}
    if(topicSwipeOpenRow){closeTopicSwipeRow(topicSwipeOpenRow,true);e.preventDefault();e.stopPropagation();return;}
    var unfiled=e.target.closest('[data-unfiled-open]');if(unfiled){e.preventDefault();enterUnfiledWorkspace();return;}
    var card=e.target.closest('[data-topic-open-id]');if(card){e.preventDefault();enterTopicWorkspace(Number(card.getAttribute('data-topic-open-id')));}
  });
  document.addEventListener('click',function(e){if(topicSwipeOpenRow&&!e.target.closest('.topic-swipe-row'))closeTopicSwipeRow(topicSwipeOpenRow,true);});
})();

document.getElementById('noteSwipeTopicClose')?.addEventListener('click',closeNoteSwipeTopicPicker);
document.getElementById('noteSwipeTopicOverlay')?.addEventListener('click',function(e){if(e.target===this)closeNoteSwipeTopicPicker();});
document.getElementById('noteSwipeTopicList')?.addEventListener('click',function(e){
  var btn=e.target.closest('[data-note-swipe-topic-id]');if(!btn)return;
  var raw=btn.getAttribute('data-note-swipe-topic-id');moveSwipeNoteToTopic(raw===''?null:raw);
});

// ===== Search =====
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  if (searchQuery) {
    searchClear.classList.add('visible');
    searchIcon.style.display = 'none';
    renderSearchHistory();
    searchHistoryEl.classList.add('active');
  } else {
    searchClear.classList.remove('visible');
    searchIcon.style.display = '';
    searchHistoryEl.classList.remove('active');
  }
  if (editingEl) commitEdit();
  updateCounts();
  render();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    addSearchHistory(searchInput.value);
    searchHistoryEl.classList.remove('active');
  }
});

searchIcon.addEventListener('click', () => {
  toggleSearchHistory();
});

searchClear.addEventListener('click', () => {
  searchQuery = '';
  searchInput.value = '';
  searchClear.classList.remove('visible');
  searchIcon.style.display = '';
  searchHistoryEl.classList.remove('active');
  updateCounts();
  render();
  searchInput.focus();
});

searchHistoryList.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.search-history__remove');
  if (removeBtn) {
    e.stopPropagation();
    const term = removeBtn.dataset.term;
    removeSearchHistory(term);
    return;
  }
  const item = e.target.closest('.search-history__item');
  if (item) {
    const term = item.dataset.term;
    searchQuery = term;
    searchInput.value = term;
    searchClear.classList.add('visible');
    searchIcon.style.display = 'none';
    searchHistoryEl.classList.remove('active');
    if (editingEl) commitEdit();
    render();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap') && !e.target.closest('.search-history')) {
    searchHistoryEl.classList.remove('active');
  }
});

// ===== Tabs =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    if (editingEl) commitEdit();
    render();
  });
});

// ===== AI Chat =====
function openAiChat() {
  document.getElementById('aiChatModal').classList.add('active');
  setTimeout(() => showContextCoach('aiOpen', '#aiChatModal .ai-chat-modal__content', '可以直接说人话', '例如“明天下午三点提醒我交材料”或“把今天完成的清掉”。它适合用一句话快速创建、查询和整理待办。', '试试说：“明天上午 10 点提醒我开会”'), 180);
  // Don't auto-focus — keyboard only when user taps input
}

function closeAiChat() {
  document.getElementById('aiChatModal').classList.remove('active');
  FeatureCoachManager.close(false);
}

function addAiMessage(role, text) {
  const msgs = document.getElementById('aiChatMessages');
  // Remove placeholder if present
  const placeholder = msgs.querySelector('div:first-child');
  if (placeholder && placeholder.style && placeholder.style.textAlign === 'center') {
    // keep it
  }
  // Remove placeholder text on first message
  const hint = msgs.querySelector('div[style*="text-align:center"]');
  if (hint) hint.remove();

  const el = document.createElement('div');
  el.className = 'ai-chat__msg ai-chat__msg--' + (role === 'user' ? 'user' : 'ai');
  var copyBtn = role === 'ai' ? '<button class="ai-chat__copy-btn" onclick="copyAiMsg(this)" title="复制">📋</button>' : '';
  el.innerHTML = '<div class="ai-chat__bubble">' + copyBtn + escapeHtml(text) + '</div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

// Copy AI message text to clipboard
function copyAiMsg(btn) {
  var bubble = btn.closest('.ai-chat__bubble');
  if (!bubble) return;
  // Clone and remove the copy button to get clean text
  var clone = bubble.cloneNode(true);
  var copyBtnClone = clone.querySelector('.ai-chat__copy-btn');
  if (copyBtnClone) copyBtnClone.remove();
  var text = clone.textContent.trim();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { showToast('已复制'); });
  }
}

function showAiLoading() {
  const msgs = document.getElementById('aiChatMessages');
  const hint = msgs.querySelector('div[style*="text-align:center"]');
  if (hint) hint.remove();

  const el = document.createElement('div');
  el.className = 'ai-chat__loading';
  el.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideAiLoading() {
  const loader = document.querySelector('#aiChatMessages .ai-chat__loading');
  if (loader) loader.remove();
}

function sendAiInput() {
  const input = document.getElementById('aiChatInput');
  const text = input.value.trim();
  if (!text) return;

  addAiMessage('user', text);
  input.value = '';

  // Route: regex first, then AI
  handleAiCommand(text);
}

// Event listeners for AI chat
document.getElementById('fabAi').addEventListener('click', openAiChat);
document.getElementById('aiChatBackdrop').addEventListener('click', closeAiChat);
document.getElementById('aiChatClose').addEventListener('click', closeAiChat);

document.getElementById('aiChatSend').addEventListener('click', sendAiInput);
document.getElementById('aiChatInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendAiInput();
});

// Suggestion chips — direct actions, not text commands
document.getElementById('aiChatSuggestions').addEventListener('click', function(e) {
  var chip = e.target.closest('.ai-chat__chip');
  if (!chip) return;
  var action = chip.dataset.action;

  if (action === 'focus-input') {
    // Pre-fill "加一条 " so user can type the rest: e.g. "加一条 英语的60个词"
    var input = document.getElementById('aiChatInput');
    input.value = '加一条 ';
    input.focus();
    // Move cursor to end
    input.setSelectionRange(input.value.length, input.value.length);
  } else if (action === 'today') {
    // Scroll to today's date divider
    var today = new Date(); today.setHours(0,0,0,0);
    var todayKey = getDateKey(today.getTime());
    closeAiChat();
    scrollToDate(todayKey);
  } else if (action === 'clear-completed') {
    // Delete all completed todos
    var completed = todos.filter(function(t) { return t.status === 'completed'; });
    if (completed.length === 0) {
      addAiMessage('ai', '没有已完成的待办需要清理。');
      return;
    }
    var count = completed.length;
    var ids = {};
    for (var i = 0; i < completed.length; i++) {
      ids[completed[i].id] = true;
      addToRecycleBin(completed[i]);
    }
    todos = todos.filter(function(t) { return !ids[t.id]; });
    saveTodos();
    render();
    addAiMessage('ai', '已清理 ' + count + ' 条已完成的待办，移入回收站。');
    showToast('已清理 ' + count + ' 条已完成待办');
  } else if (action === 'stats') {
    showStatsInChat();
  } else if (action === 'bullet') {
    openBulletModal();
  }
});

// ===== Keyboard-aware: push AI panel up when keyboard opens =====
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function() {
    var diff = window.innerHeight - window.visualViewport.height;
    var content = document.querySelector('.ai-chat-modal__content');
    if (content) {
      content.style.transform = diff > 100 ? 'translateY(-' + diff + 'px)' : '';
    }
  });
}

// ===== AI Config =====
var AI_PROVIDERS = {
  agnes: {
    id: 'agnes', label: 'Agnes',
    endpoint: 'https://apihub.agnes-ai.com/v1/chat/completions',
    model: 'agnes-2.0-flash',
    apiKey: ''
  },
  deepseek: {
    id: 'deepseek', label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    apiKey: '', needUserKey: true
  }
};

function getAiProvider() {
  return localStorage.getItem('todo_ai_provider') || 'agnes';
}

function setAiProvider(id) {
  localStorage.setItem('todo_ai_provider', id);
  document.getElementById('aiProviderBtn').textContent = AI_PROVIDERS[id].label;
}

function getDeepseekKey() {
  return localStorage.getItem('todo_ai_deepseek_key') || '';
}

function setDeepseekKey(k) {
  localStorage.setItem('todo_ai_deepseek_key', k);
}

function getAiConfig() {
  var id = getAiProvider();
  var p = AI_PROVIDERS[id];
  var key = id === 'deepseek' ? getDeepseekKey() : p.apiKey;
  return { provider: id, endpoint: p.endpoint, model: p.model, apiKey: key };
}

function switchAiProvider() {
  var cur = getAiProvider();
  var next = cur === 'agnes' ? 'deepseek' : 'agnes';
  if (next === 'deepseek' && !getDeepseekKey()) {
    var k = prompt('请输入 DeepSeek API Key（从 platform.deepseek.com 获取）：');
    if (!k || !k.trim()) return;
    setDeepseekKey(k.trim());
  }
  setAiProvider(next);
  showToast('已切换到 ' + AI_PROVIDERS[next].label);
}

// Init provider button label
document.getElementById('aiProviderBtn').textContent = AI_PROVIDERS[getAiProvider()].label;
document.getElementById('aiProviderBtn').addEventListener('click', switchAiProvider);

// ===== Reminder natural-language parser (Route A + LLM shared) =====
function aiReminderChineseNumber(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) return NaN;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  var digit = { '零':0, '〇':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
  if (Object.prototype.hasOwnProperty.call(digit, s)) return digit[s];
  if (s === '十') return 10;
  var m = s.match(/^([一二两三四五六七八九])?十([一二两三四五六七八九])?$/);
  if (m) return (m[1] ? digit[m[1]] : 1) * 10 + (m[2] ? digit[m[2]] : 0);
  return NaN;
}

function aiReminderFormatDateTime(ts) {
  var d = new Date(Number(ts));
  if (!Number.isFinite(d.getTime())) return '';
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
    + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function aiReminderParseDuration(text, nowMs) {
  var s = String(text || '').replace(/\s+/g, '');
  var base = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  var total = 0;
  var matched = false;

  if (/^半(?:个)?小时后$/.test(s)) return { status:'ok', timestamp: base + 30 * 60000, kind:'relative' };

  var oneHalf = s.match(/^([一二两三四五六七八九十\d]+)(?:个)?半小时后$/);
  if (oneHalf) {
    var hv = aiReminderChineseNumber(oneHalf[1]);
    if (Number.isFinite(hv) && hv >= 0) return { status:'ok', timestamp: base + (hv * 60 + 30) * 60000, kind:'relative' };
  }

  var day = s.match(/([零〇一二两三四五六七八九十\d]+)天/);
  var hour = s.match(/([零〇一二两三四五六七八九十\d]+)(?:个)?小时/);
  var minute = s.match(/([零〇一二两三四五六七八九十\d]+)分钟/);
  if (day) { var dv=aiReminderChineseNumber(day[1]); if (Number.isFinite(dv)) { total += dv * 86400000; matched = true; } }
  if (hour) { var hv2=aiReminderChineseNumber(hour[1]); if (Number.isFinite(hv2)) { total += hv2 * 3600000; matched = true; } }
  if (minute) { var mv=aiReminderChineseNumber(minute[1]); if (Number.isFinite(mv)) { total += mv * 60000; matched = true; } }

  if (matched && /后$/.test(s) && total > 0) return { status:'ok', timestamp: base + total, kind:'relative' };
  return null;
}

function parseReminderTimeSpec(text, nowMs) {
  var raw = String(text || '').trim().replace(/[，,。；;]+$/g, '');
  var compact = raw.replace(/\s+/g, '');
  var now = new Date(Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now());
  var nowValue = now.getTime();
  if (!compact) return { status:'invalid', message:'没有识别到提醒时间' };

  var relative = aiReminderParseDuration(compact, nowValue);
  if (relative) {
    relative.label = aiReminderFormatDateTime(relative.timestamp);
    return relative;
  }

  var year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate();
  var hasExplicitDate = false;
  var rest = compact;

  var fullDate = rest.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (fullDate) {
    year = parseInt(fullDate[1], 10); month = parseInt(fullDate[2], 10); day = parseInt(fullDate[3], 10);
    rest = rest.slice(fullDate[0].length); hasExplicitDate = true;
  } else {
    var shortDate = rest.match(/^(\d{1,2})月(\d{1,2})日?/);
    if (shortDate) {
      month = parseInt(shortDate[1], 10); day = parseInt(shortDate[2], 10);
      rest = rest.slice(shortDate[0].length); hasExplicitDate = true;
    } else {
      var relativeDay = rest.match(/^(今天|今日|明天|后天)/);
      if (relativeDay) {
        var offset = relativeDay[1] === '明天' ? 1 : relativeDay[1] === '后天' ? 2 : 0;
        var d0 = new Date(nowValue); d0.setHours(0,0,0,0); d0.setDate(d0.getDate() + offset);
        year = d0.getFullYear(); month = d0.getMonth() + 1; day = d0.getDate();
        rest = rest.slice(relativeDay[0].length); hasExplicitDate = true;
      }
    }
  }

  rest = rest.replace(/^的?/, '');
  var part = '';
  var partMatch = rest.match(/^(凌晨|早上|上午|中午|下午|傍晚|晚上|晚间)/);
  if (partMatch) { part = partMatch[1]; rest = rest.slice(partMatch[0].length); }

  var hourValue = NaN, minuteValue = 0, colonStyle = false;
  var colon = rest.match(/^(\d{1,2})[:：](\d{1,2})/);
  if (colon) {
    hourValue = parseInt(colon[1], 10); minuteValue = parseInt(colon[2], 10); colonStyle = true;
    rest = rest.slice(colon[0].length);
  } else {
    var clock = rest.match(/^([零〇一二两三四五六七八九十\d]{1,3})点(?:钟)?(?:(半)|([零〇一二两三四五六七八九十\d]{1,3})分?)?/);
    if (clock) {
      hourValue = aiReminderChineseNumber(clock[1]);
      if (clock[2]) minuteValue = 30;
      else if (clock[3]) minuteValue = aiReminderChineseNumber(clock[3]);
      rest = rest.slice(clock[0].length);
    }
  }

  rest = rest.replace(/^的$/, '');
  if (rest) return { status:'invalid', message:'暂不支持这个提醒时间表达，请换成具体时间或“多久后”' };

  if (!Number.isFinite(hourValue)) {
    return hasExplicitDate
      ? { status:'need_time', message:'日期识别到了，但还需要一个具体提醒时间' }
      : { status:'invalid', message:'没有识别到具体提醒时间' };
  }
  if (!Number.isFinite(minuteValue) || minuteValue < 0 || minuteValue > 59 || hourValue < 0 || hourValue > 23) return { status:'invalid', message:'提醒时间不正确' };

  if (part) {
    if (['下午','傍晚','晚上','晚间'].indexOf(part) !== -1 && hourValue < 12) hourValue += 12;
    else if (part === '中午' && hourValue >= 1 && hourValue <= 10) hourValue += 12;
    else if ((part === '凌晨' || part === '早上' || part === '上午') && hourValue === 12) hourValue = 0;
  } else if (!colonStyle && hourValue >= 1 && hourValue <= 11) {
    return { status:'ambiguous', message:'“' + raw + '”是上午还是下午？请说“上午/下午”，或直接用 24 小时制，例如 15点。' };
  }

  var target = new Date(year, month - 1, day, hourValue, minuteValue, 0, 0);
  if (target.getFullYear() !== year || target.getMonth() !== month - 1 || target.getDate() !== day || target.getHours() !== hourValue || target.getMinutes() !== minuteValue) {
    return { status:'invalid', message:'提醒日期或时间不正确' };
  }
  var ts = target.getTime();
  if (ts <= nowValue + 5000) {
    if (!hasExplicitDate) return { status:'past', message:'今天 ' + String(hourValue).padStart(2,'0') + ':' + String(minuteValue).padStart(2,'0') + ' 已经过了。要设成明天这个时间，请直接说“明天' + String(hourValue).padStart(2,'0') + ':' + String(minuteValue).padStart(2,'0') + '提醒我…”' };
    return { status:'past', message:'这个提醒时间已经过去了，请换一个未来时间' };
  }
  return { status:'ok', timestamp:ts, label:aiReminderFormatDateTime(ts), kind:'absolute' };
}

function parseBasicAddRegex(text) {
  var t = String(text || '').trim();
  var m1 = t.match(/^加一条(.+?)的(.+)$/);
  if (m1) return { action:'addTodo', text:m1[2].trim(), category:m1[1].trim() };
  var m2 = t.match(/^(?:添加|加一条?|加)\s*(.+)$/);
  if (m2 && m2[1].trim() && m2[1].length <= 80) return { action:'addTodo', text:m2[1].trim(), category:'全部' };
  var mBullet = t.match(/^-\s*(.+)$/);
  if (mBullet && mBullet[1].trim()) return { action:'addTodo', text:mBullet[1].trim(), category:'全部' };
  return null;
}

function reminderClarificationAction(result) {
  return { action:'reminderClarification', message:(result && result.message) || '提醒时间还不够明确' };
}

function buildReminderRegexAction(timeText, action) {
  var parsed = parseReminderTimeSpec(timeText, Date.now());
  if (!parsed || parsed.status !== 'ok') return reminderClarificationAction(parsed);
  action.reminderAt = parsed.timestamp;
  action.reminderLabel = parsed.label;
  action.reminderTime = String(timeText || '').trim();
  return action;
}

function parseReminderRegexCommand(t) {
  var text = String(t || '').trim().replace(/\s+/g, ' ');

  var change = text.match(/^把\s*(.+?)\s*的?提醒(?:时间)?\s*(?:改到|改为|设为|设置为)\s*(.+)$/);
  if (change) return buildReminderRegexAction(change[2], { action:'setReminder', keyword:change[1].trim() });

  var setAfter = text.match(/^给\s*(.+?)\s*(?:设置|设定|设|加上?|加)\s*(?:一个|个)?提醒(?:时间)?\s*[，, ]*\s*(.+)$/);
  if (setAfter) return buildReminderRegexAction(setAfter[2], { action:'setReminder', keyword:setAfter[1].trim() });
  var setBefore = text.match(/^给\s*(.+?)\s*(?:设置|设定|设|加上?|加)\s*(?:一个|个)?\s*(.+?)\s*提醒$/);
  if (setBefore) {
    var candidate = parseReminderTimeSpec(setBefore[2], Date.now());
    if (candidate && candidate.status !== 'invalid') return buildReminderRegexAction(setBefore[2], { action:'setReminder', keyword:setBefore[1].trim() });
  }

  var addSuffix = text.match(/^((?:添加|加一条?|加)\s*.+?)[，,]\s*(.+?)\s*提醒$/);
  if (addSuffix) {
    var add = parseBasicAddRegex(addSuffix[1]);
    if (add) return buildReminderRegexAction(addSuffix[2], add);
  }

  var timeFirst = text.match(/^(.+?)\s*提醒我\s*(.+)$/);
  if (timeFirst) {
    var p1 = parseReminderTimeSpec(timeFirst[1], Date.now());
    if (p1 && p1.status !== 'invalid') return buildReminderRegexAction(timeFirst[1], { action:'addTodo', text:timeFirst[2].trim(), category:'全部' });
  }

  var remindMeFirst = text.match(/^提醒我\s*(.+)$/);
  if (remindMeFirst) {
    var body = remindMeFirst[1].trim();
    var leadingPatterns = [
      /^(\d{4}年\d{1,2}月\d{1,2}日?(?:凌晨|早上|上午|中午|下午|傍晚|晚上|晚间)?(?:\d{1,2}[:：]\d{1,2}|[零〇一二两三四五六七八九十\d]{1,3}点(?:钟)?(?:半|[零〇一二两三四五六七八九十\d]{1,3}分?)?))/,
      /^(\d{1,2}月\d{1,2}日?(?:凌晨|早上|上午|中午|下午|傍晚|晚上|晚间)?(?:\d{1,2}[:：]\d{1,2}|[零〇一二两三四五六七八九十\d]{1,3}点(?:钟)?(?:半|[零〇一二两三四五六七八九十\d]{1,3}分?)?))/,
      /^((?:今天|今日|明天|后天)(?:凌晨|早上|上午|中午|下午|傍晚|晚上|晚间)?(?:\d{1,2}[:：]\d{1,2}|[零〇一二两三四五六七八九十\d]{1,3}点(?:钟)?(?:半|[零〇一二两三四五六七八九十\d]{1,3}分?)?))/,
      /^((?:半(?:个)?小时|[零〇一二两三四五六七八九十\d]+(?:个)?半小时|(?:(?:[零〇一二两三四五六七八九十\d]+天)?(?:[零〇一二两三四五六七八九十\d]+(?:个)?小时)?(?:[零〇一二两三四五六七八九十\d]+分钟)?))后)/,
      /^((?:凌晨|早上|上午|中午|下午|傍晚|晚上|晚间)?(?:\d{1,2}[:：]\d{1,2}|[零〇一二两三四五六七八九十\d]{1,3}点(?:钟)?(?:半|[零〇一二两三四五六七八九十\d]{1,3}分?)?))/
    ];
    for (var i=0;i<leadingPatterns.length;i++) {
      var lm = body.match(leadingPatterns[i]);
      if (lm && body.slice(lm[0].length).trim()) return buildReminderRegexAction(lm[1], { action:'addTodo', text:body.slice(lm[0].length).trim(), category:'全部' });
    }
  }

  return null;
}

// ===== Regex Command Parser (Route A: fast, free) =====
function parseRegexCommand(text) {
  // Normalize: collapse newlines to spaces so multiline input works
  var t = text.trim().replace(/\n/g, ' ');

  // Reminder intent must run before ordinary addTodo, otherwise reminder text
  // would be swallowed by the existing generic add command.
  var reminderCmd = parseReminderRegexCommand(t);
  if (reminderCmd) return reminderCmd;

  var add = parseBasicAddRegex(t);
  if (add) return add;

  // "删除[关键词]"
  var m3 = t.match(/^删除(.+)/);
  if (m3 && m3[1].trim()) return { action: 'deleteTodo', keyword: m3[1].trim() };

  // "进行[关键词]" → set to in-progress
  var m4a = t.match(/^进行(.+)/);
  if (m4a && m4a[1].trim()) return { action: 'setProgress', keyword: m4a[1].trim() };

  // "完成[关键词]" or "做完[关键词]" → directly set completed
  var m4b = t.match(/^(?:完成|做完)(.+)/);
  if (m4b && m4b[1].trim()) return { action: 'setCompleted', keyword: m4b[1].trim() };

  // "显示[标签]标签" or "切换到[标签]"
  var m5 = t.match(/^(?:显示|切换到?)(.+)标签/);
  if (m5) return { action: 'showCategory', category: m5[1].trim() };

  // "[今天/进行中/已完成/全部/未完成]的任务"
  var m6 = t.match(/^(今天|进行中|已完成|全部|未完成)的?任务/);
  if (m6) {
    var filterMap = { '今天': 'all', '进行中': 'in-progress', '已完成': 'completed', '全部': 'all', '未完成': 'pending' };
    return { action: 'listTodos', filter: filterMap[m6[1]] || 'all' };
  }

  // "搜索[关键词]" or "找[关键词]"
  var m7 = t.match(/^(?:搜索|找)\s*(.+)/);
  if (m7 && m7[1].trim()) return { action: 'searchTodo', keyword: m7[1].trim() };

  // "改[关键词]为[新内容]" or "把[关键词]改为[新内容]"
  var m8 = t.match(/^(?:改|把)\s*(.+?)\s*(?:改为|为)\s*(.+)/);
  if (m8) return { action: 'renameTodo', keyword: m8[1].trim(), newText: m8[2].trim() };

  // "给[关键词]加标签[标签]"
  var m9 = t.match(/^给(.+?)加标签(.+)/);
  if (m9) return { action: 'recategorize', keyword: m9[1].trim(), category: m9[2].trim() };

  // "统计"
  if (t === '统计' || t === '统计一下') return { action: 'showStats' };

  // No regex match → go to AI
  return null;
}

// ===== AI System Prompt =====
function getAiSystemPrompt() {
  return '你是一个待办事项助手。你可以帮用户管理他们的待办事项。\n\n'
    + '当用户要求操作待办时，在回复末尾附上一个 JSON 动作块（用 ```json 代码块包裹）：\n\n'
    + '可用动作：\n'
    + '- addTodo: { "action": "addTodo", "text": "待办内容", "category": "标签", "reminderTime": "可选，用户原始提醒时间表达" }\n'
    + '- setReminder: { "action": "setReminder", "keyword": "已有待办匹配文本", "reminderTime": "提醒时间表达" }\n'
    + '- deleteTodo: { "action": "deleteTodo", "keyword": "匹配文本" }\n'
    + '- toggleTodo: { "action": "toggleTodo", "keyword": "匹配文本" }\n'
    + '- setProgress: { "action": "setProgress", "keyword": "匹配文本" }\n'
    + '- setCompleted: { "action": "setCompleted", "keyword": "匹配文本" }\n'
    + '- searchTodo: { "action": "searchTodo", "keyword": "匹配文本" }\n'
    + '- renameTodo: { "action": "renameTodo", "keyword": "匹配文本", "newText": "新内容" }\n'
    + '- recategorize: { "action": "recategorize", "keyword": "匹配文本", "category": "新标签" }\n'
    + '- listTodos: { "action": "listTodos", "filter": "all|todo|in-progress|completed" }\n'
    + '- showCategory: { "action": "showCategory", "category": "标签名" }\n'
    + '- showStats: { "action": "showStats" }\n\n'
    + '规则：\n'
    + '1. 先简短回复用户（1-2句话），然后在 ```json 代码块中给出动作\n'
    + '2. 标签(category)默认为"全部"，用户提到特定科目/类别时使用\n'
    + '3. 如果用户只是聊天/提问，不需要动作块\n'
    + '4. **重要**：addTodo 的 text 只包含任务内容本身，不要把标签/类别词或提醒时间放进 text\n'
    + '   例如用户说"英语的60个词"→ text:"60个词" category:"英语"（不要 text:"英语60个词"）\n'
    + '   例如用户说"工作的写周报"→ text:"写周报" category:"工作"\n'
    + '5. 用户要求提醒时，把时间原话放在 reminderTime；不要自己计算 Unix 时间戳。支持如“2026年8月25日20:30 / 8月25日15点 / 明天下午3点 / 16点 / 6个小时后”。\n'
    + '6. 给已有待办设置或修改提醒时使用 setReminder；新建并提醒时使用 addTodo + reminderTime。\n'
    + '7. 多个动作可以放在一个 JSON 数组中';
}

// ===== AI Chat History =====
function getAiChatHistory() {
  var key = 'todo_ai_history_' + getAiProvider();
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}

function saveAiChatHistory(msgs) {
  var key = 'todo_ai_history_' + getAiProvider();
  if (msgs.length > 20) msgs = msgs.slice(msgs.length - 20);
  localStorage.setItem(key, JSON.stringify(msgs));
}

// ===== AI API Call (Route B: complex/chat) =====
async function callAiApi(userText) {
  var cfg = getAiConfig();
  if (!cfg.apiKey) {
    addAiMessage('ai', '请先设置 API Key（点击标题栏「' + AI_PROVIDERS[cfg.provider].label + '」切换模型）');
    return;
  }

  var history = getAiChatHistory();
  if (history.length === 0 || history[0].role !== 'system') {
    history.unshift({ role: 'system', content: getAiSystemPrompt() });
  } else {
    history[0].content = getAiSystemPrompt();
  }
  history.push({ role: 'user', content: userText });

  showAiLoading();

  try {
    var resp = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model,
        messages: history,
        max_tokens: 600,
        temperature: 0.7,
        stream: false
      })
    });

    if (!resp.ok) {
      var errText = '';
      try { errText = await resp.text(); } catch(e) {}
      hideAiLoading();
      addAiMessage('ai', '请求失败 (HTTP ' + resp.status + ')：' + (errText.substring(0, 100) || '请检查网络或API Key'));
      return;
    }

    var data = await resp.json();
    var replyText = data.choices[0].message.content;

    hideAiLoading();

    var parsed = parseAiActions(replyText);

    // Render markdown if marked.js loaded, else plain text
    if (typeof marked !== 'undefined' && parsed.text) {
      addAiMessageHtml('ai', marked.parse(parsed.text));
    } else {
      addAiMessage('ai', parsed.text);
    }

    // Execute actions
    if (parsed.actions.length > 0) {
      for (var i = 0; i < parsed.actions.length; i++) {
        executeAction(parsed.actions[i], { route: 'ai' });
      }
    }

    // Save history
    history.push({ role: 'assistant', content: replyText });
    saveAiChatHistory(history);

  } catch (e) {
    hideAiLoading();
    addAiMessage('ai', '网络错误：' + e.message);
  }
}

// HTML version of addAiMessage for markdown rendering
function addAiMessageHtml(role, html) {
  var msgs = document.getElementById('aiChatMessages');
  var hint = msgs.querySelector('div[style*="text-align:center"]');
  if (hint) hint.remove();

  var el = document.createElement('div');
  el.className = 'ai-chat__msg ai-chat__msg--' + (role === 'user' ? 'user' : 'ai');
  var copyBtn = role === 'ai' ? '<button class="ai-chat__copy-btn" onclick="copyAiMsg(this)" title="复制">📋</button>' : '';
  el.innerHTML = '<div class="ai-chat__bubble">' + copyBtn + html + '</div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// ===== AI Action Parser =====
function parseAiActions(replyText) {
  var match = replyText.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { text: replyText, actions: [] };
  try {
    var parsed = JSON.parse(match[1]);
    var actions = Array.isArray(parsed) ? parsed : [parsed];
    var text = replyText.replace(/```json[\s\S]*?```/, '').trim();
    return { text: text, actions: actions };
  } catch(e) {
    return { text: replyText, actions: [] };
  }
}

// ===== AI Reminder Action Helpers =====
function aiReminderResolveActionTime(action) {
  var direct = Number(action && action.reminderAt);
  if (Number.isFinite(direct) && direct > Date.now() + 5000) {
    return { status:'ok', timestamp:direct, label:action.reminderLabel || aiReminderFormatDateTime(direct) };
  }
  return parseReminderTimeSpec(action && action.reminderTime ? action.reminderTime : '', Date.now());
}

function aiReminderFindTodo(keyword) {
  var q = String(keyword || '').trim().toLowerCase();
  if (!q) return { status:'none', matches:[] };
  var exact = todos.filter(function(t) { return String(t.text || '').trim().toLowerCase() === q; });
  if (exact.length === 1) return { status:'ok', todo:exact[0], matches:exact };
  if (exact.length > 1) return { status:'ambiguous', matches:exact };
  var partial = todos.filter(function(t) { return String(t.text || '').toLowerCase().indexOf(q) !== -1; });
  if (partial.length === 1) return { status:'ok', todo:partial[0], matches:partial };
  if (partial.length > 1) return { status:'ambiguous', matches:partial };
  return { status:'none', matches:[] };
}

function aiReminderMatchMessage(keyword, result) {
  if (!result || result.status === 'none') return '没有找到与“' + String(keyword || '') + '”匹配的待办。';
  var names = (result.matches || []).slice(0, 5).map(function(t) { return '「' + (t.text || '未命名待办') + '」'; });
  return '找到多条匹配待办：' + names.join('、') + (result.matches.length > 5 ? '…' : '') + '。请把待办名称说得更完整一点。';
}

function applyAiTodoReminder(todo, timestamp) {
  var ts = Number(timestamp);
  if (!todo || !Number.isFinite(ts) || ts <= Date.now() + 5000) return { ok:false, message:'提醒时间必须晚于现在' };
  todo.reminderAt = ts;
  saveTodos();
  var nativeScheduleResult = 'ok';
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.scheduleTodoReminder) {
    try {
      nativeScheduleResult = String(AndroidBridge.scheduleTodoReminder(String(todo.id), todo.text || '', todo.status || 'todo', String(ts)));
    } catch(e) { nativeScheduleResult = '失败'; }
  }
  render();
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.requestReminderPermissions) {
    try { AndroidBridge.requestReminderPermissions(); } catch(e) {}
  }
  var failed = nativeScheduleResult.startsWith('失败') || nativeScheduleResult === 'invalid';
  return { ok:!failed, saved:true, label:aiReminderFormatDateTime(ts), nativeResult:nativeScheduleResult };
}

function aiReminderReport(message, meta) {
  if (meta && meta.route === 'regex') addAiMessage('ai', message);
  showToast(message);
}

// ===== Action Executor =====
function executeAction(action, meta) {
  meta = meta || {};
  switch(action.action) {
    case 'reminderClarification':
      aiReminderReport(action.message || '提醒时间还不够明确', meta);
      break;

    case 'addTodo':
      var text = action.text || '';
      var cat = action.category || '全部';
      if (action.reminderTime || action.reminderAt) {
        var addTime = aiReminderResolveActionTime(action);
        if (!addTime || addTime.status !== 'ok') {
          aiReminderReport((addTime && addTime.message) || '没有识别到有效提醒时间', meta);
          break;
        }
        var createdTodo = addTodoWithCategory(text, cat);
        var addSchedule = applyAiTodoReminder(createdTodo, addTime.timestamp);
        if (!addSchedule.saved) {
          aiReminderReport(addSchedule.message || '提醒设置失败', meta);
          break;
        }
        var addMsg = '已创建「' + text + '」并设置提醒 · ' + addSchedule.label;
        if (meta.route === 'regex') addAiMessage('ai', addMsg);
        showToast(addSchedule.ok ? addMsg : '提醒已保存 · 原生调度失败');
      } else {
        addTodoWithCategory(text, cat);
        showToast('已添加：「' + text + '」');
      }
      break;

    case 'setReminder':
      var targetResult = aiReminderFindTodo(action.keyword || '');
      if (targetResult.status !== 'ok') {
        aiReminderReport(aiReminderMatchMessage(action.keyword || '', targetResult), meta);
        break;
      }
      var setTime = aiReminderResolveActionTime(action);
      if (!setTime || setTime.status !== 'ok') {
        aiReminderReport((setTime && setTime.message) || '没有识别到有效提醒时间', meta);
        break;
      }
      var setSchedule = applyAiTodoReminder(targetResult.todo, setTime.timestamp);
      if (!setSchedule.saved) {
        aiReminderReport(setSchedule.message || '提醒设置失败', meta);
        break;
      }
      var setMsg = '已为「' + targetResult.todo.text + '」设置提醒 · ' + setSchedule.label;
      if (meta.route === 'regex') addAiMessage('ai', setMsg);
      showToast(setSchedule.ok ? setMsg : '提醒已保存 · 原生调度失败');
      break;

    case 'deleteTodo':
      var found = deleteByKeyword(action.keyword || '');
      if (found) {
        showToast('已删除：「' + found.text + '」');
      } else {
        showToast('未找到匹配的待办');
      }
      break;

    case 'toggleTodo':
      var toggled = toggleByKeyword(action.keyword || '');
      if (toggled) {
        var label = toggled.status === 'completed' ? '已完成' : toggled.status === 'in-progress' ? '进行中' : '未完成';
        showToast('已更新：「' + toggled.text + '」→ ' + label);
      } else {
        showToast('未找到匹配的待办');
      }
      break;

    case 'listTodos':
      if (action.filter && ['all','todo','in-progress','completed','pending'].indexOf(action.filter) !== -1) {
        currentTab = action.filter === 'todo' ? 'pending' : action.filter;
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        var targetTab = document.querySelector('.tab[data-tab="' + currentTab + '"]');
        if (targetTab) targetTab.classList.add('active');
        render();
        var labelMap = { pending: '未完成', 'in-progress': '进行中', completed: '已完成', all: '全部' };
        showToast('已筛选：' + (labelMap[currentTab] || currentTab));
      }
      break;

    case 'showCategory':
      if (action.category) {
        selectCategory(action.category);
        showToast('已切换到：「' + action.category + '」');
      }
      break;

    case 'setProgress':
      var prog = setStatusByKeyword(action.keyword || '', 'in-progress');
      if (prog) { showToast('进行中：「' + prog.text + '」'); }
      else { showToast('未找到匹配的待办'); }
      break;

    case 'setCompleted':
      var comp = setStatusByKeyword(action.keyword || '', 'completed');
      if (comp) { showToast('已完成：「' + comp.text + '」'); }
      else { showToast('未找到匹配的待办'); }
      break;

    case 'searchTodo':
      searchQuery = action.keyword || '';
      searchInput.value = searchQuery;
      searchClear.classList.add('visible');
      document.getElementById('search-icon').style.display = 'none';
      render();
      closeAiChat();
      showToast('搜索：「' + searchQuery + '」');
      break;

    case 'renameTodo':
      var renamed = renameByKeyword(action.keyword || '', action.newText || '');
      if (renamed) { showToast('已改：「' + renamed.oldText + '」→「' + action.newText + '」'); }
      else { showToast('未找到匹配的待办'); }
      break;

    case 'recategorize':
      var recat = recategorizeByKeyword(action.keyword || '', action.category || '全部');
      if (recat) { showToast('「' + recat.text + '」→ 标签「' + action.category + '」'); }
      else { showToast('未找到匹配的待办'); }
      break;

    case 'showStats':
      showStatsInChat();
      break;
  }
}

// ===== Main AI Command Handler (Hybrid: regex → AI) =====
function handleAiCommand(text) {
  // Route A: Try regex first (instant, free)
  var cmd = parseRegexCommand(text);
  if (cmd) {
    setTimeout(function() {
      showAiLoading();
      setTimeout(function() {
        hideAiLoading();
        var isReminderAction = cmd.action === 'setReminder' || cmd.action === 'reminderClarification' || (cmd.action === 'addTodo' && (cmd.reminderTime || cmd.reminderAt));
        if (cmd.action !== 'showStats' && !isReminderAction) {
          addAiMessage('ai', '好的，已处理 ✓');
        }
        executeAction(cmd, { route: 'regex' });
      }, 300);
    }, 200);
    return;
  }

  // Route B: Send to AI (complex commands)
  callAiApi(text);
}

// ===== Action Helpers (operate on the real todos array) =====
function addTodoWithCategory(text, category) {
  var todo = {
    id: Date.now(),
    text: text.trim(),
    status: 'todo',
    createdAt: Date.now(),
    category: category || '全部'
  };
  todos.unshift(todo);
  saveTodos();
  render();
  var newEl = todoListEl.querySelector('[data-id="' + todo.id + '"]');
  if (newEl) {
    newEl.classList.add('slide-in');
    newEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return todo;
}

function deleteByKeyword(keyword) {
  var q = keyword.toLowerCase();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].text.toLowerCase().indexOf(q) !== -1) {
      var deleted = todos[i];
      todos.splice(i, 1);
      addToRecycleBin(deleted);
      saveTodos();
      render();
      return deleted;
    }
  }
  return null;
}

function toggleByKeyword(keyword) {
  var q = keyword.toLowerCase();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].text.toLowerCase().indexOf(q) !== -1) {
      var todo = todos[i];
      if (todo.status === 'todo') todo.status = 'in-progress';
      else if (todo.status === 'in-progress') todo.status = 'completed';
      else todo.status = 'todo';
      saveTodos();
      render();
      return todo;
    }
  }
  return null;
}

function setStatusByKeyword(keyword, status) {
  var q = keyword.toLowerCase();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].text.toLowerCase().indexOf(q) !== -1) {
      todos[i].status = status;
      saveTodos();
      render();
      return todos[i];
    }
  }
  return null;
}

function renameByKeyword(keyword, newText) {
  var q = keyword.toLowerCase();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].text.toLowerCase().indexOf(q) !== -1) {
      var oldText = todos[i].text;
      todos[i].text = newText;
      saveTodos();
      render();
      return { oldText: oldText };
    }
  }
  return null;
}

function recategorizeByKeyword(keyword, category) {
  var q = keyword.toLowerCase();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].text.toLowerCase().indexOf(q) !== -1) {
      var todo = todos[i];
      todo.category = category;
      if (categories.indexOf(category) === -1 && category !== '全部') {
        categories.push(category);
        renderCategoryBar();
      }
      saveTodos();
      render();
      return todo;
    }
  }
  return null;
}

function showStatsInChat() {
  var total = todos.length;
  var completed = todos.filter(function(t) { return t.status === 'completed'; }).length;
  var inProgress = todos.filter(function(t) { return t.status === 'in-progress'; }).length;
  var pending = total - completed - inProgress;
  var rate = total > 0 ? Math.round(completed / total * 100) : 0;

  var catStats = {};
  for (var i = 0; i < todos.length; i++) {
    var cat = todos[i].category || '全部';
    if (!catStats[cat]) catStats[cat] = { total: 0, completed: 0 };
    catStats[cat].total++;
    if (todos[i].status === 'completed') catStats[cat].completed++;
  }

  var lines = [];
  lines.push('**📊 待办统计**');
  lines.push('');
  lines.push('| 状态 | 数量 |');
  lines.push('|------|------|');
  lines.push('| ⏳ 未完成 | ' + pending + ' |');
  lines.push('| 🔄 进行中 | ' + inProgress + ' |');
  lines.push('| ✅ 已完成 | ' + completed + ' |');
  lines.push('| 📦 总计 | ' + total + ' |');
  lines.push('');
  lines.push('完成率：**' + rate + '%**');
  lines.push('');
  lines.push('**📂 各标签：**');
  var catKeys = Object.keys(catStats);
  for (var c = 0; c < catKeys.length; c++) {
    var cs = catStats[catKeys[c]];
    lines.push('- ' + catKeys[c] + '：' + cs.completed + '/' + cs.total);
  }

  addAiMessageHtml('ai', marked.parse(lines.join('\n')));
}

// ===== Bullet List Modal =====
var bulletTagDropdown = null;
var bulletTagTarget = null;

function getBulletTagDropdown() {
  if (!bulletTagDropdown) {
    bulletTagDropdown = document.createElement('div');
    bulletTagDropdown.className = 'bullet-tag-dropdown';
    document.body.appendChild(bulletTagDropdown);
    // Click outside closes it
    document.addEventListener('click', function(e) {
      if (bulletTagDropdown.classList.contains('active') &&
          !e.target.closest('.bullet-tag-dropdown') &&
          !e.target.closest('.bullet-row__tag')) {
        bulletTagDropdown.classList.remove('active');
        bulletTagTarget = null;
      }
    });
  }
  return bulletTagDropdown;
}

function openBulletTagMenu(tagEl) {
  bulletTagTarget = tagEl;
  var dd = getBulletTagDropdown();
  var rect = tagEl.getBoundingClientRect();

  var html = '';
  for (var c = 0; c < categories.length; c++) {
    var sel = categories[c] === tagEl.dataset.tag ? ' selected' : '';
    html += '<div class="bullet-tag-dropdown__item' + sel + '" data-tag="' + escapeHtml(categories[c]) + '">' + escapeHtml(categories[c]) + '</div>';
  }
  html += '<div class="bullet-tag-dropdown__divider"></div>';
  html += '<div class="bullet-tag-dropdown__add" id="bulletDropdownAdd">+ 新标签</div>';
  html += '<input type="text" class="bullet-tag-dropdown__input" id="bulletDropdownInput" placeholder="输入新标签名" style="display:none">';
  dd.innerHTML = html;

  dd.style.left = rect.left + 'px';
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.classList.add('active');

  // Handle item clicks
  dd.onclick = function(e) {
    var item = e.target.closest('.bullet-tag-dropdown__item');
    if (item) {
      var cat = item.dataset.tag;
      if (bulletTagTarget) {
        bulletTagTarget.dataset.tag = cat;
        bulletTagTarget.textContent = cat;
      }
      dd.classList.remove('active');
      bulletTagTarget = null;
      return;
    }
    var addBtn = e.target.closest('#bulletDropdownAdd');
    if (addBtn) {
      var input = document.getElementById('bulletDropdownInput');
      input.style.display = 'block'; input.focus();
      addBtn.style.display = 'none';
      return;
    }
  };

  // Handle new tag input
  var input = document.getElementById('bulletDropdownInput');
  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      var name = input.value.trim();
      if (name && name !== '__new__') {
        if (categories.indexOf(name) === -1) {
          categories.push(name);
          renderCategoryBar();
        }
        if (bulletTagTarget) {
          bulletTagTarget.dataset.tag = name;
          bulletTagTarget.textContent = name;
        }
      }
      dd.classList.remove('active');
      bulletTagTarget = null;
    }
    if (e.key === 'Escape') {
      dd.classList.remove('active');
      bulletTagTarget = null;
    }
  };
}

function openBulletModal() {
  var list = document.getElementById('bulletList');
  var html = '';
  for (var i = 0; i < 10; i++) {
    html += '<div class="bullet-row">' +
      '<span class="bullet-row__dash">-</span>' +
      '<span class="bullet-row__tag" data-tag="全部" onclick="openBulletTagMenu(this)">全部</span>' +
      '<input class="bullet-row__input" placeholder="内容">' +
      '</div>';
  }
  list.innerHTML = html;
  document.getElementById('bulletModal').classList.add('active');
  setTimeout(function() {
    var first = list.querySelector('.bullet-row__input');
    if (first) first.focus();
  }, 300);
}

document.getElementById('bulletClose').addEventListener('click', closeBulletModal);
document.getElementById('bulletBackdrop').addEventListener('click', closeBulletModal);

function closeBulletModal() {
  document.getElementById('bulletModal').classList.remove('active');
  if (bulletTagDropdown) bulletTagDropdown.classList.remove('active');
  bulletTagTarget = null;
}

document.getElementById('bulletCreate').addEventListener('click', function() {
  var rows = document.querySelectorAll('#bulletList .bullet-row');
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var input = rows[i].querySelector('.bullet-row__input');
    var tagEl = rows[i].querySelector('.bullet-row__tag');
    var val = input.value.trim();
    if (!val) continue;
    var tag = tagEl ? tagEl.dataset.tag : '全部';
    addTodoWithCategory(val, tag);
    count++;
  }
  closeBulletModal();
  if (count > 0) {
    showToast('已创建 ' + count + ' 条待办');
  }
  render();
});

// Wire up chip: 📝 清单 → open bullet modal
// (The chip handler below already has the 'bullet' case — update it)
// Find the bullet case and redirect to openBulletModal

// ===== Init =====
loadTodos();
loadRecycleBin();
loadSearchHistory();
loadDailyTasks();
if (window.__pullNativeTodoMutations) window.__pullNativeTodoMutations();
if (window.__pullNativeDailyTaskMutations) window.__pullNativeDailyTaskMutations();
syncToAndroid();
syncDailyTasksToAndroid();
render();
updateCounts();
renderCategoryBar();

// Recycle modal events
fabRecycleBtn.addEventListener('click', openRecycleModal);
recycleBackdrop.addEventListener('click', closeRecycleModal);
recycleClose.addEventListener('click', closeRecycleModal);
recycleClearAll.addEventListener('click', () => {
  if (recycleBin.length > 0) {
    showConfirm('确定要清空回收站吗？', function() { clearRecycleBin(); });
  }
});
recycleList.addEventListener('click', (e) => {
  const restoreBtn = e.target.closest('.recycle-modal__restore');
  const deleteBtn = e.target.closest('.recycle-modal__delete');
  const item = e.target.closest('.recycle-modal__item');
  if (!item) return;
  const id = parseInt(item.dataset.id);
  if (restoreBtn) restoreFromRecycle(id);
  if (deleteBtn) permanentlyDelete(id);
});

// ===== Calendar Modal =====
let calendarDate = new Date();
let calendarSelectedDate = null;

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  calendarTitle.textContent = `${year}年${month+1}月`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const today = new Date(); today.setHours(0,0,0,0);
  
  let html = '<div class="calendar-modal__day-header">日</div>' +
             '<div class="calendar-modal__day-header">一</div>' +
             '<div class="calendar-modal__day-header">二</div>' +
             '<div class="calendar-modal__day-header">三</div>' +
             '<div class="calendar-modal__day-header">四</div>' +
             '<div class="calendar-modal__day-header">五</div>' +
             '<div class="calendar-modal__day-header">六</div>';
  
  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendar-modal__day empty"></div>';
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    d.setHours(0,0,0,0);
    const isToday = d.getTime() === today.getTime();
    const isSelected = calendarSelectedDate && 
                       calendarSelectedDate.getFullYear() === year &&
                       calendarSelectedDate.getMonth() === month &&
                       calendarSelectedDate.getDate() === day;
    
    html += `<div class="calendar-modal__day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" data-day="${day}">${day}</div>`;
  }
  
  calendarGrid.innerHTML = html;
}

function openCalendar() {
  calendarDate = new Date();
  calendarSelectedDate = null;
  renderCalendar();
  calendarModal.classList.add('active');
}

function closeCalendar() {
  calendarModal.classList.remove('active');
}

calendarBtn.addEventListener('click', openCalendar);
calendarBackdrop.addEventListener('click', closeCalendar);

calendarPrev.addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

calendarNext.addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

calendarGrid.addEventListener('click', (e) => {
  const dayEl = e.target.closest('.calendar-modal__day');
  if (!dayEl || dayEl.classList.contains('empty')) return;
  
  document.querySelectorAll('.calendar-modal__day').forEach(d => d.classList.remove('selected'));
  dayEl.classList.add('selected');
  
  const day = parseInt(dayEl.dataset.day);
  calendarSelectedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
});

// ===== Calendar Long Press Preview =====
let calendarLongPressTimer = null;
let calendarLongPressDay = null;
let calendarLongPressStartX = 0;
let calendarLongPressStartY = 0;
let calendarLongPressShown = false;

function showCalendarPreview(date, x, y) {
  calendarLongPressShown = true;
  const dateKey = getDateKey(date.getTime());
  const dateTodos = todos.filter(t => getDateKey(t.createdAt) === dateKey);
  
  let preview = document.getElementById('calendarPreview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'calendarPreview';
    preview.className = 'calendar-preview';
    document.body.appendChild(preview);
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (dateTodos.length === 0) {
    preview.innerHTML = `<div class="calendar-preview__header">${year}年${month}月${day}日<button class="calendar-preview__close" onclick="hideCalendarPreview()">✕</button></div>
                         <div class="calendar-preview__empty">当天没有待办</div>`;
  } else {
    preview.innerHTML = `<div class="calendar-preview__header">${year}年${month}月${day}日 (${dateTodos.length}项)<button class="calendar-preview__close" onclick="hideCalendarPreview()">✕</button></div>` +
                        dateTodos.map(t => `<div class="calendar-preview__item${t.status === 'completed' ? ' completed' : t.status === 'in-progress' ? ' in-progress' : ''}" data-id="${t.id}" onclick="jumpToTodo(${t.id})"><span class="todo-item__status ${t.status === 'completed' ? 'todo-item__status--completed' : t.status === 'in-progress' ? 'todo-item__status--in-progress' : 'todo-item__status--todo'}"></span>${t.text}</div>`).join('');
  }
  
  preview.style.left = `${Math.min(x, window.innerWidth - 280)}px`;
  preview.style.top = `${Math.max(y - 30, 100)}px`;
  preview.style.display = 'block';
}

function hideCalendarPreview() {
  const preview = document.getElementById('calendarPreview');
  if (preview) {
    preview.style.display = 'none';
  }
}

function jumpToTodo(todoId) {
  hideCalendarPreview();
  closeCalendar();
  
  const todo = todos.find(t => t.id === todoId);
  if (!todo) return;
  
  const dateKey = getDateKey(todo.createdAt);
  scrollToDate(dateKey);
  
  setTimeout(() => {
    const el = document.querySelector(`.todo-item[data-id="${todoId}"]`);
    if (el) {
      el.classList.add('highlight-flash');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.classList.remove('highlight-flash');
      }, 1500);
    }
  }, 300);
}

calendarGrid.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const dayEl = e.target.closest('.calendar-modal__day');
  if (!dayEl || dayEl.classList.contains('empty')) return;
  
  calendarLongPressDay = dayEl;
  calendarLongPressShown = false;
  calendarLongPressTimer = setTimeout(() => {
    const day = parseInt(dayEl.dataset.day);
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const rect = dayEl.getBoundingClientRect();
    showCalendarPreview(date, rect.left, rect.top - 10);
    calendarLongPressDay = null;
  }, 500);
});

calendarGrid.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const dayEl = e.target.closest('.calendar-modal__day');
  if (!dayEl || dayEl.classList.contains('empty')) return;
  
  calendarLongPressDay = dayEl;
  calendarLongPressStartX = e.touches[0].clientX;
  calendarLongPressStartY = e.touches[0].clientY;
  calendarLongPressShown = false;
  calendarLongPressTimer = setTimeout(() => {
    const day = parseInt(dayEl.dataset.day);
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const rect = dayEl.getBoundingClientRect();
    showCalendarPreview(date, rect.left, rect.top - 10);
    calendarLongPressDay = null;
  }, 500);
}, { passive: false });

calendarGrid.addEventListener('mouseup', () => {
  if (calendarLongPressTimer) {
    clearTimeout(calendarLongPressTimer);
    calendarLongPressTimer = null;
  }
  
  if (!calendarLongPressShown && calendarLongPressDay) {
    const dayEl = calendarLongPressDay;
    document.querySelectorAll('.calendar-modal__day').forEach(d => d.classList.remove('selected'));
    dayEl.classList.add('selected');
    const day = parseInt(dayEl.dataset.day);
    calendarSelectedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
  }
  calendarLongPressDay = null;
});

calendarGrid.addEventListener('touchend', () => {
  if (calendarLongPressTimer) {
    clearTimeout(calendarLongPressTimer);
    calendarLongPressTimer = null;
  }
  
  if (!calendarLongPressShown && calendarLongPressDay) {
    const dayEl = calendarLongPressDay;
    document.querySelectorAll('.calendar-modal__day').forEach(d => d.classList.remove('selected'));
    dayEl.classList.add('selected');
    const day = parseInt(dayEl.dataset.day);
    calendarSelectedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
  }
  calendarLongPressDay = null;
});

calendarGrid.addEventListener('mousemove', () => {
  if (calendarLongPressTimer) {
    clearTimeout(calendarLongPressTimer);
    calendarLongPressTimer = null;
  }
});

calendarGrid.addEventListener('touchmove', (e) => {
  if (!calendarLongPressTimer) return;
  const dx = Math.abs(e.touches[0].clientX - calendarLongPressStartX);
  const dy = Math.abs(e.touches[0].clientY - calendarLongPressStartY);
  if (dx > 10 || dy > 10) {
    clearTimeout(calendarLongPressTimer);
    calendarLongPressTimer = null;
  }
}, { passive: true });

document.addEventListener('click', (e) => {
  if (!e.target.closest('.calendar-preview')) {
    hideCalendarPreview();
  }
});

calendarGo.addEventListener('click', () => {
  if (calendarSelectedDate) {
    closeCalendar();
    const dateKey = getDateKey(calendarSelectedDate.getTime());
    scrollToDate(dateKey);
  } else {
    showToast('请先选择日期');
  }
});

// ===== Category Bar Events =====
categoryScroll.addEventListener('click', (e) => {
  const item = e.target.closest('.category-bar__item');
  if (item) {
    const cat = item.dataset.category;
    selectCategory(cat);
  }
});

// ===== Category Picker Events =====
categoryPicker.addEventListener('click', function(e) {
  e.stopPropagation();

  const deleteBtn = e.target.closest('.category-picker__delete');
  if (deleteBtn) {
    const cat = deleteBtn.dataset.category;
    deleteCategory(cat);
    return;
  }
  
  const pickerItem = e.target.closest('.category-picker__item');
  if (pickerItem) {
    const cat = pickerItem.dataset.category;
    if (pickerTodoId) {
      const todo = getTodoById(pickerTodoId);
      if (todo) {
        todo.category = cat;
        saveTodos();
        render();
        showToast(`已切换到「${cat}」`);
      }
    }
    closeCategoryPicker();
    return;
  }
  
  const addBtn = e.target.closest('#pickerAdd');
  if (addBtn) {
    const input = document.getElementById('pickerInput');
    if (input) {
      input.style.display = 'block';
      input.focus();
      addBtn.style.display = 'none';
    }
    return;
  }
});

categoryPicker.addEventListener('keydown', (e) => {
  const input = document.getElementById('pickerInput');
  if (input && e.target === input) {
    if (e.key === 'Enter') {
      addNewCategory(input.value);
      input.style.display = 'none';
      document.getElementById('pickerAdd').style.display = 'flex';
    } else if (e.key === 'Escape') {
      input.style.display = 'none';
      document.getElementById('pickerAdd').style.display = 'flex';
      closeCategoryPicker();
    }
  }
});

// Click outside to close category picker
document.addEventListener('click', (e) => {
  if (!e.target.closest('.category-picker') && !e.target.closest('.todo-item__category')) {
    closeCategoryPicker();
  }
});

// Midnight refresh for date dividers
const msToMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
};
setTimeout(() => {
  render();
  setInterval(render, 86400000); // Daily
}, msToMidnight());

// ===== Notes Event Handlers =====

// Mode toggle
document.getElementById('modeToggle').addEventListener('click', function() {
  var nextMode = currentMode === 'todo' ? 'notes' : 'todo';
  switchMode(nextMode, nextMode === 'notes' ? 'right' : 'left');
});

document.getElementById('noteViewSwitch')?.addEventListener('click', function(e) {
  var btn=e.target.closest('[data-note-view]'); if(!btn||currentMode!=='notes')return;
  noteHomeView=btn.getAttribute('data-note-view')==='tree'?'tree':'recent';
  currentTopicId=null; currentVirtualNoteFolder=null; noteViewStack=[]; topicSummaryEditing=false; closeNoteCreateMenu(); renderNoteList();
  var c=document.getElementById('noteContainer'); if(c)c.scrollTop=0;
});

// Resolve title: user input, or first line of body
function firstLineOfBody(bodyEl) {
  var clone = bodyEl.cloneNode(true);
  clone.querySelectorAll('.note-image-grid,.note-image-picker-marker,.note-image-remove,.note-file-stack,.note-file-picker-marker,.note-file-card__remove').forEach(function(el) { el.remove(); });
  var text = (clone.textContent || '').replace(/\n/g, ' ').trim();
  if (!text) {
    var hasImage = !!bodyEl.querySelector('.note-image-item');
    var hasFile = !!bodyEl.querySelector('.note-file-card');
    if (hasImage && hasFile) return '附件笔记';
    if (hasFile) return '文件笔记';
    if (hasImage) return '图片笔记';
  }
  if (text.length > 50) text = text.substring(0, 50) + '…';
  return text;
}
function resolveTitle(titleVal, bodyEl) {
  var t = (titleVal || '').trim();
  if (t) return t;
  return firstLineOfBody(bodyEl);
}
function getNoteStorageHtml(bodyEl) {
  if (!bodyEl) return '';
  var clone=bodyEl.cloneNode(true);
  clone.querySelectorAll('mark.search-hit').forEach(function(mark){
    var parent=mark.parentNode;if(!parent)return;
    while(mark.firstChild)parent.insertBefore(mark.firstChild,mark);
    parent.removeChild(mark);
  });
  clone.normalize();
  return clone.innerHTML;
}
function saveCurrentNote() {
  if (!currentNoteId) return false;
  var note=getNoteById(currentNoteId);
  var titleInput = document.getElementById('noteEditorTitle');
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl || !note) return false;
  var nextTitle=resolveTitle(titleInput ? titleInput.value : '', bodyEl);
  var nextContent=getNoteStorageHtml(bodyEl);
  if(String(note.title||'')===String(nextTitle||'') && String(note.content||'')===String(nextContent||'')) return false;
  updateNote(currentNoteId, { title: nextTitle, content: nextContent });
  return true;
}

// Note editor: back button
document.getElementById('noteEditorBack').addEventListener('click', function() {
  closeNoteEditor();
});
document.getElementById('noteEditorDone')?.addEventListener('click',function(){if(noteEditorMode==='edit')exitNoteEditModeToRead();});

// Note editor: auto-save (debounced)
var noteSaveTimer = null;
function noteAutoSave() {
  if (!currentNoteId) return;
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(saveCurrentNote, 500);
}
document.getElementById('noteEditorTitle').addEventListener('input', noteAutoSave);

// Note body input: autosave only. Text input/delete/selection never mutates scrollTop.
var noteBodyForInputGuard = document.getElementById('noteEditorBody');
if (noteBodyForInputGuard) noteBodyForInputGuard.addEventListener('input', noteAutoSave);

// Search in editor: highlight matches
document.getElementById('noteEditorSearch').addEventListener('input', function() {
  var q = this.value.trim().toLowerCase();
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  // Remove old highlights
  var marks = bodyEl.querySelectorAll('mark.search-hit');
  for (var i = 0; i < marks.length; i++) {
    var m = marks[i];
    var parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  }
  bodyEl.normalize();
  if (!q) return;
  // Search and highlight text nodes
  highlightTextNodes(bodyEl, q);
});

function highlightTextNodes(el, q) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (var i = 0; i < textNodes.length; i++) {
    var node = textNodes[i];
    var text = node.textContent.toLowerCase();
    var idx = text.indexOf(q);
    if (idx === -1) continue;
    var fragment = document.createDocumentFragment();
    var pos = 0;
    while (idx !== -1) {
      if (idx > pos) fragment.appendChild(document.createTextNode(node.textContent.substring(pos, idx)));
      var mark = document.createElement('mark');
      mark.className = 'search-hit';
      mark.textContent = node.textContent.substring(idx, idx + q.length);
      fragment.appendChild(mark);
      pos = idx + q.length;
      var remaining = node.textContent.substring(pos).toLowerCase();
      idx = remaining.indexOf(q);
      if (idx !== -1) idx += pos;
    }
    if (pos < node.textContent.length) {
      fragment.appendChild(document.createTextNode(node.textContent.substring(pos)));
    }
    node.parentNode.replaceChild(fragment, node);
  }
}

// More menu toggle
document.getElementById('noteEditorMore').addEventListener('click', function(e) {
  e.stopPropagation();
  var menu = document.getElementById('noteEditorMoreMenu');
  if (!menu) return;
  if (menu.style.display === 'none') {
    // Reset to default menu
    menu.innerHTML = '<button onclick="showTopicPicker()">📁 移到主题…</button>' +
      '<button onclick="moreDeleteNote()" style="color:var(--sunset-coral)">🗑 删除笔记</button>';
    menu.style.display = '';
  } else {
    menu.style.display = 'none';
  }
});

// Close more menu on outside click (skip if user just interacted with menu items)
var _moreMenuSkipClose = false;
document.addEventListener('click', function(e) {
  var menu = document.getElementById('noteEditorMoreMenu');
  var moreBtn = document.getElementById('noteEditorMore');
  if (!menu || !moreBtn) return;
  if (_moreMenuSkipClose) { _moreMenuSkipClose = false; return; }
  if (menu.style.display !== 'none' && !moreBtn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

function insertCheckbox() {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  bodyEl.focus();
  var html = '<span contenteditable="false" style="display:inline-block;width:16px;height:16px;border:2px solid #888;border-radius:3px;margin:0 4px;vertical-align:middle;cursor:pointer" onclick="this.innerHTML=this.innerHTML?\' \':\'✓\';this.style.background=this.innerHTML?\'#2EC4B6\':\'\'"> </span>&nbsp;';
  document.execCommand('insertHTML', false, html);
}

function formatNoteTimestampText(date) {
  function p2(v){return String(v).padStart(2,'0');}
  return date.getFullYear()+'.'+p2(date.getMonth()+1)+'.'+p2(date.getDate())+' · '+p2(date.getHours())+':'+p2(date.getMinutes())+':'+p2(date.getSeconds());
}
function insertNoteTimestamp() {
  if(!currentNoteId)return;
  if(noteEditorMode!=='edit')enterNoteEditMode();
  var bodyEl=focusNoteBodyPreserveSelection(); if(!bodyEl)return;
  var now=new Date(); var ms=now.getTime();
  var html='<span class="note-timestamp" contenteditable="false" data-note-timestamp="'+ms+'">'+escapeHtml(formatNoteTimestampText(now))+'</span>&nbsp;';
  document.execCommand('insertHTML',false,html); rememberNoteSelection(); noteAutoSave();
}
document.getElementById('noteTimestampBtn')?.addEventListener('click',function(e){e.preventDefault();insertNoteTimestamp();});

function runNoteHistoryCommand(cmd) {
  if(noteEditorMode!=='edit')return;
  focusNoteBodyPreserveSelection();
  try{document.execCommand(cmd,false,null);}catch(e){}
  rememberNoteSelection(); noteAutoSave(); setTimeout(updateToolbarState,10);
}
['noteHeaderUndo','noteHeaderRedo'].forEach(function(id){
  var btn=document.getElementById(id);if(!btn)return;
  btn.addEventListener('pointerdown',function(e){e.preventDefault();rememberNoteSelection();});
  btn.addEventListener('click',function(e){e.preventDefault();runNoteHistoryCommand(id==='noteHeaderUndo'?'undo':'redo');});
});
function isNoteReadInteractionTarget(target) {
  if(!target||!target.closest)return false;
  var bodyEl=document.getElementById('noteEditorBody');
  var island=target.closest('a[href],button,input,textarea,img[data-note-image-preview],[data-note-file-action],[data-note-file-menu],[data-note-image-remove],.note-file-card,.note-file-stack,.note-timestamp,[contenteditable="false"]');
  return !!(island && island!==bodyEl);
}
(function bindNoteReadEditShell(){
  var bodyEl=document.getElementById('noteEditorBody'); var titleEl=document.getElementById('noteEditorTitle'); if(!bodyEl)return;

  // The format bar must enter the Golden flex layout BEFORE Chromium performs its native
  // focus/default action and opens the IME. Do not preventDefault: Chromium still owns the
  // caret placement, selection semantics and keyboard opening path exactly as in V1.22.12.
  bodyEl.addEventListener('pointerdown',function(e){
    if(noteEditorMode!=='read'||isNoteReadInteractionTarget(e.target))return;
    setNoteEditorMode('edit',{hideKeyboard:false});
    requestAnimationFrame(function(){ syncCollapsedNoteTypingFormat(); updateToolbarState(); syncNoteImeLayout(); });
  },true);

  // Accessibility / keyboard-focus fallback for paths without pointerdown.
  bodyEl.addEventListener('focus',function(){
    if(noteEditorMode==='read') setNoteEditorMode('edit',{hideKeyboard:false});
  });

  if(titleEl)titleEl.addEventListener('pointerdown',function(){
    if(noteEditorMode!=='read')return;
    setNoteEditorMode('edit',{hideKeyboard:false});
    titleEl.readOnly=false;
  },true);
})();

// ===== Note image picker / inline image blocks =====
var noteImagePendingMarkerId = '';
var noteImageMarkerSeq = 0;
var noteLastSelectionRange = null;

function rememberNoteSelection() {
  var bodyEl = document.getElementById('noteEditorBody');
  var sel = window.getSelection();
  if (!bodyEl || !sel || !sel.rangeCount) return;
  var range = sel.getRangeAt(0);
  if (bodyEl.contains(range.commonAncestorContainer)) noteLastSelectionRange = range.cloneRange();
}

function insertImageMarkerAtCaret() {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return null;
  var marker = document.createElement('span');
  marker.id = 'noteImageMarker_' + Date.now() + '_' + (++noteImageMarkerSeq);
  marker.className = 'note-image-picker-marker';
  marker.setAttribute('contenteditable', 'false');

  var range = noteLastSelectionRange && bodyEl.contains(noteLastSelectionRange.commonAncestorContainer)
    ? noteLastSelectionRange.cloneRange() : null;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(bodyEl);
    range.collapse(false);
  }
  range = moveNoteInsertionRangeOutsideFileAnnotation(range, bodyEl);
  range.deleteContents();
  range.insertNode(marker);
  return marker;
}

function requestNoteImages() {
  if (!currentNoteId) return showToast('请先打开一条笔记');
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.pickNoteImages) {
    return showToast('添加图片仅支持 Android APP');
  }
  rememberNoteSelection();
  var oldMarker = noteImagePendingMarkerId ? document.getElementById(noteImagePendingMarkerId) : null;
  if (oldMarker) oldMarker.remove();
  var marker = insertImageMarkerAtCaret();
  if (!marker) return;
  noteImagePendingMarkerId = marker.id;
  try {
    var result = String(AndroidBridge.pickNoteImages(String(currentNoteId)));
    if (result !== 'ok') { marker.remove(); noteImagePendingMarkerId = ''; showToast('无法打开系统相册'); }
  } catch(e) {
    marker.remove(); noteImagePendingMarkerId = ''; showToast('无法打开系统相册');
  }
}

window.__onNoteImagesPicked = function(items) {
  items = Array.isArray(items) ? items : [];
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  var marker = noteImagePendingMarkerId ? document.getElementById(noteImagePendingMarkerId) : null;
  noteImagePendingMarkerId = '';
  if (!items.length) { if (marker) marker.remove(); return; }

  var grid = document.createElement('div');
  grid.className = 'note-image-grid' + (items.length === 1 ? ' note-image-grid--single' : '');
  grid.setAttribute('contenteditable', 'false');
  items.forEach(function(item) {
    if (!item || !item.url || !item.name) return;
    var fig = document.createElement('div');
    fig.className = 'note-image-item';
    fig.setAttribute('data-note-image-name', String(item.name));
    var img = document.createElement('img');
    img.src = String(item.url);
    img.alt = '笔记图片';
    img.setAttribute('data-note-image-preview', '1');
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'note-image-remove';
    remove.setAttribute('data-note-image-remove', '1');
    remove.setAttribute('aria-label', '删除图片');
    remove.textContent = '✕';
    fig.appendChild(img);
    fig.appendChild(remove);
    grid.appendChild(fig);
  });
  if (!grid.children.length) { if (marker) marker.remove(); return; }

  var spacer = document.createElement('div');
  spacer.innerHTML = '<br>';
  if (marker && marker.parentNode) {
    marker.parentNode.insertBefore(grid, marker);
    marker.parentNode.insertBefore(spacer, marker);
    marker.remove();
  } else {
    bodyEl.appendChild(grid); bodyEl.appendChild(spacer);
  }
  saveCurrentNote();
  showToast(items.length === 1 ? '已添加图片' : ('已添加 ' + items.length + ' 张图片'));
};

var noteImagePreviewScale = 1;
var noteImagePreviewX = 0;
var noteImagePreviewY = 0;
var noteImagePreviewPinchDistance = 0;
var noteImagePreviewPinchScale = 1;
var noteImagePreviewPinchX = 0;
var noteImagePreviewPinchY = 0;
var noteImagePreviewDragStartX = 0;
var noteImagePreviewDragStartY = 0;

function noteImagePreviewClamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function noteImagePreviewDistance(a, b) {
  var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
function clampNoteImagePreviewPan() {
  var overlay = document.getElementById('noteImagePreview');
  var img = document.getElementById('noteImagePreviewImg');
  if (!overlay || !img) return;
  if (noteImagePreviewScale <= 1.001) { noteImagePreviewX = 0; noteImagePreviewY = 0; return; }

  var scaledW = img.clientWidth * noteImagePreviewScale;
  var scaledH = img.clientHeight * noteImagePreviewScale;
  var maxX = Math.max(0, (scaledW - overlay.clientWidth) / 2);
  var maxY = Math.max(0, (scaledH - overlay.clientHeight) / 2);
  noteImagePreviewX = noteImagePreviewClamp(noteImagePreviewX, -maxX, maxX);
  noteImagePreviewY = noteImagePreviewClamp(noteImagePreviewY, -maxY, maxY);
}
function applyNoteImagePreviewTransform() {
  var img = document.getElementById('noteImagePreviewImg');
  if (!img) return;
  clampNoteImagePreviewPan();
  img.style.transform = 'translate3d(' + noteImagePreviewX + 'px,' + noteImagePreviewY + 'px,0) scale(' + noteImagePreviewScale + ')';
}
function resetNoteImagePreviewTransform() {
  noteImagePreviewScale = 1; noteImagePreviewX = 0; noteImagePreviewY = 0;
  noteImagePreviewPinchDistance = 0; noteImagePreviewPinchScale = 1;
  var img = document.getElementById('noteImagePreviewImg');
  if (img) img.style.transform = 'translate3d(0,0,0) scale(1)';
}
function onNoteImagePreviewTouchStart(e) {
  if (!e.touches) return;
  if (e.touches.length >= 2) {
    e.preventDefault();
    noteImagePreviewPinchDistance = Math.max(1, noteImagePreviewDistance(e.touches[0], e.touches[1]));
    noteImagePreviewPinchScale = noteImagePreviewScale;
    noteImagePreviewPinchX = noteImagePreviewX;
    noteImagePreviewPinchY = noteImagePreviewY;
    return;
  }
  if (e.touches.length === 1 && noteImagePreviewScale > 1.001) {
    noteImagePreviewDragStartX = e.touches[0].clientX - noteImagePreviewX;
    noteImagePreviewDragStartY = e.touches[0].clientY - noteImagePreviewY;
  }
}
function onNoteImagePreviewTouchMove(e) {
  if (!e.touches) return;
  if (e.touches.length >= 2) {
    e.preventDefault();
    var distance = Math.max(1, noteImagePreviewDistance(e.touches[0], e.touches[1]));
    var nextScale = noteImagePreviewClamp(noteImagePreviewPinchScale * distance / Math.max(1, noteImagePreviewPinchDistance), 1, 5);
    var factor = nextScale / Math.max(0.001, noteImagePreviewPinchScale);
    var focusX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - window.innerWidth / 2;
    var focusY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - window.innerHeight / 2;
    noteImagePreviewX = focusX - (focusX - noteImagePreviewPinchX) * factor;
    noteImagePreviewY = focusY - (focusY - noteImagePreviewPinchY) * factor;
    noteImagePreviewScale = nextScale;
    applyNoteImagePreviewTransform();
    return;
  }
  if (e.touches.length === 1 && noteImagePreviewScale > 1.001) {
    e.preventDefault();
    noteImagePreviewX = e.touches[0].clientX - noteImagePreviewDragStartX;
    noteImagePreviewY = e.touches[0].clientY - noteImagePreviewDragStartY;
    applyNoteImagePreviewTransform();
  }
}
function onNoteImagePreviewTouchEnd(e) {
  if (noteImagePreviewScale <= 1.01) {
    resetNoteImagePreviewTransform();
    return;
  }
  if (e.touches && e.touches.length === 1) {
    noteImagePreviewDragStartX = e.touches[0].clientX - noteImagePreviewX;
    noteImagePreviewDragStartY = e.touches[0].clientY - noteImagePreviewY;
  }
}

function openNoteImagePreview(src) {
  var overlay = document.getElementById('noteImagePreview');
  var img = document.getElementById('noteImagePreviewImg');
  if (!overlay || !img || !src) return;
  resetNoteImagePreviewTransform();
  img.src = src;
  overlay.style.display = 'flex';
  requestAnimationFrame(function() { overlay.classList.add('active'); });
  overlay.setAttribute('aria-hidden', 'false');
}
function closeNoteImagePreview() {
  var overlay = document.getElementById('noteImagePreview');
  var img = document.getElementById('noteImagePreviewImg');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  setTimeout(function() {
    if (!overlay.classList.contains('active')) {
      overlay.style.display = 'none';
      resetNoteImagePreviewTransform();
      if (img) img.removeAttribute('src');
    }
  }, 190);
}

document.getElementById('noteAddImageBtn')?.addEventListener('click', requestNoteImages);
document.getElementById('noteImagePreviewClose')?.addEventListener('click', closeNoteImagePreview);
document.getElementById('noteImagePreview')?.addEventListener('click', function(e) { if (e.target === e.currentTarget) closeNoteImagePreview(); });
var noteImagePreviewImg = document.getElementById('noteImagePreviewImg');
if (noteImagePreviewImg) {
  noteImagePreviewImg.addEventListener('touchstart', onNoteImagePreviewTouchStart, { passive: false });
  noteImagePreviewImg.addEventListener('touchmove', onNoteImagePreviewTouchMove, { passive: false });
  noteImagePreviewImg.addEventListener('touchend', onNoteImagePreviewTouchEnd, { passive: false });
  noteImagePreviewImg.addEventListener('touchcancel', onNoteImagePreviewTouchEnd, { passive: false });
}

// Inline note images are focus-safe interaction islands, just like file attachment cards.
// Intercept pointer-down before contenteditable can focus/reopen the IME, preserve the last caret,
// then commit the preview only on a short pointer-up so normal vertical note scrolling still works.
var noteImagePointerTap = null;
document.getElementById('noteEditorBody')?.addEventListener('pointerdown', function(e) {
  var img = e.target.closest('img[data-note-image-preview]');
  if (!img) return;
  e.preventDefault();
  e.stopPropagation();
  closeNoteKeyboardForOverlay();
  noteImagePointerTap = { img:img, x:e.clientX, y:e.clientY, pointerId:e.pointerId };
}, true);
document.getElementById('noteEditorBody')?.addEventListener('pointerup', function(e) {
  var tap = noteImagePointerTap; noteImagePointerTap = null;
  if (!tap || tap.pointerId !== e.pointerId) return;
  if (Math.abs(e.clientX - tap.x) > 12 || Math.abs(e.clientY - tap.y) > 12) return;
  e.preventDefault(); e.stopPropagation();
  openNoteImagePreview(tap.img.src);
}, true);
document.getElementById('noteEditorBody')?.addEventListener('pointercancel', function(){ noteImagePointerTap = null; }, true);

document.getElementById('noteEditorBody')?.addEventListener('click', function(e) {
  var remove = e.target.closest('[data-note-image-remove]');
  if (remove) {
    e.preventDefault(); e.stopPropagation();
    var fig = remove.closest('.note-image-item');
    var grid = remove.closest('.note-image-grid');
    var name = fig ? fig.getAttribute('data-note-image-name') : '';
    if (name && typeof AndroidBridge !== 'undefined' && AndroidBridge.deleteNoteImage) { try { AndroidBridge.deleteNoteImage(name); } catch(err) {} }
    if (fig) fig.remove();
    if (grid && !grid.querySelector('.note-image-item')) grid.remove();
    saveCurrentNote();
    showToast('图片已删除');
    return;
  }
  var img = e.target.closest('img[data-note-image-preview]');
  if (img) { e.preventDefault(); e.stopPropagation(); return; }
});

// ===== Note file picker / inline attachment cards =====
var noteFilePendingMarkerId = '';
var noteFileMarkerSeq = 0;
var activeNoteFileMeta = null;
var activeNoteFileCard = null;

function insertFileMarkerAtCaret(persistentExternal) {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return null;
  var marker = document.createElement('span');
  marker.id = 'noteFileMarker_' + Date.now() + '_' + (++noteFileMarkerSeq);
  marker.className = 'note-file-picker-marker';
  marker.setAttribute('contenteditable','false');
  if (persistentExternal && currentNoteId) marker.setAttribute('data-note-external-import', String(currentNoteId));
  var range = noteLastSelectionRange && bodyEl.contains(noteLastSelectionRange.commonAncestorContainer)
    ? noteLastSelectionRange.cloneRange() : null;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(bodyEl);
    range.collapse(false);
  }
  range = moveNoteInsertionRangeOutsideFileAnnotation(range, bodyEl);
  range.deleteContents();
  range.insertNode(marker);
  return marker;
}

function closeNoteKeyboardForOverlay() {
  var bodyEl = document.getElementById('noteEditorBody');
  var titleEl = document.getElementById('noteEditorTitle');
  rememberNoteSelection();
  if (bodyEl && document.activeElement === bodyEl) bodyEl.blur();
  if (titleEl && document.activeElement === titleEl) titleEl.blur();
  try { if (typeof AndroidBridge !== 'undefined' && AndroidBridge.hideNoteKeyboard) AndroidBridge.hideNoteKeyboard(); } catch(e) {}
}

function openNoteFileImportSheet() {
  if (!currentNoteId) return showToast('请先打开一条笔记');
  rememberNoteSelection();
  closeNoteKeyboardForOverlay();
  var overlay = document.getElementById('noteFileImportOverlay');
  var home = document.getElementById('noteFileImportHome');
  var recent = document.getElementById('noteFileRecentPanel');
  if (!overlay) return;
  if (home) home.style.display = '';
  if (recent) recent.classList.remove('active');
  overlay.style.display = 'flex';
  requestAnimationFrame(function(){ overlay.classList.add('active'); });
  overlay.setAttribute('aria-hidden','false');
}
function closeNoteFileImportSheet() {
  var overlay = document.getElementById('noteFileImportOverlay');
  if (!overlay) return;
  overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true');
  setTimeout(function(){ if (!overlay.classList.contains('active')) overlay.style.display = 'none'; }, 190);
}

function ensureNoteFileMarker(persistentExternal) {
  var oldMarker = noteFilePendingMarkerId ? document.getElementById(noteFilePendingMarkerId) : null;
  if (oldMarker) oldMarker.remove();
  var marker = insertFileMarkerAtCaret(!!persistentExternal);
  if (!marker) return null;
  noteFilePendingMarkerId = marker.id;
  return marker;
}

function requestNoteFiles() {
  if (!currentNoteId) return showToast('请先打开一条笔记');
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.pickNoteFiles) return showToast('添加文件仅支持 Android APP');
  var marker = ensureNoteFileMarker(false);
  if (!marker) return;
  closeNoteFileImportSheet();
  try {
    var result = String(AndroidBridge.pickNoteFiles(String(currentNoteId)));
    if (result !== 'ok') { marker.remove(); noteFilePendingMarkerId = ''; showToast('无法打开系统文件选择器'); }
  } catch(e) {
    marker.remove(); noteFilePendingMarkerId = ''; showToast('无法打开系统文件选择器');
  }
}

function requestExternalNoteFiles(target) {
  if (!currentNoteId) return showToast('请先打开一条笔记');
  if (typeof AndroidBridge === 'undefined' || !AndroidBridge.beginExternalNoteImport) return showToast('聊天导入仅支持 Android APP');
  var marker = ensureNoteFileMarker(true);
  if (!marker) return;
  saveCurrentNote(); // persist the marker so process recreation can still restore the insertion point
  closeNoteFileImportSheet();
  try {
    var result = String(AndroidBridge.beginExternalNoteImport(String(currentNoteId), String(target)));
    if (result !== 'ok') {
      marker.remove(); noteFilePendingMarkerId = '';
      saveCurrentNote();
      showToast(target === 'wechat' ? '未检测到微信' : '未检测到 QQ');
    }
  } catch(e) {
    marker.remove(); noteFilePendingMarkerId = '';
    saveCurrentNote();
    showToast('暂时无法打开对应应用');
  }
}

function noteFileExtension(displayName, mime) {
  var name = String(displayName || '');
  var idx = name.lastIndexOf('.');
  var ext = idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
  if (!ext && mime === 'application/pdf') ext = 'pdf';
  if (!ext && mime && mime.indexOf('text/') === 0) ext = 'txt';
  return ext || 'file';
}
function noteFileBadgeLabel(ext) {
  var e = String(ext || 'file').toUpperCase();
  if (e === 'MARKDOWN') e = 'MD';
  if (e === 'JPEG') e = 'JPG';
  return e.length > 5 ? 'FILE' : e;
}
function noteFileBadgeClass(ext) {
  var e = String(ext || '').toLowerCase();
  return e === '7z' ? 'sevenzip' : e.replace(/[^a-z0-9_-]/g,'');
}
function noteFileSizeLabel(bytes) {
  var n = Number(bytes);
  if (!isFinite(n) || n < 0) return '未知大小';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}
function createNoteFileCard(item) {
  if (!item || !item.name) return null;
  var displayName = String(item.displayName || item.name);
  var mime = String(item.mime || 'application/octet-stream');
  var size = Number(item.size || 0);
  var ext = noteFileExtension(displayName, mime);
  var card = document.createElement('div');
  card.className = 'note-file-card';
  card.setAttribute('contenteditable','false');
  card.setAttribute('data-note-file-name', String(item.name));
  card.setAttribute('data-note-file-display', displayName);
  card.setAttribute('data-note-file-mime', mime);
  card.setAttribute('data-note-file-size', String(size));
  card.setAttribute('data-note-file-ext', ext);

  var badge = document.createElement('div');
  badge.className = 'note-file-card__badge ' + noteFileBadgeClass(ext);
  badge.textContent = noteFileBadgeLabel(ext);
  var main = document.createElement('div');
  main.className = 'note-file-card__main';
  var name = document.createElement('div');
  name.className = 'note-file-card__name'; name.textContent = displayName;
  var meta = document.createElement('div');
  meta.className = 'note-file-card__meta'; meta.textContent = noteFileBadgeLabel(ext) + ' · ' + noteFileSizeLabel(size) + ' · 点击预览';
  main.appendChild(name); main.appendChild(meta);
  var more = document.createElement('button');
  more.type = 'button'; more.className = 'note-file-card__more'; more.setAttribute('data-note-file-more','1'); more.setAttribute('aria-label','更多文件操作'); more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="12" cy="19" r="1.8"></circle></svg>';
  card.appendChild(badge); card.appendChild(main); card.appendChild(more);
  return card;
}

function insertPickedFileItems(items, externalNoteId) {
  items = Array.isArray(items) ? items : [];
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  var marker = noteFilePendingMarkerId ? document.getElementById(noteFilePendingMarkerId) : null;
  if (!marker && externalNoteId) marker = bodyEl.querySelector('[data-note-external-import="' + externalNoteId + '"]');
  noteFilePendingMarkerId = '';
  if (!items.length) { if (marker) marker.remove(); saveCurrentNote(); return; }
  var stack = document.createElement('div');
  stack.className = 'note-file-stack'; stack.setAttribute('contenteditable','false');
  items.forEach(function(item) { var card = createNoteFileCard(item); if (card) stack.appendChild(card); });
  if (!stack.children.length) { if (marker) marker.remove(); return; }
  var spacer = document.createElement('div'); spacer.innerHTML = '<br>';
  if (marker && marker.parentNode) {
    marker.parentNode.insertBefore(stack, marker);
    marker.parentNode.insertBefore(spacer, marker);
    marker.remove();
  } else { bodyEl.appendChild(stack); bodyEl.appendChild(spacer); }
  saveCurrentNote();
  showToast(items.length === 1 ? '已添加文件' : ('已添加 ' + items.length + ' 个文件'));
}
window.__onNoteFilesPicked = function(items) { insertPickedFileItems(items, null); };
window.__onExternalNoteFilesPicked = function(noteId, items) {
  noteId = Number(noteId || 0);
  items = Array.isArray(items) ? items : [];
  if (noteId <= 0) noteId = Number(currentNoteId || 0);
  if (noteId <= 0) {
    // A system share target can be invoked even when no Note is open. Do not leave orphan files.
    try {
      if (typeof AndroidBridge !== 'undefined' && AndroidBridge.deleteNoteFile) {
        items.forEach(function(item){ if (item && item.name) AndroidBridge.deleteNoteFile(String(item.name)); });
      }
    } catch(e) {}
    return showToast('请先打开一条笔记，再从其他应用导入附件');
  }
  var finish = function() { insertPickedFileItems(items, noteId); };
  if (currentMode !== 'notes') applyMode('notes');
  if (currentNoteId !== noteId) {
    var note = getNoteById(noteId);
    if (!note) return showToast('原笔记已不存在，未导入附件');
    openNoteEditor(noteId, { preserveKeyboard:false, restoreExternalMarker:true });
    setTimeout(finish, 40);
  } else finish();
};
window.__onExternalNoteImportCancelled = function(noteId) {
  noteId = Number(noteId || 0);
  var bodyEl = document.getElementById('noteEditorBody');
  if (bodyEl && currentNoteId === noteId) {
    var marker = bodyEl.querySelector('[data-note-external-import="' + noteId + '"]');
    if (marker) marker.remove();
    noteFilePendingMarkerId = '';
    saveCurrentNote();
  } else {
    var note = getNoteById(noteId);
    if (note && note.content) {
      var host = document.createElement('div'); host.innerHTML = note.content;
      host.querySelectorAll('[data-note-external-import="' + noteId + '"]').forEach(function(el){ el.remove(); });
      note.content = host.innerHTML; saveNotes();
    }
  }
};

function noteFileCardMeta(card) {
  if (!card) return null;
  return {
    name: card.getAttribute('data-note-file-name') || '',
    displayName: card.getAttribute('data-note-file-display') || '附件',
    mime: card.getAttribute('data-note-file-mime') || 'application/octet-stream',
    size: Number(card.getAttribute('data-note-file-size') || 0),
    ext: card.getAttribute('data-note-file-ext') || 'file'
  };
}
function noteFileAnnotationIsEmpty(annotation) {
  if (!annotation) return true;
  var text = String(annotation.textContent || '').replace(/[\u200B\u00A0]/g, ' ').trim();
  if (text) return false;
  // Keep deliberate non-text inline content (for example a checkbox) if the user inserted one.
  return !annotation.querySelector('img,video,audio,[contenteditable="false"]');
}
function findNoteFileAnnotation(fileName, root) {
  fileName = String(fileName || '');
  if (!fileName) return null;
  root = root || document.getElementById('noteEditorBody');
  if (!root) return null;
  var items = root.querySelectorAll('.note-file-annotation[data-note-file-annotation-for]');
  for (var i = 0; i < items.length; i++) {
    if (String(items[i].getAttribute('data-note-file-annotation-for') || '') === fileName) return items[i];
  }
  return null;
}
function createNoteFileStackShell() {
  var stack = document.createElement('div');
  stack.className = 'note-file-stack';
  stack.setAttribute('contenteditable','false');
  return stack;
}
function isolateNoteFileCardStack(card) {
  var stack = card ? card.closest('.note-file-stack') : null;
  if (!stack || !stack.parentNode) return stack;
  var cards = Array.prototype.filter.call(stack.children, function(child) {
    return child.classList && child.classList.contains('note-file-card');
  });
  if (cards.length <= 1) return stack;
  var idx = cards.indexOf(card);
  if (idx < 0) return stack;
  var fragment = document.createDocumentFragment();
  var selectedStack = null;
  function appendGroup(group) {
    if (!group.length) return null;
    var nextStack = createNoteFileStackShell();
    group.forEach(function(item){ nextStack.appendChild(item); });
    fragment.appendChild(nextStack);
    return nextStack;
  }
  appendGroup(cards.slice(0, idx));
  selectedStack = appendGroup([card]);
  appendGroup(cards.slice(idx + 1));
  stack.parentNode.replaceChild(fragment, stack);
  return selectedStack;
}
function noteFileStackHasFollowingAnnotation(stack) {
  if (!stack || !stack.classList || !stack.classList.contains('note-file-stack')) return false;
  var annotation = stack.nextElementSibling;
  if (!annotation || !annotation.classList || !annotation.classList.contains('note-file-annotation')) return false;
  var fileName = String(annotation.getAttribute('data-note-file-annotation-for') || '');
  var cards = stack.querySelectorAll('.note-file-card[data-note-file-name]');
  for (var i = 0; i < cards.length; i++) {
    if (String(cards[i].getAttribute('data-note-file-name') || '') === fileName) return true;
  }
  return false;
}
function mergeAdjacentNoteFileStacks(stack) {
  if (!stack || !stack.parentNode || !stack.classList.contains('note-file-stack')) return stack;
  var prev = stack.previousElementSibling;
  if (prev && prev.classList.contains('note-file-stack') && !noteFileStackHasFollowingAnnotation(prev)) {
    while (stack.firstElementChild) prev.appendChild(stack.firstElementChild);
    stack.remove();
    stack = prev;
  }
  var next = stack.nextElementSibling;
  while (next && next.classList.contains('note-file-stack') && !noteFileStackHasFollowingAnnotation(next)) {
    while (next.firstElementChild) stack.appendChild(next.firstElementChild);
    var removeNext = next;
    next = next.nextElementSibling;
    removeNext.remove();
  }
  return stack;
}
function removeNoteFileAnnotation(annotation, mergeStacks) {
  if (!annotation || !annotation.parentNode) return false;
  var prevStack = annotation.previousElementSibling;
  annotation.remove();
  if (mergeStacks && prevStack && prevStack.classList && prevStack.classList.contains('note-file-stack')) {
    mergeAdjacentNoteFileStacks(prevStack);
  }
  return true;
}
function cleanupNoteFileAnnotations(root) {
  root = root || document.getElementById('noteEditorBody');
  if (!root) return false;
  var changed = false;
  var annotations = Array.from(root.querySelectorAll('.note-file-annotation[data-note-file-annotation-for]'));
  annotations.forEach(function(annotation) {
    var fileName = String(annotation.getAttribute('data-note-file-annotation-for') || '');
    var cardFound = false;
    root.querySelectorAll('.note-file-card[data-note-file-name]').forEach(function(card) {
      if (String(card.getAttribute('data-note-file-name') || '') === fileName) cardFound = true;
    });
    if (!fileName || !cardFound || noteFileAnnotationIsEmpty(annotation)) {
      if (removeNoteFileAnnotation(annotation, true)) changed = true;
    }
  });
  return changed;
}
function focusNoteFileAnnotation(annotation) {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!annotation || !annotation.isConnected || !bodyEl || !bodyEl.contains(annotation)) return;
  // The annotation stays part of the one existing contenteditable body; do not create a nested editor/focus owner.
  try { bodyEl.focus({preventScroll:true}); } catch(e) { bodyEl.focus(); }
  try {
    var range = document.createRange();
    range.selectNodeContents(annotation);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    noteLastSelectionRange = range.cloneRange();
  } catch(e2) {}
  setTimeout(function(){ syncCollapsedNoteTypingFormat(); updateToolbarState(); }, 0);
}
function openActiveNoteFileAnnotation() {
  var card = activeNoteFileCard;
  var meta = activeNoteFileMeta;
  if (!card || !meta || !meta.name) return;
  var annotation = findNoteFileAnnotation(meta.name);
  if (!annotation) {
    var stack = isolateNoteFileCardStack(card);
    if (!stack || !stack.parentNode) return;
    annotation = document.createElement('div');
    annotation.className = 'note-file-annotation note-file-annotation--enter';
    annotation.setAttribute('role','textbox');
    annotation.setAttribute('aria-multiline','true');
    annotation.setAttribute('aria-label','附件附注');
    annotation.setAttribute('data-note-file-annotation-for', meta.name);
    stack.parentNode.insertBefore(annotation, stack.nextSibling);
    setTimeout(function(){ if (annotation && annotation.isConnected) annotation.classList.remove('note-file-annotation--enter'); }, 240);
  }
  closeNoteFileActions();
  setTimeout(function(){ focusNoteFileAnnotation(annotation); }, 205);
}
function moveNoteInsertionRangeOutsideFileAnnotation(range, bodyEl) {
  if (!range || !bodyEl) return range;
  var node = range.commonAncestorContainer;
  var el = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
  var annotation = el ? el.closest('.note-file-annotation[data-note-file-annotation-for]') : null;
  if (annotation && bodyEl.contains(annotation)) {
    try {
      range.selectNode(annotation);
      range.collapse(false);
    } catch(e) {}
  }
  return range;
}

function previewNoteFileCard(card) {
  var meta = noteFileCardMeta(card);
  if (!meta || !meta.name || typeof AndroidBridge === 'undefined') return showToast('文件不可用');
  closeNoteKeyboardForOverlay();
  var result = 'failed';
  try { result = String(AndroidBridge.previewNoteFile(meta.name, meta.displayName, meta.mime)); } catch(e) { result = 'failed'; }
  if (result === 'unavailable') showToast('没有可预览或打开此文件的应用');
  else if (result !== 'ok') showToast('暂时无法打开这个文件');
}
function openNoteFileActions(card) {
  if (!card) return;
  closeNoteKeyboardForOverlay();
  activeNoteFileCard = card;
  activeNoteFileMeta = noteFileCardMeta(card);
  var overlay = document.getElementById('noteFileActionsOverlay');
  var nameEl = document.getElementById('noteFileActionsName');
  var metaEl = document.getElementById('noteFileActionsMeta');
  var annotationBtn = document.getElementById('noteFileAnnotationAction');
  if (!overlay || !activeNoteFileMeta) return;
  if (nameEl) nameEl.textContent = activeNoteFileMeta.displayName;
  if (metaEl) metaEl.textContent = noteFileBadgeLabel(activeNoteFileMeta.ext) + ' · ' + noteFileSizeLabel(activeNoteFileMeta.size);
  if (annotationBtn) annotationBtn.textContent = findNoteFileAnnotation(activeNoteFileMeta.name) ? '编辑附注' : '＋ 附注';
  overlay.style.display = 'flex';
  requestAnimationFrame(function(){ overlay.classList.add('active'); });
  overlay.setAttribute('aria-hidden','false');
}
function closeNoteFileActions() {
  var overlay = document.getElementById('noteFileActionsOverlay');
  if (!overlay) return;
  overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true');
  setTimeout(function(){ if (!overlay.classList.contains('active')) overlay.style.display = 'none'; }, 190);
}
function deleteActiveNoteFileAttachment() {
  if (!activeNoteFileMeta || !activeNoteFileCard) return;
  var fileName = activeNoteFileMeta.name;
  var card = activeNoteFileCard;
  var stack = card.closest('.note-file-stack');
  var annotation = findNoteFileAnnotation(fileName);
  var mergeAnchor = stack ? stack.previousElementSibling : null;
  try { if (typeof AndroidBridge !== 'undefined' && AndroidBridge.deleteNoteFile) AndroidBridge.deleteNoteFile(fileName); } catch(e) {}
  if (annotation) annotation.remove();
  card.remove();
  if (stack && !stack.querySelector('.note-file-card')) {
    var nextStack = stack.nextElementSibling;
    stack.remove();
    if (mergeAnchor && mergeAnchor.classList && mergeAnchor.classList.contains('note-file-stack')) mergeAdjacentNoteFileStacks(mergeAnchor);
    else if (nextStack && nextStack.classList && nextStack.classList.contains('note-file-stack')) mergeAdjacentNoteFileStacks(nextStack);
  }
  activeNoteFileMeta = null; activeNoteFileCard = null;
  closeNoteFileActions();
  saveCurrentNote();
  showToast('已删除附件');
}
function runNoteFileAction(action) {
  if (!activeNoteFileMeta || !activeNoteFileMeta.name || typeof AndroidBridge === 'undefined') return showToast('文件不可用');
  if (action === 'delete') return deleteActiveNoteFileAttachment();
  var result = 'failed';
  try {
    if (action === 'more') result = String(AndroidBridge.openNoteFileExternally(activeNoteFileMeta.name, activeNoteFileMeta.displayName, activeNoteFileMeta.mime));
    else result = String(AndroidBridge.shareNoteFile(activeNoteFileMeta.name, action));
  } catch(e) { result = 'failed'; }
  closeNoteFileActions();
  if (result === 'unavailable') showToast(action === 'wechat' ? '未检测到可用的微信' : action === 'qq' ? '未检测到可用的 QQ' : '没有可打开此文件的专业应用');
  else if (result !== 'ok') showToast('暂时无法处理这个文件');
}

function collectRecentNoteFiles() {
  var found = [], seen = {};
  var ordered = notes.slice().sort(function(a,b){ return (b.updatedAt||0) - (a.updatedAt||0); });
  ordered.forEach(function(note) {
    if (!note || !note.content) return;
    var host = document.createElement('div'); host.innerHTML = note.content;
    host.querySelectorAll('.note-file-card[data-note-file-name]').forEach(function(card) {
      var meta = noteFileCardMeta(card);
      if (!meta || !meta.name || seen[meta.name]) return;
      seen[meta.name] = true; found.push(meta);
    });
  });
  return found.slice(0, 20);
}
function showRecentNoteFiles() {
  var home = document.getElementById('noteFileImportHome');
  var panel = document.getElementById('noteFileRecentPanel');
  var list = document.getElementById('noteFileRecentList');
  if (!panel || !list) return;
  if (home) home.style.display = 'none'; panel.classList.add('active');
  var items = collectRecentNoteFiles();
  if (!items.length) { list.innerHTML = '<div class="note-file-recent-empty">还没有可以复用的附件。<br>先从文件、微信或 QQ 导入一次吧。</div>'; return; }
  list.innerHTML = items.map(function(item, idx) {
    var ext = noteFileExtension(item.displayName,item.mime);
    return '<label class="note-file-recent-item"><input type="checkbox" data-recent-index="' + idx + '"><span class="note-file-recent-badge">' + escapeHtml(noteFileBadgeLabel(ext)) + '</span><span class="note-file-recent-copy"><span class="note-file-recent-name">' + escapeHtml(item.displayName) + '</span><span class="note-file-recent-meta">' + escapeHtml(noteFileBadgeLabel(ext) + ' · ' + noteFileSizeLabel(item.size)) + '</span></span></label>';
  }).join('');
  list._recentItems = items;
}
function addSelectedRecentNoteFiles() {
  var list = document.getElementById('noteFileRecentList');
  if (!list || !list._recentItems || typeof AndroidBridge === 'undefined' || !AndroidBridge.cloneNoteFile) return;
  var chosen = [];
  list.querySelectorAll('input[data-recent-index]:checked').forEach(function(input) {
    var item = list._recentItems[Number(input.getAttribute('data-recent-index'))]; if (item) chosen.push(item);
  });
  if (!chosen.length) return showToast('请选择至少一个文件');
  var marker = ensureNoteFileMarker(false); if (!marker) return;
  var cloned = [];
  chosen.slice(0,20).forEach(function(item) {
    try {
      var raw = String(AndroidBridge.cloneNoteFile(item.name, String(currentNoteId), item.displayName, item.mime));
      var obj = JSON.parse(raw); if (obj && obj.name) cloned.push(obj);
    } catch(e) {}
  });
  closeNoteFileImportSheet();
  insertPickedFileItems(cloned, null);
}

document.getElementById('noteAddFileBtn')?.addEventListener('click', openNoteFileImportSheet);
document.getElementById('noteFileImportCancel')?.addEventListener('click', closeNoteFileImportSheet);
document.getElementById('noteFileImportOverlay')?.addEventListener('click', function(e){ if (e.target === e.currentTarget) closeNoteFileImportSheet(); });
document.querySelectorAll('[data-note-import]').forEach(function(btn){ btn.addEventListener('click', function(){ var type=btn.getAttribute('data-note-import'); if(type==='phone') requestNoteFiles(); else if(type==='recent') showRecentNoteFiles(); else requestExternalNoteFiles(type); }); });
document.getElementById('noteFileRecentBack')?.addEventListener('click', function(){ var home=document.getElementById('noteFileImportHome'); var panel=document.getElementById('noteFileRecentPanel'); if(home) home.style.display=''; if(panel) panel.classList.remove('active'); });
document.getElementById('noteFileRecentAdd')?.addEventListener('click', addSelectedRecentNoteFiles);
document.getElementById('noteFileActionsCancel')?.addEventListener('click', closeNoteFileActions);
document.getElementById('noteFileAnnotationAction')?.addEventListener('click', openActiveNoteFileAnnotation);
document.getElementById('noteFileActionsOverlay')?.addEventListener('click', function(e){ if (e.target === e.currentTarget) closeNoteFileActions(); });
document.querySelectorAll('[data-note-file-action]').forEach(function(btn){ btn.addEventListener('click', function(){ runNoteFileAction(btn.getAttribute('data-note-file-action')); }); });

// ===== Note file attachment keyboard-delete guard =====
// contenteditable=false protects the card's interior, but Chromium can still remove the whole atomic
// node when Backspace/Delete is pressed next to it. File attachments are intentionally durable:
// the only supported destructive path is the explicit three-dot -> 删除附件 action above.
var noteFileDeleteGuardToastAt = 0;

function noteProtectedFileNodes(bodyEl) {
  if (!bodyEl) return [];
  var nodes = Array.from(bodyEl.querySelectorAll('.note-file-stack'));
  // Legacy/recovery safety: also protect a standalone card if a malformed/older note has no stack wrapper.
  bodyEl.querySelectorAll('.note-file-card[data-note-file-name]').forEach(function(card) {
    if (!card.closest('.note-file-stack')) nodes.push(card);
  });
  return nodes;
}

function noteRangeIntersectsProtectedFile(range, bodyEl) {
  if (!range || range.collapsed || !bodyEl) return false;
  var nodes = noteProtectedFileNodes(bodyEl);
  for (var i = 0; i < nodes.length; i++) {
    try { if (range.intersectsNode(nodes[i])) return true; } catch(e) {}
  }
  return false;
}

function noteDeletionGapHasBarrier(fragment) {
  if (!fragment) return false;
  var text = String(fragment.textContent || '').replace(/[\u200B\u00A0]/g, ' ').trim();
  if (text) return true;
  // Empty wrappers / BR-only spacer lines are transparent for this guard because Android Chromium can
  // otherwise collapse them together with the neighboring contenteditable=false attachment.
  return !!fragment.querySelector('img,video,audio,canvas,svg,hr,table,input,textarea,button,select,[contenteditable="false"]:not(.note-file-stack):not(.note-file-card)');
}

function noteCaretTouchesProtectedFile(range, direction, bodyEl) {
  if (!range || !range.collapsed || !bodyEl) return false;
  var nodes = noteProtectedFileNodes(bodyEl);
  var container = range.startContainer;
  var offset = range.startOffset;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node || !node.parentNode) continue;
    var parent = node.parentNode;
    var index = Array.prototype.indexOf.call(parent.childNodes, node);
    if (index < 0) continue;

    try {
      var gap = document.createRange();
      if (direction === 'backward') {
        // The point immediately after this attachment must be at/before the caret.
        if (range.comparePoint(parent, index + 1) > 0) continue;
        gap.setStart(parent, index + 1);
        gap.setEnd(container, offset);
      } else if (direction === 'forward') {
        // The point immediately before this attachment must be at/after the caret.
        if (range.comparePoint(parent, index) < 0) continue;
        gap.setStart(container, offset);
        gap.setEnd(parent, index);
      } else {
        continue;
      }
      if (!noteDeletionGapHasBarrier(gap.cloneContents())) return true;
    } catch(e) {}
  }
  return false;
}

function shouldBlockNoteFileDeletion(range, direction, bodyEl) {
  if (!range || !bodyEl) return false;
  if (noteRangeIntersectsProtectedFile(range, bodyEl)) return true;
  return range.collapsed && noteCaretTouchesProtectedFile(range, direction, bodyEl);
}

function notifyProtectedNoteFileDelete() {
  var now = Date.now();
  if (now - noteFileDeleteGuardToastAt < 900) return;
  noteFileDeleteGuardToastAt = now;
  showToast('附件请通过三点菜单删除');
}

var noteFileDeleteGuardBody = document.getElementById('noteEditorBody');
if (noteFileDeleteGuardBody) {
  // Soft keyboards / IMEs primarily surface deletion through beforeinput on Android WebView.
  noteFileDeleteGuardBody.addEventListener('beforeinput', function(e) {
    var inputType = String(e.inputType || '');
    if (inputType.indexOf('delete') !== 0) return;
    var range = getNoteEditorSelectionRange();
    if (!range) return;
    var direction = /Backward/i.test(inputType) ? 'backward' : (/Forward/i.test(inputType) ? 'forward' : 'selection');
    if (!shouldBlockNoteFileDeletion(range, direction, noteFileDeleteGuardBody)) return;
    e.preventDefault();
    notifyProtectedNoteFileDelete();
  }, true);

  // Hardware-keyboard fallback. preventDefault here suppresses the native deletion before it can reach
  // Chromium's atomic-node removal path; normal text Backspace/Delete remains untouched.
  noteFileDeleteGuardBody.addEventListener('keydown', function(e) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    var range = getNoteEditorSelectionRange();
    if (!range) return;
    var direction = e.key === 'Backspace' ? 'backward' : 'forward';
    if (!shouldBlockNoteFileDeletion(range, direction, noteFileDeleteGuardBody)) return;
    e.preventDefault();
    notifyProtectedNoteFileDelete();
  }, true);
}

// Plain Enter at the annotation root would make Chromium clone the whole block as a sibling.
// Convert only that root-level paragraph action into a line break so one file always keeps one annotation.
// Structured content such as UL/OL/LI keeps Chromium's native paragraph/list behavior.
document.getElementById('noteEditorBody')?.addEventListener('beforeinput', function(e) {
  if (String(e.inputType || '') !== 'insertParagraph') return;
  var bodyEl = document.getElementById('noteEditorBody');
  var range = getNoteEditorSelectionRange();
  if (!bodyEl || !range) return;
  var node = range.commonAncestorContainer;
  var el = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
  var annotation = el ? el.closest('.note-file-annotation[data-note-file-annotation-for]') : null;
  if (!annotation || !bodyEl.contains(annotation)) return;
  var innerBlock = el ? el.closest('li,p,div,blockquote,pre') : null;
  if (innerBlock && innerBlock !== annotation && annotation.contains(innerBlock)) return;
  e.preventDefault();
  syncCollapsedNoteTypingFormat();
  document.execCommand('insertLineBreak', false, null);
  noteAutoSave();
});

// Empty attachment notes are ephemeral: tapping elsewhere removes them instead of leaving a blank card.
// Toolbar taps are exempt so the user can choose B/S/H/list formatting before typing.
document.addEventListener('pointerdown', function(e) {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  var annotations = Array.from(bodyEl.querySelectorAll('.note-file-annotation[data-note-file-annotation-for]'));
  var changed = false;
  annotations.forEach(function(annotation) {
    if (!noteFileAnnotationIsEmpty(annotation) || annotation.contains(e.target)) return;
    if (e.target.closest && (e.target.closest('#noteFormatBar') || e.target.closest('#colorPickerPop'))) return;
    if (removeNoteFileAnnotation(annotation, true)) changed = true;
  });
  if (changed) saveCurrentNote();
}, true);

// Attachment cards are focus-safe interaction islands inside contenteditable.
// Pointer-down only removes editor focus; the action commits on a short pointer-up so vertical scrolling still works.
var noteFilePointerTap = null;
document.getElementById('noteEditorBody')?.addEventListener('pointerdown', function(e) {
  var card = e.target.closest('.note-file-card[data-note-file-name]');
  if (!card) return;
  // Suppress contenteditable's default focus action before it can reopen the IME.
  // touch-action:pan-y on the card still leaves vertical note scrolling to the browser.
  e.preventDefault();
  e.stopPropagation();
  closeNoteKeyboardForOverlay();
  noteFilePointerTap = { card:card, more:!!e.target.closest('.note-file-card__more'), x:e.clientX, y:e.clientY, pointerId:e.pointerId };
}, true);
document.getElementById('noteEditorBody')?.addEventListener('pointerup', function(e) {
  var tap = noteFilePointerTap; noteFilePointerTap = null;
  if (!tap || tap.pointerId !== e.pointerId) return;
  if (Math.abs(e.clientX - tap.x) > 12 || Math.abs(e.clientY - tap.y) > 12) return;
  e.preventDefault(); e.stopPropagation();
  if (tap.more) openNoteFileActions(tap.card); else previewNoteFileCard(tap.card);
}, true);
document.getElementById('noteEditorBody')?.addEventListener('pointercancel', function(){ noteFilePointerTap = null; }, true);

// ===== Note http(s) auto-linking =====
// V1.22.7 safety model, inspired by mature editors: explicit-protocol only (no fuzzy domain guesses),
// link only the just-completed token / pasted token, and never rewrite the full editor while typing.
// Existing notes are migrated before focus in openNoteEditor(), where no live caret/IME exists.
var notePendingUrlCandidate = null;
var noteAutoLinkBusy = false;

function isAllowedNoteHttpUrl(value) {
  value = String(value || '').trim();
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    var parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (!parsed.hostname) return false;
    // Avoid silently creating credential-bearing links from plain text.
    if (parsed.username || parsed.password) return false;
    return true;
  } catch(e) { return false; }
}

function trimNoteUrlTail(value) {
  var token = String(value || '');
  // Common sentence punctuation should remain plain text after the link.
  while (/[.,，。;；:：!?！？、"'”’」』]$/.test(token)) token = token.slice(0, -1);
  var pairs = {')':'(', ']':'[', '}':'{', '）':'（', '】':'【', '》':'《'};
  var changed = true;
  while (changed && token) {
    changed = false;
    var close = token.charAt(token.length - 1);
    var open = pairs[close];
    if (!open) break;
    var opens = 0, closes = 0;
    for (var i = 0; i < token.length; i++) {
      if (token.charAt(i) === open) opens++;
      if (token.charAt(i) === close) closes++;
    }
    if (closes > opens) { token = token.slice(0, -1); changed = true; }
  }
  return token;
}

function noteNodeIsLinkifiableText(node, root) {
  if (!node || node.nodeType !== 3 || !root || !root.contains(node)) return false;
  var parent = node.parentElement;
  if (!parent) return false;
  if (parent.closest('a')) return false;
  if (parent.closest('[contenteditable="false"],.note-file-card,.note-image-grid,.note-image-picker-marker,.note-file-picker-marker')) return false;
  return true;
}

function noteCaretTextOffset(root) {
  var sel = window.getSelection();
  if (!root || !sel || !sel.rangeCount || !root.contains(sel.anchorNode)) return null;
  try {
    var r = document.createRange();
    r.selectNodeContents(root);
    r.setEnd(sel.anchorNode, sel.anchorOffset);
    return r.toString().length;
  } catch(e) { return null; }
}

function restoreNoteCaretTextOffset(root, offset) {
  if (!root || offset == null) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var remaining = Math.max(0, Number(offset) || 0), node;
  while ((node = walker.nextNode())) {
    var len = (node.nodeValue || '').length;
    if (remaining <= len) {
      try {
        var range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        return;
      } catch(e) { return; }
    }
    remaining -= len;
  }
  try {
    var endRange = document.createRange();
    endRange.selectNodeContents(root); endRange.collapse(false);
    var endSel = window.getSelection();
    endSel.removeAllRanges(); endSel.addRange(endRange);
  } catch(e2) {}
}

function noteUrlCandidateBeforeCaret() {
  var bodyEl = document.getElementById('noteEditorBody');
  var sel = window.getSelection();
  if (!bodyEl || !sel || !sel.rangeCount || !sel.isCollapsed || !bodyEl.contains(sel.anchorNode)) return null;
  var node = sel.anchorNode;
  var offset = sel.anchorOffset;
  if (node && node.nodeType === 1 && offset > 0) {
    var prev = node.childNodes[offset - 1];
    if (prev && prev.nodeType === 3) { node = prev; offset = (prev.nodeValue || '').length; }
  }
  if (!noteNodeIsLinkifiableText(node, bodyEl)) return null;
  var text = node.nodeValue || '';
  var scanEnd = Math.min(offset, text.length);
  while (scanEnd > 0 && /\s/.test(text.charAt(scanEnd - 1))) scanEnd--;
  if (scanEnd <= 0) return null;
  var prefix = text.slice(Math.max(0, scanEnd - 2048), scanEnd);
  var match = prefix.match(/https?:\/\/[^\s<>"']+$/i);
  if (!match) return null;
  var raw = match[0];
  var url = trimNoteUrlTail(raw);
  if (!url || !isAllowedNoteHttpUrl(url)) return null;
  var start = scanEnd - raw.length;
  var end = start + url.length;
  if (start < 0 || end <= start) return null;
  return { node:node, start:start, end:end, url:url };
}

function applyNoteAutoLinkCandidate(candidate) {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl || !candidate || noteAutoLinkBusy) return false;
  var node = candidate.node;
  if (!noteNodeIsLinkifiableText(node, bodyEl) || !node.isConnected) return false;
  if ((node.nodeValue || '').slice(candidate.start, candidate.end) !== candidate.url) return false;
  var caretOffset = noteCaretTextOffset(bodyEl);
  var oldScrollTop = bodyEl.scrollTop;
  var oldScrollLeft = bodyEl.scrollLeft;
  noteAutoLinkBusy = true;
  var ok = false;
  try {
    var range = document.createRange();
    range.setStart(node, candidate.start);
    range.setEnd(node, candidate.end);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    ok = !!document.execCommand('createLink', false, candidate.url);
    if (ok) {
      var links = bodyEl.querySelectorAll('a[href]');
      for (var i = links.length - 1; i >= 0; i--) {
        var link = links[i];
        if ((link.textContent || '') === candidate.url && isAllowedNoteHttpUrl(link.getAttribute('href') || '')) {
          link.setAttribute('rel','noopener noreferrer');
          break;
        }
      }
    }
  } catch(e) { ok = false; }
  restoreNoteCaretTextOffset(bodyEl, caretOffset);
  bodyEl.scrollTop = oldScrollTop;
  bodyEl.scrollLeft = oldScrollLeft;
  rememberNoteSelection();
  noteAutoLinkBusy = false;
  if (ok) noteAutoSave();
  return ok;
}

function noteLinkifyExistingUrls(root) {
  if (!root) return false;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var nodes = [], node;
  while ((node = walker.nextNode())) if (noteNodeIsLinkifiableText(node, root)) nodes.push(node);
  var changed = false;
  nodes.forEach(function(textNode) {
    var text = textNode.nodeValue || '';
    var re = /https?:\/\/[^\s<>"']+/ig;
    var matches = [], m;
    while ((m = re.exec(text))) {
      var url = trimNoteUrlTail(m[0]);
      if (url && isAllowedNoteHttpUrl(url)) matches.push({ index:m.index, raw:m[0], url:url });
    }
    if (!matches.length || !textNode.parentNode) return;
    var frag = document.createDocumentFragment();
    var cursor = 0;
    matches.forEach(function(item) {
      if (item.index < cursor) return;
      if (item.index > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, item.index)));
      var a = document.createElement('a');
      a.href = item.url;
      a.rel = 'noopener noreferrer';
      a.textContent = item.url;
      frag.appendChild(a);
      cursor = item.index + item.url.length;
      changed = true;
    });
    if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
    textNode.parentNode.replaceChild(frag, textNode);
  });
  return changed;
}

function openNoteHttpUrl(href) {
  href = String(href || '').trim();
  if (!isAllowedNoteHttpUrl(href)) return;
  closeNoteKeyboardForOverlay();
  if (typeof AndroidBridge !== 'undefined' && AndroidBridge.openExternalUrl) {
    try {
      var result = String(AndroidBridge.openExternalUrl(href));
      if (result === 'unavailable') showToast('没有可用的浏览器');
      else if (result !== 'ok') showToast('暂时无法打开链接');
      return;
    } catch(e) {}
  }
  try { window.open(href, '_blank', 'noopener'); } catch(e2) {}
}

var noteLinkBody = document.getElementById('noteEditorBody');
if (noteLinkBody) {
  // Capture the URL before Enter splits the current text node; apply only after the native edit completes.
  noteLinkBody.addEventListener('beforeinput', function(e) {
    if (noteAutoLinkBusy || e.isComposing) return;
    var type = String(e.inputType || '');
    if (type === 'insertParagraph' || type === 'insertLineBreak') notePendingUrlCandidate = noteUrlCandidateBeforeCaret();
  });
  noteLinkBody.addEventListener('input', function(e) {
    if (noteAutoLinkBusy || e.isComposing) return;
    var type = String(e.inputType || '');
    if (type === 'insertParagraph' || type === 'insertLineBreak') {
      var pending = notePendingUrlCandidate; notePendingUrlCandidate = null;
      if (pending) setTimeout(function(){ applyNoteAutoLinkCandidate(pending); }, 0);
      return;
    }
    if (type === 'insertText' && /\s/.test(String(e.data || ''))) {
      setTimeout(function(){ var c = noteUrlCandidateBeforeCaret(); if (c) applyNoteAutoLinkCandidate(c); }, 0);
    }
  });
  noteLinkBody.addEventListener('paste', function() {
    // Do not intercept/cancel paste; wait until Chromium has inserted it, then inspect only the token at the caret.
    setTimeout(function(){ var c = noteUrlCandidateBeforeCaret(); if (c) applyNoteAutoLinkCandidate(c); }, 0);
  });
  noteLinkBody.addEventListener('click', function(e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link || !noteLinkBody.contains(link)) return;
    var href = link.getAttribute('href') || '';
    if (!isAllowedNoteHttpUrl(href)) return;
    e.preventDefault(); e.stopPropagation();
    openNoteHttpUrl(href);
  }, true);
}

// ===== Keyboard-aware Note editor =====
// V1.22.3: keep V1.22.2's single-scroll-owner model, but make Android WindowInsets the
// authoritative IME geometry when the native bridge is available. visualViewport remains
// a browser/WebView fallback and only contributes the compositor offset used during viewport pan.
// Input/delete/selection NEVER restore scrollTop. Caret reveal is triggered only by IME geometry
// changes or an explicit pointer tap, so normal typing cannot reintroduce the old jump-to-top bug.
var noteImeSpacePx = 0;
var noteImeBaseHeight = 0;
var noteNativeImeKnown = false;
var noteNativeImeSpacePx = 0;
var noteVisualImeSpacePx = 0;
var noteCaretRevealTimer = 0;
var noteCaretRevealRaf = 0;

function measureVisualImeSpace() {
  var vv = window.visualViewport;
  if (!vv) return null;
  var layoutHeight = Math.max(noteImeBaseHeight || 0, window.innerHeight || 0, document.documentElement.clientHeight || 0);
  if (!noteImeBaseHeight || (vv.height >= layoutHeight - 40)) noteImeBaseHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, vv.height || 0);
  layoutHeight = Math.max(noteImeBaseHeight || 0, window.innerHeight || 0, document.documentElement.clientHeight || 0);
  var diff = Math.max(0, Math.round(layoutHeight - vv.height));
  return diff >= 80 ? diff : 0;
}

function resolveNoteImeSpace() {
  // Android WindowInsets is the stable source on the packaged app. A WebView can expose
  // visualViewport while still failing to resize it for the IME, so feature-existence alone
  // must never suppress the native inset bridge.
  return noteNativeImeKnown ? noteNativeImeSpacePx : noteVisualImeSpacePx;
}

function getNoteCaretRect(bodyEl) {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  var range = sel.getRangeAt(0);
  if (!bodyEl.contains(range.commonAncestorContainer)) return null;
  var rect = range.getBoundingClientRect();
  if (rect && (rect.height > 0 || rect.width > 0)) return rect;

  // Some Chromium builds return a zero-sized rect for a collapsed caret. Expand a cloned
  // range by one adjacent character only for measurement; the actual selection is untouched.
  if (range.collapsed && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    var node = range.startContainer;
    var offset = range.startOffset;
    var clone = range.cloneRange();
    try {
      if (offset > 0) clone.setStart(node, offset - 1);
      else if (offset < node.length) clone.setEnd(node, offset + 1);
      var fallback = clone.getBoundingClientRect();
      if (fallback && (fallback.height > 0 || fallback.width > 0)) return fallback;
    } catch(e) {}
  }
  return rect || null;
}

function revealNoteCaretAboveIme(smooth) {
  if (noteImeSpacePx <= 0) return;
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl || document.activeElement !== bodyEl) return;
  var caret = getNoteCaretRect(bodyEl);
  if (!caret) return;
  var box = bodyEl.getBoundingClientRect();
  var topLimit = box.top + 14;
  var bottomLimit = box.bottom - 18;
  var delta = 0;
  if (caret.bottom > bottomLimit) delta = caret.bottom - bottomLimit;
  else if (caret.top < topLimit) delta = caret.top - topLimit;
  if (Math.abs(delta) < 2) return;

  var target = Math.max(0, bodyEl.scrollTop + delta);
  try { bodyEl.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' }); }
  catch(e) { bodyEl.scrollTop = target; }
}

function scheduleNoteCaretReveal(delay, smooth) {
  clearTimeout(noteCaretRevealTimer);
  if (noteCaretRevealRaf) cancelAnimationFrame(noteCaretRevealRaf);
  noteCaretRevealTimer = setTimeout(function() {
    noteCaretRevealRaf = requestAnimationFrame(function() {
      noteCaretRevealRaf = requestAnimationFrame(function() {
        noteCaretRevealRaf = 0;
        revealNoteCaretAboveIme(!!smooth);
      });
    });
  }, Math.max(0, Number(delay) || 0));
}

function applyNoteImeSpace(next) {
  var editor = document.getElementById('noteEditor');
  if (!editor || editor.style.display === 'none') return;
  next = Math.max(0, Math.round(Number(next) || 0));
  if (next < 80) next = 0;
  var changed = Math.abs(next - noteImeSpacePx) >= 2;
  if (changed) {
    noteImeSpacePx = next;
    editor.style.setProperty('--note-ime-space', next + 'px');
    editor.classList.toggle('note-ime-visible', next > 0);
  }
  syncNoteViewportOffset();
  // Reflow first, then reveal the existing caret once. This is intentionally geometry-driven,
  // never input-driven, so long-note typing/deleting remains free of JS scroll restoration.
  if (changed && next > 0) scheduleNoteCaretReveal(70, true);
}

function syncResolvedNoteImeSpace() {
  applyNoteImeSpace(resolveNoteImeSpace());
}

function syncNoteViewportOffset() {
  var editor = document.getElementById('noteEditor');
  var vv = window.visualViewport;
  if (!editor || editor.style.display === 'none' || !vv || noteImeSpacePx <= 0) {
    if (editor) editor.style.setProperty('--note-viewport-offset','0px');
    return;
  }
  // If Android pans the visual viewport while placing the caret, compensate only the toolbar.
  // The note body remains the sole scroll owner.
  var offset = Math.max(0, Math.round(vv.offsetTop || 0));
  editor.style.setProperty('--note-viewport-offset', offset + 'px');
}

function syncNoteImeLayout() {
  var visual = measureVisualImeSpace();
  noteVisualImeSpacePx = visual === null ? 0 : visual;
  syncResolvedNoteImeSpace();
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncNoteImeLayout);
  window.visualViewport.addEventListener('scroll', syncNoteViewportOffset);
}
window.addEventListener('resize', function() {
  if (!window.visualViewport) syncNoteImeLayout();
  else if (window.visualViewport.height >= (window.innerHeight || 0) - 40) { noteImeBaseHeight = 0; syncNoteImeLayout(); }
});

// Android WindowInsets are physical pixels; Web content layout uses CSS pixels.
// V1.22 used the raw value and could therefore overshoot by devicePixelRatio. V1.22.3 keeps
// the native source, converts it correctly, and no longer ignores it merely because visualViewport exists.
window.__onNativeImeInset = function(insetPx, visible) {
  noteNativeImeKnown = true;
  var ratio = Math.max(1, Number(window.devicePixelRatio) || 1);
  var next = visible ? ((Number(insetPx) || 0) / ratio) : 0;
  noteNativeImeSpacePx = next >= 80 ? next : 0;
  syncResolvedNoteImeSpace();
};

// A user tap is allowed to reveal the caret while the keyboard is already open. This runs only
// on pointer interaction, never on input/delete/selectionchange.
document.getElementById('noteEditorBody')?.addEventListener('pointerup', function(e) {
  if (e.target.closest('.note-file-card[data-note-file-name]')) return;
  if (noteImeSpacePx > 0) scheduleNoteCaretReveal(24, true);
  // A caret move must not adopt formatting from the character it lands beside.
  // Normalize Chromium's pending typing state to the three manual toolbar switches after selection settles.
  setTimeout(syncCollapsedNoteTypingFormat, 0);
});

// ===== Manual inline-format state (B / S / H) =====
var highlightColor = '#ffd93d'; // default yellow
var highlightColors = ['#ffd93d', '#ff6b6b', '#ff8787', '#b794f6', '#2EC4B6', '#4A90D9', '#FF9F43', '#ff9ff3'];
var EDITOR_BG_COLOR = 'rgb(245, 236, 216)'; // #f5ecd8
var EDITOR_BG_HEX = '#f5ecd8';

// B / S / H are deliberately NOT mirrors of the caret's inherited formatting.
// These three booleans are the single source of truth for FUTURE collapsed-caret input.
// Moving the caret into formatted text must never flip them.
var _highlightActive = false;
var _boldActive = false;
var _strikeActive = false;
var _syncingTypingFormat = false;
var _noteColorCache = {};

// Init format-button visuals.
setTimeout(updateToolbarState, 50);

function focusNoteBodyPreserveSelection() {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return null;
  try { bodyEl.focus({preventScroll:true}); } catch(e) { bodyEl.focus(); }
  if (noteLastSelectionRange && bodyEl.contains(noteLastSelectionRange.commonAncestorContainer)) {
    try {
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(noteLastSelectionRange.cloneRange());
    } catch(e2) {}
  }
  return bodyEl;
}

function getNoteEditorSelectionRange() {
  var bodyEl = document.getElementById('noteEditorBody');
  var sel = window.getSelection();
  if (!bodyEl || !sel || !sel.rangeCount) return null;
  var range = sel.getRangeAt(0);
  if (!bodyEl.contains(range.commonAncestorContainer)) return null;
  return range;
}

function normalizeNoteCssColor(value) {
  value = String(value || '').trim().toLowerCase();
  if (!value) return '';
  if (_noteColorCache[value]) return _noteColorCache[value];
  if (value === 'transparent') return (_noteColorCache[value] = 'transparent');
  var probe = document.createElement('span');
  probe.style.color = value;
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  var normalized = String(getComputedStyle(probe).color || value).replace(/\s+/g, '').toLowerCase();
  probe.remove();
  _noteColorCache[value] = normalized;
  return normalized;
}

function isNeutralNoteBackColor(value) {
  var normalized = normalizeNoteCssColor(value);
  if (!normalized || normalized === 'transparent' || normalized === 'rgba(0,0,0,0)') return true;
  return normalized === normalizeNoteCssColor(EDITOR_BG_COLOR) || normalized === normalizeNoteCssColor(EDITOR_BG_HEX);
}

function isKnownNoteHighlightColor(value) {
  var normalized = normalizeNoteCssColor(value);
  for (var i = 0; i < highlightColors.length; i++) {
    if (normalized === normalizeNoteCssColor(highlightColors[i])) return true;
  }
  return false;
}

function setCollapsedCommandState(cmd, desired) {
  var actual = false;
  try { actual = !!document.queryCommandState(cmd); } catch(e) {}
  if (actual !== !!desired) document.execCommand(cmd, false, null);
}

// Synchronize Chromium's *pending* collapsed-caret format to the manual toolbar switches.
// This does not prevent/cancel beforeinput and does not rewrite input text, preserving IME/composition/undo.
function syncCollapsedNoteTypingFormat() {
  if (_syncingTypingFormat) return;
  var bodyEl = document.getElementById('noteEditorBody');
  var range = getNoteEditorSelectionRange();
  if (!bodyEl || !range || !range.collapsed) return;
  _syncingTypingFormat = true;
  try {
    setCollapsedCommandState('bold', _boldActive);
    setCollapsedCommandState('strikeThrough', _strikeActive);

    var currentBack = '';
    try { currentBack = document.queryCommandValue('backColor') || ''; } catch(e) {}
    if (_highlightActive) {
      if (normalizeNoteCssColor(currentBack) !== normalizeNoteCssColor(highlightColor)) {
        document.execCommand('backColor', false, highlightColor);
      }
    } else if (isKnownNoteHighlightColor(currentBack)) {
      // Neutralize only H-palette inheritance. Unknown/pasted background styles are left untouched.
      document.execCommand('backColor', false, EDITOR_BG_HEX);
    }
  } finally {
    _syncingTypingFormat = false;
  }
}

function effectiveNoteBackColorForNode(node, bodyEl) {
  var el = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
  while (el && el !== bodyEl) {
    var bg = '';
    try { bg = getComputedStyle(el).backgroundColor || ''; } catch(e) {}
    if (!isNeutralNoteBackColor(bg)) return bg;
    el = el.parentElement;
  }
  return EDITOR_BG_COLOR;
}

function selectionBackColorIsActive() {
  var bodyEl = document.getElementById('noteEditorBody');
  var range = getNoteEditorSelectionRange();
  if (!bodyEl || !range || range.collapsed) return false;
  var walker = document.createTreeWalker(bodyEl, NodeFilter.SHOW_TEXT);
  var node, sawText = false;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    var intersects = false;
    try { intersects = range.intersectsNode(node); } catch(e) {}
    if (!intersects) continue;
    sawText = true;
    if (isNeutralNoteBackColor(effectiveNoteBackColorForNode(node, bodyEl))) return false;
  }
  // Fully highlighted selection -> one H tap removes it; mixed/plain selection -> one H tap highlights all.
  return sawText;
}

function toggleManualInlineCommand(cmd) {
  var bodyEl = focusNoteBodyPreserveSelection();
  if (!bodyEl) return;
  var range = getNoteEditorSelectionRange();
  if (!range) return;

  if (!range.collapsed) {
    // Selection mode edits EXISTING text only; it must not leak into future typing switches.
    document.execCommand(cmd, false, null);
  } else {
    if (cmd === 'bold') _boldActive = !_boldActive;
    if (cmd === 'strikeThrough') _strikeActive = !_strikeActive;
    syncCollapsedNoteTypingFormat();
  }
  rememberNoteSelection();
  updateToolbarState();
}

function toggleHighlight() {
  var bodyEl = focusNoteBodyPreserveSelection();
  if (!bodyEl) return;
  var range = getNoteEditorSelectionRange();
  if (!range) return;

  if (!range.collapsed) {
    // Existing selection: H toggles highlight on that text only.
    var selectedIsHighlighted = selectionBackColorIsActive();
    document.execCommand('backColor', false, selectedIsHighlighted ? EDITOR_BG_HEX : highlightColor);
  } else {
    // Collapsed caret: H is a persistent future-input switch controlled only by the toolbar.
    _highlightActive = !_highlightActive;
    syncCollapsedNoteTypingFormat();
  }
  rememberNoteSelection();
  updateToolbarState();
}

function showColorPicker(e) {
  e.preventDefault();
  e.stopPropagation();
  var bar = document.getElementById('noteFormatBar');
  var existing = document.getElementById('colorPickerPop');
  if (existing) { existing.remove(); return; }

  var pop = document.createElement('div');
  pop.id = 'colorPickerPop';
  pop.className = 'color-picker-pop';
  var html = '';
  for (var i = 0; i < highlightColors.length; i++) {
    var c = highlightColors[i];
    var sel = c === highlightColor ? ' color-picker-pop__swatch--active' : '';
    html += '<span class="color-picker-pop__swatch' + sel + '" style="background:' + c + '" data-color="' + c + '" title="' + c + '"></span>';
  }
  pop.innerHTML = html;
  // Position above the toolbar
  var barRect = bar.getBoundingClientRect();
  pop.style.bottom = (window.innerHeight - barRect.top + 8) + 'px';
  pop.style.left = '50%';
  pop.style.transform = 'translateX(-50%)';
  document.body.appendChild(pop);

  pop.addEventListener('click', function(ev) {
    var sw = ev.target.closest('.color-picker-pop__swatch');
    if (!sw) return;
    highlightColor = sw.getAttribute('data-color');
    var bodyEl = focusNoteBodyPreserveSelection();
    var range = getNoteEditorSelectionRange();
    if (bodyEl && range) {
      if (!range.collapsed) {
        // Color-picking over a selection recolors existing text only.
        document.execCommand('backColor', false, highlightColor);
      } else {
        // Color-picking at a caret intentionally turns future highlight input ON in the chosen color.
        _highlightActive = true;
        syncCollapsedNoteTypingFormat();
      }
      rememberNoteSelection();
    }
    updateToolbarState();
    pop.remove();
  });

  // Close on outside click
  setTimeout(function() {
    document.addEventListener('click', function closeCp(ev2) {
      if (!pop.contains(ev2.target)) {
        pop.remove();
        document.removeEventListener('click', closeCp);
      }
    });
  }, 0);
}

// Format bar button clicks
// B / S / H use the manual-state model; the remaining commands keep their established behavior.
document.getElementById('noteFormatBar').addEventListener('click', function(e) {
  var btn = e.target.closest('button');
  if (!btn) return;
  var cmd = btn.getAttribute('data-cmd');
  if (!cmd) return; // custom handlers like onclick
  var bodyEl = focusNoteBodyPreserveSelection();
  if (cmd === 'hiliteColor') {
    toggleHighlight();
  } else if (cmd === 'bold' || cmd === 'strikeThrough') {
    toggleManualInlineCommand(cmd);
  } else if (cmd === 'indent') {
    document.execCommand('insertHTML', false, '&emsp;');
  } else if (cmd === 'outdent') {
    // Remove leading emsp or spaces
    document.execCommand('delete', false, null);
  } else {
    document.execCommand(cmd, false, null);
  }
  setTimeout(updateToolbarState, 10);
});

// Keep native WebView input/composition intact. We only align pending format immediately before
// text-like insertion; the event is never prevented and no character is manually reinserted.
var noteBodyForTypingFormat = document.getElementById('noteEditorBody');
if (noteBodyForTypingFormat) {
  noteBodyForTypingFormat.addEventListener('beforeinput', function(e) {
    var inputType = String(e.inputType || '');
    var shouldSync = !inputType || inputType === 'insertText' || inputType === 'insertCompositionText' ||
      inputType === 'insertReplacementText' || inputType === 'insertParagraph' || inputType === 'insertLineBreak';
    if (shouldSync) syncCollapsedNoteTypingFormat();
  });
}

// Long-press on H button for color picker
var hiliteBtn = document.querySelector('#noteFormatBar button[data-cmd="hiliteColor"]');
var hilitePressTimer;
if (hiliteBtn) {
  hiliteBtn.addEventListener('touchstart', function(e) {
    hilitePressTimer = setTimeout(function() { showColorPicker(e); }, 500);
  });
  hiliteBtn.addEventListener('touchend', function() { clearTimeout(hilitePressTimer); });
  hiliteBtn.addEventListener('touchmove', function() { clearTimeout(hilitePressTimer); });
  hiliteBtn.addEventListener('mousedown', function(e) {
    hilitePressTimer = setTimeout(function() { showColorPicker(e); }, 500);
  });
  hiliteBtn.addEventListener('mouseup', function() { clearTimeout(hilitePressTimer); });
  hiliteBtn.addEventListener('mouseleave', function() { clearTimeout(hilitePressTimer); });
}

// ===== Knowledge Tree Drawer · same Topic/Note tree as the main Tree view =====
let folderSidebarCloseTimer=null;
function closeSurfaceSwipeRailsForDrawer() {
  // Normal gesture ownership cleanup only. Rail visibility is now owned by each row itself,
  // so the Drawer no longer carries a CSS/GPU flicker workaround.
  document.querySelectorAll('#noteList .note-swipe-row').forEach(function(row){setNoteSwipeRowX(row,0,false);});
  document.querySelectorAll('#noteList .topic-swipe-row').forEach(function(row){setTopicSwipeRowX(row,0,false);});
  resetNoteSwipeState();resetTopicSwipeState();
}
function openFolderSidebar() {
  var sidebar=document.getElementById('folderSidebar'); var backdrop=document.getElementById('folderSidebarBackdrop');
  if(folderSidebarCloseTimer){clearTimeout(folderSidebarCloseTimer);folderSidebarCloseTimer=null;}
  closeSurfaceSwipeRailsForDrawer();
  renderFolderSidebar(); if(backdrop)backdrop.style.display='';
  if(sidebar){sidebar.style.display='';requestAnimationFrame(function(){sidebar.classList.add('folder-sidebar--open');});}
}
function closeFolderSidebar() {
  var sidebar=document.getElementById('folderSidebar'); var backdrop=document.getElementById('folderSidebarBackdrop');
  if(sidebar)sidebar.classList.remove('folder-sidebar--open');
  if(folderSidebarCloseTimer)clearTimeout(folderSidebarCloseTimer);
  folderSidebarCloseTimer=setTimeout(function(){if(sidebar)sidebar.style.display='none';if(backdrop)backdrop.style.display='none';folderSidebarCloseTimer=null;},300);
}
function renderFolderSidebar() {
  var listEl=document.getElementById('folderSidebarList'); if(!listEl)return;
  var roots=getChildTopics(null); var unfiled=getTopicNotes(null); var html='';
  html += '<div class="folder-sidebar__tree-row folder-sidebar__tree-row--root' + (currentTopicId==null&&currentVirtualNoteFolder==null?' active':'') + '" onclick="selectNoteRootFromDrawer()" title="知识树根目录" aria-label="知识树根目录"><span style="width:18px"></span><span class="folder-sidebar__root-glyph">🌳</span></div>';
  roots.forEach(function(topic){html+=renderSidebarTopicTree(topic);});
  if(unfiled.length)html+=renderSidebarUnfiledNode(unfiled);
  if(!roots.length&&!unfiled.length) html += '<div style="padding:34px 18px;text-align:center;color:var(--text-tertiary);font-size:13px">知识树还是空的</div>';
  listEl.innerHTML=html;
}
function renderSidebarUnfiledChildren(unfiled){var html='<div class="folder-sidebar__tree-children" data-sidebar-unfiled-branch="1">';unfiled.forEach(function(note){html+=renderSidebarLeafNote(note);});return html+'</div>';}
function renderSidebarUnfiledNode(unfiled){
  var open=!noteUnfiledCollapsed;var html='<div class="folder-sidebar__tree-node" data-sidebar-unfiled-node="1">';
  html += '<div class="folder-sidebar__tree-row' + (currentVirtualNoteFolder==='unfiled'?' active':'') + '" onclick="selectUnfiledFromDrawer()"><button class="folder-sidebar__tree-toggle'+(open?' open':'')+'" onclick="event.stopPropagation();toggleUnfiledCollapse()">▶</button><span>📂</span><span class="folder-sidebar__tree-title">未分类</span><span class="folder-sidebar__tree-kind">'+unfiled.length+'</span></div>';
  if(open)html+=renderSidebarUnfiledChildren(unfiled);return html+'</div>';
}
function renderSidebarTopicChildren(topic){var html='<div class="folder-sidebar__tree-children" data-sidebar-topic-branch="'+Number(topic.id)+'">';getChildTopics(topic.id).forEach(function(t){html+=renderSidebarTopicTree(t);});getTopicNotes(topic.id).forEach(function(n){html+=renderSidebarLeafNote(n);});return html+'</div>';}
function renderSidebarTopicTree(topic) {
  var childTopics=getChildTopics(topic.id); var childNotes=getTopicNotes(topic.id); var hasChildren=childTopics.length||childNotes.length; var open=hasChildren&&!topic.collapsed;
  var html='<div class="folder-sidebar__tree-node" data-sidebar-topic-id="'+Number(topic.id)+'">';
  html += '<div class="folder-sidebar__tree-row' + (Number(currentTopicId)===Number(topic.id)?' active':'') + '" onclick="selectTopicFromDrawer('+topic.id+')">' +
    '<button class="folder-sidebar__tree-toggle' + (hasChildren?(open?' open':''):' empty') + '" onclick="event.stopPropagation();toggleTopicCollapseFromDrawer('+topic.id+')">▶</button><span>📁</span><span class="folder-sidebar__tree-title">'+escapeHtml(topic.title)+'</span><span class="folder-sidebar__tree-kind">主题</span></div>';
  if(open)html+=renderSidebarTopicChildren(topic);
  html+='</div>';return html;
}
function renderSidebarLeafNote(note) {
  return '<div class="folder-sidebar__tree-row" onclick="openNoteFromDrawer('+note.id+')"><span style="width:18px"></span><span>📄</span><span class="folder-sidebar__tree-title">'+escapeHtml(note.title||'无标题')+'</span><span class="folder-sidebar__tree-kind">笔记</span></div>';
}
function syncFolderSidebarTopicNode(id){
  var list=document.getElementById('folderSidebarList'),topic=getTopicById(id);if(!list||!topic)return false;
  var node=list.querySelector('[data-sidebar-topic-id="'+Number(id)+'"]');if(!node)return false;
  var row=directChildByClass(node,'folder-sidebar__tree-row');var toggle=row?row.querySelector('.folder-sidebar__tree-toggle'):null;
  var has=getChildTopics(id).length||getTopicNotes(id).length;var open=!!has&&!topic.collapsed;
  if(toggle){toggle.classList.toggle('open',open);toggle.classList.toggle('empty',!has);}
  var branch=directChildByClass(node,'folder-sidebar__tree-children');
  if(open&&!branch)node.insertAdjacentHTML('beforeend',renderSidebarTopicChildren(topic));else if(!open&&branch)branch.remove();
  return true;
}
function syncFolderSidebarUnfiledNode(){
  var list=document.getElementById('folderSidebarList'),unfiled=getTopicNotes(null);if(!list)return false;
  var node=list.querySelector('[data-sidebar-unfiled-node="1"]');if(!node)return false;
  var row=directChildByClass(node,'folder-sidebar__tree-row');var toggle=row?row.querySelector('.folder-sidebar__tree-toggle'):null;var open=unfiled.length&&!noteUnfiledCollapsed;
  if(toggle)toggle.classList.toggle('open',!!open);var kind=row?row.querySelector('.folder-sidebar__tree-kind'):null;if(kind)kind.textContent=String(unfiled.length);
  var branch=directChildByClass(node,'folder-sidebar__tree-children');
  if(open&&!branch)node.insertAdjacentHTML('beforeend',renderSidebarUnfiledChildren(unfiled));else if(!open&&branch)branch.remove();
  return true;
}
function toggleTopicCollapseFromDrawer(id){toggleTopicCollapse(id);}
function selectTopicFromDrawer(id){closeFolderSidebar();enterTopicWorkspace(id);}
function selectUnfiledFromDrawer(){closeFolderSidebar();enterUnfiledWorkspace();}
function selectNoteRootFromDrawer(){closeFolderSidebar();currentTopicId=null;currentVirtualNoteFolder=null;noteHomeView='tree';noteViewStack=[];renderNoteList();var c=document.getElementById('noteContainer');if(c)c.scrollTop=0;}
function openNoteFromDrawer(id){closeFolderSidebar();noteOpenOrigin=captureNoteSurfaceContext();setTimeout(function(){openNoteEditor(id,{forceRead:true,preserveKeyboard:false});},60);}
function createTopicFromDrawer(){closeFolderSidebar();setTimeout(createTopicInCurrentTopic,80);}
// Compatibility names retained so no stale inline handler can recreate the old folder/category model.
function selectFolder(){navigateNoteRoot();}
function clearFolderFilter(){navigateNoteRoot();}
function addNewFolder(){createTopicFromDrawer();}
function deleteFolder(){showToast('主题不再等同于旧文件夹；请在主题工作区管理内容');}
function showFolderPicker(){showTopicPicker();}
function moreMoveToFolder(){showTopicPicker();}
function promptNewFolder(){createTopicInCurrentTopic();}

document.getElementById('noteFolderBtn').addEventListener('click',function(){openFolderSidebar();});
// Right-swipe in the Note surface opens the exact same knowledge tree drawer.
(function(){
  var container=document.getElementById('noteContainer');if(!container)return;var swipeX=0,swipeY=0,swipeNode=null,swipeRow=null,swipeRowWasOpen=false;
  container.addEventListener('touchstart',function(e){
    if(!e.touches.length)return;swipeX=e.touches[0].clientX;swipeY=e.touches[0].clientY;swipeNode=e.target;
    swipeRow=swipeNode.closest?swipeNode.closest('.note-swipe-row,.topic-swipe-row'):null;
    swipeRowWasOpen=!!(swipeRow&&((swipeRow.classList.contains('note-swipe-row')&&noteSwipeRowX(swipeRow)<-1)||(swipeRow.classList.contains('topic-swipe-row')&&topicSwipeRowX(swipeRow)<-1)));
  },{passive:true});
  container.addEventListener('touchend',function(e){
    if(!swipeNode||!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-swipeX;var dy=Math.abs(e.changedTouches[0].clientY-swipeY);
    // An already-open action rail owns its right-drag close gesture. A closed card never blocks Drawer navigation.
    if(!swipeRowWasOpen&&dx>50&&dx>dy&&swipeX<window.innerWidth*.4&&currentMode==='notes')openFolderSidebar();
    swipeNode=null;swipeRow=null;swipeRowWasOpen=false;
  },{passive:true});
})();

// Selection changes remember the editing range only. B / S / H manual switches are never
// imported from caret ancestry, so landing beside formatted text cannot activate future input.
document.addEventListener('selectionchange', function() {
  var editor = document.getElementById('noteEditor');
  if (!editor || editor.style.display === 'none') return;
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl) return;
  var sel = window.getSelection();
  if (sel && sel.rangeCount && bodyEl.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    noteLastSelectionRange = sel.getRangeAt(0).cloneRange();
    updateToolbarState();
  }
});

// Android system back: always consume the deepest visible layer first.
// Native MainActivity asks this function before it considers leaving the app.
function handleBackPress() {
  var el;

  el = document.getElementById('onboardingWelcome');
  if (el && el.classList.contains('active')) { finishOnboarding(true); return 'onboarding-welcome'; }
  el = document.getElementById('onboardingOverlay');
  if (el && el.classList.contains('active')) { finishOnboarding(true); return 'onboarding'; }
  el = document.getElementById('helpGuideOverlay');
  if (el && el.classList.contains('active')) { closeHelpGuide(); return 'help-guide'; }
  el = document.getElementById('contextCoach');
  if (el && el.classList.contains('active')) { closeContextCoach(false); return 'context-coach'; }

  // Highest-priority second-level dialogs.
  el = document.getElementById('confirmOverlay');
  if (el && el.style.display !== 'none') { hideConfirm(); return 'confirm'; }
  el = document.getElementById('promptOverlay');
  if (el && el.style.display !== 'none') { hidePrompt(); return 'prompt'; }

  // Daily nested pages → Daily drawer → base page.
  el = document.getElementById('dailyCalendarOverlay');
  if (el && el.classList.contains('active')) { closeDailyCalendar(); return 'daily-calendar'; }
  el = document.getElementById('dailyEditorOverlay');
  if (el && el.classList.contains('active')) { closeDailyEditor(); return 'daily-editor'; }

  // Daily overall-history calendar.
  el = document.getElementById('dailyHistoryOverlay');
  if (el && el.classList.contains('active')) { closeDailyHistory(); return 'daily-history'; }

  // Todo reminder/time picker layers.
  el = document.getElementById('reminderPickerOverlay');
  if (el && el.classList.contains('active')) { closeTodoReminderPicker(); return 'todo-reminder'; }
  el = document.getElementById('timePickerOverlay');
  if (el && el.classList.contains('active')) { el.classList.remove('active'); return 'time-picker'; }

  // Small transient overlays and menus.
  el = document.getElementById('calendarPreview');
  if (el && el.style.display === 'block') { hideCalendarPreview(); return 'calendar-preview'; }
  if (categoryPicker && categoryPicker.classList.contains('active')) { closeCategoryPicker(); return 'category-picker'; }
  el = document.getElementById('noteEditorMoreMenu');
  if (el && el.style.display !== 'none') { el.style.display = 'none'; return 'note-more'; }
  el = document.getElementById('noteCreateMenu');
  if (el && el.classList.contains('active')) { closeNoteCreateMenu(); return 'note-create-menu'; }

  // Note attachment import/actions / image preview sit above the editor.
  el = document.getElementById('noteFileImportOverlay');
  if (el && el.classList.contains('active')) { closeNoteFileImportSheet(); return 'note-file-import'; }
  el = document.getElementById('noteFileActionsOverlay');
  if (el && el.classList.contains('active')) { closeNoteFileActions(); return 'note-file-actions'; }
  el = document.getElementById('noteImagePreview');
  if (el && el.classList.contains('active')) { closeNoteImagePreview(); return 'note-image-preview'; }

  // Note sub-pages.
  el = document.getElementById('folderSidebar');
  if (el && (el.classList.contains('folder-sidebar--open') || el.style.display !== 'none')) {
    closeFolderSidebar(); return 'folder-sidebar';
  }
  el = document.getElementById('noteEditor');
  if (el && el.style.display !== 'none') {
    closeNoteEditor();
    return 'note-editor';
  }
  if (topicSummaryEditing) {
    saveTopicSummaryEdit();
    return 'topic-summary';
  }
  if (currentMode === 'notes' && (currentTopicId != null || currentVirtualNoteFolder != null)) {
    noteSurfaceBack();
    return currentVirtualNoteFolder === 'unfiled' ? 'note-unfiled' : 'note-topic';
  }

  // App-wide modals.
  el = document.getElementById('bulletModal');
  if (el && el.classList.contains('active')) { closeBulletModal(); return 'bullet'; }
  el = document.getElementById('aiChatModal');
  if (el && el.classList.contains('active')) { closeAiChat(); return 'ai-chat'; }
  if (recycleModal && recycleModal.classList.contains('active')) { closeRecycleModal(); return 'recycle'; }
  if (calendarModal && calendarModal.classList.contains('active')) { closeCalendar(); return 'calendar'; }

  // Daily drawer itself.
  el = document.getElementById('dailyDrawerOverlay');
  if (el && el.classList.contains('active')) { closeDailyDrawer(); return 'daily-drawer'; }

  // Search suggestions/history are a layer too.
  if (searchHistoryEl && searchHistoryEl.classList.contains('active')) {
    searchHistoryEl.classList.remove('active');
    return 'search-history';
  }

  // Note is the second main workspace; back returns to To-Do before app exit.
  if (currentMode === 'notes') {
    switchMode('todo', 'right');
    return 'notes';
  }

  return 'none';
}
window.__handleSystemBack = function() { return handleBackPress() !== 'none'; };

// ===== Header horizontal swipe → drawer-like To-Do / Note mode switch =====
(function() {
  const headerEl = document.querySelector('.header__top');
  if (!headerEl) return;
  let startX = 0, startY = 0, lastX = 0, startAt = 0, swiping = false, horizontal = false;

  function preview(dx) {
    const appEl = document.querySelector('.app');
    if (!appEl || modeSwitchAnimating) return;
    const targetMode = currentMode === 'todo' ? 'notes' : 'todo';
    const expectedDirection = currentMode === 'todo' ? 1 : -1;
    const width = appEl.getBoundingClientRect().width || window.innerWidth;
    const sameDirection = dx * expectedDirection > 0;
    const offset = sameDirection
      ? Math.max(-width * 0.88, Math.min(width * 0.88, dx))
      : Math.max(-24, Math.min(24, dx * 0.12));
    if (sameDirection) prepareModeDrawer(targetMode, expectedDirection);
    appEl.classList.add('mode-drawer-moving');
    appEl.style.transition = 'none';
    appEl.style.transform = `translate3d(${offset}px,0,0)`;
    modeSwipePreviewActive = true;
  }

  headerEl.addEventListener('touchstart', e => {
    if (modeSwitchAnimating || !e.touches.length) return;
    startX = lastX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startAt = performance.now();
    swiping = true;
    horizontal = false;
  }, { passive:true });

  headerEl.addEventListener('touchmove', e => {
    if (!swiping || modeSwitchAnimating || !e.touches.length) return;
    const x = e.touches[0].clientX;
    const dx = x - startX;
    const dy = e.touches[0].clientY - startY;
    lastX = x;
    if (!horizontal && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horizontal = Math.abs(dx) > Math.abs(dy) * 1.12;
    if (!horizontal) return;
    e.preventDefault();
    preview(dx);
  }, { passive:false });

  headerEl.addEventListener('touchend', e => {
    if (!swiping) return;
    swiping = false;
    if (!horizontal || !e.changedTouches.length) return springBackModeDrawer();
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    const elapsed = Math.max(1, performance.now() - startAt);
    const velocity = Math.abs(dx) / elapsed;
    const appEl = document.querySelector('.app');
    const width = appEl ? (appEl.getBoundingClientRect().width || window.innerWidth) : window.innerWidth;
    const expectedDirection = currentMode === 'todo' ? 1 : -1;
    const validDirection = dx * expectedDirection > 0;
    const commit = validDirection && Math.abs(dx) > dy && (Math.abs(dx) >= width * 0.30 || (Math.abs(dx) > 48 && velocity > 0.55));
    if (commit) {
      switchMode(currentMode === 'todo' ? 'notes' : 'todo', expectedDirection > 0 ? 'right' : 'left');
    } else {
      springBackModeDrawer();
    }
  }, { passive:true });

  headerEl.addEventListener('touchcancel', () => { swiping = false; springBackModeDrawer(); }, { passive:true });
})();

// ===== Nested Note header swipe → To-Do, while preserving the exact Note workspace =====
(function() {
  var header = document.querySelector('.note-editor__header');
  var editor = document.getElementById('noteEditor');
  if (!header || !editor) return;
  var sx=0, sy=0, started=0, horizontal=false, tracking=false;
  function notePreview(dx) {
    if (dx > 0) dx *= .12; // wrong direction: elastic resistance only
    var width = editor.getBoundingClientRect().width || window.innerWidth;
    dx = Math.max(-width*.9, Math.min(22, dx));
    var underlay = document.getElementById('modeDrawerUnderlay');
    if (underlay) {
      underlay.style.zIndex = '199';
      underlay.classList.remove('from-right');
      underlay.classList.add('from-left','active');
      var label=document.getElementById('modeDrawerLabel'); if(label) label.textContent='To-Do';
    }
    editor.style.transition='none'; editor.style.transform='translate3d('+dx+'px,0,0)';
  }
  function resetPreview() {
    editor.style.transition='transform 190ms cubic-bezier(.22,.82,.28,1)';
    editor.style.transform='translate3d(0,0,0)';
    setTimeout(function(){ editor.style.transition=''; editor.style.transform=''; var u=document.getElementById('modeDrawerUnderlay'); if(u){u.classList.remove('active','from-left');u.style.zIndex='';}},200);
  }
  function commitNestedToTodo() {
    if (modeSwitchAnimating) return resetPreview();
    var width=editor.getBoundingClientRect().width || window.innerWidth;
    modeSwitchAnimating=true;
    closeNoteKeyboardForOverlay();
    saveCurrentNote();
    suspendedNoteWorkspace=captureNoteWorkspaceState();
    editor.style.transition='transform 170ms cubic-bezier(.22,.78,.25,1), opacity 140ms ease-out';
    editor.style.transform='translate3d('+(-width-8)+'px,0,0)';
    editor.style.opacity='.98';
    setTimeout(function(){
      var keep=suspendedNoteWorkspace;
      suspendNoteEditorForModeSwitch();
      suspendedNoteWorkspace=keep;
      applyMode('todo');
      editor.style.transition=''; editor.style.transform=''; editor.style.opacity='';
      var u=document.getElementById('modeDrawerUnderlay'); if(u){u.classList.remove('active','from-left');u.style.zIndex='';}
      modeSwitchAnimating=false;
    },175);
  }
  header.addEventListener('touchstart',function(e){
    if(currentMode!=='notes'||!isNoteEditorVisible()||modeSwitchAnimating||!e.touches.length)return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; started=performance.now(); horizontal=false; tracking=true;
  },{passive:true});
  header.addEventListener('touchmove',function(e){
    if(!tracking||!e.touches.length)return;
    var dx=e.touches[0].clientX-sx, dy=e.touches[0].clientY-sy;
    if(!horizontal&&(Math.abs(dx)>7||Math.abs(dy)>7)) horizontal=Math.abs(dx)>Math.abs(dy)*1.15;
    if(!horizontal)return;
    e.preventDefault(); notePreview(dx);
  },{passive:false});
  header.addEventListener('touchend',function(e){
    if(!tracking)return; tracking=false;
    if(!horizontal||!e.changedTouches.length)return resetPreview();
    var dx=e.changedTouches[0].clientX-sx, dy=Math.abs(e.changedTouches[0].clientY-sy);
    var elapsed=Math.max(1,performance.now()-started), velocity=Math.abs(dx)/elapsed;
    var width=editor.getBoundingClientRect().width||window.innerWidth;
    if(dx<0&&Math.abs(dx)>dy&&(Math.abs(dx)>=width*.28||(Math.abs(dx)>48&&velocity>.55))) commitNestedToTodo(); else resetPreview();
  },{passive:true});
  header.addEventListener('touchcancel',function(){tracking=false;resetPreview();},{passive:true});
})();

// Toolbar button active state feedback
function updateToolbarState() {
  var bodyEl = document.getElementById('noteEditorBody');
  if (!bodyEl || document.activeElement !== bodyEl) return;

  // List controls keep the established caret/selection mirroring behavior.
  var cmds = ['insertUnorderedList', 'insertOrderedList'];
  for (var i = 0; i < cmds.length; i++) {
    var btn = document.querySelector('#noteFormatBar button[data-cmd="' + cmds[i] + '"]');
    if (!btn) continue;
    if (document.queryCommandState(cmds[i])) btn.classList.add('toolbar-active');
    else btn.classList.remove('toolbar-active');
  }

  // B / S / H display only the user's explicit future-input switches.
  var boldBtn = document.querySelector('#noteFormatBar button[data-cmd="bold"]');
  if (boldBtn) boldBtn.classList.toggle('toolbar-active', !!_boldActive);

  var strikeBtn = document.querySelector('#noteFormatBar button[data-cmd="strikeThrough"]');
  if (strikeBtn) strikeBtn.classList.toggle('toolbar-active', !!_strikeActive);

  var hiliteBtn = document.querySelector('#noteFormatBar button[data-cmd="hiliteColor"]');
  if (hiliteBtn) {
    if (_highlightActive) {
      hiliteBtn.style.background = highlightColor;
      hiliteBtn.style.color = '#fff';
      hiliteBtn.style.borderRadius = '4px';
    } else {
      hiliteBtn.style.background = '';
      hiliteBtn.style.color = '';
      hiliteBtn.style.borderRadius = '';
    }
  }
}
// Load notes on init
loadNotes();
setTimeout(maybeStartOnboarding, 650);
