/** Общий слой данных для админки эмулятора телефона. */
(function () {
  const NOVOGRAM_KEY = 'dym_novogram_admin_v1';
  const BROWSER_KEY = 'dym_browser_sites_v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getAccount(accountId) {
    return window.PhoneAccounts?.getAllAccounts().find(a => a.id === accountId) || null;
  }

  function listAccounts() {
    return window.PhoneAccounts?.getAllAccounts() || [];
  }

  function loadPhoneData(accountId) {
    const account = getAccount(accountId);
    if (!account) return null;
    try {
      const raw = localStorage.getItem(account.dataStorageKey);
      if (raw) return { ...clone(account.defaultData), ...JSON.parse(raw) };
    } catch {}
    return clone(account.defaultData);
  }

  function savePhoneData(accountId, data) {
    const account = getAccount(accountId);
    if (!account) return;
    writeJson(account.dataStorageKey, data);
  }

  function resetPhoneData(accountId) {
    const account = getAccount(accountId);
    if (!account) return;
    localStorage.removeItem(account.dataStorageKey);
    if (window.GibddDB) {
      GibddDB.configure(account.gibddStorageKey, account.gibddSeed);
      GibddDB.resetCarsToSeed();
    }
  }

  function loadGibddCars(accountId) {
    const account = getAccount(accountId);
    if (!account || !window.GibddDB) return [];
    GibddDB.configure(account.gibddStorageKey, account.gibddSeed);
    return GibddDB.loadCars();
  }

  function saveGibddCars(accountId, cars) {
    const account = getAccount(accountId);
    if (!account || !window.GibddDB) return;
    GibddDB.configure(account.gibddStorageKey, account.gibddSeed);
    GibddDB.saveCars(cars);
  }

  function emptyNovogramOverrides() {
    return { users: [], posts: [], deletedUserIds: [], deletedPostIds: [] };
  }

  function loadNovogramOverrides() {
    return readJson(NOVOGRAM_KEY, emptyNovogramOverrides());
  }

  function saveNovogramOverrides(data) {
    writeJson(NOVOGRAM_KEY, data);
  }

  function getBaseNovogramSeed() {
    return clone(window.NovogramSeed || { users: [], posts: [], newsAccounts: [], fillerAccountIds: [] });
  }

  function getNovogramData(baseSeed) {
    const base = clone(baseSeed || getBaseNovogramSeed());
    const ov = loadNovogramOverrides();
    const deletedUsers = new Set(ov.deletedUserIds || []);
    const deletedPosts = new Set(ov.deletedPostIds || []);

    const users = base.users.filter(u => !deletedUsers.has(u.id));
    const posts = base.posts.filter(p => !deletedPosts.has(p.id));

    for (const user of ov.users || []) {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) users[idx] = user;
      else users.push(user);
    }

    for (const post of ov.posts || []) {
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0) posts[idx] = post;
      else posts.push(post);
    }

    return { ...base, users, posts };
  }

  function isSeedUser(id) {
    return getBaseNovogramSeed().users.some(u => u.id === id);
  }

  function isSeedPost(id) {
    return getBaseNovogramSeed().posts.some(p => p.id === id);
  }

  function upsertNovogramUser(user) {
    const ov = loadNovogramOverrides();
    ov.users = (ov.users || []).filter(u => u.id !== user.id);
    ov.users.push(user);
    if ((ov.deletedUserIds || []).includes(user.id)) {
      ov.deletedUserIds = ov.deletedUserIds.filter(id => id !== user.id);
    }
    saveNovogramOverrides(ov);
  }

  function deleteNovogramUser(id) {
    const ov = loadNovogramOverrides();
    const relatedPostIds = getNovogramData()
      .posts
      .filter(post => post.userId === id)
      .map(post => post.id);
    ov.users = (ov.users || []).filter(u => u.id !== id);
    if (isSeedUser(id) && !ov.deletedUserIds.includes(id)) ov.deletedUserIds.push(id);
    ov.posts = (ov.posts || []).filter(p => p.userId !== id);
    for (const postId of relatedPostIds) {
      if (isSeedPost(postId) && !ov.deletedPostIds.includes(postId)) {
        ov.deletedPostIds.push(postId);
      }
    }
    saveNovogramOverrides(ov);
  }

  function upsertNovogramPost(post) {
    const ov = loadNovogramOverrides();
    ov.posts = (ov.posts || []).filter(p => p.id !== post.id);
    ov.posts.push(post);
    if ((ov.deletedPostIds || []).includes(post.id)) {
      ov.deletedPostIds = ov.deletedPostIds.filter(id => id !== post.id);
    }
    saveNovogramOverrides(ov);
  }

  function deleteNovogramPost(id) {
    const ov = loadNovogramOverrides();
    ov.posts = (ov.posts || []).filter(p => p.id !== id);
    if (isSeedPost(id) && !ov.deletedPostIds.includes(id)) ov.deletedPostIds.push(id);
    saveNovogramOverrides(ov);
  }

  function resetNovogramOverrides() {
    localStorage.removeItem(NOVOGRAM_KEY);
  }

  function loadBrowserSites() {
    const ov = readJson(BROWSER_KEY, { sites: null });
    if (Array.isArray(ov.sites) && ov.sites.length) return ov.sites;
    return clone(window.BrowserSites || []);
  }

  function saveBrowserSites(sites) {
    writeJson(BROWSER_KEY, { sites });
  }

  function resetBrowserSites() {
    localStorage.removeItem(BROWSER_KEY);
  }

  function getEffectiveBrowserSites() {
    const ov = readJson(BROWSER_KEY, { sites: null });
    if (Array.isArray(ov.sites)) return ov.sites;
    return clone(window.BrowserSites || []);
  }

  function exportAll(accountId) {
    return {
      exportedAt: new Date().toISOString(),
      accountId,
      phone: loadPhoneData(accountId),
      gibdd: loadGibddCars(accountId),
      novogram: loadNovogramOverrides(),
      browser: readJson(BROWSER_KEY, { sites: null }),
      customAccounts: window.PhoneAccounts?.loadCustomAccounts() || [],
    };
  }

  function importAll(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Некорректный файл');
    if (payload.accountId && payload.phone) savePhoneData(payload.accountId, payload.phone);
    if (payload.accountId && payload.gibdd) saveGibddCars(payload.accountId, payload.gibdd);
    if (payload.novogram) saveNovogramOverrides(payload.novogram);
    if (payload.browser) writeJson(BROWSER_KEY, payload.browser);
    if (Array.isArray(payload.customAccounts)) {
      window.PhoneAccounts?.saveCustomAccounts(payload.customAccounts);
    }
  }

  function nextId(items, prefix) {
    const nums = items
      .map(item => String(item.id || ''))
      .map(id => {
        const m = id.match(/(\d+)$/);
        return m ? Number(m[1]) : 0;
      });
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${next}`;
  }

  window.AdminStore = {
    NOVOGRAM_KEY,
    BROWSER_KEY,
    listAccounts,
    getAccount,
    loadPhoneData,
    savePhoneData,
    resetPhoneData,
    loadGibddCars,
    saveGibddCars,
    getBaseNovogramSeed,
    getNovogramData,
    loadNovogramOverrides,
    saveNovogramOverrides,
    upsertNovogramUser,
    deleteNovogramUser,
    upsertNovogramPost,
    deleteNovogramPost,
    resetNovogramOverrides,
    loadBrowserSites,
    saveBrowserSites,
    resetBrowserSites,
    getEffectiveBrowserSites,
    exportAll,
    importAll,
    nextId,
  };
})();
