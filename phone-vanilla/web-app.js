const PHONE_WEB_URLS = {
  mail: { url: 'https://novogradmail.lovable.app', title: 'Почта' },
  novagram: { url: 'https://novagram.ru', title: 'Novagram' },
};

function openWebApp(url, title) {
  const frame = document.getElementById('webAppFrame');
  const titleEl = document.getElementById('webAppTitle');
  if (!frame) return;

  if (titleEl) titleEl.textContent = title || 'Сайт';
  frame.src = url;

  if (typeof showScreen === 'function') showScreen('webApp');
}

function closeWebApp() {
  const frame = document.getElementById('webAppFrame');
  if (frame) frame.src = 'about:blank';
}

window.PHONE_WEB_URLS = PHONE_WEB_URLS;
window.openWebApp = openWebApp;
window.closeWebApp = closeWebApp;
