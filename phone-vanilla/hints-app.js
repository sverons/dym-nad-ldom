(function () {
  const STORAGE_KEY = 'dym_hints_state_v1';

  let mode = 'hint';
  let chapter = 1;
  let messages = [];
  let typingTimer = null;

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.chapter) chapter = parsed.chapter;
      if (parsed.mode) mode = parsed.mode;
      if (Array.isArray(parsed.messages)) messages = parsed.messages;
    } catch {}
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chapter, mode, messages }));
  }

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/ё/g, 'е').trim();
  }

  function scoreTopic(topic, text) {
    if (!topic.chapters.includes(chapter)) return 0;
    let score = 0;
    for (const kw of topic.keywords) {
      const re = new RegExp(kw, 'i');
      if (re.test(text)) score += kw.length;
    }
    return score;
  }

  function checkSpoiler(text) {
    for (const rule of HintsData.SPOILER_PATTERNS) {
      if (chapter <= rule.chapter && rule.re.test(text)) return rule.reply;
    }
    return null;
  }

  function getPhoneContext() {
    const ctx = [];
    const notes = (PhoneSession?.notes || []).map(n => `${n.title} ${n.body}`).join(' ');
    const emails = (PhoneSession?.emails || []).map(e => `${e.subject} ${e.body}`).join(' ');
    if (/вероник|е907|granta/i.test(notes)) {
      ctx.push('veronika-note');
    }
    if (/жанн|к558|logan/i.test(notes)) {
      ctx.push('zhanna-note');
    }
    if (/kapnos|капнос|строител|лесная/i.test(notes)) {
      ctx.push('kapnos-note');
    }
    if (/passat|а316|santa|м042/i.test(notes)) {
      ctx.push('cars-note');
    }
    if (/kapnos|mia|морозов/i.test(emails)) {
      ctx.push('ch2-email');
    }
    return ctx;
  }

  function enrichResponse(base, topicId, context) {
    const extras = [];

    if (topicId === 'veronika' && context.includes('veronika-note') && chapter === 1) {
      extras.push('В заметках есть Granta Прониной — проверьте номер Е907ВА 152 в ГИБДД.');
    }
    if (topicId === 'jeanne' && context.includes('zhanna-note') && chapter === 1) {
      extras.push('Logan Жанны (К558ЕН 152) и алиби через такси — сверьте с показаниями Назарова.');
    }
    if (topicId === 'next' && context.includes('veronika-note') && chapter === 1) {
      extras.push('Вы уже близко к линии Вероники — сверьте заметки с базой авто.');
    }
    if (chapter === 2 && context.includes('kapnos-note')) {
      extras.push('Заметка про парковку на Строителей может связать быт и серию.');
    }
    if (chapter === 1 && context.includes('ch2-email')) {
      extras.push('Некоторые материалы откроются во второй главе — не торопите выводы.');
    }

    return extras.length ? `${base}\n\n${extras.join(' ')}` : base;
  }

  function findTopic(text) {
    let best = null;
    let bestScore = 0;
    for (const topic of HintsData.TOPICS) {
      const s = scoreTopic(topic, text);
      if (s > bestScore) {
        bestScore = s;
        best = topic;
      }
    }
    return bestScore > 0 ? best : null;
  }

  function composeReply(question) {
    const text = normalize(question);
    if (!text) {
      return 'Напишите вопрос — я подскажу направление расследования.';
    }

    const spoiler = checkSpoiler(text);
    if (spoiler) return spoiler;

    const topic = findTopic(text);
    if (topic) {
      const chapterResponses = topic.responses[chapter] || topic.responses[1] || topic.responses[2];
      if (chapterResponses) {
        const base = chapterResponses[mode] || chapterResponses.hint || chapterResponses.direction;
        return enrichResponse(base, topic.id, getPhoneContext());
      }
    }

    const fallbacks = HintsData.FALLBACKS[chapter] || HintsData.FALLBACKS[1];
    return fallbacks[mode] || fallbacks.hint;
  }

  function nowTime() {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function ensureWelcome() {
    if (messages.length) return;
    messages.push({
      role: 'bot',
      text: HintsData.WELCOME[chapter] || HintsData.WELCOME[1],
      time: nowTime(),
    });
    saveState();
  }

  function renderMessages() {
    const container = document.getElementById('hintsMessages');
    if (!container) return;

    container.innerHTML = messages.map(msg => {
      if (msg.role === 'system') {
        return `<div class="hints-system">${esc(msg.text)}</div>`;
      }
      const cls = msg.role === 'user' ? 'sent' : 'received hints-bot-bubble';
      return `
        <div class="message-bubble ${cls}">${esc(msg.text).replace(/\n/g, '<br>')}</div>
      `;
    }).join('');

    const typing = document.getElementById('hintsTyping');
    if (typing) typing.style.display = typingTimer ? 'flex' : 'none';

    container.scrollTop = container.scrollHeight;
  }

  function renderModeBar() {
    const bar = document.getElementById('hintsModeBar');
    if (!bar) return;

    bar.innerHTML = Object.entries(HintsData.MODES).map(([id, meta]) => `
      <button type="button" class="hints-mode-btn${mode === id ? ' active' : ''}" data-mode="${id}" title="${esc(meta.desc)}">
        ${esc(meta.label)}
      </button>
    `).join('');

    bar.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        saveState();
        renderModeBar();
      });
    });
  }

  function renderChapterBar() {
    const bar = document.getElementById('hintsChapterBar');
    if (!bar) return;

    bar.innerHTML = [1, 2].map(ch => `
      <button type="button" class="hints-chapter-btn${chapter === ch ? ' active' : ''}" data-chapter="${ch}">
        Глава ${ch}
      </button>
    `).join('');

    bar.querySelectorAll('[data-chapter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = parseInt(btn.dataset.chapter, 10);
        if (next === chapter) return;
        chapter = next;
        messages.push({
          role: 'system',
          text: `Переключено на главу ${chapter}. Подсказки учитывают доступные вам знания.`,
          time: nowTime(),
        });
        saveState();
        renderChapterBar();
        renderMessages();
      });
    });
  }

  function renderQuickChips() {
    const row = document.getElementById('hintsQuickRow');
    if (!row) return;

    row.innerHTML = HintsData.QUICK_QUESTIONS.map(q => `
      <button type="button" class="hints-chip" data-question="${esc(q)}">${esc(q)}</button>
    `).join('');

    row.querySelectorAll('[data-question]').forEach(chip => {
      chip.addEventListener('click', () => ask(chip.dataset.question));
    });
  }

  function ask(text) {
    const question = String(text || '').trim();
    if (!question || typingTimer) return;

    messages.push({ role: 'user', text: question, time: nowTime() });
    saveState();
    renderMessages();

    const input = document.getElementById('hintsInput');
    if (input) input.value = '';

    const delay = 500 + Math.min(question.length * 20, 1200);
    typingTimer = true;
    renderMessages();

    setTimeout(() => {
      const reply = composeReply(question);
      messages.push({ role: 'bot', text: reply, time: nowTime() });
      typingTimer = null;
      saveState();
      renderMessages();
    }, delay);
  }

  function clearChat() {
    messages = [];
    ensureWelcome();
    saveState();
    renderMessages();
  }

  function open() {
    loadState();
    const screen = document.getElementById('hintsApp');
    if (!screen) return;

    screen.innerHTML = `
      <div class="app-header hints-header">
        <button type="button" class="back-btn" data-hints-back="home" aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="hints-title-block">
          <h1>Подсказки</h1>
          <span class="hints-subtitle">Помощник по расследованию</span>
        </div>
        <button type="button" class="hints-clear-btn" id="hintsClearBtn" title="Очистить чат">↺</button>
      </div>
      <div class="hints-toolbar">
        <div class="hints-chapter-bar" id="hintsChapterBar"></div>
        <div class="hints-mode-bar" id="hintsModeBar"></div>
      </div>
      <div class="hints-messages" id="hintsMessages"></div>
      <div class="hints-typing" id="hintsTyping">
        <span class="hints-typing-dot"></span>
        <span class="hints-typing-dot"></span>
        <span class="hints-typing-dot"></span>
      </div>
      <div class="hints-quick-row" id="hintsQuickRow"></div>
      <div class="message-input-bar hints-input-bar">
        <input type="text" id="hintsInput" placeholder="Спросите о деле…" autocomplete="off" />
        <button type="button" class="send-btn" id="hintsSendBtn" aria-label="Отправить">
          <svg viewBox="0 0 24 24" fill="#ffcc00"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="home-indicator"></div>
    `;

    screen.querySelector('[data-hints-back]')?.addEventListener('click', () => showScreen('homeScreen'));
    screen.querySelector('#hintsSendBtn')?.addEventListener('click', () => {
      const input = screen.querySelector('#hintsInput');
      ask(input?.value);
    });
    screen.querySelector('#hintsInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') ask(e.target.value);
    });
    screen.querySelector('#hintsClearBtn')?.addEventListener('click', clearChat);

    renderChapterBar();
    renderModeBar();
    renderQuickChips();
    ensureWelcome();
    renderMessages();

    showScreen('hintsApp');
  }

  window.HintsApp = { open, ask, composeReply };
})();
