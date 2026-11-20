import './styles-gQsbNd0W.js';
import { i as icon, u, a as initTheme, s as shell, p as pageHead, b as bindShell, z as openModal, c as showToast } from './shell-CcX8x_5v.js';

const body = `<section class="page-body"><div class="wrap page p-playlists">
  <div class="pl-top">
    <div class="pl-tabs" id="scopeTabs">
      <button class="pl-tab on" type="button" data-scope="tv">影视片单</button>
      <button class="pl-tab" type="button" data-scope="mid">午夜片单</button>
    </div>
    <span class="spacer"></span>
    <button class="btn-mint-line np" type="button" id="newPlaylist">${icon('plus', 17)}<span class="np-txt">新建片单</span></button>
  </div>

  <a class="pl-card" href="${u('/library/history/')}">
    <span class="pl-ico">${icon('bookmark', 30)}</span>
    <span>
      <span class="pl-title">我的收藏<span class="pl-chip">默认片单</span></span>
      <span class="pl-sub">${icon('film', 14)}<span>0 部影片</span></span>
    </span>
    <span class="pl-go">${icon('chevronRight', 18)}</span>
  </a>

  <header class="pl-tabs pl-tabs2" id="ownTabs">
    <button class="pl-tab on" type="button" data-own="made">我创建的</button>
    <button class="pl-tab" type="button" data-own="saved">我收藏的</button>
  </header>

  <section class="pl-empty">
    <div class="login-cta" id="cta">
      <p>登录后管理片单</p>
      <button class="btn-mint-line" type="button" data-action="login">${icon('login', 17)}登录或注册</button>
    </div>
  </section>
</div></section>`;

initTheme();
document.getElementById('app').innerHTML = shell({
  body,
  active: '片单',
  tabActive: '片单',
  top: false,
  head: pageHead({ title: '片单', nav: null, back: '/', big: true }),
});
bindShell();

function tabs(container, attr) {
  container?.addEventListener('click', (e) => {
    const b = e.target.closest(`[data-${attr}]`);
    if (!b) return
    container.querySelectorAll(`[data-${attr}]`).forEach((x) => x.classList.toggle('on', x === b));
  });
}
tabs(document.getElementById('scopeTabs'), 'scope');
tabs(document.getElementById('ownTabs'), 'own');

document.getElementById('newPlaylist')?.addEventListener('click', () => {
  openModal();
});

document.getElementById('cta')?.addEventListener('click', (e) => {
  if (!e.target.closest('[data-action="login"]')) {
    showToast('登录后可以创建自己的片单');
  }
});
