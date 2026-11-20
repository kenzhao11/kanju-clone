import './styles-gQsbNd0W.js';
import { a as initTheme, s as shell, b as bindShell, i as icon, u, c as showToast, d as compactCard, f as fetchUserProgress, e as proxyReady, g as proxyShow, h as posterArt, j as proxyHomeFeed, k as proxyList, l as posterCard, m as getCachedUser } from './shell-CcX8x_5v.js';
import { R as ROWS, a as allByPool, C as CATS, s as shows } from './data-COe7SVsj.js';

const state = {
  q: '',
  mode: 'quick',
  cat: null,
  extra: [],
  categories: {},
  calendar: [],
  selectedDate: '',
  rows: [...ROWS],
  order: ROWS.map((row) => row.id),
  browse: null,
};

const KIND_CAT = { series: 'tv', short_drama: 'tv', movie: 'movie', anime: 'anime', animation: 'anime', variety: 'variety', documentary: 'variety' };
const KIND_LABEL = { series: '电视剧', short_drama: '短剧', movie: '电影', anime: '动漫', animation: '动漫', variety: '综艺', documentary: '纪录片' };
const HOME_CAT_KEYS = ['tv', 'anime', 'variety', 'movie'];
const CALENDAR_KIND = { tv: 'series', anime: 'anime', variety: 'variety', movie: 'movie' };
const ROW_AREA = { kr: '韩国', jp: '日本', us: '美国', cn: '中国大陆' };
const BROWSE_PAGE = 24;
let searchTimer = null;

function findRow(id) {
  return state.rows.find((row) => row.id === id)
}

// 原站栏目没有直接对应的分类时，用同分类热榜
function browseOf(row) {
  if (!row) return { title: '全部影视' }
  if (row.id === 'hot') return { title: row.title }
  if (ROW_AREA[row.id]) return { title: row.title, cat: 'tv', area: ROW_AREA[row.id] }
  if (row.cat === 'movie' || row.cat === 'anime' || row.cat === 'variety' || row.cat === 'tv') {
    return { title: row.title, cat: row.cat }
  }
  return { title: row.title }
}

function calendarItems(day, cat) {
  const key = CALENDAR_KIND[cat];
  const preview = key ? day.groups?.[key]?.preview || [] : [];
  return preview.map((item, index) => feedShow({
    id: item.id,
    title: item.title,
    year: item.year,
    kind: item.content_kind,
    poster: item.poster_url,
    remarks: item.latest_episode_label || item.forecast?.label || '',
    heatValue: item.heat_score,
  }, index))
}

function daysHTML() {
  return state.calendar.map((day) => `<button class="day ${day.date === state.selectedDate ? 'on' : ''}" type="button" role="tab"
    aria-selected="${day.date === state.selectedDate}" data-day="${day.date}">
    <span class="dow">${day.weekday_label}</span>
    <span class="dnum">${Number(day.date.slice(-2))}日</span>
    <span class="dcnt">${day.count ?? Object.values(day.groups || {}).reduce((total, group) => total + (Number(group.total) || 0), 0)}部</span>
  </button>`).join('')
}

/* 手机上日期条是可横向滚动的：一进来把它停在今天（只在条内定位，不动页面），
   手动拖动之后不再覆盖用户的选择。 */
let daysTouched = false;
/* 用户把日期条停在哪。后台刷新会重建 #days 并把 scrollLeft 归零，
   重建后照这个值放回去，观众看到的就是自己刚才那一格，而不是被拨回今天。 */
let daysLeft = 0;

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', (event) => {
    if (event.target && event.target.closest && event.target.closest('#days')) daysTouched = true;
  }, true);
  document.addEventListener('scroll', (event) => {
    if (!daysTouched || !event.target || event.target.id !== 'days') return
    daysLeft = event.target.scrollLeft;
  }, true);
  /* 站点自己的重渲染走 centerSelectedDay，但其他路径（局部刷新、插件、注入层）
     也会整块换掉卡片；统一用观察器兜住，两条路径都不会把用户的位置拨走。 */
  if (typeof MutationObserver === 'function') {
    const watch = () => {
      const days = document.getElementById('days');
      if (!days) {
        document.addEventListener('DOMContentLoaded', watch, { once: true });
        return
      }
      new MutationObserver(() => centerSelectedDay(days)).observe(days, { childList: true });
    };
    watch();
  }
}

