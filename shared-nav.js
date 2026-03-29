/**
 * ============================================================
 *  エコピタ 共通ナビゲーション v2.0（本番版）
 * ============================================================
 *
 *  【重要：運用ルール】
 *  このファイルは nihonrinobe-create.github.io リポジトリに
 *  1つだけ置き、全ページから同じフルURLで読み込むこと。
 *  こうすることで、このファイルを1回修正するだけで
 *  全サイトに変更が反映される。
 *
 *  各HTMLの </body> の直前に以下の1行を追加：
 *  <script src="https://nihonrinobe-create.github.io/shared-nav.js"></script>
 *
 *  ※ 相対パス（src="shared-nav.js"）でも同一リポジトリなら動くが、
 *    将来リポジトリが分かれた場合に壊れるため、フルURL推奨。
 *
 *  【v2.0 変更点】
 *  - 二重読み込み防止
 *  - DOMContentLoaded待ち（読み込み位置の安全保証）
 *  - 日本語ファイル名のURL判定を正規化対応
 *  - 準備中リンクを<span>化（#やalertに頼らない）
 *  - aria-expanded 追加
 */

(function () {
  'use strict';

  // ============================================================
  //  二重読み込み防止
  //  テンプレート共通化等で2回読まれてもボタンが2個出ない
  // ============================================================
  if (document.getElementById('ecopita-nav-trigger')) return;

  // ============================================================
  //  ★ サイト定義 ― URLをここで一括管理 ★
  //  新しいサイトを追加する場合はここに1行足すだけ。
  //  url: null にすると「準備中」表示になる。
  // ============================================================
  var SITES = [
    {
      name: '注文フォーム',
      sub: '新規受付・注文入力',
      icon: '📋',
      url: 'https://nihonrinobe-create.github.io/index.html',
      color: '#06c755'
    },
    {
      name: '業務報告',
      sub: '完了報告・現場記録',
      icon: '🔧',
      url: 'https://nihonrinobe-create.github.io/estimate.html',
      color: '#2196F3'
    },
    {
      name: '見積もり',
      sub: '見積書作成・管理',
      icon: '💰',
      url: 'https://nihonrinobe-create.github.io/%E5%BC%95%E7%94%A8.html',
      color: '#FF9800'
    },
    {
      name: 'ポータル',
      sub: '成績・報酬確認',
      icon: '📊',
      url: 'https://nihonrinobe-create.github.io/%E3%83%9D%E3%83%BC%E3%82%BF%E3%83%AB.html',
      color: '#9C27B0'
    },
    {
      name: 'すり合わせ',
      sub: '案件すり合わせ',
      icon: '🤝',
      url: 'https://nihonrinobe-create.github.io/reward.html',
      color: '#F44336'
    }
  ];

  // ============================================================
  //  現在ページ判定（日本語ファイル名対応）
  //  ブラウザの location.pathname はエンコード済みの場合と
  //  デコード済みの場合がある。両方をデコードして比較する。
  // ============================================================
  function parseUrl(url) {
    try {
      var u = new URL(url, window.location.origin);
      var path = decodeURIComponent(u.pathname).toLowerCase();
      // GitHub Pages では / と /index.html は同じページ
      if (path === '/' || path === '') path = '/index.html';
      return { origin: u.origin, path: path };
    } catch (e) {
      return { origin: '', path: '' };
    }
  }

  var currentParsed = parseUrl(window.location.href);

  function isCurrentSite(siteUrl) {
    if (!siteUrl) return false;
    var site = parseUrl(siteUrl);
    // origin + path の両方が一致する場合のみ「現在」扱い
    return currentParsed.origin === site.origin
        && currentParsed.path === site.path;
  }

  // ============================================================
  //  初期化（DOM準備完了後に実行）
  // ============================================================
  function init() {
    // DOMContentLoaded経由で2回呼ばれた場合の二重初期化防止
    // （<head>で2回読み込まれると、外側のガードはDOM未生成で効かない）
    if (document.getElementById('ecopita-nav-trigger')) return;

    // ---- CSS注入 ----
    var css = '\
    #ecopita-nav-trigger,\
    #ecopita-nav-overlay,\
    #ecopita-nav-panel {\
      box-sizing: border-box;\
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans",\
                   "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif;\
      -webkit-font-smoothing: antialiased;\
    }\
    #ecopita-nav-trigger {\
      position: fixed;\
      top: 12px;\
      right: 12px;\
      z-index: 999999;\
      width: 44px;\
      height: 44px;\
      border-radius: 50%;\
      border: none;\
      background: rgba(255,255,255,0.95);\
      backdrop-filter: blur(12px);\
      -webkit-backdrop-filter: blur(12px);\
      box-shadow: 0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);\
      cursor: pointer;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      transition: transform 0.2s ease, box-shadow 0.2s ease;\
      padding: 0;\
    }\
    #ecopita-nav-trigger:hover {\
      transform: scale(1.08);\
      box-shadow: 0 4px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08);\
    }\
    #ecopita-nav-trigger:active {\
      transform: scale(0.95);\
    }\
    #ecopita-nav-trigger.open {\
      background: #1a1a2e;\
      box-shadow: 0 4px 20px rgba(26,26,46,0.3);\
    }\
    #ecopita-nav-trigger.open .ecopita-dot {\
      background: #fff;\
    }\
    .ecopita-dots {\
      display: grid;\
      grid-template-columns: repeat(3, 5px);\
      gap: 3px;\
    }\
    .ecopita-dot {\
      width: 5px;\
      height: 5px;\
      border-radius: 50%;\
      background: #333;\
      transition: background 0.2s ease;\
    }\
    #ecopita-nav-overlay {\
      position: fixed;\
      inset: 0;\
      background: rgba(0,0,0,0.3);\
      backdrop-filter: blur(4px);\
      -webkit-backdrop-filter: blur(4px);\
      z-index: 999997;\
      opacity: 0;\
      pointer-events: none;\
      transition: opacity 0.25s ease;\
    }\
    #ecopita-nav-overlay.show {\
      opacity: 1;\
      pointer-events: auto;\
    }\
    #ecopita-nav-panel {\
      position: fixed;\
      top: 64px;\
      right: 12px;\
      z-index: 999998;\
      width: 300px;\
      background: #fff;\
      border-radius: 16px;\
      box-shadow: 0 12px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);\
      padding: 8px;\
      opacity: 0;\
      transform: translateY(-12px) scale(0.96);\
      pointer-events: none;\
      transition: opacity 0.25s ease, transform 0.25s ease;\
    }\
    #ecopita-nav-panel.show {\
      opacity: 1;\
      transform: translateY(0) scale(1);\
      pointer-events: auto;\
    }\
    .ecopita-nav-header {\
      padding: 12px 12px 8px;\
      font-size: 11px;\
      font-weight: 700;\
      color: #888;\
      letter-spacing: 0.08em;\
      text-transform: uppercase;\
    }\
    .ecopita-nav-link {\
      display: flex;\
      align-items: center;\
      gap: 12px;\
      padding: 10px 12px;\
      border-radius: 12px;\
      text-decoration: none;\
      color: #1a1a2e;\
      transition: background 0.15s ease, transform 0.15s ease;\
      position: relative;\
    }\
    .ecopita-nav-link:hover {\
      background: #f0f4ff;\
      transform: translateX(2px);\
    }\
    .ecopita-nav-link:active {\
      transform: scale(0.98);\
    }\
    .ecopita-nav-link.current {\
      background: #f0f7ff;\
    }\
    .ecopita-nav-link.current::after {\
      content: "現在";\
      position: absolute;\
      right: 12px;\
      top: 50%;\
      transform: translateY(-50%);\
      font-size: 10px;\
      font-weight: 700;\
      color: #2196F3;\
      background: #e3f2fd;\
      padding: 2px 8px;\
      border-radius: 99px;\
    }\
    .ecopita-nav-link.coming-soon {\
      opacity: 0.5;\
      cursor: default;\
    }\
    .ecopita-nav-link.coming-soon::after {\
      content: "準備中";\
      position: absolute;\
      right: 12px;\
      top: 50%;\
      transform: translateY(-50%);\
      font-size: 10px;\
      font-weight: 700;\
      color: #999;\
      background: #eee;\
      padding: 2px 8px;\
      border-radius: 99px;\
    }\
    .ecopita-nav-link.coming-soon:hover {\
      background: transparent;\
      transform: none;\
    }\
    .ecopita-nav-icon {\
      width: 42px;\
      height: 42px;\
      border-radius: 12px;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      font-size: 20px;\
      flex-shrink: 0;\
      transition: transform 0.2s ease;\
    }\
    .ecopita-nav-link:hover .ecopita-nav-icon {\
      transform: scale(1.1);\
    }\
    .ecopita-nav-text {\
      display: flex;\
      flex-direction: column;\
      gap: 1px;\
      min-width: 0;\
    }\
    .ecopita-nav-name {\
      font-size: 14px;\
      font-weight: 700;\
      color: #1a1a2e;\
      line-height: 1.3;\
    }\
    .ecopita-nav-sub {\
      font-size: 11px;\
      color: #888;\
      line-height: 1.3;\
      white-space: nowrap;\
      overflow: hidden;\
      text-overflow: ellipsis;\
    }\
    .ecopita-nav-divider {\
      height: 1px;\
      background: #eee;\
      margin: 4px 12px;\
    }\
    .ecopita-nav-footer {\
      padding: 8px 12px 10px;\
      text-align: center;\
      font-size: 10px;\
      color: #bbb;\
      letter-spacing: 0.02em;\
    }\
    @media (max-width: 480px) {\
      #ecopita-nav-panel {\
        top: auto;\
        bottom: 0;\
        right: 0;\
        left: 0;\
        width: 100%;\
        border-radius: 20px 20px 0 0;\
        padding: 6px 6px 20px;\
        transform: translateY(100%);\
      }\
      #ecopita-nav-panel.show {\
        transform: translateY(0);\
      }\
      #ecopita-nav-panel::before {\
        content: "";\
        display: block;\
        width: 36px;\
        height: 4px;\
        background: #ddd;\
        border-radius: 99px;\
        margin: 8px auto 4px;\
      }\
      #ecopita-nav-trigger {\
        top: auto;\
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));\
        right: 16px;\
        width: 52px;\
        height: 52px;\
        box-shadow: 0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06);\
      }\
      #ecopita-nav-panel {\
        padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));\
      }\
    }\
    @media (prefers-color-scheme: dark) {\
      #ecopita-nav-trigger {\
        background: rgba(40,40,60,0.95);\
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);\
      }\
      .ecopita-dot {\
        background: #ccc;\
      }\
      #ecopita-nav-panel {\
        background: #1e1e2e;\
        box-shadow: 0 12px 48px rgba(0,0,0,0.4);\
      }\
      .ecopita-nav-link {\
        color: #e0e0e0;\
      }\
      .ecopita-nav-link:hover {\
        background: rgba(255,255,255,0.06);\
      }\
      .ecopita-nav-link.current {\
        background: rgba(33,150,243,0.12);\
      }\
      .ecopita-nav-name {\
        color: #e0e0e0;\
      }\
      .ecopita-nav-sub {\
        color: #888;\
      }\
      .ecopita-nav-divider {\
        background: #333;\
      }\
      .ecopita-nav-header {\
        color: #666;\
      }\
      #ecopita-nav-overlay {\
        background: rgba(0,0,0,0.5);\
      }\
    }';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // ---- HTML構築 ----
    var trigger = document.createElement('button');
    trigger.id = 'ecopita-nav-trigger';
    trigger.setAttribute('aria-label', 'サイト切り替え');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<div class="ecopita-dots">' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '<span class="ecopita-dot"></span>' +
      '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'ecopita-nav-overlay';

    var panel = document.createElement('nav');
    panel.id = 'ecopita-nav-panel';
    panel.setAttribute('aria-label', 'サイトナビゲーション');

    var linksHtml = '<div class="ecopita-nav-header">エコピタ ツール</div>';
    for (var i = 0; i < SITES.length; i++) {
      var s = SITES[i];
      var isCurrent = isCurrentSite(s.url);
      var isComingSoon = !s.url;

      if (isComingSoon) {
        // 準備中は<span>にする。<a href="#">やalertに頼らない。
        // クリックしても何も起きない＝最も安全。
        linksHtml += '<span class="ecopita-nav-link coming-soon" aria-disabled="true">' +
          '<div class="ecopita-nav-icon" style="background:' + s.color + '15; color:' + s.color + '">' +
          s.icon + '</div>' +
          '<div class="ecopita-nav-text">' +
          '<span class="ecopita-nav-name">' + s.name + '</span>' +
          '<span class="ecopita-nav-sub">' + s.sub + '</span>' +
          '</div></span>';
      } else {
        linksHtml += '<a href="' + s.url + '" class="ecopita-nav-link' +
          (isCurrent ? ' current' : '') + '">' +
          '<div class="ecopita-nav-icon" style="background:' + s.color + '15; color:' + s.color + '">' +
          s.icon + '</div>' +
          '<div class="ecopita-nav-text">' +
          '<span class="ecopita-nav-name">' + s.name + '</span>' +
          '<span class="ecopita-nav-sub">' + s.sub + '</span>' +
          '</div></a>';
      }
    }
    linksHtml += '<div class="ecopita-nav-divider"></div>';
    linksHtml += '<div class="ecopita-nav-footer">エコピタ株式会社 業務システム</div>';

    panel.innerHTML = linksHtml;

    document.body.appendChild(trigger);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // ---- 開閉ロジック ----
    var isOpen = false;

    function setOpen(open) {
      isOpen = open;
      trigger.classList.toggle('open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.classList.toggle('show', isOpen);
      overlay.classList.toggle('show', isOpen);
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!isOpen);
    });

    overlay.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !panel.contains(e.target) && !trigger.contains(e.target)) {
        setOpen(false);
      }
    });
  }

  // ============================================================
  //  DOMContentLoaded 待ち
  //  </body>直前に置く限り不要だが、万が一<head>内で
  //  読み込まれた場合の保険。
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
