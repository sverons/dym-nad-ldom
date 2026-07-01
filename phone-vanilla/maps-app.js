(function () {
  const DEFAULT_FROM = 'novograd';
  const NAV_CAR = './assets/nav-car.svg';

  let fromId = DEFAULT_FROM;
  let toId = null;
  let route = null;
  let searchQuery = '';
  let driving = false;
  let navStep = 0;
  let picking = null; // 'from' | 'to' | null
  let inputMode = 'search'; // 'search' | 'coords'
  let coordLat = '';
  let coordLon = '';

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function placeLabel(p) {
    if (!p) return '';
    if (p.sub && p.type !== 'coord') return `${p.name} — ${p.sub}`;
    return p.name;
  }

  function placeSubline(p) {
    if (!p) return '';
    const geo = MapsData.getPlaceCoords(p);
    if (!geo) return p.sub || '';
    return MapsData.formatCoords(geo.lat, geo.lon);
  }

  function formatDuration(min) {
    const m = Math.round(min);
    if (m < 60) return `${m} мин.`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} ч. ${rest} мин.` : `${h} ч.`;
  }

  function formatDurationShort(min) {
    const m = Math.round(min);
    if (m < 60) return `${m} мин`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} ч ${rest}` : `${h} ч`;
  }

  function viaLabel(r) {
    if (!r || r.path.length < 2) return '';
    const idx = Math.min(1, r.path.length - 2);
    const via = MapsData.findPlace(r.path[idx]);
    return via ? `через ${via.name}` : '';
  }

  function routePoints(path) {
    return path.map(id => MapsData.findPlace(id)).filter(Boolean);
  }

  function displayPathPoints() {
    if (route?.displayPath?.length) return route.displayPath;
    if (route?.path) return routePoints(route.path).map(p => ({ x: p.x, y: p.y, name: p.name }));
    return [];
  }

  function boundsForPoints(pts, pad = 8) {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    return {
      minX: Math.min(...xs) - pad,
      minY: Math.min(...ys) - pad,
      maxX: Math.max(...xs) + pad,
      maxY: Math.max(...ys) + pad,
    };
  }

  function viewBoxFromBounds(b) {
    return `${b.minX} ${b.minY} ${b.maxX - b.minX} ${b.maxY - b.minY}`;
  }

  function routeMidpoint() {
    const pts = displayPathPoints();
    if (!pts.length) return { x: 50, y: 50 };
    const mid = pts[Math.floor(pts.length / 2)];
    return { x: mid.x, y: mid.y };
  }

  function navInstruction() {
    if (!route) return null;
    const path = route.path;
    if (navStep >= path.length - 1) {
      const dest = MapsData.findPlace(route.toId || toId);
      return {
        main: 'Вы прибыли',
        sub: dest ? placeLabel(dest) : '',
        next: null,
      };
    }
    const next = MapsData.findPlace(path[navStep + 1]);
    const after = navStep + 2 < path.length ? MapsData.findPlace(path[navStep + 2]) : null;
    return {
      main: 'в сторону',
      sub: next ? next.name : '',
      next: after ? { text: after.name, turn: 'left' } : null,
    };
  }

  function renderMapSvg(opts = {}) {
    const { path = null, dotted = true, showBubble = false, showPin = false } = opts;
    const displayPts = path && route?.displayPath?.length
      ? route.displayPath
      : (path ? routePoints(path).map(p => ({ x: p.x, y: p.y, name: p.name })) : MapsData.MAP_PLACES.filter(p => p.type !== 'lake'));
    const bounds = boundsForPoints(displayPts, path ? 10 : 6);
    const vb = viewBoxFromBounds(bounds);

    const roads = MapsData.MAP_ROADS.map(([a, b]) => {
      const p1 = MapsData.findPlace(a);
      const p2 = MapsData.findPlace(b);
      if (!p1 || !p2) return '';
      return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="gm-road"/>`;
    }).join('');

    let routeLine = '';
    if (path && displayPts.length > 1) {
      const d = displayPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      routeLine = `<path d="${d}" class="gm-route${dotted ? ' dotted' : ''}"/>`;
    }

    const dest = toId ? MapsData.findPlace(toId) : null;
    const from = MapsData.findPlace(fromId);
    const mid = path ? routeMidpoint() : null;
    const bubble = showBubble && route
      ? `<g class="gm-time-bubble" transform="translate(${mid.x} ${mid.y - 4})">
          <rect x="-14" y="-5" width="28" height="10" rx="5" class="gm-bubble-bg"/>
          <text class="gm-bubble-text" text-anchor="middle" y="1.5">${formatDurationShort(route.min)}</text>
        </g>`
      : '';

    const destPin = showPin && dest
      ? `<g class="gm-dest-pin" transform="translate(${dest.x} ${dest.y})">
          <path d="M0 -6 C-3.5 -6 -6 -3.5 -6 0 C-6 4 0 9 0 9 C0 9 6 4 6 0 C6 -3.5 3.5 -6 0 -6 Z" class="gm-pin-shape"/>
          <circle r="2" cy="-1" class="gm-pin-hole"/>
        </g>`
      : '';

    const fromPin = from && path
      ? `<g class="gm-from-pin" transform="translate(${from.x} ${from.y})">
          <circle r="2.5" class="gm-from-dot"/>
        </g>`
      : '';

  const coordPins = [from, dest].filter(p => p?.type === 'coord').map(p => `
      <g class="gm-coord-pin" transform="translate(${p.x} ${p.y})">
        <circle r="2.2" class="gm-coord-dot"/>
      </g>
    `).join('');

    return `
      <svg class="gm-map-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">
        <rect class="gm-map-tile" x="${bounds.minX}" y="${bounds.minY}" width="${bounds.maxX - bounds.minX}" height="${bounds.maxY - bounds.minY}"/>
        <g class="gm-roads">${roads}</g>
        ${routeLine}
        ${fromPin}
        ${coordPins}
        ${bubble}
        ${destPin}
      </svg>
    `;
  }

  function renderDriveScene() {
    return `
      <div class="gm-drive-scene">
        <div class="gm-drive-map">${renderMapSvg({ path: route?.path, dotted: true, showBubble: true })}</div>
        <div class="gm-drive-tilt"></div>
        <img class="gm-drive-car" src="${NAV_CAR}" alt="" draggable="false">
        <button type="button" class="gm-whereami">ГДЕ Я?</button>
        <div class="gm-fabs">
          <button type="button" class="gm-fab" aria-label="Поиск">⌕</button>
          <button type="button" class="gm-fab" aria-label="Звук">🔊</button>
          <button type="button" class="gm-fab" aria-label="Компас">◎</button>
        </div>
      </div>
    `;
  }

  function renderBlueHeader(from, to) {
    return `
      <div class="gm-header">
        <button type="button" class="gm-header-back" data-maps-back aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <div class="gm-destinations">
          <button type="button" class="gm-dest-row${picking === 'from' ? ' active' : ''}" data-pick="from">
            <span class="gm-dot from"></span>
            <span class="gm-dest-text">
              <span class="gm-dest-name">${esc(from ? placeLabel(from) : 'Моё местоположение')}</span>
              ${from ? `<span class="gm-dest-coords">${esc(placeSubline(from))}</span>` : ''}
            </span>
          </button>
          <button type="button" class="gm-dest-row${picking === 'to' ? ' active' : ''}" data-pick="to">
            <span class="gm-dot to"></span>
            <span class="gm-dest-text">
              <span class="gm-dest-name">${esc(to ? placeLabel(to) : 'Куда едем?')}</span>
              ${to ? `<span class="gm-dest-coords">${esc(placeSubline(to))}</span>` : ''}
            </span>
          </button>
        </div>
        <button type="button" class="gm-header-menu" aria-label="Меню">⋮</button>
      </div>
    `;
  }

  function renderModeTabs() {
    const time = route ? formatDurationShort(route.min) : '—';
    return `
      <div class="gm-modes">
        <button type="button" class="gm-mode active" aria-label="На машине">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
          <span>${time}</span>
        </button>
        <button type="button" class="gm-mode" aria-label="Транспорт" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
        </button>
        <button type="button" class="gm-mode" aria-label="Пешком" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>
        </button>
        <button type="button" class="gm-mode" aria-label="Велосипед" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4 1.4 1.4-2.4 2.4-1.4-1.4zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>
        </button>
      </div>
    `;
  }

  function renderNavBars(instr) {
    if (!instr) return '';
    return `
      <div class="gm-nav-bar">
        <div class="gm-nav-arrow">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>
        </div>
        <div class="gm-nav-main">
          <div class="gm-nav-title">${esc(instr.main)}</div>
          ${instr.sub ? `<div class="gm-nav-sub">${esc(instr.sub)}</div>` : ''}
        </div>
        <button type="button" class="gm-nav-mic" aria-label="Голос">🎤</button>
      </div>
      ${instr.next ? `
        <div class="gm-nav-next">
          <span class="gm-nav-next-label">Далее</span>
          <span class="gm-nav-next-arrow">↰</span>
          <span class="gm-nav-next-text">${esc(instr.next.text)}</span>
        </div>
      ` : ''}
    `;
  }

  function renderRouteCard() {
    if (!route) return '';
    return `
      <div class="gm-route-card">
        <div class="gm-route-card-info">
          <strong>${formatDuration(route.min)} (${route.km.toFixed(1).replace('.', ',')} км)</strong>
          <span>${esc(viaLabel(route))}</span>
        </div>
        <button type="button" class="gm-start-btn" data-maps-start>НАЧАТЬ</button>
      </div>
    `;
  }

  function renderPickPanel() {
    const geo = MapsData.MAP_GEO;
    return `
      <div class="gm-search-panel">
        <div class="gm-pick-tabs">
          <button type="button" class="gm-pick-tab${inputMode === 'search' ? ' active' : ''}" data-input-mode="search">Поиск</button>
          <button type="button" class="gm-pick-tab${inputMode === 'coords' ? ' active' : ''}" data-input-mode="coords">Координаты</button>
        </div>

        ${inputMode === 'search' ? `
          <input type="search" class="maps-search" placeholder="Населённый пункт или 56.81, 37.21" value="${esc(searchQuery)}" id="mapsSearchInput" autofocus>
          <div class="maps-list">${renderList()}</div>
        ` : `
          <div class="gm-coord-form">
            <p class="gm-coord-hint">Диапазон: ${geo.latMin}–${geo.latMax}° с.ш., ${geo.lonMin}–${geo.lonMax}° в.д.</p>
            <div class="gm-coord-row">
              <label>Широта</label>
              <input type="text" inputmode="decimal" id="coordLat" placeholder="56.81234" value="${esc(coordLat)}">
            </div>
            <div class="gm-coord-row">
              <label>Долгота</label>
              <input type="text" inputmode="decimal" id="coordLon" placeholder="37.21456" value="${esc(coordLon)}">
            </div>
            <div class="gm-coord-row full">
              <label>Или одной строкой</label>
              <input type="text" inputmode="decimal" id="coordCombined" placeholder="56.81234, 37.21456">
            </div>
            <button type="button" class="maps-go-btn gm-coord-apply" data-apply-coords>Применить координаты</button>
          </div>
        `}
      </div>
    `;
  }

  function renderList() {
    const q = searchQuery.trim();
    const coord = MapsData.parseCoordinates(q);
    let extra = '';
    if (coord) {
      extra = `
        <button type="button" class="maps-list-item coord-suggest" data-apply-coord="${coord.lat},${coord.lon}">
          <span class="maps-list-icon">📌</span>
          <span class="maps-list-text">
            <strong>${esc(MapsData.formatCoords(coord.lat, coord.lon))}</strong>
            <small>Использовать эти координаты</small>
          </span>
        </button>
      `;
    }

    const items = MapsData.searchPlaces(searchQuery);
    if (!items.length && !extra) return '<p class="maps-hint">Ничего не найдено</p>';
    return extra + items.map(p => {
      const geo = MapsData.getPlaceCoords(p);
      return `
        <button type="button" class="maps-list-item" data-place="${p.id}">
          <span class="maps-list-icon">${p.type === 'city' ? '🏙' : p.type === 'poi' ? '📍' : '🏘'}</span>
          <span class="maps-list-text">
            <strong>${esc(p.name)}</strong>
            <small>${esc(geo ? MapsData.formatCoords(geo.lat, geo.lon) : (p.sub || ''))}</small>
          </span>
        </button>
      `;
    }).join('');
  }

  function render() {
    const screen = document.getElementById('mapsApp');
    if (!screen) return;

    const from = MapsData.findPlace(fromId);
    const to = toId ? MapsData.findPlace(toId) : null;
    const instr = driving && route ? navInstruction() : null;
    const showRoute = Boolean(route);
    const showPick = picking && !driving;

    if (driving) {
      screen.innerHTML = `
        <div class="maps-app gm-app driving">
          ${renderNavBars(instr)}
          ${renderDriveScene()}
          <button type="button" class="gm-exit-drive" data-maps-stop>✕</button>
        </div>
      `;
    } else if (showRoute) {
      screen.innerHTML = `
        <div class="maps-app gm-app route">
          ${renderBlueHeader(from, to)}
          ${renderModeTabs()}
          <div class="gm-map-area">
            ${renderMapSvg({ path: route.path, dotted: true, showBubble: true, showPin: true })}
            <button type="button" class="gm-my-location" aria-label="Моё местоположение">◎</button>
            <button type="button" class="gm-nav-fab" data-maps-start aria-label="Навигация">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </button>
          </div>
          ${renderRouteCard()}
        </div>
      `;
    } else {
      screen.innerHTML = `
        <div class="maps-app gm-app search">
          ${renderBlueHeader(from, to)}
          ${to ? renderModeTabs() : ''}
          <div class="gm-map-area${to ? '' : ' idle'}">
            ${renderMapSvg({ path: null, dotted: false, showPin: Boolean(to) })}
          </div>
          ${showPick ? renderPickPanel() : (to ? `
            <div class="gm-build-wrap">
              <button type="button" class="maps-go-btn gm-build-btn" data-maps-route">Построить маршрут</button>
            </div>
          ` : `
            <div class="gm-search-panel compact">
              <p class="maps-hint">Нажмите поле «Куда едем?» — поиск или ввод координат</p>
            </div>
          `)}
        </div>
      `;
    }

    bind(screen);
  }

  function bind(screen) {
    screen.querySelector('[data-maps-back]')?.addEventListener('click', () => {
      if (route) {
        route = null;
        driving = false;
        picking = null;
        render();
        return;
      }
      if (typeof showScreen === 'function') showScreen('homeScreen');
    });

    screen.querySelector('#mapsSearchInput')?.addEventListener('input', e => {
      searchQuery = e.target.value;
      const list = screen.querySelector('.maps-list');
      if (list) list.innerHTML = renderList();
      bindList(screen);
    });

    screen.querySelectorAll('[data-input-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        inputMode = btn.dataset.inputMode;
        render();
      });
    });

    screen.querySelector('#coordLat')?.addEventListener('input', e => { coordLat = e.target.value; });
    screen.querySelector('#coordLon')?.addEventListener('input', e => { coordLon = e.target.value; });

    screen.querySelector('[data-apply-coords]')?.addEventListener('click', () => {
      const combined = screen.querySelector('#coordCombined')?.value;
      applyCoordinates(combined || `${coordLat}, ${coordLon}`);
    });

    screen.querySelector('#coordCombined')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyCoordinates(e.target.value);
    });

    screen.querySelectorAll('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        picking = btn.dataset.pick;
        searchQuery = '';
        inputMode = 'search';
        const target = picking === 'from' ? from : to;
        if (target?.type === 'coord') {
          coordLat = String(target.lat);
          coordLon = String(target.lon);
        } else {
          coordLat = '';
          coordLon = '';
        }
        render();
      });
    });

    bindList(screen);

    screen.querySelector('[data-maps-route]')?.addEventListener('click', buildRoute);
    screen.querySelectorAll('[data-maps-start]').forEach(btn => {
      btn.addEventListener('click', startDriving);
    });
    screen.querySelector('[data-maps-stop]')?.addEventListener('click', () => {
      driving = false;
      navStep = 0;
      render();
    });
  }

  function bindList(screen) {
    screen.querySelectorAll('.maps-list-item[data-place]').forEach(btn => {
      btn.onclick = () => selectPlace(btn.dataset.place);
    });
    screen.querySelectorAll('[data-apply-coord]').forEach(btn => {
      btn.onclick = () => {
        const [lat, lon] = btn.dataset.applyCoord.split(',').map(Number);
        applyCoordinates(`${lat}, ${lon}`);
      };
    });
  }

  function applyCoordinates(text) {
    const parsed = MapsData.parseCoordinates(text);
    if (!parsed) {
      alert('Неверный формат координат.\nПример: 56.81234, 37.21456');
      return;
    }

    const point = MapsData.registerCustomPoint(parsed.lat, parsed.lon);
    coordLat = String(parsed.lat);
    coordLon = String(parsed.lon);

    if (picking === 'from') {
      fromId = point.id;
      if (toId === point.id) toId = null;
    } else {
      toId = point.id;
      if (fromId === point.id) fromId = DEFAULT_FROM;
    }

    picking = null;
    route = null;
    driving = false;
    searchQuery = MapsData.formatCoords(parsed.lat, parsed.lon);
    render();
  }

  function selectPlace(id) {
    const place = MapsData.findPlace(id);
    if (!place || place.type === 'lake') return;

    if (picking === 'from') {
      fromId = id;
      if (toId === id) toId = null;
    } else {
      toId = id;
      if (fromId === id) fromId = DEFAULT_FROM;
    }
    picking = null;
    route = null;
    driving = false;
    searchQuery = place.name;
    render();
  }

  function buildRoute() {
    if (!fromId || !toId) return;
    route = MapsData.findRouteResolved(fromId, toId);
    if (!route) {
      alert('Маршрут по дорогам не найден');
      return;
    }
    driving = false;
    navStep = 0;
    picking = null;
    render();
  }

  function startDriving() {
    if (!route) return;
    driving = true;
    navStep = 0;
    picking = null;
    render();
  }

  function open(opts = {}) {
    fromId = opts.from || DEFAULT_FROM;
    toId = opts.to || null;
    route = null;
    driving = false;
    navStep = 0;
    picking = null;
    inputMode = 'search';
    coordLat = '';
    coordLon = '';
    searchQuery = opts.query || '';
    render();
    if (toId) buildRoute();
  }

  window.MapsApp = { open, render };
})();
