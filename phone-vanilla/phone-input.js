(function () {
  let code = '';
  let checking = false;

  function lockEl() {
    return document.getElementById('lockScreen');
  }

  function dots() {
    return document.querySelectorAll('#passcodeDots .dot');
  }

  function lockActive() {
    const lock = lockEl();
    return lock && lock.classList.contains('active');
  }

  function updateDots() {
    dots().forEach((dot, i) => {
      dot.classList.toggle('filled', i < code.length);
    });
  }

  function clearError() {
    const err = document.getElementById('passcodeError');
    const wrap = document.getElementById('passcodeDots');
    if (err) err.classList.remove('show');
    if (wrap) wrap.classList.remove('success');
  }

  function showError(msg) {
    const wrap = document.getElementById('passcodeDots');
    const err = document.getElementById('passcodeError');
    if (wrap) wrap.classList.add('shake');
    if (err) {
      err.textContent = msg;
      err.classList.add('show');
    }
    setTimeout(() => {
      if (wrap) wrap.classList.remove('shake');
      code = '';
      updateDots();
      checking = false;
    }, 600);
  }

  function unlock() {
    const lockScreen = lockEl();
    const homeScreen = document.getElementById('homeScreen');
    if (!lockScreen || !homeScreen) return;

    const wrap = document.getElementById('passcodeDots');
    if (wrap) wrap.classList.add('success');

    lockScreen.classList.add('unlocking');
    if (window.GibddApp && window.PhoneSession) {
      GibddApp.setAdminMode(PhoneSession.isAdmin());
    }
    try {
      if (window.PhoneSession) PhoneSession.renderHome();
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      lockScreen.classList.remove('active', 'unlocking', 'locking-in');
      homeScreen.classList.add('active', 'unlocking-in');
      code = '';
      updateDots();
      clearError();
      if (typeof window.setCurrentScreen === 'function') {
        window.setCurrentScreen('homeScreen');
      } else if (typeof window.showScreen === 'function') {
        window.showScreen('homeScreen');
      }
      window.currentPhoneScreen = 'homeScreen';
      setTimeout(() => homeScreen.classList.remove('unlocking-in'), 520);
      checking = false;
    }, 380);
  }

  function lockPhone() {
    const lockScreen = lockEl();
    if (!lockScreen) return;

    if (typeof window.stopSnake === 'function') window.stopSnake();

    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active', 'slide-in', 'unlocking', 'unlocking-in');
    });
    document.getElementById('callOverlay')?.classList.remove('active');

    lockScreen.classList.add('active', 'locking-in');
    lockScreen.classList.remove('unlocking');
    code = '';
    checking = false;
    updateDots();
    clearError();

    setTimeout(() => lockScreen.classList.remove('locking-in'), 460);

    if (typeof window.setCurrentScreen === 'function') {
      window.setCurrentScreen('lockScreen');
    }
    window.currentPhoneScreen = 'lockScreen';
  }

  function verify(attempt) {
    if (checking) return;
    checking = true;

    if (!window.PhoneAccounts || !window.PhoneSession) {
      if (attempt < 40) {
        checking = false;
        setTimeout(() => verify(attempt + 1), 50);
        return;
      }
      showError('Ошибка загрузки');
      return;
    }

    const match = PhoneAccounts.findAccountByPasscode(code);
    if (!match) {
      showError('Неверный код');
      return;
    }

    try {
      PhoneSession.activate(match.account, match.admin);
      unlock();
    } catch (e) {
      console.error(e);
      showError('Ошибка входа');
    }
  }

  function digit(d) {
    if (!lockActive() || code.length >= 6) return;
    code += String(d);
    updateDots();
    clearError();
    if (code.length === 6) {
      setTimeout(() => verify(0), 120);
    }
  }

  function del() {
    if (!lockActive() || !code.length) return;
    code = code.slice(0, -1);
    updateDots();
    clearError();
  }

  function getNumpadButton(target) {
    if (!(target instanceof Element)) return null;
    const btn = target.closest('.num-key');
    const numpad = document.getElementById('numpad');
    if (!btn || !numpad || !numpad.contains(btn)) return null;
    return btn;
  }

  function handleNumpadButton(btn) {
    if (!btn || btn.classList.contains('empty')) return;
    if (btn.id === 'deleteKey' || btn.classList.contains('delete')) {
      del();
      return;
    }
    const num = btn.dataset.num;
    if (num !== undefined && num !== '') digit(num);
  }

  function initNumpad() {
    const numpad = document.getElementById('numpad');
    if (!numpad || numpad.dataset.bound === '1') return;
    numpad.dataset.bound = '1';

    numpad.addEventListener('click', e => {
      if (!lockActive()) return;
      const btn = getNumpadButton(e.target);
      if (!btn) return;
      e.preventDefault();
      handleNumpadButton(btn);
    });
  }

  function onKeydown(e) {
    if (!lockActive()) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      digit(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      del();
    }
  }

  document.addEventListener('keydown', onKeydown);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNumpad);
  } else {
    initNumpad();
  }

  window.PhoneInput = {
    digit,
    del,
    reset: () => { code = ''; checking = false; updateDots(); clearError(); },
    lockPhone,
    initNumpad,
  };
  window.PhonePasscode = {
    reset: () => { code = ''; checking = false; updateDots(); },
    unlockPhone: unlock,
    lockPhone,
  };
})();
