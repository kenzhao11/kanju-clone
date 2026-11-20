import './styles-gQsbNd0W.js';
import { i as icon, a as initTheme, s as shell, p as pageHead, b as bindShell, f as fetchUserProgress, u, h as posterArt, m as getCachedUser } from './shell-CcX8x_5v.js';
import { s as shows } from './data-COe7SVsj.js';

const HISTORY_KEY = 'kj-history';
const PROGRESS_KEY = 'kj-progress';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

function timeText(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`
}

function localRows() {
  const ids = readJson(HISTORY_KEY, []);
  const progress = readJson(PROGRESS_KEY, {});
  return ids
    .map((id, index) => {
      const show = shows.find((item) => item.id === id);
      if (!show) return null
      const saved = progress[id] || {};
      return {
        show,
        idx: Number(saved.idx) || 0,
        position: Number(saved.position) || 0,
        duration: Number(saved.duration) || 0,
        label: saved.label || '',
        seed: index,
      }
    })
    .filter(Boolean)
}

const KIND_CAT = {
  series: 'tv',
  short_drama: 'tv',
  movie: 'movie',
  anime: 'anime',
  animation: 'anime',
  variety: 'variety',
  documentary: 'variety',
};

function remoteRows(items) {
  return items.map((item, index) => ({
    show: {
      id: item.showId,
      title: item.title || item.showId,
      poster: item.poster || '',
      year: item.year || '',
      area: item.area || '',
      genres: [],
      badge: item.remarks || '最近观看',
      hue: [206, 214, 222, 230, 238, 196, 188, 26, 12, 210][index % 10],
      seed: index,
      cat: KIND_CAT[item.kind] || 'tv',
    },
    idx: Number(item.idx) || 0,
    position: Number(item.position) || 0,
    duration: Number(item.duration) || 0,
    label: '',
    seed: index,
  }))
}

function rowHTML(item) {
  const episode = item.label || `第${Number(item.idx) + 1}集`;
  const meta = [item.show.badge, item.show.year, episode, timeText(item.position)].filter(Boolean).join(' · ');
  const percent = item.duration ? Math.min(99, Math.round((item.position / item.duration) * 100)) : 0;
  return `<a class="hitem" href="${u('/player/')}?id=${encodeURIComponent(item.show.id)}&ep=${Number(item.idx) || 0}&t=${Math.floor(item.position)}&v=live">
    ${posterArt(item.show, 'thumb')}
    <span class="hi-main"><h4>${esc(item.show.title)}</h4><p>${esc(meta)}</p>${percent ? `<span class="hi-progress"><i style="width:${percent}%"></i></span>` : ''}</span>
    <span class="hi-go">${icon('chevronRight', 16)}</span>
  </a>`
}

const body = `<section class="page-body"><div class="wrap page p-history">
  <div class="lib-head">
    <h1>播放历史</h1>
    <span class="count-chip" id="historyCount">0</span>
  </div>
  <label class="searchbar">
    ${icon('search', 15)}
    <input type="search" id="filter" placeholder="搜索标题、类型、地区" />
  </label>
  <section class="lib-panel" aria-label="播放历史列表">
    <div id="historyList"></div>
  </section>
</div></section>`;

initTheme();
document.getElementById('app').innerHTML = shell({
  body,
  active: '历史',
  tabActive: '历史',
  top: false,
  head: pageHead({ title: '播放历史', nav: '历史', back: '/' }),
});
bindShell();

const filter = document.getElementById('filter');
const list = document.getElementById('historyList');
const count = document.getElementById('historyCount');

function applyFilter() {
  const q = filter?.value.trim().toLowerCase() || '';
  document.querySelectorAll('#historyList .hitem').forEach((element) => {
    element.style.display = element.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function render(rows) {
  if (!list) return
  if (count) count.textContent = String(rows.length);
  if (rows.length) {
    list.innerHTML = `<div class="hlist" id="hlist">${rows.map(rowHTML).join('')}</div>`;
  } else {
    const guest = !getCachedUser();
    list.innerHTML = `<div class="empty-card" id="emptyCard">
      <p>${guest ? '还没有观看历史' : '这个账号还没有观看历史'}</p>
      ${guest ? `<button class="btn-mint-line" type="button" data-action="login">${icon('login', 16)}登录后跨设备同步</button>` : ''}
    </div>`;
  }
  applyFilter();
}

filter?.addEventListener('input', applyFilter);
render(localRows());

async function loadAccountHistory() {
  const user = getCachedUser();
  if (!user) {
    render(localRows());
    return
  }
  const items = await fetchUserProgress('', 100);
  const rows = remoteRows(items);
  render(rows.length ? rows : localRows());
}

void loadAccountHistory();
document.addEventListener('kj-auth-changed', () => void loadAccountHistory());

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