function centerSelectedDay(days) {
  const active = days.querySelector('.day.on');
  if (!active) return
  if (daysTouched) {
    /* 不抢用户的选择：只把重建后归零的位置放回去，位置没变就不写（每次写都强制一次布局） */
    const max = Math.max(0, days.scrollWidth - days.clientWidth);
    const target = Math.min(max, Math.max(0, daysLeft));
    if (Math.abs(days.scrollLeft - target) > 4) days.scrollLeft = target;
    return
  }
  const max = Math.max(0, days.scrollWidth - days.clientWidth);
  if (max <= 0) return
  const stripRect = days.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  /* 把今天拨到可视区起点。日期条是 scroll-snap 容器（每张卡都是 snap 点），
     居中会被吸附回卡片边界，所以按「对齐到天」处理，结果稳定。 */
  const target = days.scrollLeft + (activeRect.left - stripRect.left);
  const wanted = Math.min(max, Math.max(0, target));
  if (Math.abs(days.scrollLeft - wanted) > 4) days.scrollLeft = wanted;
  daysLeft = days.scrollLeft;
}

function renderCalendarDay() {
  const day = state.calendar.find((item) => item.date === state.selectedDate);
  if (!day) return
  document.querySelectorAll('.day').forEach((button) => {
    const selected = button.dataset.day === state.selectedDate;
    button.classList.toggle('on', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  HOME_CAT_KEYS.forEach((cat) => {
    const key = CALENDAR_KIND[cat];
    const group = day.groups?.[key];
    state.categories[cat] = {
      total: group?.total || 0,
      items: calendarItems(day, cat),
    };
  });
  const cats = document.getElementById('cats');
  if (cats) cats.innerHTML = catsHTML();
}

function catsHTML() {
  return HOME_CAT_KEYS
    .map((key) => {
      const label = CATS[key];
      const data = state.categories[key];
      const items = data?.items || [];
      return `<section class="cat" aria-label="${label}">
      <div class="cat-head">
        <h3><button class="cat-name" type="button" data-cat="${key}">${label}</button></h3>
        <span class="cat-count"><b>${data?.total ?? '—'}</b> 部</span>
      </div>
      <div class="cat-list" data-catlist="${key}">
        ${items.length ? items.map((s) => compactCard(s)).join('') : '<p class="cat-loading">正在同步片库…</p>'}
      </div>
    </section>`
    })
    .join('')
}

function rowHTML(row, idx) {
  return `<section class="row" data-row="${row.id}">
    <div class="row-head">
      <div>
        <h2>${row.title}</h2>
        <p class="sub">${row.sub}</p>
      </div>
      <div class="row-tools">
        <button class="circ" type="button" data-scroll="${row.id}:-1" aria-label="向左">${icon('chevronLeft', 16)}</button>
        <button class="circ" type="button" data-scroll="${row.id}:1" aria-label="向右">${icon('chevronRight', 16)}</button>
        <button class="more-btn" type="button" data-more="${row.id}">查看更多</button>
      </div>
    </div>
    <div class="strip" id="strip-${row.id}" tabindex="0">
      ${row.items.map((s) => posterCard(s)).join('')}
    </div>
  </section>`
}

function rowsHTML() {
  const base = state.order.map((id) => findRow(id)).filter(Boolean);
  return [...base, ...state.extra].map(rowHTML).join('')
}

function bodyHTML() {
  return `<section class="page-body">
    <div class="wrap home">
    <section class="hero">
      <h1>阿噗影视</h1>
      <form class="search" id="searchForm" autocomplete="off">
        <label class="sr-only" for="q">影视搜索输入</label>
        <textarea id="q" rows="1" placeholder="今天你想看什么？"></textarea>
        <div class="search-row">
          <button class="sbtn" type="button" data-action="expand" aria-label="展开扩展功能">${icon('plus', 20)}</button>
          <div class="modes" role="group" aria-label="搜索模式">
            <button type="button" class="on" data-mode="quick">${icon('bolt', 16)}快速</button>
            <button type="button" data-mode="smart">${icon('sparkle', 16)}智能</button>
          </div>
          <span class="search-spacer"></span>
          <button class="sbtn round" type="button" data-action="mic" aria-label="切换到语音输入">${icon('mic', 16)}</button>
          <button class="send" type="submit" aria-label="发送搜索">${icon('send', 18)}</button>
        </div>
      </form>
      <div class="home-hot" aria-label="热门影片"><span>热门影片</span>${(findRow('hot')?.items || ROWS[0]?.items || []).slice(0, 7).map((s) => `<button type="button" data-hot="${s.title}"><span aria-hidden="true">▶</span>${s.title}</button>`).join('')}</div>
      <div class="home-suggest" aria-label="推荐输入"><span>推荐输入</span><button type="button" data-hot="AI漫剧">AI漫剧</button></div>
    </section>

    <div id="homeSections">
      <section class="row" id="continueRow" hidden>
        <div class="row-head"><div><h2>继续观看</h2></div><a class="link-mint" href="${u('/library/history/')}">查看更多</a></div>
        <div class="strip" id="continueStrip"></div>
      </section>
      <section class="week">
        <div class="sec-head">
          <span class="sec-ico">${icon('calendar', 18)}</span>
          <div class="sec-titles">
            <h2>本周追剧</h2>
            <p class="sub">按日期查看影片更新</p>
          </div>
          <div class="sec-actions">
            <a class="link-mint" href="${u('/library/history/')}">查看完整日历</a>
            <span class="range" id="calendarRange"></span>
          </div>
        </div>
        <div class="days" id="days" role="tablist" aria-label="本周追剧"></div>
      </section>

      <div class="cats" id="cats">${catsHTML()}</div>
      <div id="rows">${rowsHTML()}</div>
      <button class="loadmore" type="button" id="loadmore">继续下滑，或点击加载更多</button>
    </div>

    <div id="results"></div>
    </div>
  </section>`
}

function renderResultView() {
  if (!state.q && !state.cat) {
    const box = document.getElementById('results');
    const home = document.getElementById('homeSections');
    if (box) box.innerHTML = '';
    if (home) home.hidden = false;
    state.browse = null;
    return
  }
  openBrowse({
    title: state.cat ? CATS[state.cat] : '搜索结果',
    cat: state.cat || '',
    q: state.q.trim(),
  });
}

function browseShellHTML(title) {
  return `<section class="browse">
    <div class="browse-head">
      <h2>${title}</h2>
      <span id="browseCount">正在同步…</span>
      <button class="more-btn" type="button" id="clearView" style="margin-left:auto">返回首页</button>
    </div>
    <div class="browse-grid" id="browseGrid"></div>
    <button class="loadmore" type="button" id="browseMore" hidden>加载更多</button>
    <div class="empty-note" id="browseEmpty" hidden>没有找到相关影片，换个关键词试试</div>
  </section>`
}

function browseGridFill(items, start, append) {
  const grid = document.getElementById('browseGrid');
  if (!grid) return
  const html = items.map((r, i) => posterCard(feedShow(r, start + i))).join('');
  if (append) grid.insertAdjacentHTML('beforeend', html);
  else grid.innerHTML = html;
}

async function openBrowse({ title, cat = '', area = '', q = '' }) {
  const home = document.getElementById('homeSections');
  const box = document.getElementById('results');
  if (!home || !box) return
  home.hidden = true;
  state.browse = { title: title || '影视列表', cat, area, q, page: 0, items: [] };
  box.innerHTML = browseShellHTML(title || '影视列表');
  await loadBrowsePage(1, false);
}

async function loadBrowsePage(page, append) {
  const b = state.browse;
  if (!b) return
  await proxyReady;
  const data = await proxyList({ cat: b.cat, area: b.area, q: b.q, limit: BROWSE_PAGE, page, sort: 'heat' });
  const items = data?.items || [];
  if (!append) b.items = [];
  b.items.push(...items);
  b.page = page;
  browseGridFill(items, b.items.length - items.length, append && b.items.length > items.length);
  const count = document.getElementById('browseCount');
  if (count) count.textContent = b.items.length ? `已显示 ${b.items.length} 部` : '共 0 部';
  const more = document.getElementById('browseMore');
  if (more) more.hidden = items.length < BROWSE_PAGE;
  const empty = document.getElementById('browseEmpty');
  if (empty) empty.hidden = b.items.length > 0;
}

function bind() {
  document.getElementById('app').addEventListener('click', (e) => {
    const day = e.target.closest('[data-day]');
    if (day) {
      state.selectedDate = day.dataset.day;
      renderCalendarDay();
      return
    }
    const suggestion = e.target.closest('[data-hot]');
    if (suggestion) {
      const ta = document.getElementById('q');
      ta.value = suggestion.dataset.hot;
      state.q = ta.value;
      state.cat = null;
      renderResultView();
      return
    }
    const mode = e.target.closest('[data-mode]');
    if (mode) {
      state.mode = mode.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b === mode));
      showToast(state.mode === 'quick' ? '快速模式：直接匹配片名与类型' : '智能模式：按一句话描述找片');
      return
    }
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.cat = cat.dataset.cat;
      state.q = '';
      const ta = document.getElementById('q');
      if (ta) ta.value = '';
      renderResultView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return
    }
    if (e.target.closest('#clearView')) {
      state.cat = null;
      state.q = '';
      state.browse = null;
      const ta = document.getElementById('q');
      if (ta) ta.value = '';
      renderResultView();
      return
    }
    if (e.target.closest('#browseMore')) {
      if (state.browse) loadBrowsePage(state.browse.page + 1, true);
      return
    }
    const sc = e.target.closest('[data-scroll]');
    if (sc) {
      const [id, dir] = sc.dataset.scroll.split(':');
      const strip = document.getElementById('strip-' + id);
      strip?.scrollBy({ left: Number(dir) * Math.round(strip.clientWidth * 0.8), behavior: 'smooth' });
      return
    }
    const more = e.target.closest('[data-more]');
    if (more) {
      const row = findRow(more.dataset.more);
      if (!row) return
      const { title, cat, area } = browseOf(row);
      openBrowse({ title, cat: cat || '', area: area || '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return
    }
    if (e.target.closest('#loadmore')) {
      const pools = ['all', 'kr', 'jp'];
      const pool = pools[state.extra.length % pools.length];
      const n = state.extra.length + 1;
      state.extra.push({
        id: 'more' + n,
        title: ['再刷一遍', '今晚继续', '片单补货'][(n - 1) % 3],
        sub: ['越往后越好看', '换个口味继续看', '按热度挑的下一批'][(n - 1) % 3],
        items: allByPool(pool).slice(0, 10),
        pool,
      });
      document.getElementById('rows').insertAdjacentHTML('beforeend', rowHTML(state.extra.at(-1)));
      const btn = document.getElementById('loadmore');
      btn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return
    }
    if (e.target.closest('[data-action="expand"]')) showToast('可以粘贴影片链接或上传剧照来找片');
    if (e.target.closest('[data-action="mic"]')) showToast('语音搜索正在准备中');
  });

  const form = document.getElementById('searchForm');
  const ta = document.getElementById('q');
  ta.addEventListener('input', () => {
    state.q = ta.value;
    state.cat = null;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderResultView, 240);
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = ta.value;
    state.cat = null;
    renderResultView();
    if (state.q.trim()) showToast(`正在为你找“${state.q.trim()}”`);
    else showToast('先输入片名、类型或地区');
  });
}

initTheme();
const bootCat = new URLSearchParams(location.search).get('cat');
if (bootCat && CATS[bootCat]) state.cat = bootCat;
document.getElementById('app').innerHTML = shell({
  body: bodyHTML(),
  active: '首页',
  tabActive: '首页',
  top: true,
});
bindShell();
bind();
renderResultView();
try {
  if (!localStorage.getItem('kj-notice-seen')) {
    window.setTimeout(() => {
      const notice = document.getElementById('noticeWrap');
      if (!notice) return
      notice.classList.add('on');
      notice.setAttribute('aria-hidden', 'false');
    }, 450);
  }
} catch {}

HOME_CAT_KEYS.forEach((cat) => {
  const items = allByPool(cat).slice(0, 4);
  state.categories[cat] = { total: allByPool(cat).length, items };
});
document.getElementById('cats').innerHTML = catsHTML();

function readProgress() {
  try { return JSON.parse(localStorage.getItem('kj-progress') || '{}') } catch { return {} }
}

function heatText(value) {
  const v = Number(value) || 0;
  if (v >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return v ? String(Math.round(v)) : ''
}

function feedShow(r, i) {
  return {
    id: r.id,
    title: r.title,
    year: r.year || '',
    area: r.area || '中国大陆',
    genres: r.genres?.length ? r.genres : [],
    poster: r.poster || '',
    badge: r.remarks || '最近更新',
    heat: heatText(r.heatValue),
    heatValue: r.heatValue || 0,
    hue: [206, 214, 222, 230, 238, 196, 188, 26, 12, 210][i % 10],
    vip: r.availability?.state === 'login_required',
    cat: KIND_CAT[r.kind] || 'tv',
    kindLabel: KIND_LABEL[r.kind] || '影视',
    seed: i,
  }
}

async function loadContinue() {
  const strip = document.getElementById('continueStrip');
  const row = document.getElementById('continueRow');
  if (row) row.hidden = true;
  if (strip) strip.innerHTML = '';
  const user = getCachedUser();
  let items = [];
  if (user) {
    const rows = await fetchUserProgress('', 12);
    items = rows.map((row, i) => ({
      show: feedShow(
        {
          id: row.showId,
          title: row.title || row.showId,
          year: row.year,
          area: row.area,
          genres: [],
          poster: row.poster,
          remarks: row.remarks,
          kind: row.kind,
        },
        i
      ),
      progress: { idx: row.idx, position: row.position, duration: row.duration },
    }));
  } else {
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem('kj-history') || '[]'); } catch {}
    if (!ids.length) return
    const progress = readProgress();
    const local = new Map(shows.map((s) => [s.id, s]));
    items = await Promise.all(ids.slice(0, 10).map(async (id, i) => {
      const cached = local.get(id);
      let show = cached;
      if (!show) {
        await proxyReady;
        const remote = await proxyShow(id).catch(() => null);
        show = remote?.id ? feedShow(remote, i) : null;
      }
      if (!show) return null
      return { show, progress: progress[id] || { idx: 0, position: 0, duration: 0 } }
    }));
  }
  const valid = items.filter(Boolean);
  if (!strip || !row || !valid.length) return
  strip.innerHTML = valid.map(({ show, progress: item }) => {
    const episodeLabel = item.label || `第${Number(item.idx || 0) + 1}集`;
    const seconds = Math.max(0, Number(item.position) || 0);
    const duration = Math.max(0, Number(item.duration) || 0);
    const percent = duration ? Math.min(99, Math.round(seconds / duration * 100)) : 0;
    const time = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    const meta = `${episodeLabel} · ${time}${duration ? ` · ${percent}%` : ''}`;
    return `<article class="continue-card"><a class="continue-link" href="${u('/player/')}?id=${encodeURIComponent(show.id)}&ep=${Number(item.idx) || 0}&t=${Math.floor(seconds)}&v=live">${posterArt(show)}<span class="p-badge">${show.badge}</span><span class="p-shade"></span><h3 class="p-title">${show.title}</h3><p class="p-meta">${show.year || '—'} · ${show.area}</p></a><div class="continue-progress"><span>${meta}</span><i style="--progress:${percent}%"></i></div></article>`
  }).join('');
  row.hidden = false;
}

