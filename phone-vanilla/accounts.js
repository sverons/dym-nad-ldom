const APP_ICONS = {
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  dialer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
  phonebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="13" height="18" rx="2.5" fill="#fff"/><circle cx="9.5" cy="9" r="2.8" fill="#aeaeb2"/><path fill="#aeaeb2" d="M5.5 17.5c0-2.2 1.8-4 4-4s4 1.8 4 4"/><rect x="16" y="4" width="2.8" height="3.5" rx=".6" fill="#ff3b30"/><rect x="16" y="8.5" width="2.8" height="3.5" rx=".6" fill="#ff9500"/><rect x="16" y="13" width="2.8" height="3.5" rx=".6" fill="#ffcc00"/><rect x="16" y="17.5" width="2.8" height="3.5" rx=".6" fill="#34c759"/></svg>',
  messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h2l3.5 3.5L20 18V4c0-1.1-.9-2-2-2z"/></svg>',
  games: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6v2a2 2 0 0 0 2 2h1v-9H6zm12 0h-1.5v9H18a2 2 0 0 0 2-2v-2h1.5a2.5 2.5 0 0 0 0-5H18V7a2 2 0 0 0-2-2h-1.5v4zM9 7v10h6V7H9z"/></svg>',
  match3: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="9" r="4" fill="#fff" opacity=".95"/><circle cx="16.5" cy="9" r="4" fill="#fff" opacity=".85"/><circle cx="12" cy="16" r="4" fill="#fff" opacity=".9"/></svg>',
  snake: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M3 8h11c1.1 0 2 .9 2 2s-.9 2-2 2H5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h13v2H5c-1.7 0-3-1.3-3-3v-2c0-1.7 1.3-3 3-3h9c.6 0 1-.4 1-1s-.4-1-1-1H3V8z"/><circle cx="19" cy="16" r="2.5" fill="#fff"/></svg>',
  tetris: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity=".95"/><rect x="12" y="3" width="9" height="4.5" rx="1.5" fill="#fff" opacity=".8"/><rect x="3" y="12" width="4.5" height="9" rx="1.5" fill="#fff" opacity=".85"/><rect x="9" y="12" width="12" height="9" rx="1.5" fill="#fff" opacity=".7"/></svg>',
  gibdd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 1z"/><path fill="#1e3a5f" d="M7 9.5h10v1.5H7zm0 3h10v1.5H7zm3-5.5h4v2h-4z"/></svg>',
  novagram: '<img class="novogram-icon-img" src="./assets/novogram-icon.png" alt="" draggable="false" />',
  notes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M6 2h9.5L18 4.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path fill="#e8c547" d="M15 2v3h3"/><rect x="7" y="11" width="10" height="1.4" rx=".7" fill="#c9a227" opacity=".55"/><rect x="7" y="14" width="10" height="1.4" rx=".7" fill="#c9a227" opacity=".55"/><rect x="7" y="17" width="7" height="1.4" rx=".7" fill="#c9a227" opacity=".55"/></svg>',
  photos: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="#fff"/><ellipse cx="12" cy="6.5" rx="2.8" ry="3.8" fill="#fff"/><ellipse cx="12" cy="17.5" rx="2.8" ry="3.8" fill="#fff"/><ellipse cx="6.5" cy="12" rx="3.8" ry="2.8" fill="#fff"/><ellipse cx="17.5" cy="12" rx="3.8" ry="2.8" fill="#fff"/><ellipse cx="8" cy="8" rx="2.5" ry="3.2" transform="rotate(-45 8 8)" fill="#fff" opacity=".92"/><ellipse cx="16" cy="8" rx="2.5" ry="3.2" transform="rotate(45 16 8)" fill="#fff" opacity=".92"/><ellipse cx="8" cy="16" rx="2.5" ry="3.2" transform="rotate(45 8 16)" fill="#fff" opacity=".92"/><ellipse cx="16" cy="16" rx="2.5" ry="3.2" transform="rotate(-45 16 16)" fill="#fff" opacity=".92"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3" fill="#fff"/><path fill="#ff3b30" d="M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3H4V8z"/><rect x="7.5" y="3" width="2" height="4" rx="1" fill="#aeaeb2"/><rect x="14.5" y="3" width="2" height="4" rx="1" fill="#aeaeb2"/><text x="12" y="18.5" text-anchor="middle" fill="#1d1d1f" font-size="8.5" font-weight="700" font-family="-apple-system,sans-serif">24</text></svg>',
  admin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5z"/><path fill="#fff" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
  hints: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C7.79 2 5 4.79 5 8c0 2.34 1.28 4.38 3.18 5.47L9 20h6l.82-6.53C17.72 12.38 19 10.34 19 8c0-3.21-2.79-6-7-6z"/></svg>',
};

