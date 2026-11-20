import './styles-gQsbNd0W.js';
import { i as icon, a as initTheme, s as shell, p as pageHead, b as bindShell, c as showToast } from './shell-CcX8x_5v.js';

const body = `<section class="page-body"><div class="wrap page p-sessions">
  <div class="lib-head">
    <span class="lh-ico">${icon('chat', 20)}</span>
    <h1>会话记录</h1>
    <span class="count-chip">0</span>
    <span class="src-chip">本机</span>
  </div>
  <label class="searchbar">
    ${icon('search', 15)}
    <input type="search" id="filter" placeholder="搜索会话" />
  </label>
  <section class="lib-panel" aria-label="会话列表">
    <div class="empty-card">暂无本机会话</div>
  </section>
</div></section>`;

initTheme();
document.getElementById('app').innerHTML = shell({
  body,
  active: '历史',
  tabActive: '历史',
  top: false,
  head: pageHead({ title: '会话记录', nav: '历史', back: '/' }),
});
bindShell();

document.getElementById('filter')?.addEventListener('input', (e) => {
  if (e.target.value.trim()) showToast('本机还没有记录，去首页问点什么吧');
});
