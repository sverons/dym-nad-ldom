(function () {
  let currentAccount = null;
  let isAdminUser = false;
  let accountData = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData(account) {
    try {
      const raw = localStorage.getItem(account.dataStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return mergeAccountData(account.defaultData, parsed);
      }
    } catch {}
    return clone(account.defaultData);
  }

  function mergeAccountData(defaults, saved) {
    const base = clone(defaults);
    const data = { ...base, ...clone(saved) };
    const defaultContacts = Array.isArray(base.contacts) ? base.contacts : [];
    const savedContacts = Array.isArray(saved.contacts) ? saved.contacts : [];
    const merged = [...savedContacts];
    const ids = new Set(merged.map(c => c.id));
    const names = new Set(merged.map(c => String(c.name || '').toLowerCase()));

    defaultContacts.forEach(contact => {
      const nameKey = String(contact.name || '').toLowerCase();
      if (!ids.has(contact.id) && !names.has(nameKey)) {
        merged.push(clone(contact));
        ids.add(contact.id);
        names.add(nameKey);
      }
    });

    // Гарантируем адвоката Железнова в основной книге контактов
    const hasZheleznov = merged.some(c => /железнов/i.test(String(c.name || '')));
    if (!hasZheleznov) {
      const fromDefaults = defaultContacts.find(c => /железнов/i.test(String(c.name || '')));
      merged.unshift(clone(fromDefaults || {
        id: 1,
        name: 'Пётр Железнов',
        avatar: 'Ж',
        color: 'avatar-1',
        phone: '+7 (903) 118-25-00',
      }));
    }

    data.contacts = merged;
    return data;
  }

  function saveData() {
    if (!currentAccount || !accountData) return;
    localStorage.setItem(currentAccount.dataStorageKey, JSON.stringify(accountData));
  }

  function resetData() {
    if (!currentAccount) return;
    accountData = clone(currentAccount.defaultData);
    saveData();
    GibddDB.configure(currentAccount.gibddStorageKey, currentAccount.gibddSeed);
    GibddDB.resetCarsToSeed();
  }

  function activate(account, admin) {
    currentAccount = account;
    isAdminUser = admin;
    accountData = loadData(account);
    GibddDB.configure(account.gibddStorageKey, account.gibddSeed);
    GibddDB.loadCars();
  }

  function renderHome() {
    const grid = document.getElementById('homeAppGrid');
    if (!grid || !currentAccount) return;
    grid.innerHTML = PhoneAccounts.renderAccountApps(currentAccount, isAdminUser);
    document.querySelectorAll('#homeAppGrid .app-icon[data-app]').forEach(icon => {
      icon.addEventListener('click', () => openApp(icon.dataset.app));
    });
  }

  window.PhoneSession = {
    activate,
    saveData,
    resetData,
    renderHome,
    getAccount: () => currentAccount,
    isAdmin: () => isAdminUser,
    getData: () => accountData,
    get contacts() { return accountData?.contacts || []; },
    get chats() { return accountData?.chats || []; },
    get emails() { return accountData?.emails || []; },
    get callHistory() { return accountData?.callHistory || []; },
    get games() { return accountData?.games || []; },
    get notes() { return accountData?.notes || []; },
    get calendar() { return accountData?.calendar || []; },
    get photos() { return accountData?.photos || []; },
  };
})();
