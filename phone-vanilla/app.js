let currentScreen = 'lockScreen';
let currentChat = null;
let dialNumber = '';
let callTimer = null;

function getContacts() { return PhoneSession.contacts; }
function getChats() { return PhoneSession.chats; }
function getEmails() { return PhoneSession.emails; }
function getCallHistory() { return PhoneSession.callHistory; }
function getGames() { return PhoneSession.games; }

function escHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getContact(id) {
  return getContacts().find(c => c.id === id);
}

function updateTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const statusTime = document.getElementById('statusTime');
  if (statusTime) statusTime.textContent = timeStr;

  const lockTime = document.getElementById('lockTime');
  if (lockTime) lockTime.textContent = timeStr;

  const lockDate = document.getElementById('lockDate');
  if (lockDate) {
    // Неизменная дата сюжета — 21 февраля
    const lockDay = new Date(2026, 1, 21);
    lockDate.textContent = lockDay.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}

function isMobile() {
  return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
}

function setupMobile() {
  if (!isMobile()) return;

  document.documentElement.style.height = `${window.innerHeight}px`;

  window.addEventListener('resize', () => {
    document.documentElement.style.height = `${window.innerHeight}px`;
  });

  document.addEventListener('gesturestart', e => e.preventDefault());
}

function setCurrentScreen(screenId) {
  currentScreen = screenId;
  window.currentPhoneScreen = screenId;
}

function showScreen(screenId) {
  if (currentScreen === 'webApp' && screenId !== 'webApp' && typeof window.closeWebApp === 'function') {
    window.closeWebApp();
  }
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active', 'slide-in');
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    if (screenId !== 'lockScreen' && screenId !== 'homeScreen') {
      screen.classList.add('slide-in');
    }
  }
  setCurrentScreen(screenId);
}

const APP_SCREENS = [
  'messagesApp', 'chatDetail', 'callsApp', 'mailApp', 'mailDetail',
  'gamesApp', 'snakeGame', 'webApp', 'gibddApp', 'gibddAdminApp', 'adminApp',
  'hintsApp', 'notesApp', 'photosApp', 'calendarApp', 'mapsApp',
];

function openApp(app) {
  if (app === 'gibdd') {
    GibddApp.openGibddSearch();
    return;
  }
  if (app === 'gibdd-admin') {
    GibddApp.openGibddAdmin();
    return;
  }
  if (app === 'admin') {
    AdminApp.open();
    return;
  }
  if (app === 'hints') {
    HintsApp.open();
    return;
  }
  if (app === 'mail') {
    const mail = window.PHONE_WEB_URLS?.mail;
    if (mail) {
      openWebApp(mail.url, mail.title);
      return;
    }
  }
  if (app === 'novagram') {
    const novagram = window.PHONE_WEB_URLS?.novagram;
    if (novagram) {
      openWebApp(novagram.url, novagram.title);
      return;
    }
  }

  const appMap = {
    messages: 'messagesApp',
    calls: 'callsApp',
    mail: 'mailApp',
    games: 'gamesApp',
    snake: 'snakeGame',
    contacts: 'messagesApp',
    notes: 'notesApp',
    photos: 'photosApp',
    calendar: 'calendarApp',
    maps: 'mapsApp',
  };

  if (!appMap[app]) return;

  showScreen(appMap[app]);

  if (app === 'messages' || app === 'contacts') renderChatList();
  if (app === 'calls') { renderCallList(); initDialer(); }
  if (app === 'games') renderGames();
  if (app === 'snake') initSnake();
  if (app === 'notes') renderNotesApp();
  if (app === 'photos') renderPhotosApp();
  if (app === 'calendar') renderCalendarApp();
  if (app === 'maps') renderMapsApp();
}

