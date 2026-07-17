/**
 * StoryState — два сюжетных состояния телефона «Дым над льдом».
 *   Состояние 1 — 21 февраля 2026 (глава 1, начальное).
 *   Состояние 2 — 23 марта 2026 (глава 2), включается после верных координат в навигаторе.
 * Управляет датой мира (экран блокировки, календарь) и активным набором Novogram.
 */
(function () {
  const KEY = 'dym_story_state_v1';

  const STATES = {
    1: {
      chapter: 1,
      // Месяцы в JS: 0 = январь, поэтому 1 = февраль, 2 = март.
      date: { year: 2026, month: 1, day: 21 },
    },
    2: {
      chapter: 2,
      date: { year: 2026, month: 2, day: 23 },
    },
  };

  const listeners = new Set();

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const n = raw ? Number(JSON.parse(raw).state) : 1;
      return n === 2 ? 2 : 1;
    } catch {
      return 1;
    }
  }

  function write(n) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ state: n === 2 ? 2 : 1 }));
    } catch {}
  }

  let current = read();

  function getState() {
    return current;
  }

  function getChapter() {
    return STATES[current].chapter;
  }

  function getDateParts() {
    return { ...STATES[current].date };
  }

  function getDateObj() {
    const d = STATES[current].date;
    return new Date(d.year, d.month, d.day);
  }

  function notify() {
    listeners.forEach(fn => {
      try {
        fn(current);
      } catch (e) {
        console.error(e);
      }
    });
    try {
      document.dispatchEvent(new CustomEvent('storystatechange', { detail: { state: current } }));
    } catch {}
  }

  function setState(n) {
    const next = n === 2 ? 2 : 1;
    current = next;
    write(next);
    notify();
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /** Полный сброс к началу игры: 1-е состояние + возврат к экрану пароля. */
  function reset() {
    setState(1);
    try {
      localStorage.removeItem('dym_novogram_session_v1');
      localStorage.removeItem('navigator_module_v1');
    } catch {}
    if (window.MapsApp?.resetProgress) {
      try { MapsApp.resetProgress(); } catch {}
    }
    if (window.PhonePasscode && typeof PhonePasscode.lockPhone === 'function') {
      PhonePasscode.lockPhone();
    }
  }

  window.StoryState = {
    KEY,
    getState,
    getChapter,
    getDateParts,
    getDateObj,
    setState,
    onChange,
    reset,
  };
})();
