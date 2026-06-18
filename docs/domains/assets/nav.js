/**
 * 도메인 문서 공용 내비게이션 (중앙 정의).
 * 각 페이지는 <header class="topnav"><div class="inner" id="site-nav"></div></header> 만 두고
 * 이 스크립트가 브랜드 + 그룹 드롭다운 메뉴를 주입한다. 도메인 추가 시 GROUPS 만 수정.
 */
(function () {
  var script = document.currentScript;
  // .../docs/domains/assets/nav.js → .../docs/domains/
  var base = script.src.replace(/assets\/nav\.js(?:\?.*)?$/, '');

  var GROUPS = [
    { label: 'Overview', href: 'index.html' },
    {
      label: 'Identity & Access',
      items: [['Account', 'account'], ['Role', 'role'], ['Permission', 'permission'], ['Auth', 'auth']],
    },
    { label: 'Production', items: [['Creator', 'creator']] },
    { label: 'Content', items: [['Content', 'content'], ['Tag', 'tag']] },
    {
      label: 'Composition',
      items: [
        ['Character', 'character'],
        ['Casting', 'casting'],
        ['Episode', 'episode'],
        ['Playback', 'playback'],
      ],
    },
    { label: 'Platform', items: [['File', 'file']] },
  ];

  var path = location.pathname.replace(/\/+$/, '');

  function isActive(slug) {
    if (slug === 'index.html') {
      return /\/domains$/.test(path) || /\/domains\/index\.html$/.test(path);
    }
    return new RegExp('/' + slug + '/(index\\.html)?$').test(path) || path.indexOf('/' + slug + '/') !== -1;
  }
  function hrefFor(slug) {
    return slug === 'index.html' ? base + 'index.html' : base + slug + '/index.html';
  }
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  var root = document.getElementById('site-nav');
  if (!root) return;

  var html =
    '<div class="brand"><a href="' + base + 'index.html">Vooth <span>core-api</span> · 도메인</a></div>' +
    '<nav class="menu" aria-label="도메인">';

  GROUPS.forEach(function (g) {
    if (g.href) {
      html +=
        '<a class="menu-top' + (isActive(g.href) ? ' active' : '') + '" href="' + hrefFor(g.href) + '">' +
        esc(g.label) + '</a>';
      return;
    }
    var groupActive = g.items.some(function (it) { return isActive(it[1]); });
    html += '<div class="menu-group' + (groupActive ? ' active' : '') + '">';
    html += '<button class="menu-top" type="button" aria-haspopup="true">' + esc(g.label) + ' <span class="caret">▾</span></button>';
    html += '<div class="menu-drop">';
    g.items.forEach(function (it) {
      html +=
        '<a class="menu-item' + (isActive(it[1]) ? ' active' : '') + '" href="' + hrefFor(it[1]) + '">' +
        esc(it[0]) + '</a>';
    });
    html += '</div></div>';
  });

  html += '</nav>';
  root.innerHTML = html;
})();
