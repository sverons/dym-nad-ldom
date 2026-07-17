/** Навигатор Новограда — карта, места, координаты, маршрут (промт 2026-07-16). */
(function () {
  const STORAGE_KEY = 'navigator_module_v1';
  const TABS = [
    { id: 'map', label: 'Карта' },
    { id: 'places', label: 'Места' },
    { id: 'coords', label: 'Координаты' },
    { id: 'route', label: 'Маршрут' },
  ];

  let tab = 'map';
  let searchQuery = '';
  let placesQuery = '';
  let showGrid = false;
  let selectedId = null;
  let sheetOpen = false;
  let route = null;
  let coordCol = 'А';
  let coordRow = '50';
  let coordStatus = ''; // idle | building | fail | hint | success
  let coordMessage = '';
  let revealOpen = false;
  let adminOpen = false;
  let progress = loadProgress();

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return {
        attempts: Number(data.attempts) || 0,
        solved: Boolean(data.solved),
        lastRoute: data.lastRoute || null,
      };
    } catch {
      return { attempts: 0, solved: false, lastRoute: null };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      attempts: progress.attempts,
      solved: progress.solved,
      lastRoute: progress.lastRoute,
    }));
  }

  function resetProgress() {
    progress = { attempts: 0, solved: false, lastRoute: null };
    saveProgress();
    route = null;
    revealOpen = false;
    coordStatus = '';
    coordMessage = '';
    selectedId = null;
  }

  function cfg() {
    return MapsData.CONFIG;
  }

  function placesVisible() {
    const list = MapsData.publicPlaces();
    if (progress.solved) {
      const target = MapsData.getTargetPlace();
      if (!list.some(p => p.id === target.id)) list.push(target);
    }
    return list;
  }

  function findAny(id) {
    if (id === 'target-house') return MapsData.getTargetPlace();
    return MapsData.findPlace(id);
  }

  function youAreHere() {
    return MapsData.publicPlaces().find(p => p.youAreHere) || MapsData.findPlace('bureau');
  }

  /* ——— SVG map (фотореалистичная спутниковая подложка) ——— */
  function pinTone(p) {
    if (p.youAreHere) return 'here';
    if (p.id === 'target-house' || p.cat === 'target') return 'target';
    if (p.cat === 'police') return 'police';
    if (p.cat === 'medical') return 'hospital';
    if (p.cat === 'shop') return 'shop';
    if (p.cat === 'transport') return 'transit';
    if (p.cat === 'park' || p.cat === 'sport') return 'park';
    if (p.cat === 'cafe' || p.cat === 'hotel') return 'shop';
    if (p.cat === 'culture' || p.cat === 'education') return 'place';
    return 'place';
  }

  function renderSvg() {
    const places = placesVisible().filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return `${p.name} ${p.addr}`.toLowerCase().includes(q);
    });

    let grid = '';
    if (showGrid) {
      const cols = MapsData.COLS;
      const rows = MapsData.ROWS;
      const pad = MapsData.VIEW.pad;
      const uw = 100 - pad * 2;
      const uh = 100 - pad * 2;
      cols.forEach((c, i) => {
        const x = pad + ((i + 0.5) / cols.length) * uw;
        grid += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${100 - pad}" class="nav-grid-line"/>`;
        grid += `<text x="${x}" y="${pad - 1.2}" class="nav-grid-label" text-anchor="middle">${c}</text>`;
      });
      rows.forEach((r, i) => {
        const y = pad + ((i + 0.5) / rows.length) * uh;
        grid += `<line x1="${pad}" y1="${y}" x2="${100 - pad}" y2="${y}" class="nav-grid-line"/>`;
        grid += `<text x="${pad - 1.2}" y="${y + 1}" class="nav-grid-label" text-anchor="end">${r}</text>`;
      });
    }

    let routeLine = '';
    if (route?.displayPath?.length > 1) {
      const d = route.displayPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      routeLine = `
        <path d="${d}" class="nav-route-casing" pathLength="100"/>
        <path d="${d}" class="nav-route-line" pathLength="100"/>
      `;
    }

    const pins = places.map(p => {
      const tone = pinTone(p);
      const active = selectedId === p.id ? ' active' : '';
      if (p.youAreHere) {
        return `
          <g class="nav-pin here${active}" data-pin="${esc(p.id)}" transform="translate(${p.x} ${p.y})">
            <circle r="2.8" class="nav-here-pulse"/>
            <circle r="1.55" class="nav-here-ring"/>
            <circle r="0.85" class="nav-here-dot"/>
          </g>
        `;
      }
      return `
        <g class="nav-pin pin-${tone}${active}" data-pin="${esc(p.id)}" transform="translate(${p.x} ${p.y})">
          <path class="nav-pin-body" d="M0,-3.2 C-1.6,-3.2 -2.55,-2.1 -2.55,-0.75 C-2.55,0.85 0,3.3 0,3.3 S2.55,0.85 2.55,-0.75 C2.55,-2.1 1.6,-3.2 0,-3.2 Z"/>
          <circle class="nav-pin-hole" cx="0" cy="-0.95" r="0.95"/>
          <text y="-0.7" text-anchor="middle" class="nav-pin-icon">${p.icon}</text>
        </g>
      `;
    }).join('');

    return `
      <svg class="nav-map-svg photo-map" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="navSoftShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0.4" stdDeviation="0.45" flood-color="#000" flood-opacity="0.45"/>
          </filter>
          <radialGradient id="navPhotoVignette" cx="50%" cy="45%" r="72%">
            <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0.28)"/>
          </radialGradient>
        </defs>
        <image
          class="nav-aerial"
          href="./assets/maps/novograd-aerial.jpg"
          xlink:href="./assets/maps/novograd-aerial.jpg"
          x="0" y="0" width="100" height="100"
          preserveAspectRatio="xMidYMid slice"
        />
        <rect x="0" y="0" width="100" height="100" fill="url(#navPhotoVignette)" pointer-events="none"/>
        <g class="nav-grid">${grid}</g>
        ${routeLine}
        <g class="nav-pins">${pins}</g>
        <g class="nav-compass" transform="translate(91 9)">
          <circle r="4" class="nav-compass-disc"/>
          <polygon points="0,-2.8 1.2,2.1 -1.2,2.1" class="nav-compass-n"/>
          <text y="5.2" text-anchor="middle" class="nav-compass-label">С</text>
        </g>
      </svg>
    `;
  }

  function sheetHtml() {
    if (!sheetOpen || !selectedId) return '';
    const p = findAny(selectedId);
    if (!p) return '';
    return `
      <div class="nav-sheet">
        <div class="nav-sheet-handle"></div>
        <div class="nav-sheet-card">
          <div class="nav-sheet-icon">${p.icon}</div>
          <div class="nav-sheet-meta">
            <strong>${esc(p.name)}</strong>
            <span>${esc(p.addr)}</span>
            <small>${esc(p.cell)} · ${esc(p.catLabel)}</small>
          </div>
        </div>
        <button type="button" class="nav-primary-btn" data-route-here="${esc(p.id)}">Маршрут сюда</button>
        <button type="button" class="nav-ghost-btn" data-close-sheet>Закрыть</button>
      </div>
    `;
  }

  function mapTab() {
    return `
      <div class="nav-map-wrap">
        ${renderSvg()}
        <div class="nav-map-overlays">
          <input type="search" class="nav-search" id="navMapSearch" placeholder="Поиск места…" value="${esc(searchQuery)}" />
          <div class="nav-map-tools">
            <button type="button" class="nav-tool-btn${showGrid ? ' on' : ''}" data-toggle-grid>Сетка</button>
            <button type="button" class="nav-tool-btn" data-go-here>Я здесь</button>
          </div>
          <button type="button" class="nav-fab" data-goto-coords>Ввести координаты</button>
        </div>
        ${sheetHtml()}
      </div>
    `;
  }

  function placesTab() {
    const groups = MapsData.placesByCategory();
    const q = placesQuery.trim().toLowerCase();
    let html = '';
    Object.keys(groups).forEach(cat => {
      const items = groups[cat].filter(p => {
        if (!q) return true;
        return `${p.name} ${p.addr} ${p.cell}`.toLowerCase().includes(q);
      });
      if (!items.length) return;
      html += `<div class="nav-cat-title">${esc(cat)}</div>`;
      html += items.map(p => `
        <button type="button" class="nav-place-row" data-open-place="${esc(p.id)}">
          <span class="nav-place-ico">${p.icon}</span>
          <span class="nav-place-text">
            <strong>${esc(p.name)}</strong>
            <small>${esc(p.addr)}</small>
          </span>
          <span class="nav-place-cell">${esc(p.cell)}</span>
        </button>
      `).join('');
    });
    if (progress.solved) {
      const t = MapsData.getTargetPlace();
      if (!q || `${t.name} ${t.addr}`.toLowerCase().includes(q)) {
        html += `<div class="nav-cat-title">Цель</div>`;
        html += `
          <button type="button" class="nav-place-row target" data-open-place="${esc(t.id)}">
            <span class="nav-place-ico">${t.icon}</span>
            <span class="nav-place-text">
              <strong>${esc(t.name)}</strong>
              <small>${esc(t.addr)}</small>
            </span>
            <span class="nav-place-cell">${esc(t.cell)}</span>
          </button>`;
      }
    }
    return `
      <div class="nav-scroll">
        <input type="search" class="nav-search inline" id="navPlacesSearch" placeholder="Название или адрес…" value="${esc(placesQuery)}" />
        <div class="nav-places-list">${html || '<p class="nav-empty">Ничего не найдено</p>'}</div>
      </div>
    `;
  }

  function coordsTab() {
    const cols = MapsData.COLS.map(c =>
      `<option value="${c}" ${c === coordCol ? 'selected' : ''}>${c}</option>`
    ).join('');
    const rows = MapsData.ROWS.map(r =>
      `<option value="${r}" ${String(r) === String(coordRow) ? 'selected' : ''}>${r}</option>`
    ).join('');

    let result = '';
    if (coordStatus === 'building') {
      result = `<div class="nav-coord-result building">Прокладываю маршрут…</div>`;
    } else if (coordStatus === 'fail') {
      result = `<div class="nav-coord-result fail">${esc(coordMessage || cfg().onFail)}</div>`;
    } else if (coordStatus === 'hint') {
      result = `<div class="nav-coord-result hint">${esc(coordMessage)}</div>`;
    } else if (coordStatus === 'success') {
      result = `<div class="nav-coord-result ok">Точка найдена</div>`;
    } else {
      result = `<div class="nav-coord-result idle">Введите столбец и строку сетки (пример: Ж-70)</div>`;
    }

    return `
      <div class="nav-scroll nav-coords">
        <p class="nav-coords-lead">Координаты по сетке буклета: столбец (А–Р) и строка (10–110).</p>
        <div class="nav-coord-form">
          <label>
            <span>Столбец</span>
            <select id="navCoordCol">${cols}</select>
          </label>
          <label>
            <span>Строка</span>
            <select id="navCoordRow">${rows}</select>
          </label>
        </div>
        <button type="button" class="nav-primary-btn" data-build-coords>Проложить маршрут</button>
        ${result}
        <p class="nav-attempts">Попыток: ${progress.attempts}</p>
      </div>
    `;
  }

  function routeTab() {
    const r = route || progress.lastRoute;
    if (!r) {
      return `
        <div class="nav-scroll">
          <div class="nav-empty-card">
            <strong>Маршрут ещё не построен</strong>
            <p>Выберите место на карте или во вкладке «Места», либо введите координаты.</p>
          </div>
        </div>
      `;
    }
    const fromName = r.from?.name || findAny(r.fromId)?.name || 'A';
    const toName = r.to?.name || findAny(r.toId)?.name || 'B';
    return `
      <div class="nav-scroll">
        <div class="nav-route-card">
          <div class="nav-route-row"><span>Откуда</span><strong>${esc(fromName)}</strong></div>
          <div class="nav-route-row"><span>Куда</span><strong>${esc(toName)}</strong></div>
          <div class="nav-route-stats">
            <div><b>${esc(String(r.km).replace('.', ','))} км</b><small>расстояние</small></div>
            <div><b>${r.min} мин</b><small>время</small></div>
            <div><b>${esc(r.toCell || r.fromCell || '—')}</b><small>ячейка</small></div>
          </div>
          <button type="button" class="nav-primary-btn" data-show-on-map>Показать на карте</button>
        </div>
      </div>
    `;
  }

  function revealHtml() {
    if (!revealOpen) return '';
    return `
      <div class="nav-reveal">
        <div class="nav-reveal-card">
          <div class="nav-reveal-badge">На месте</div>
          <h2>${esc(cfg().target.label)}</h2>
          <p>У воды найдено тело — <strong>Вероника</strong>. Она мертва задолго до этой ночи. Дом Сергей знал по риелторской работе.</p>
          <p class="nav-reveal-guard">По убийству Анны это не отвечает ничего. Убийца Анны по-прежнему неизвестен.</p>
          <div class="nav-sms">
            <div class="nav-sms-from">Шеф</div>
            <div class="nav-sms-text">Дело собрали не в ту историю. Открываю материалы второй главы.</div>
          </div>
          <button type="button" class="nav-primary-btn" data-go-chapter2>Перейти к главе 2</button>
        </div>
      </div>
    `;
  }

  function adminHtml() {
    if (!adminOpen) return '';
    const answers = (cfg().target.answer || []).join(', ');
    return `
      <div class="nav-admin">
        <div class="nav-admin-card">
          <h3>Админка навигатора</h3>
          <label>Правильные координаты
            <input type="text" id="navAdminAnswers" value="${esc(answers)}" />
          </label>
          <label>Подпись цели
            <input type="text" id="navAdminLabel" value="${esc(cfg().target.label)}" />
          </label>
          <div class="nav-admin-row">
            <button type="button" class="nav-tool-btn" data-admin-ch="1">Глава 1</button>
            <button type="button" class="nav-tool-btn" data-admin-ch="2">Глава 2</button>
          </div>
          <button type="button" class="nav-ghost-btn" data-admin-reset>Сброс прогресса</button>
          <button type="button" class="nav-primary-btn" data-admin-save>Сохранить</button>
          <button type="button" class="nav-ghost-btn" data-admin-close>Закрыть</button>
          <p class="nav-admin-note">Канон: Виктора нет на карте; цель скрыта до разгадки; тело Вероники — антиразгадка по Анне. Значение координат — плейсхолдер.</p>
        </div>
      </div>
    `;
  }

  function tabBar() {
    return `
      <nav class="nav-tabs">
        ${TABS.map(t => `
          <button type="button" class="nav-tab${tab === t.id ? ' active' : ''}" data-nav-tab="${t.id}">${t.label}</button>
        `).join('')}
      </nav>
    `;
  }

  function render() {
    const screen = document.getElementById('mapsApp');
    if (!screen) return;

    let body = '';
    if (tab === 'map') body = mapTab();
    else if (tab === 'places') body = placesTab();
    else if (tab === 'coords') body = coordsTab();
    else body = routeTab();

    screen.innerHTML = `
      <div class="nav-app">
        <header class="nav-header">
          <button type="button" class="nav-back" data-nav-back aria-label="Назад">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <h1 data-nav-title>Навигатор</h1>
          <span class="nav-header-spacer"></span>
        </header>
        <div class="nav-body">${body}</div>
        ${tabBar()}
        ${revealHtml()}
        ${adminHtml()}
      </div>
    `;
    bind(screen);
  }

  function buildRouteTo(toId) {
    const from = youAreHere();
    if (!from) return;
    const built = MapsData.routeBetween(from.id, toId);
    if (!built) return;
    route = built;
    progress.lastRoute = {
      fromId: built.fromId,
      toId: built.toId,
      km: built.km,
      min: built.min,
      fromCell: built.fromCell,
      toCell: built.toCell,
      from: { name: built.from.name },
      to: { name: built.to.name },
      displayPath: built.displayPath,
    };
    saveProgress();
    selectedId = toId;
    sheetOpen = false;
    tab = 'map';
    render();
  }

  function tryCoords() {
    const col = document.getElementById('navCoordCol')?.value || coordCol;
    const row = document.getElementById('navCoordRow')?.value || coordRow;
    coordCol = col;
    coordRow = row;

    coordStatus = 'building';
    coordMessage = '';
    render();

    setTimeout(() => {
      const ok = MapsData.isCorrectAnswer(col, row);
      if (ok) {
        progress.solved = true;
        saveProgress();
        const target = MapsData.getTargetPlace();
        const from = youAreHere();
        route = MapsData.routeBetween(from.id, target.id);
        if (route) {
          progress.lastRoute = {
            fromId: route.fromId,
            toId: route.toId,
            km: route.km,
            min: route.min,
            fromCell: route.fromCell,
            toCell: route.toCell,
            from: { name: route.from.name },
            to: { name: route.to.name },
            displayPath: route.displayPath,
          };
          saveProgress();
        }
        coordStatus = 'success';
        revealOpen = true;
        selectedId = target.id;
        tab = 'map';
        showGrid = true;
        render();
        return;
      }

      progress.attempts += 1;
      saveProgress();
      if (progress.attempts >= cfg().hintAfter) {
        coordStatus = 'hint';
        coordMessage = `${cfg().onFail}\n${cfg().hintText}`;
      } else {
        coordStatus = 'fail';
        coordMessage = cfg().onFail;
      }
      render();
    }, 700);
  }

  function goChapter2() {
    revealOpen = false;
    try {
      window.parent?.postMessage({ type: 'chapter', ch: 2 }, '*');
      window.parent?.postMessage({ type: 'nav-event', event: 'reveal-veronika' }, '*');
    } catch {}
    if (window.goToStoryState) window.goToStoryState(2);
    else if (window.StoryState) {
      StoryState.setState(2);
      if (typeof showScreen === 'function') showScreen('homeScreen');
    }
  }

  function bind(screen) {
    screen.querySelector('[data-nav-back]')?.addEventListener('click', () => {
      if (revealOpen) {
        revealOpen = false;
        render();
        return;
      }
      if (typeof showScreen === 'function') showScreen('homeScreen');
    });

    // long-press title → admin
    const title = screen.querySelector('[data-nav-title]');
    if (title) {
      let timer = null;
      const start = () => {
        timer = setTimeout(() => {
          adminOpen = true;
          render();
        }, 1200);
      };
      const clear = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };
      title.addEventListener('mousedown', start);
      title.addEventListener('touchstart', start, { passive: true });
      title.addEventListener('mouseup', clear);
      title.addEventListener('mouseleave', clear);
      title.addEventListener('touchend', clear);
      title.addEventListener('touchcancel', clear);
    }

    screen.querySelectorAll('[data-nav-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        tab = btn.dataset.navTab;
        sheetOpen = false;
        render();
      });
    });

    screen.querySelector('#navMapSearch')?.addEventListener('input', e => {
      searchQuery = e.target.value;
      const wrap = screen.querySelector('.nav-map-wrap');
      if (wrap) {
        const svgHost = wrap.querySelector('.nav-map-svg')?.parentElement;
        // re-render map pins cheaply via full render
        render();
        const input = document.getElementById('navMapSearch');
        if (input) {
          input.focus();
          input.value = searchQuery;
          try { input.setSelectionRange(searchQuery.length, searchQuery.length); } catch {}
        }
      }
    });

    screen.querySelector('[data-toggle-grid]')?.addEventListener('click', () => {
      showGrid = !showGrid;
      render();
    });

    screen.querySelector('[data-go-here]')?.addEventListener('click', () => {
      const here = youAreHere();
      if (!here) return;
      selectedId = here.id;
      sheetOpen = true;
      searchQuery = '';
      render();
    });

    screen.querySelector('[data-goto-coords]')?.addEventListener('click', () => {
      tab = 'coords';
      render();
    });

    screen.querySelectorAll('[data-pin]').forEach(g => {
      g.addEventListener('click', e => {
        e.stopPropagation();
        selectedId = g.getAttribute('data-pin');
        sheetOpen = true;
        render();
      });
    });

    screen.querySelector('[data-close-sheet]')?.addEventListener('click', () => {
      sheetOpen = false;
      render();
    });

    screen.querySelector('[data-route-here]')?.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-route-here');
      buildRouteTo(id);
    });

    screen.querySelector('#navPlacesSearch')?.addEventListener('input', e => {
      placesQuery = e.target.value;
      render();
      const input = document.getElementById('navPlacesSearch');
      if (input) {
        input.focus();
        input.value = placesQuery;
        try { input.setSelectionRange(placesQuery.length, placesQuery.length); } catch {}
      }
    });

    screen.querySelectorAll('[data-open-place]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedId = btn.dataset.openPlace;
        sheetOpen = true;
        tab = 'map';
        render();
      });
    });

    screen.querySelector('#navCoordCol')?.addEventListener('change', e => { coordCol = e.target.value; });
    screen.querySelector('#navCoordRow')?.addEventListener('change', e => { coordRow = e.target.value; });
    screen.querySelector('[data-build-coords]')?.addEventListener('click', tryCoords);

    screen.querySelector('[data-show-on-map]')?.addEventListener('click', () => {
      tab = 'map';
      render();
    });

    screen.querySelector('[data-go-chapter2]')?.addEventListener('click', goChapter2);

    // admin
    screen.querySelector('[data-admin-close]')?.addEventListener('click', () => {
      adminOpen = false;
      render();
    });
    screen.querySelector('[data-admin-reset]')?.addEventListener('click', () => {
      resetProgress();
      adminOpen = false;
      render();
    });
    screen.querySelectorAll('[data-admin-ch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = Number(btn.dataset.adminCh);
        if (window.StoryState) StoryState.setState(ch);
        if (ch === 1) resetProgress();
        adminOpen = false;
        render();
      });
    });
    screen.querySelector('[data-admin-save]')?.addEventListener('click', () => {
      const answers = (document.getElementById('navAdminAnswers')?.value || '')
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(Boolean);
      const label = document.getElementById('navAdminLabel')?.value?.trim();
      if (answers.length) MapsData.CONFIG.target.answer = answers;
      if (label) MapsData.CONFIG.target.label = label;
      // sync first answer into col/row if parseable
      const first = MapsData.normalizeCell(answers[0] || '');
      if (first) {
        MapsData.CONFIG.target.col = first.col;
        MapsData.CONFIG.target.row = first.row;
      }
      adminOpen = false;
      render();
    });
  }

  function open(opts = {}) {
    progress = loadProgress();
    tab = opts.tab || 'map';
    searchQuery = '';
    placesQuery = '';
    showGrid = false;
    selectedId = null;
    sheetOpen = false;
    coordStatus = '';
    coordMessage = '';
    revealOpen = Boolean(progress.solved && opts.reveal);
    adminOpen = /[?&]admin=1(?:&|$)/.test(location.search);
    if (progress.lastRoute && !route) {
      route = progress.lastRoute;
    }
    render();
  }

  window.MapsApp = { open, render, resetProgress };
})();
