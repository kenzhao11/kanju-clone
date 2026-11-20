import { z as openModal, A as logoutAccount, B as refreshAccountUI, c as showToast, C as applyTheme, D as closeModal, i as icon, E as avatarHTML, m as getCachedUser } from './shell-CcX8x_5v.js';

/**
 * 站点设置：网站设置面板与播放器齿轮菜单共用同一份值。
 *
 * 存储沿用站点既有 key（kj-speed / kj-hq / kj-dm / kj-fill），
 * iOS 注入层和旧的播放逻辑读的也是这几个，所以两边天然同源；
 * 新增项各自一个 key，改即存，没有「保存」按钮。
 */

const SPEED_MIN = 0.5;
const SPEED_MAX = 3;
const SPEED_STEP = 0.25;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const KEYS = {
  speed: 'kj-speed',
  enhance: 'kj-hq',
  danmaku: 'kj-dm',
  fill: 'kj-fill',
  skipIntro: 'kj-skip-intro',
  skipOutro: 'kj-skip-outro',
  p2p: 'kj-p2p',
  dmOpacity: 'kj-dm-opacity',
  dmSize: 'kj-dm-size',
  dmSpeed: 'kj-dm-speed',
  dmArea: 'kj-dm-area',
};

const DEFAULTS = {
  speed: 1,
  enhance: false,
  danmaku: true,
  fill: 'contain',
  skipIntro: true,
  skipOutro: false,
  p2p: false,
  dmOpacity: 0.9,
  dmSize: 18,
  dmSpeed: 8,
  dmArea: 100, // 弹幕显示区域：占画面高度百分比（100 = 全画面）
};

const NUMERIC = new Set(['speed', 'dmOpacity', 'dmSize', 'dmSpeed', 'dmArea']);

function raw(key) {
  try {
    return localStorage.getItem(KEYS[key])
  } catch {
    return null
  }
}

function getSetting(key) {
  const stored = raw(key);
  if (stored === null || stored === undefined || stored === '') return DEFAULTS[key]
  if (NUMERIC.has(key)) {
    const value = Number(stored);
    return Number.isFinite(value) ? value : DEFAULTS[key]
  }
  if (typeof DEFAULTS[key] === 'boolean') return stored === '1'
  return stored
}

function setSetting(key, value, { silent = false } = {}) {
  if (!(key in DEFAULTS)) return
  const stored = NUMERIC.has(key) ? String(value) : typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  try {
    localStorage.setItem(KEYS[key], stored);
  } catch {}
  if (!silent) {
    try {
      window.dispatchEvent(new CustomEvent('kj-settings', { detail: { key, value: getSetting(key) } }));
    } catch {}
  }
}

/** 监听设置变化（同一页内改值 + 其它标签页 storage 事件）。 */
function onSettingChange(handler) {
  const local = (event) => handler(event.detail?.key, event.detail?.value);
  const remote = (event) => {
    for (const [key, storageKey] of Object.entries(KEYS)) {
      if (event.key === storageKey) handler(key, getSetting(key));
    }
  };
  window.addEventListener('kj-settings', local);
  window.addEventListener('storage', remote);
  return () => {
    window.removeEventListener('kj-settings', local);
    window.removeEventListener('storage', remote);
  }
}

function clampRate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1
  const snapped = Math.round(number / SPEED_STEP) * SPEED_STEP;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, Number(snapped.toFixed(2))))
}

function rateText(value) {
  return clampRate(value).toFixed(2)
}

const FILL_MODES = [
  ['contain', '默认'],
  ['fill', '拉伸'],
  ['cover', '铺满'],
];

const DM_AREA_MODES = [
  [25, '1/4 画面'],
  [50, '1/2 画面'],
  [75, '3/4 画面'],
  [100, '全画面'],
];

/**
 * 站点设置面板（网站此前没有）。
 *
 * 入口：顶栏右侧齿轮/头像、侧栏设置按钮、播放器齿轮里的「更多设置」。
 * 形态：桌面居中弹窗（约 560px，内部滚动）；手机全屏；右上圆形 ✕；
 *       点遮罩或按 Esc 关闭。浅色淡绿渐变底 + 白色分组卡片。
 * 取值：全部来自 settings.js（与播放器齿轮菜单同一份值），改即存，无保存按钮。
 */


function rowSwitch(key) {
  return `<button class="set-sw" type="button" role="switch" data-set-switch="${key}" aria-checked="false"><i></i></button>`
}

function themeSegmented() {
  return `<div class="set-seg" role="group" aria-label="界面主题" data-set-seg="theme">
    <button type="button" data-seg-val="light">浅色</button>
    <button type="button" data-seg-val="dark">深色</button>
  </div>`
}