function renderChatList() {
  const list = document.getElementById('chatList');
  if (!list) return;

  const chats = getChats();
  const contacts = getContacts();

  list.innerHTML = chats.map(chat => {
    const contact = contacts.find(c => c.id === chat.contactId);
    const lastMsg = chat.messages[chat.messages.length - 1];
    const name = contact ? contact.name : `Контакт #${chat.contactId}`;
    const avatar = contact ? contact.avatar : '?';
    const color = contact ? contact.color : 'avatar-1';
    return `
      <div class="chat-item" data-chat="${chat.contactId}">
        <div class="chat-avatar ${color}">${escHtml(avatar)}</div>
        <div class="chat-info">
          <div class="chat-name">${escHtml(name)}</div>
          <div class="chat-preview">${lastMsg ? (lastMsg.sent ? 'Вы: ' : '') + escHtml(lastMsg.text) : ''}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">${lastMsg ? escHtml(lastMsg.time) : ''}</div>
          ${chat.unread ? '<div class="chat-unread"></div>' : ''}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => openChat(parseInt(item.dataset.chat, 10)));
  });
}

function openChat(contactId) {
  currentChat = contactId;
  const contact = getContact(contactId);
  const chat = getChats().find(c => c.contactId === contactId);
  if (!chat || !contact) return;

  chat.unread = false;
  PhoneSession.saveData();

  const chatAvatar = document.getElementById('chatAvatar');
  const chatContactName = document.getElementById('chatContactName');
  if (chatAvatar) {
    chatAvatar.textContent = contact.avatar;
    chatAvatar.className = `contact-avatar ${contact.color}`;
  }
  if (chatContactName) chatContactName.textContent = contact.name;

  const container = document.getElementById('messagesContainer');
  if (container) {
    container.innerHTML = chat.messages.map(msg => `
      <div class="message-bubble ${msg.sent ? 'sent' : 'received'}">${escHtml(msg.text)}</div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  showScreen('chatDetail');
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text || !currentChat) return;

  const chat = getChats().find(c => c.contactId === currentChat);
  if (!chat) return;

  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  chat.messages.push({ text, sent: true, time });
  PhoneSession.saveData();

  const container = document.getElementById('messagesContainer');
  if (container) {
    container.innerHTML += `<div class="message-bubble sent">${escHtml(text)}</div>`;
    container.scrollTop = container.scrollHeight;
  }
  input.value = '';

  setTimeout(() => {
    const replies = ['Понял 👍', 'Хорошо!', 'Ок, напишу позже', 'Спасибо!', '👌'];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    chat.messages.push({ text: reply, sent: false, time });
    PhoneSession.saveData();
    if (container) {
      container.innerHTML += `<div class="message-bubble received">${escHtml(reply)}</div>`;
      container.scrollTop = container.scrollHeight;
    }
  }, 1500);
}

function renderCallList() {
  const list = document.getElementById('callList');
  if (!list) return;

  const icons = { incoming: '↙', outgoing: '↗', missed: '↙' };
  const typeLabels = { incoming: 'Входящий', outgoing: 'Исходящий', missed: 'Пропущенный' };

  list.innerHTML = getCallHistory().map(call => {
    const contact = getContact(call.contactId);
    const name = contact ? contact.name : 'Неизвестный';
    return `
      <div class="call-item" data-call="${call.contactId}">
        <div class="call-icon ${call.type}">${icons[call.type] || '↙'}</div>
        <div class="call-details">
          <div class="call-name-text ${call.type === 'missed' ? 'missed' : ''}">${escHtml(name)}</div>
          <div class="call-date">${typeLabels[call.type] || call.type} · ${escHtml(call.date)}</div>
        </div>
        <button class="call-info-btn" data-call-btn="${call.contactId}" type="button">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-call-btn]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      startCall(parseInt(btn.dataset.callBtn, 10));
    });
  });
}

function initDialer() {
  const pad = document.getElementById('dialerPad');
  if (!pad) return;

  const letters = ['', 'АБВГ', 'ДЕЖЗ', 'ИЙКЛ', 'МНОП', 'РСТУ', 'ФХЦЧ', 'ШЩЪЫ', 'ЬЭЮЯ', ''];
  pad.innerHTML = '';

  for (let i = 1; i <= 9; i++) {
    pad.innerHTML += `<button class="dial-key" data-dial="${i}" type="button"><span>${i}</span><small>${letters[i]}</small></button>`;
  }
  pad.innerHTML += `<button class="dial-key empty" type="button"></button>`;
  pad.innerHTML += `<button class="dial-key" data-dial="0" type="button"><span>0</span><small>+</small></button>`;
  pad.innerHTML += `<button class="dial-key" data-dial="del" type="button">⌫</button>`;

  pad.querySelectorAll('[data-dial]').forEach(key => {
    key.addEventListener('click', () => {
      if (key.dataset.dial === 'del') {
        dialNumber = dialNumber.slice(0, -1);
      } else {
        dialNumber += key.dataset.dial;
      }
      const display = document.getElementById('dialerDisplay');
      if (display) display.textContent = formatPhone(dialNumber);
    });
  });

  const display = document.getElementById('dialerDisplay');
  if (display) display.textContent = formatPhone(dialNumber);
}

function formatPhone(num) {
  if (!num) return '';
  let f = num;
  if (f.length > 3) f = f.slice(0, 3) + ' ' + f.slice(3);
  if (f.length > 7) f = f.slice(0, 7) + '-' + f.slice(7);
  if (f.length > 10) f = f.slice(0, 10) + '-' + f.slice(10);
  return f;
}

function startCall(contactId, number) {
  const overlay = document.getElementById('callOverlay');
  if (!overlay) return;

  const contact = contactId
    ? getContact(contactId)
    : { name: number || 'Неизвестный', avatar: '?', color: 'avatar-1' };

  if (!contact) return;

  const callAvatar = document.getElementById('callAvatar');
  const callName = document.getElementById('callName');
  const callStatus = document.getElementById('callStatus');

  if (callAvatar) {
    callAvatar.textContent = contact.avatar || '?';
    callAvatar.className = `call-avatar ${contact.color || 'avatar-1'}`;
  }
  if (callName) callName.textContent = contact.name;
  if (callStatus) callStatus.textContent = 'Вызов...';

  overlay.classList.add('active');

  if (callTimer) clearInterval(callTimer);

  setTimeout(() => {
    let seconds = 1;
    if (callStatus) callStatus.textContent = '00:01';
    callTimer = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      if (callStatus) callStatus.textContent = `${m}:${s}`;
    }, 1000);
  }, 2000);
}

function endCall() {
  document.getElementById('callOverlay')?.classList.remove('active');
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
}

function renderMailList() {
  const list = document.getElementById('mailList');
  if (!list) return;

  list.innerHTML = getEmails().map(mail => `
    <div class="mail-item${mail.unread ? ' unread' : ' read'}" data-mail="${mail.id}">
      <div class="mail-meta">
        <div class="mail-sender-row">
          ${mail.unread ? '<span class="mail-unread-dot" aria-hidden="true"></span>' : ''}
          <div class="mail-sender">${escHtml(mail.from)}</div>
        </div>
        <div class="mail-time">${escHtml(mail.time)}</div>
      </div>
      <div class="mail-subject">${escHtml(mail.subject)}</div>
      <div class="mail-preview-text">${escHtml(mail.preview)}</div>
    </div>
  `).join('');

  list.querySelectorAll('.mail-item').forEach(item => {
    item.addEventListener('click', () => openMail(parseInt(item.dataset.mail, 10)));
  });
}

function openMail(id) {
  const mail = getEmails().find(e => e.id === id);
  if (!mail) return;

  if (mail.unread) {
    mail.unread = false;
    PhoneSession.saveData();
  }

  const content = document.getElementById('mailDetailContent');
  if (!content) return;

  content.innerHTML = `
    <div class="mail-detail-header">
      <div class="mail-detail-subject">${escHtml(mail.subject)}</div>
      <div class="mail-detail-from">
        <div class="mail-from-avatar ${mail.color}">${escHtml(mail.from[0])}</div>
        <div class="mail-from-info">
          <div class="mail-from-name">${escHtml(mail.from)}</div>
          <div class="mail-from-email">${escHtml(mail.email)}</div>
        </div>
      </div>
    </div>
    <div class="mail-body">${escHtml(mail.body).replace(/\n/g, '<br>')}</div>
  `;
  showScreen('mailDetail');
}

function renderGames() {
  const grid = document.getElementById('gamesGrid');
  if (!grid) return;

  const account = PhoneSession.getAccount();
  const defaults = account?.defaultData?.games || [];
  const stored = getGames();
  const defaultIds = new Set(defaults.map(g => g.id));
  const games = [
    ...defaults.map(g => stored.find(s => s.id === g.id) || g),
    ...stored.filter(g => !defaultIds.has(g.id)),
  ].filter(g => g.id !== 'novagram');
  if (!games.length) {
    grid.innerHTML = '<p class="simple-empty" style="padding:20px;color:#8e8e93">Нет игр</p>';
    return;
  }

  grid.innerHTML = games.map(game => `
    <div class="game-card ${game.disabled ? 'disabled' : ''}" data-game="${escHtml(game.id)}"${game.url ? ` data-url="${escHtml(game.url)}"` : ''} style="opacity: ${game.disabled ? 0.5 : 1}">
      <div class="game-card-img" style="background: ${escHtml(game.bg)}">${escHtml(game.emoji)}</div>
      <div class="game-card-info">
        <div class="game-card-title">${escHtml(game.title)}</div>
        <div class="game-card-desc">${escHtml(game.desc)}</div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.game-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.dataset.game;
      const externalUrl = card.dataset.url;
      if (externalUrl) {
        const game = games.find(g => g.id === gameId);
        openWebApp(externalUrl, game?.title || 'Сайт');
        return;
      }
      if (gameId === 'snake') {
        showScreen('snakeGame');
        initSnake();
      } else if (gameId === 'memory') {
        alert('Игра «Память» скоро будет доступна!');
      } else if (gameId === 'tap') {
        startTapGame();
      }
    });
  });
}

