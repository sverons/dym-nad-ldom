(function () {
  let currentSiteId = null;
  let historyStack = [];
  let historyIndex = -1;
  let draftAddress = '';

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function canGoBack() {
    return historyIndex > 0;
  }

  function canGoForward() {
    return historyIndex >= 0 && historyIndex < historyStack.length - 1;
  }

  function chromeHtml() {
    const site = currentSiteId ? (window.BrowserData?.findById(currentSiteId) || null) : null;
    const addr = site ? site.host : draftAddress;
    return `
      <div class="browser-chrome">
        <div class="browser-chrome-row">
          <button type="button" class="browser-nav-btn" data-browser-back ${canGoBack() ? '' : 'disabled'} aria-label="Назад">‹</button>
          <button type="button" class="browser-nav-btn" data-browser-fwd ${canGoForward() ? '' : 'disabled'} aria-label="Вперёд">›</button>
          <form class="browser-addr" data-browser-go>
            <span class="browser-lock">${site ? '🔒' : '🔍'}</span>
            <input type="text" id="browserAddress" value="${esc(addr)}" placeholder="Введите адрес сайта" autocomplete="off" spellcheck="false" inputmode="url">
            <button type="submit" class="browser-go-btn" aria-label="Перейти">Перейти</button>
          </form>
          <button type="button" class="browser-nav-btn" data-browser-home aria-label="Домой">⌂</button>
          <button type="button" class="browser-nav-btn" data-browser-close aria-label="Закрыть">✕</button>
        </div>
      </div>
    `;
  }

  function homeHtml() {
    const bookmarks = window.BrowserData?.listedSites?.() || [];
    return `
      <div class="browser-home">
        <div class="browser-home-hero">
          <h1>Браузер</h1>
          <p>Введите адрес сайта в строке выше</p>
        </div>
        ${bookmarks.length ? `
          <div class="browser-bookmarks">
            <h2>Закладки</h2>
            <div class="browser-site-list">
              ${bookmarks.map(site => `
                <button type="button" class="browser-site-card" data-open-site="${esc(site.id)}">
                  <span class="browser-site-icon" style="background:${esc(site.color || '#007aff')}">${esc(site.letter || site.title.slice(0, 1))}</span>
                  <span class="browser-site-meta">
                    <strong>${esc(site.title)}</strong>
                    <small class="browser-site-host">${esc(site.host)}</small>
                  </span>
                  <span class="browser-site-chevron">›</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="browser-empty">
            <p>Нет открытых закладок</p>
            <small>Сайты открываются только по точному адресу</small>
          </div>
        `}
      </div>
    `;
  }

  function render() {
    const screen = document.getElementById('browserApp');
    if (!screen) return;

    const viewing = Boolean(currentSiteId);
    const site = viewing ? window.BrowserData?.findById(currentSiteId) : null;

    screen.innerHTML = `
      <div class="browser-app${viewing ? ' viewing' : ''}">
        ${chromeHtml()}
        ${viewing && site
          ? `<iframe class="browser-frame" id="browserFrame" title="${esc(site.title)}" src="${esc(site.url)}"></iframe>`
          : homeHtml()}
      </div>
    `;

    bind(screen);

    if (!viewing) {
      const input = screen.querySelector('#browserAddress');
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }
  }

  function bind(screen) {
    screen.querySelector('[data-browser-close]')?.addEventListener('click', () => {
      close();
      if (typeof showScreen === 'function') showScreen('homeScreen');
    });

    screen.querySelector('[data-browser-home]')?.addEventListener('click', () => {
      goHome(true);
    });

    screen.querySelector('[data-browser-back]')?.addEventListener('click', () => {
      if (!canGoBack()) return;
      historyIndex -= 1;
      applyHistory();
    });

    screen.querySelector('[data-browser-fwd]')?.addEventListener('click', () => {
      if (!canGoForward()) return;
      historyIndex += 1;
      applyHistory();
    });

    screen.querySelectorAll('[data-open-site]').forEach(btn => {
      btn.addEventListener('click', () => openSite(btn.dataset.openSite, true));
    });

    const addrInput = screen.querySelector('#browserAddress');
    addrInput?.addEventListener('input', e => {
      if (!currentSiteId) draftAddress = e.target.value;
    });

    screen.querySelector('[data-browser-go]')?.addEventListener('submit', e => {
      e.preventDefault();
      tryOpenAddress(screen.querySelector('#browserAddress')?.value || '');
    });
  }

  function applyHistory() {
    const entry = historyStack[historyIndex];
    if (!entry || entry === '__home__') {
      currentSiteId = null;
      draftAddress = '';
      render();
      return;
    }
    currentSiteId = entry;
    draftAddress = '';
    render();
  }

  function pushHistory(entry) {
    historyStack = historyStack.slice(0, historyIndex + 1);
    if (historyStack[historyStack.length - 1] === entry) return;
    historyStack.push(entry);
    historyIndex = historyStack.length - 1;
  }

  function goHome(push) {
    currentSiteId = null;
    draftAddress = '';
    if (push) pushHistory('__home__');
    render();
  }

  function openSite(id, push) {
    const site = window.BrowserData?.findById(id);
    if (!site) return;
    currentSiteId = site.id;
    draftAddress = '';
    if (push) pushHistory(site.id);
    render();
  }

  function tryOpenAddress(raw) {
    const text = String(raw || '').trim();
    draftAddress = text;

    if (!text) {
      goHome(true);
      return;
    }

    const site = window.BrowserData?.findByHost(text);
    if (site) {
      openSite(site.id, true);
      return;
    }

    alert('Страница не найдена.\nПроверьте адрес и попробуйте снова.');
    render();
  }

  function open(opts = {}) {
    historyStack = ['__home__'];
    historyIndex = 0;
    currentSiteId = null;
    draftAddress = '';
    render();
    if (opts.siteId) openSite(opts.siteId, true);
    if (typeof showScreen === 'function') showScreen('browserApp');
  }

  function close() {
    const frame = document.getElementById('browserFrame');
    if (frame) frame.src = 'about:blank';
    currentSiteId = null;
    draftAddress = '';
  }

  window.BrowserApp = { open, close, render };
})();