function speedSelect() {
  return `<select class="set-sel" data-set-select="speed" aria-label="默认播放倍速">
    ${SPEED_OPTIONS.map((value) => `<option value="${value}">${value === 1 ? '1 倍（默认）' : value + ' 倍'}</option>`).join('')}
  </select>`
}

function dmAreaSegmented() {
  return `<div class="set-seg set-seg-sm" role="group" aria-label="弹幕显示区域" data-set-seg="dmArea">
    ${DM_AREA_MODES.map(([value, label]) => `<button type="button" data-seg-val="${value}">${label}</button>`).join('')}
  </div>`
}

function sliderRow(key, label, { min, max, step, unit }) {
  return `<div class="set-subrow">
    <span class="set-sublabel">${label}</span>
    <input class="set-range" type="range" data-set-range="${key}" min="${min}" max="${max}" step="${step}" aria-label="${label}" />
    <span class="set-subval" data-set-val="${key}">${unit}</span>
  </div>`
}

function panelHTML() {
  return `<div class="set-wrap" id="setWrap" aria-hidden="true">
  <div class="set-sheet" role="dialog" aria-modal="true" aria-labelledby="setTitle">
    <header class="set-head">
      <h2 id="setTitle">设置</h2>
      <button class="set-x" type="button" data-set-close aria-label="关闭设置">${icon('close', 18)}</button>
    </header>

    <div class="set-scroll">
      <section class="set-group">
        <h3 class="set-gh"><span class="set-ghi">${icon('user', 13)}</span>账号</h3>
        <div class="set-card">
          <button class="set-row set-row-btn" type="button" data-set-nav="account">
            <span class="set-avatar-slot">${avatarHTML('set-avatar')}</span>
            <span class="set-main">
              <span class="set-t">个人资料</span>
              <span class="set-s" data-account-name>游客账号</span>
            </span>
            <span class="set-drill">${icon('chevronRight', 14)}</span>
          </button>
          <button class="set-row set-row-btn" type="button" data-set-nav="security">
            <span class="set-main">
              <span class="set-t">账号安全</span>
              <span class="set-s">修改密码</span>
            </span>
            <span class="set-drill">${icon('chevronRight', 14)}</span>
          </button>
        </div>
      </section>

      <section class="set-group">
        <h3 class="set-gh"><span class="set-ghi">${icon('sun', 13)}</span>外观</h3>
        <div class="set-card">
          <div class="set-row">
            <span class="set-main"><span class="set-t">界面主题</span></span>
            ${themeSegmented()}
          </div>
        </div>
      </section>

      <section class="set-group">
        <h3 class="set-gh"><span class="set-ghi">${icon('play', 13)}</span>播放</h3>
        <div class="set-card">
          <div class="set-row">
            <span class="set-main"><span class="set-t">默认播放倍速</span><span class="set-s">下次打开视频时使用</span></span>
            ${speedSelect()}
          </div>
          <div class="set-row">
            <span class="set-main"><span class="set-t">跳过片头</span><span class="set-s">使用影片已设置的时间点</span></span>
            ${rowSwitch('skipIntro')}
          </div>
          <div class="set-row">
            <span class="set-main"><span class="set-t">跳过片尾</span><span class="set-s">使用影片已设置的时间点</span></span>
            ${rowSwitch('skipOutro')}
          </div>
          <div class="set-row">
            <span class="set-main"><span class="set-t">画质增强</span><span class="set-s">下次打开视频时使用</span></span>
            ${rowSwitch('enhance')}
          </div>
          <div class="set-row">
            <span class="set-main"><span class="set-t">显示弹幕</span><span class="set-s">关闭后画面不再飘弹幕</span></span>
            ${rowSwitch('danmaku')}
          </div>
          <button class="set-row set-row-btn" type="button" data-set-expand="danmaku" aria-expanded="false">
            <span class="set-main"><span class="set-t">弹幕设置</span><span class="set-s">透明度 · 字号 · 速度 · 显示区域</span></span>
            <span class="set-drill" data-set-expand-arrow>${icon('chevronRight', 14)}</span>
          </button>
          <div class="set-sub" id="setDm" hidden>
            ${sliderRow('dmOpacity', '透明度', { min: 0.2, max: 1, step: 0.1, unit: '90%' })}
            ${sliderRow('dmSize', '字号', { min: 12, max: 28, step: 1, unit: '18px' })}
            ${sliderRow('dmSpeed', '速度', { min: 4, max: 14, step: 1, unit: '8s' })}
            <div class="set-subrow">
              <span class="set-sublabel">显示区域</span>
              ${dmAreaSegmented()}
            </div>
          </div>
          <div class="set-row">
            <span class="set-main"><span class="set-t">P2P 共享加速</span><span class="set-s">借用其他观众的带宽提速，会占用少量上行</span></span>
            ${rowSwitch('p2p')}
          </div>
        </div>
      </section>
    </div>

    <div class="set-page" id="setAccountPage" hidden>
      <header class="set-head set-head-sub">
        <button class="set-back" type="button" data-set-back aria-label="返回设置">${icon('chevronLeft', 18)}</button>
        <h2 id="setAccountTitle">个人资料</h2>
        <span class="set-x-ghost" aria-hidden="true"></span>
      </header>
      <div class="set-scroll">
        <div class="set-card set-account-card">
          <div class="set-account-top">
            ${avatarHTML('set-avatar-lg')}
            <div class="set-account-id">
              <p class="set-account-nick" data-account-name>游客账号</p>
              <p class="set-account-sub" data-account-state>本设备使用中 · 观看记录保存在本机</p>
            </div>
          </div>
          <div class="set-account-actions">
            <button class="set-btn set-btn-primary" type="button" data-set-account-action="login">登录账号</button>
            <button class="set-btn" type="button" data-set-account-action="logout" hidden>退出登录</button>
          </div>
        </div>
        <div class="set-card" id="setSecurityCard" hidden>
          <div class="set-row">
            <span class="set-main"><span class="set-t">修改密码</span><span class="set-s">网页端暂未开放，请在 App 内修改</span></span>
          </div>
        </div>
        <p class="set-note">登录后可跨设备同步观看记录与断点进度。</p>
      </div>
    </div>
  </div>
</div>`
}