let snakeInterval = null;

function initSnake() {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const displayWidth = Math.min(isMobile() && canvas.parentElement ? canvas.parentElement.clientWidth - 32 : 320, 360);
  const displayHeight = Math.round(displayWidth * 1.25);
  canvas.width = displayWidth;
  canvas.height = displayHeight;

  const gridSize = 16;
  const tileCount = canvas.width / gridSize;

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dx = 0;
  let dy = 0;
  let score = 0;

  const snakeScore = document.getElementById('snakeScore');
  if (snakeScore) snakeScore.textContent = '0';

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34c759';
    snake.forEach((seg, i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.7;
      ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ff453a';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
  }

  function update() {
    if (!dx && !dy) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      gameOver();
      return;
    }

    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      if (snakeScore) snakeScore.textContent = String(score);
      food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
      };
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    stopSnake();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillStyle = '#8e8e93';
    ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  function setDirection(dir) {
    if (dir === 'up' && dy !== 1) { dx = 0; dy = -1; }
    if (dir === 'down' && dy !== -1) { dx = 0; dy = 1; }
    if (dir === 'left' && dx !== 1) { dx = -1; dy = 0; }
    if (dir === 'right' && dx !== -1) { dx = 1; dy = 0; }
  }

  document.querySelectorAll('.game-btn').forEach(btn => {
    btn.onclick = () => setDirection(btn.dataset.dir);
  });

  document.onkeydown = e => {
    const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (keys[e.key]) {
      e.preventDefault();
      setDirection(keys[e.key]);
    }
  };

  stopSnake();
  snakeInterval = setInterval(() => { update(); draw(); }, 120);
  draw();
}

