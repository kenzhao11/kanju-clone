import './styles-gQsbNd0W.js';
import { i as icon, a as initTheme, s as shell, p as pageHead, b as bindShell, c as showToast } from './shell-CcX8x_5v.js';

const CARDS = [
  {
    ico: 'phone',
    kind: '安卓手机',
    name: 'Android',
    tag: '可下载',
    title: '安卓全新版本-0128',
    desc: '适用于 Android 8+及以上的手机，支持视频下载，4K超清播放，平板设备，大小约5M，安装包格式 APK',
    chips: [
      ['shield', '版本 v0.1.2.8'],
      ['monitor', 'Android 8+'],
      ['download', 'APK'],
    ],
    cta: '下载APP',
    body: `<div class="dl-body"><h4>本次更新主要优化了以下内容：</h4><ol>
      <li>优化多项功能及使用体验</li>
      <li>修复部分已知问题，提升运行稳定性</li>
      <li>新增 APP 版本更新检测，后续有新版本时可在下载页面检测更新</li>
    </ol><p class="dl-note">大家更新后可以多多体验一下，有任何问题或者建议，欢迎随时反馈～</p></div>`,
  },
  {
    ico: 'apple',
    kind: 'iOS自签',
    name: 'iOS',
    tag: '可下载',
    title: 'IOS签名版本来啦！',
    desc: 'iOS全新自签版本！需要签名安装',
    chips: [
      ['info', '版本 v0.1.2.6'],
      ['download', '支持视频下载'],
    ],
    cta: '下载签名安装',
    body: `<div class="dl-body"><h4>本次更新主要优化了以下内容：</h4>
      <p>1. 优化综艺选集、换源体验<br/>2. 新增离线历史记录，封面续播卡片<br/>3. 优化播放续播体验</p>
      <p class="dl-note">优化并修复了一些已知 Bug，提升整体使用体验</p></div>`,
  },
  {
    ico: 'monitor',
    kind: '电视端',
    name: 'TV',
    tag: '可下载',
    title: 'TV安卓版',
    desc: '适用于 Android 7 及以上电视或盒子，安装包格式 APK，推荐使用野草助手安装。',
    chips: [
      ['shield', '版本 v0.2.1.3 (vc24)'],
      ['monitor', 'Android 6+'],
      ['download', 'APK'],
    ],
    cta: '下载TV版',
    body: `<div class="dl-body">
      <p>本次版本已内置版本更新检测功能。安装此版本后，可在 APP 内点击版本号进行检查；如有新版本，系统会自动提示更新，方便大家及时获取最新版本</p></div>`,
  },
  {
    ico: 'phone',
    kind: '历史版本',
    name: 'Android',
    tag: '可下载',
    title: '安卓历史版本',
    desc: '老版本下载链接将同步挂上，方便安卓用户下载安装使用。',
    chips: [
      ['shield', '版本 v0.1.21'],
      ['monitor', 'Android 10+'],
      ['download', 'APK'],
    ],
    cta: '下载APP',
    body: `<div class="dl-body"><h3>安装说明</h3>
      <ol><li>从官方渠道下载APP。</li><li>打开 APK 文件并点击“安装”。</li><li>如果系统阻止安装，请进入系统设置，允许当前浏览器或文件管理器“安装未知应用”。</li><li>返回安装页面并完成安装。</li><li>安装完成后，点击“打开”即可使用。</li></ol></div>`,
  },
  {
    ico: 'monitor',
    kind: '安卓手机',
    name: 'Android',
    tag: '可下载',
    title: 'TV历史版本',
    desc: 'TV历史版本下载链接将同步挂上，方便大家下载安装使用。',
    chips: [
      ['shield', '版本 v0.2.1 (12)'],
      ['monitor', 'Android 6+'],
      ['download', 'APK'],
    ],
    cta: '下载阿噗影视-TV',
    body: `<div class="dl-body"><p>适用于 安卓系统的电视或盒子，推荐使用野草助手安装。打开TV后点击网页或者app 输入配对码成功登录一次后即可使用。</p></div>`,
  },
  {
    ico: 'monitor',
    kind: '电视端',
    name: 'TV',
    tag: '可下载',
    title: 'TV/车机版',
    desc: '车机用户建议使用TV版，已完成车机适配。由于部分车机安卓版本较低，不建议安装手机版本。',
    chips: [
      ['shield', '版本 v0.2.4 (vc15)'],
      ['download', 'APK'],
    ],
    cta: '下载TV版',
    body: `<div class="dl-body"><p>车机用户请直接安装 TV版本，目前已针对车机使用场景进行适配，安装后即可体验。部分车机搭载的安卓系统版本较低，安装手机版本的话可能出现兼容性或操作问题，使用 TV版适配效果更好。</p></div>`,
  },
];

const body = `<section class="page-body p-dl-body"><div class="wrap page p-download">
  <section class="dl-section" aria-label="阿噗影视应用下载">
    <div class="dl-hero">
      <p class="dl-kicker"><span class="sec-ico">${icon('download', 14)}</span>阿噗影视</p>
      <h1 class="dl-main-title">阿噗影视应用下载</h1>
    </div>
    <div class="dl-grid">
      ${CARDS.map(
        (c) => `<article class="dl-card">
        <div class="dl-top">
          <span class="dl-ico">${icon(c.ico, 24)}</span>
          <div class="dl-names">
            <p class="dl-kind">${c.kind}</p>
            <h2 class="dl-name">${c.name}</h2>
          </div>
          <span class="dl-badge">${c.tag}</span>
        </div>
        <h3 class="dl-title">${c.title}</h3>
        <p class="dl-desc">${c.desc}</p>
        <div class="chips">${c.chips.map(([i, t]) => `<span class="chip">${icon(i, 12)}${t}</span>`).join('')}</div>
        ${c.body}
        <button class="dl-btn" type="button" data-dl="${c.cta}">${icon('external', 16)}${c.cta}</button>
      </article>`
      ).join('')}
    </div>
  </section>
</div></section>`;

initTheme();
document.getElementById('app').innerHTML = shell({
  body,
  active: '',
  tabActive: '首页',
  top: false,
  head: pageHead({ title: '应用下载', nav: '', back: '/' }),
});
bindShell();

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dl]');
  if (b) showToast('演示版本：安装包暂不提供下载');
});