let mounted = false;
let wrap = null;

function currentThemeMode() {
  const mode = document.documentElement.dataset.themeMode || 'dark';
  if (mode === 'light' || mode === 'dark') return mode
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function syncControls() {
  if (!wrap) return
  wrap.querySelectorAll('[data-set-switch]').forEach((button) => {
    const key = button.dataset.setSwitch;
    const on = !!getSetting(key);
    button.classList.toggle('on', on);
    button.setAttribute('aria-checked', String(on));
  });
  const theme = currentThemeMode();
  wrap.querySelectorAll('[data-set-seg="theme"] [data-seg-val]').forEach((button) => {
    const on = button.dataset.segVal === theme;
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
  });
  const speed = wrap.querySelector('[data-set-select="speed"]');
  if (speed) speed.value = String(getSetting('speed'));
  const area = String(getSetting('dmArea'));
  wrap.querySelectorAll('[data-set-seg="dmArea"] [data-seg-val]').forEach((button) => {
    const on = button.dataset.segVal === area;
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
  });
  const units = { dmOpacity: (value) => Math.round(value * 100) + '%', dmSize: (value) => value + 'px', dmSpeed: (value) => value + 's' };
  wrap.querySelectorAll('[data-set-range]').forEach((input) => {
    const key = input.dataset.setRange;
    const value = getSetting(key);
    input.value = String(value);
    const out = wrap.querySelector(`[data-set-val="${key}"]`);
    if (out && units[key]) out.textContent = units[key](value);
  });
  syncAccount();
}

function syncAccount() {
  if (!wrap) return
  const user = getCachedUser();
  const name = user ? user.username : '游客账号';
  wrap.querySelectorAll('[data-account-name]').forEach((el) => (el.textContent = name));
  const state = wrap.querySelector('[data-account-state]');
  if (state) state.textContent = user ? '已登录 · 观看记录跨设备同步' : '本设备使用中 · 观看记录保存在本机';
  const login = wrap.querySelector('[data-set-account-action="login"]');
  const logout = wrap.querySelector('[data-set-account-action="logout"]');
  if (login) login.hidden = !!user;
  if (logout) logout.hidden = !user;
}

function showPage(page) {
  if (!wrap) return
  const account = wrap.querySelector('#setAccountPage');
  const main = wrap.querySelector('.set-scroll');
  const isAccount = page === 'account' || page === 'security';
  if (account) account.hidden = !isAccount;
  if (main) main.hidden = isAccount;
  const head = wrap.querySelector('.set-head:not(.set-head-sub)');
  if (head) head.hidden = isAccount;
  wrap.classList.toggle('is-sub', isAccount);
  const title = wrap.querySelector('#setAccountTitle');
  if (title) title.textContent = page === 'security' ? '账号安全' : '个人资料';
  const security = wrap.querySelector('#setSecurityCard');
  if (security) security.hidden = page !== 'security';
}

function ensureSettingsPanel() {
  if (mounted) return wrap
  const holder = document.createElement('div');
  holder.innerHTML = panelHTML();
  wrap = holder.firstElementChild;
  document.body.appendChild(wrap);
  mounted = true;
  syncControls();

  wrap.addEventListener('click', async (event) => {
    const target = event.target;
    if (target === wrap || target.closest('[data-set-close]')) return closeSettings()

    const back = target.closest('[data-set-back]');
    if (back) return showPage('main')

    const nav = target.closest('[data-set-nav]');
    if (nav) {
      showPage(nav.dataset.setNav);
      return
    }

    const accountAction = target.closest('[data-set-account-action]');
    if (accountAction) {
      const action = accountAction.dataset.setAccountAction;
      if (action === 'login') {
        closeSettings();
        openModal();
        return
      }
      if (action === 'logout') {
        await logoutAccount();
        refreshAccountUI();
        syncAccount();
        showToast('已退出登录');
        return
      }
    }

    const expand = target.closest('[data-set-expand]');
    if (expand) {
      const box = wrap.querySelector('#setDm');
      const open = box?.hidden !== false;
      if (box) box.hidden = !open;
      expand.setAttribute('aria-expanded', String(open));
      wrap.querySelector('[data-set-expand-arrow]')?.classList.toggle('open', open);
      return
    }

    const sw = target.closest('[data-set-switch]');
    if (sw) {
      const key = sw.dataset.setSwitch;
      const next = !getSetting(key);
      setSetting(key, next);
      sw.classList.toggle('on', next);
      sw.setAttribute('aria-checked', String(next));
      return
    }

    const seg = target.closest('[data-set-seg] [data-seg-val]');
    if (seg) {
      const group = seg.closest('[data-set-seg]');
      const key = group.dataset.setSeg;
      const value = seg.dataset.segVal;
      if (key === 'theme') applyTheme(value, { toast: false });
      else if (key === 'dmArea') setSetting(key, Number(value));
      syncControls();
      return
    }
  });

  wrap.addEventListener('change', (event) => {
    const select = event.target.closest('[data-set-select]');
    if (select) {
      setSetting(select.dataset.setSelect, Number(select.value));
      return
    }
    const range = event.target.closest('[data-set-range]');
    if (range) setSetting(range.dataset.setRange, Number(range.value));
  });

  wrap.addEventListener('input', (event) => {
    const range = event.target.closest('[data-set-range]');
    if (!range) return
    const key = range.dataset.setRange;
    const value = Number(range.value);
    setSetting(key, value);
    const out = wrap.querySelector(`[data-set-val="${key}"]`);
    if (out) out.textContent = key === 'dmOpacity' ? Math.round(value * 100) + '%' : key === 'dmSize' ? value + 'px' : value + 's';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && wrap && wrap.classList.contains('on')) {
      event.stopPropagation();
      closeSettings();
    }
  }, true);

  window.addEventListener('kj-auth-changed', syncAccount);
  window.addEventListener('kj-settings', syncControls);
  window.addEventListener('storage', syncControls);
  return wrap
}

