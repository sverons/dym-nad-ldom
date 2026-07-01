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
        return { ...clone(account.defaultData), ...parsed };
      }
    } catch {}
    return clone(account.defaultData);
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