const CUSTOM_ACCOUNTS_KEY = 'dym_phone_custom_accounts_v1';

function gibddSeed() {
  return GIBDD_FULL_SEED.map(car => ({ ...car }));
}

const PHONE_ACCOUNTS = {
  main: {
    id: 'main',
    label: 'Основная',
    passcode: '128500',
    adminPasscode: '000000',
    gibddStorageKey: 'dym_gibdd_cars_main_v2',
    dataStorageKey: 'dym_phone_data_main_v2',
    apps: [
      { app: 'mail', label: 'Почта', icon: 'mail', style: 'app-mail' },
      { app: 'calls', label: 'Телефон', icon: 'dialer', style: 'app-dialer' },
      { app: 'contacts', label: 'Контакты', icon: 'phonebook', style: 'app-phonebook' },
      { app: 'messages', label: 'Сообщения', icon: 'messages', style: 'app-messages' },
      { app: 'notes', label: 'Заметки', icon: 'notes', style: 'app-notes' },
      { app: 'calendar', label: 'Календарь', icon: 'calendar', style: 'app-calendar' },
      { app: 'maps', label: 'Навигатор', icon: 'maps', style: 'app-maps' },
      { app: 'hints', label: 'Подсказки', icon: 'hints', style: 'app-hints' },
      { app: 'games', label: 'Игры', icon: 'games', style: 'app-games' },
      { app: 'novagram', label: 'Novagram', icon: 'novagram', style: 'app-novagram' },
      { app: 'gibdd', label: 'ГИБДД', icon: 'gibdd', style: 'app-gibdd' },
      { app: 'gibdd-admin', label: 'ГИБДД+', icon: 'gibdd', style: 'app-gibdd-admin', adminOnly: true },
      { app: 'admin', label: 'Админ', icon: 'admin', style: 'app-admin', adminOnly: true },
    ],
    defaultData: {
      contacts: [
        { id: 1, name: 'Алексей', avatar: 'А', color: 'avatar-1', phone: '+7 (999) 123-45-67' },
        { id: 2, name: 'Мария', avatar: 'М', color: 'avatar-2', phone: '+7 (999) 234-56-78' },
        { id: 3, name: 'Дмитрий', avatar: 'Д', color: 'avatar-3', phone: '+7 (999) 345-67-89' },
        { id: 4, name: 'Елена', avatar: 'Е', color: 'avatar-4', phone: '+7 (999) 456-78-90' },
        { id: 5, name: 'Сергей', avatar: 'С', color: 'avatar-5', phone: '+7 (999) 567-89-01' },
      ],
      chats: [
        { contactId: 1, messages: [
          { text: 'Привет! Ты видел новости?', sent: false, time: '10:30' },
          { text: 'Какие именно?', sent: true, time: '10:31' },
          { text: 'Про запуск ракеты сегодня утром', sent: false, time: '10:32' },
        ], unread: true },
        { contactId: 2, messages: [
          { text: 'Встречаемся в 18:00?', sent: false, time: 'Вчера' },
          { text: 'Конечно, буду!', sent: true, time: 'Вчера' },
        ], unread: false },
        { contactId: 5, messages: [
          { text: 'Нужно поговорить сегодня вечером', sent: false, time: '09:15' },
        ], unread: true },
      ],
      emails: [
        { id: 1, from: 'Apple', email: 'noreply@apple.com', subject: 'Ваш чек от Apple', preview: 'Спасибо за покупку...', time: '12:30', unread: true, body: 'Спасибо за покупку в App Store.\n\nСумма: 299 ₽', color: 'avatar-1' },
        { id: 2, from: 'Дмитрий', email: 'dmitry@work.ru', subject: 'Документы для проекта', preview: 'Прикрепляю файлы...', time: '10:15', unread: true, body: 'Привет!\n\nПрикрепляю файлы по проекту.', color: 'avatar-3' },
      ],
      callHistory: [
        { contactId: 1, type: 'incoming', date: 'Сегодня, 14:32' },
        { contactId: 5, type: 'missed', date: 'Вчера, 19:45' },
      ],
      games: [
        { id: 'snake', title: 'Змейка', desc: 'Классическая аркада', emoji: '🐍', bg: '#1a472a' },
        { id: 'match3', title: '3 в ряд', desc: 'Скоро', emoji: '🔮', bg: '#3d1a47', disabled: true },
        { id: 'tetris', title: 'Тетрис', desc: 'Скоро', emoji: '🧱', bg: '#2a2a47', disabled: true },
        { id: 'memory', title: 'Память', desc: 'Найди пары', emoji: '🧠', bg: '#2a1a47' },
        { id: 'tap', title: 'Тап-тап', desc: 'Набери очки', emoji: '👆', bg: '#471a2a' },
      ],
      notes: [
        { id: 1, title: 'Адвокат', body: 'Звонить Петровой до среды. Документы по делу передать лично.' },
        { id: 2, title: 'Машины', body: 'BMW А123БВ777 — Сергей\nMercedes К456МН199 — Анна\nПарковка: Профсоюзная, подземная.' },
        { id: 3, title: 'Вероника', body: 'Polo Е321КХ777 — проверить, когда будет время. Не обсуждать с Сергеем.' },
      ],
      calendar: [
        { id: 1, date: '2026-06-22', title: 'Суд по делу Акуниной', time: '10:00' },
        { id: 2, date: '2026-06-26', title: 'Встреча с адвокатом', time: '14:00' },
        { id: 3, date: '2026-06-28', title: 'Осмотр BMW после ДТП', time: '11:30' },
      ],
    },
    gibddSeed: gibddSeed(),
  },

  alt: {
    id: 'alt',
    label: 'Служебная',
    passcode: '123456',
    adminPasscode: '654321',
    gibddStorageKey: 'dym_gibdd_cars_alt_v2',
    dataStorageKey: 'dym_phone_data_alt_v2',
    apps: [
      { app: 'messages', label: 'Сообщения', icon: 'messages', style: 'app-messages' },
      { app: 'calls', label: 'Телефон', icon: 'dialer', style: 'app-dialer' },
      { app: 'mail', label: 'Почта', icon: 'mail', style: 'app-mail' },
      { app: 'gibdd', label: 'ГИБДД', icon: 'gibdd', style: 'app-gibdd' },
      { app: 'notes', label: 'Заметки', icon: 'notes', style: 'app-notes' },
      { app: 'photos', label: 'Фото', icon: 'photos', style: 'app-photos' },
      { app: 'calendar', label: 'Календарь', icon: 'calendar', style: 'app-calendar' },
      { app: 'maps', label: 'Навигатор', icon: 'maps', style: 'app-maps' },
      { app: 'hints', label: 'Подсказки', icon: 'hints', style: 'app-hints' },
      { app: 'gibdd-admin', label: 'ГИБДД+', icon: 'gibdd', style: 'app-gibdd-admin', adminOnly: true },
      { app: 'admin', label: 'Админ', icon: 'admin', style: 'app-admin', adminOnly: true },
    ],
    defaultData: {
      contacts: [
        { id: 1, name: 'Артур Скорый', avatar: 'А', color: 'avatar-1', phone: '+7 (916) 440-12-08' },
        { id: 2, name: 'Крылов', avatar: 'К', color: 'avatar-3', phone: '+7 (903) 771-55-20' },
        { id: 3, name: 'МИА', avatar: 'М', color: 'avatar-4', phone: '+7 (495) 000-00-01' },
        { id: 4, name: 'Неизвестный', avatar: '?', color: 'avatar-5', phone: '+7 (900) 000-00-01' },
      ],
      chats: [
        { contactId: 1, messages: [
          { text: 'Материалы по KAPNOS готовы. Смотри почту.', sent: false, time: '08:40' },
          { text: 'Получил. Разберусь сегодня.', sent: true, time: '08:42' },
        ], unread: true },
        { contactId: 2, messages: [
          { text: 'Проверьте номер Е321КХ777 в базе', sent: false, time: 'Вчера' },
        ], unread: true },
        { contactId: 4, messages: [
          { text: 'Не звони сюда больше', sent: false, time: 'Пн' },
        ], unread: false },
      ],
      emails: [
        { id: 1, from: 'МИА', email: 'info@mia.gov', subject: 'Справка по делу KAPNOS', preview: 'Направляем материалы...', time: '09:10', unread: true, body: 'Направляем материалы по серии KAPNOS.\n\nВо вложении — сводка по номерам ТС.', color: 'avatar-4' },
        { id: 2, from: 'Артур Скорый', email: 'a.skory@media.ru', subject: 'Черновик статьи', preview: 'Посмотри формулировки...', time: 'Вчера', unread: false, body: 'Посмотри формулировки в черновике. Не публикуй без согласования.', color: 'avatar-1' },
      ],
      callHistory: [
        { contactId: 1, type: 'incoming', date: 'Сегодня, 08:35' },
        { contactId: 4, type: 'missed', date: 'Пн, 22:14' },
      ],
      games: [],
      notes: [
        { id: 1, title: 'Номера для проверки', body: 'Е321КХ777 — Polo, Вероника\nМ555АА750 — Solaris, Иванов\nВ789ОР750 — Camry, 2009' },
        { id: 2, title: 'KAPNOS', body: 'Сигарета в правой руке у левши — отметка серии. Проверить связь с парковкой на Строителей.' },
      ],
      calendar: [
        { id: 1, date: '2026-06-22', title: 'Суд по делу Акуниной', time: '10:00' },
        { id: 2, date: '2026-06-24', title: 'Встреча с Артуром', time: '18:30' },
      ],
      photos: [
        { id: 1, title: 'Парковка', caption: 'Подземная парковка, ул. Строителей' },
        { id: 2, title: 'Место ДТП 2009', caption: 'Озеро Сенеж, съезд с моста' },
      ],
    },
    gibddSeed: gibddSeed(),
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadCustomAccounts() {
  try {
    const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomAccounts(list) {
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(list));
}

function buildCustomAccount(entry) {
  const template = PHONE_ACCOUNTS[entry.templateId] || PHONE_ACCOUNTS.alt;
  const id = entry.id || `custom-${Date.now()}`;
  return {
    id,
    label: entry.label,
    passcode: entry.passcode,
    adminPasscode: entry.adminPasscode || entry.passcode,
    gibddStorageKey: `dym_gibdd_${id}`,
    dataStorageKey: `dym_phone_data_${id}`,
    apps: clone(template.apps),
    defaultData: clone(template.defaultData),
    gibddSeed: gibddSeed(),
    isCustom: true,
  };
}

function addCustomAccount({ label, passcode, adminPasscode, templateId }) {
  const list = loadCustomAccounts();
  const id = `custom-${Date.now()}`;
  list.push({ id, label, passcode, adminPasscode: adminPasscode || passcode, templateId: templateId || 'alt' });
  saveCustomAccounts(list);
  return buildCustomAccount(list[list.length - 1]);
}

function deleteCustomAccount(id) {
  const list = loadCustomAccounts().filter(item => item.id !== id);
  saveCustomAccounts(list);
}

function getAllAccounts() {
  const builtIn = Object.values(PHONE_ACCOUNTS);
  const custom = loadCustomAccounts().map(buildCustomAccount);
  return [...builtIn, ...custom];
}

function findAccountByPasscode(code) {
  for (const account of getAllAccounts()) {
    if (code === account.passcode) return { account, admin: false };
    if (code === account.adminPasscode) return { account, admin: true };
  }
  return null;
}

const RICH_ICONS = new Set(['phonebook', 'notes', 'calendar', 'novagram']);

function renderAccountApps(account, isAdmin) {
  return account.apps
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => `
      <div class="app-icon${item.adminOnly ? ' admin-only' : ''}" data-app="${item.app}">
        <div class="icon-bg ios-app-icon ${item.style}${RICH_ICONS.has(item.icon) ? ' icon-rich' : ''}">${APP_ICONS[item.icon] || ''}</div>
        <span>${item.label}</span>
      </div>
    `).join('');
}

window.PhoneAccounts = {
  APP_ICONS,
  PHONE_ACCOUNTS,
  CUSTOM_ACCOUNTS_KEY,
  loadCustomAccounts,
  saveCustomAccounts,
  addCustomAccount,
  deleteCustomAccount,
  getAllAccounts,
  findAccountByPasscode,
  renderAccountApps,
};