function openSettings({ section = '' } = {}) {
  ensureSettingsPanel();
  if (!wrap) return
  showPage('main');
  syncControls();
  if (section === 'danmaku') {
    const box = wrap.querySelector('#setDm');
    const btn = wrap.querySelector('[data-set-expand="danmaku"]');
    if (box) box.hidden = false;
    btn?.setAttribute('aria-expanded', 'true');
    wrap.querySelector('[data-set-expand-arrow]')?.classList.add('open');
    setTimeout(() => {
      const row = wrap.querySelector('#setDm');
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
  }
  wrap.classList.add('on');
  wrap.setAttribute('aria-hidden', 'false');
  document.body.classList.add('set-open');
  setTimeout(() => wrap?.querySelector('.set-x')?.focus(), 80);
}

function closeSettings() {
  if (!wrap) return
  wrap.classList.remove('on');
  wrap.classList.remove('is-sub');
  wrap.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('set-open');
}

function settingsOpen() {
  return !!wrap && wrap.classList.contains('on')
}

/** 顶栏/侧栏入口用：登录弹窗和设置面板共用 ESC 关闭，这里先关设置再关弹窗。 */
function toggleSettings() {
  if (settingsOpen()) closeSettings();
  else {
    closeModal();
    openSettings();
  }
}

const settingsPanel = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  closeSettings,
  ensureSettingsPanel,
  openSettings,
  settingsOpen,
  toggleSettings
}, Symbol.toStringTag, { value: 'Module' }));

export { FILL_MODES as F, onSettingChange as a, settingsPanel as b, clampRate as c, getSetting as g, openSettings as o, rateText as r, setSetting as s };