async function loadHomeFeed() {
  await proxyReady;
  const feed = await proxyHomeFeed();
  if (!feed?.rows) return
  const defs = new Map(ROWS.map((row) => [row.id, row]));
  const order =
    Array.isArray(feed.order) && feed.order.length
      ? feed.order
      : Object.keys(feed.rows).map((id) => ({ id, title: defs.get(id)?.title || id, sub: defs.get(id)?.sub || '' }));
  const rows = [];
  for (const item of order) {
    const list = feed.rows[item.id] || [];
    if (!list.length) continue
    const base = defs.get(item.id) || {};
    const mapped = list.map((r, i) => feedShow(r, i));
    rows.push({
      id: item.id,
      title: item.title || base.title || item.id,
      sub: item.sub || base.sub || '',
      cat: base.cat || mapped[0]?.cat || 'tv',
      pool: base.pool || mapped[0]?.cat || 'tv',
      items: mapped,
    });
  }
  if (!rows.length) return
  state.rows = rows;
  state.order = rows.map((row) => row.id);
  state.extra = [];
  const box = document.getElementById('rows');
  if (box) box.innerHTML = rows.map((row) => rowHTML(row)).join('');
  const hot = findRow('hot');
  if (hot) {
    const hotLinks = document.querySelector('.home-hot');
    if (hotLinks) hotLinks.innerHTML = `<span>热门影片</span>${hot.items.slice(0, 7).map((s) => `<button type="button" data-hot="${s.title}"><span aria-hidden="true">▶</span>${s.title}</button>`).join('')}`;
  }
  if (feed.calendar?.length) {
    state.calendar = feed.calendar.map((day) => ({
      ...day,
      count: Object.values(day.groups || {}).reduce((total, group) => total + (Number(group.total) || 0), 0),
    }));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    state.selectedDate = state.calendar.find((day) => day.date === today)?.date || state.calendar[0].date;
    const days = document.getElementById('days');
    if (days) {
      days.innerHTML = daysHTML();
      centerSelectedDay(days);
    }
    const range = document.getElementById('calendarRange');
    if (range) range.textContent = `${state.calendar[0].date.slice(5, 7)}月${Number(state.calendar[0].date.slice(8))}日 - ${state.calendar.at(-1).date.slice(5, 7)}月${Number(state.calendar.at(-1).date.slice(8))}日`;
    renderCalendarDay();
  }
}

loadContinue();
loadHomeFeed();
document.addEventListener('kj-auth-changed', () => void loadContinue());