function stopSnake() {
  if (snakeInterval) {
    clearInterval(snakeInterval);
    snakeInterval = null;
  }
  document.onkeydown = null;
}

function startTapGame() {
  const gamesApp = document.getElementById('gamesApp');
  if (!gamesApp) return;

  let score = 0;
  let timeLeft = 10;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;background:#000;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="color:#fff;font-size:48px;font-weight:200;margin-bottom:8px" id="tapScore">0</div>
    <div style="color:#8e8e93;font-size:16px;margin-bottom:40px" id="tapTimer">10 сек</div>
    <button id="tapBtn" type="button" style="width:120px;height:120px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff6b8a,#cc2952);color:#fff;font-size:24px;cursor:pointer;font-family:inherit">ТАП!</button>
    <button id="tapClose" type="button" style="margin-top:30px;background:none;border:none;color:#007aff;font-size:17px;cursor:pointer;font-family:inherit">Закрыть</button>
  `;
  gamesApp.appendChild(overlay);

  const timer = setInterval(() => {
    timeLeft--;
    const tapTimer = document.getElementById('tapTimer');
    if (tapTimer) tapTimer.textContent = `${timeLeft} сек`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      const tapBtn = document.getElementById('tapBtn');
      if (tapBtn) {
        tapBtn.disabled = true;
        tapBtn.style.opacity = '0.3';
      }
      if (tapTimer) tapTimer.textContent = `Итого: ${score} тапов!`;
    }
  }, 1000);

  document.getElementById('tapBtn')?.addEventListener('click', () => {
    if (timeLeft > 0) {
      score++;
      const tapScore = document.getElementById('tapScore');
      if (tapScore) tapScore.textContent = String(score);
    }
  });

  document.getElementById('tapClose')?.addEventListener('click', () => {
    clearInterval(timer);
    overlay.remove();
  });
}

function simpleAppHeader(title) {
  return `
    <div class="app-header">
      <button class="back-btn" data-simple-back="home" type="button">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      <h1>${escHtml(title)}</h1>
    </div>
  `;
}

function bindSimpleBack(screen) {
  screen.querySelector('[data-simple-back]')?.addEventListener('click', () => showScreen('homeScreen'));
}

function renderNotesApp() {
  const screen = document.getElementById('notesApp');
  if (!screen) return;

  const notes = PhoneSession.notes || [];
  screen.innerHTML = `
    ${simpleAppHeader('Заметки')}
    <div class="simple-app-body">
      ${notes.length ? notes.map(note => `
        <div class="note-card">
          <h3>${escHtml(note.title)}</h3>
          <p>${escHtml(note.body).replace(/\n/g, '<br>')}</p>
        </div>
      `).join('') : '<p class="simple-empty">Нет заметок</p>'}
    </div>
  `;
  bindSimpleBack(screen);
}

function renderPhotosApp() {
  const screen = document.getElementById('photosApp');
  if (!screen) return;

  const photos = PhoneSession.photos || [];
  screen.innerHTML = `
    ${simpleAppHeader('Фото')}
    <div class="simple-app-body photos-grid">
      ${photos.length ? photos.map(photo => `
        <div class="photo-card">
          <div class="photo-placeholder">📷</div>
          <h3>${escHtml(photo.title)}</h3>
          <p>${escHtml(photo.caption)}</p>
        </div>
      `).join('') : '<p class="simple-empty">Нет фото</p>'}
    </div>
  `;
  bindSimpleBack(screen);
}

function renderCalendarApp() {
  const screen = document.getElementById('calendarApp');
  if (!screen) return;

  const events = PhoneSession.calendar || [];
  screen.innerHTML = `
    ${simpleAppHeader('Календарь')}
    <div class="simple-app-body">
      ${events.length ? events.map(ev => `
        <div class="calendar-event">
          <div class="calendar-date">${escHtml(ev.date)}</div>
          <div class="calendar-info">
            <h3>${escHtml(ev.title)}</h3>
            <p>${escHtml(ev.time)}</p>
          </div>
        </div>
      `).join('') : '<p class="simple-empty">Нет событий</p>'}
    </div>
  `;
  bindSimpleBack(screen);
}

function renderMapsApp() {
  if (window.MapsApp) {
    const notes = PhoneSession?.notes || [];
    const kapnos = notes.find(n => /строител|парковк/i.test(`${n.title} ${n.body}`));
    MapsApp.open({
      to: kapnos ? 'stroyitely' : null,
      query: kapnos ? 'строител' : '',
    });
    return;
  }
  const screen = document.getElementById('mapsApp');
  if (!screen) return;
  screen.innerHTML = `
    ${simpleAppHeader('Карты')}
    <div class="maps-view">
      <div class="maps-pin">📍</div>
      <p class="maps-label">Карта недоступна</p>
    </div>
  `;
  bindSimpleBack(screen);
}

function bindStaticHandlers() {
  document.addEventListener('click', e => {
    const back = e.target.closest('.back-btn[data-back]');
    if (!back) return;
    const target = back.dataset.back;
    if (target === 'home') showScreen('homeScreen');
    else if (target === 'messages') showScreen('messagesApp');
    else if (target === 'mail') {
      showScreen('mailApp');
      renderMailList();
    }
    else if (target === 'games') {
      stopSnake();
      showScreen('gamesApp');
    }
  });

  document.querySelectorAll('.calls-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.calls-tabs .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabContent = document.getElementById(`${tab.dataset.tab}Tab`);
      if (tabContent) tabContent.classList.add('active');
      if (tab.dataset.tab === 'keypad') initDialer();
    });
  });

  document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
  document.getElementById('messageInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  document.getElementById('callBtn')?.addEventListener('click', () => {
    if (dialNumber) startCall(null, dialNumber);
  });

  document.getElementById('endCall')?.addEventListener('click', endCall);

  document.querySelector('.chat-header .call-small')?.addEventListener('click', () => {
    if (currentChat) startCall(currentChat);
  });
}

function setupHomeIndicators() {
  let homeIndicatorTimer = null;
  let longPressed = false;
  const LONG_PRESS_MS = 600;

  function clearLongPress() {
    if (homeIndicatorTimer) {
      clearTimeout(homeIndicatorTimer);
      homeIndicatorTimer = null;
    }
  }

  document.querySelectorAll('.home-indicator').forEach(ind => {
    ind.addEventListener('click', () => {
      if (longPressed) {
        longPressed = false;
        return;
      }
      if (currentScreen !== 'homeScreen' && currentScreen !== 'lockScreen' && APP_SCREENS.includes(currentScreen)) {
        stopSnake();
        showScreen('homeScreen');
      }
    });

    ind.addEventListener('mousedown', () => {
      clearLongPress();
      homeIndicatorTimer = setTimeout(() => {
        longPressed = true;
        if (window.PhonePasscode) PhonePasscode.lockPhone();
      }, LONG_PRESS_MS);
    });

    ind.addEventListener('mouseup', clearLongPress);
    ind.addEventListener('mouseleave', clearLongPress);

    ind.addEventListener('touchstart', () => {
      clearLongPress();
      homeIndicatorTimer = setTimeout(() => {
        longPressed = true;
        if (window.PhonePasscode) PhonePasscode.lockPhone();
      }, LONG_PRESS_MS);
    }, { passive: true });

    ind.addEventListener('touchend', clearLongPress);
    ind.addEventListener('touchmove', clearLongPress);
  });
}

updateTime();
setInterval(updateTime, 10000);
setupMobile();
bindStaticHandlers();
setupHomeIndicators();

window.openApp = openApp;
window.showScreen = showScreen;
window.setCurrentScreen = setCurrentScreen;
window.stopSnake = stopSnake;
