(function () {
  let adminMode = false;
  let adminView = 'list';
  let adminSelected = null;
  let adminForm = GibddDB.emptyCar();
  let adminFilter = '';
  let searchQuery = '';
  let searchResult = null;
  let searchLoading = false;
  let searchTimer = null;

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ru-RU');
  }

  function renderCarCard(car, options = {}) {
    const { editable = false } = options;
    return `
      <div class="gibdd-card gibdd-plate-card">
        <p class="gibdd-label">Государственный регистрационный знак</p>
        <p class="gibdd-plate">${esc(car.plateNumber)}</p>
      </div>
      <div class="gibdd-card">
        <div class="gibdd-section-title">Сведения о ТС</div>
        <div class="gibdd-rows">
          ${row('Марка/модель', car.brand)}
          ${row('Год выпуска', car.year)}
          ${row('Цвет', car.color)}
          ${row('Категория', car.category)}
          ${row('VIN', car.vin, true)}
          ${row('№ кузова', car.bodyNumber, true)}
          ${row('№ двигателя', car.engineNumber, true)}
          ${row('Объём (см³)', car.engineVolume)}
          ${row('Мощность', car.power)}
        </div>
      </div>
      <div class="gibdd-card">
        <div class="gibdd-section-title">Владелец</div>
        <div class="gibdd-rows">
          ${row('ФИО', car.ownerName)}
          ${row('Дата рождения', formatDate(car.ownerBirthDate))}
          ${row('Регистрация', car.ownerAddress)}
        </div>
      </div>
      <div class="gibdd-card">
        <div class="gibdd-section-title">Сведения о ДТП</div>
        <p class="gibdd-accidents">${esc(car.accidents || 'Нет')}</p>
      </div>
      ${editable ? `
        <div class="gibdd-actions">
          <button type="button" class="gibdd-btn gibdd-btn-primary" data-gibdd-action="edit">Редактировать</button>
          <button type="button" class="gibdd-btn gibdd-btn-danger" data-gibdd-action="delete">Удалить</button>
        </div>
      ` : ''}
    `;
  }

  function row(label, value, mono = false) {
    return `
      <div class="gibdd-row">
        <span class="gibdd-row-label">${esc(label)}</span>
        <span class="gibdd-row-value${mono ? ' gibdd-mono' : ''}">${esc(value || '—')}</span>
      </div>
    `;
  }

  function renderSearchApp() {
    const screen = document.getElementById('gibddApp');
    if (!screen) return;

    let body = `
      <div class="gibdd-empty">
        <div class="gibdd-empty-icon">🚗</div>
        <p>Введите госномер</p>
        <small>Формат: А123БВ777</small>
      </div>
    `;

    if (searchLoading) {
      body = `<p class="gibdd-status">Поиск в базе...</p>`;
    } else if (searchResult === 'not-found') {
      body = `
        <div class="gibdd-empty">
          <div class="gibdd-empty-icon">—</div>
          <p>Не найдено</p>
          <small>Проверьте номер и попробуйте снова</small>
        </div>
      `;
    } else if (searchResult) {
      body = renderCarCard(searchResult);
    }

    screen.innerHTML = `
      <div class="gibdd-header">
        <button type="button" class="gibdd-back" data-back="home" aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <h1>ГИБДД</h1>
        <span class="gibdd-header-spacer"></span>
      </div>
      <div class="gibdd-search-minimal">
        <p class="gibdd-search-label">Проверка автомобиля</p>
        <div class="gibdd-plate-field">
          <div class="gibdd-plate-flag">RUS</div>
          <input
            id="gibddSearchInput"
            class="gibdd-plate-input"
            type="text"
            placeholder="А 123 БВ 777"
            value="${esc(searchQuery)}"
            autocomplete="off"
            maxlength="12"
          />
        </div>
        <button type="button" class="gibdd-search-btn" id="gibddSearchBtn" ${searchLoading ? 'disabled' : ''}>
          ${searchLoading ? 'Поиск...' : 'Проверить'}
        </button>
      </div>
      <div class="gibdd-body" id="gibddSearchBody">${body}</div>
      <div class="home-indicator"></div>
    `;

    const input = document.getElementById('gibddSearchInput');
    input?.addEventListener('input', (event) => {
      searchQuery = event.target.value.toUpperCase();
      event.target.value = searchQuery;
      clearTimeout(searchTimer);
      if (searchQuery.trim().length >= 6) {
        searchTimer = setTimeout(runSearch, 600);
      } else if (!searchQuery.trim()) {
        searchResult = null;
        renderSearchApp();
      }
    });
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') runSearch();
    });
    input?.focus();

    document.getElementById('gibddSearchBtn')?.addEventListener('click', runSearch);

    screen.querySelector('[data-back="home"]')?.addEventListener('click', () => {
      searchQuery = '';
      searchResult = null;
      if (typeof showScreen === 'function') showScreen('homeScreen');
    });
  }

  function runSearch() {
    const query = searchQuery.trim();
    if (!query) {
      searchResult = null;
      searchLoading = false;
      renderSearchApp();
      return;
    }
    searchLoading = true;
    renderSearchApp();
    setTimeout(() => {
      const car = GibddDB.searchCarByPlate(query);
      searchResult = car || 'not-found';
      searchLoading = false;
      renderSearchApp();
    }, 350);
  }

  function renderAdminApp() {
    const screen = document.getElementById('gibddAdminApp');
    if (!screen) return;

    const cars = GibddDB.loadCars();
    const filtered = cars.filter(car => {
      const q = adminFilter.toLowerCase();
      return (
        car.plateNumber.toLowerCase().includes(q) ||
        car.brand.toLowerCase().includes(q) ||
        car.ownerName.toLowerCase().includes(q)
      );
    });

    let title = 'База ГИБДД — Админ';
    let content = '';

    if (adminView === 'list') {
      content = `
        <div class="gibdd-admin-toolbar">
          <div class="gibdd-search gibdd-search-light">
            <svg viewBox="0 0 24 24" fill="#8e8e93"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"/></svg>
            <input id="gibddAdminFilter" type="text" placeholder="Поиск по номеру, марке, владельцу" value="${esc(adminFilter)}" />
          </div>
          <p class="gibdd-count">Всего записей: ${cars.length}</p>
          <div class="gibdd-list">
            ${filtered.length ? filtered.map(car => `
              <button type="button" class="gibdd-list-item" data-car-id="${esc(car.id)}">
                <div>
                  <p class="gibdd-list-plate">${esc(car.plateNumber)}</p>
                  <p class="gibdd-list-meta">${esc(car.brand)} • ${esc(car.ownerName)}</p>
                </div>
                <span>›</span>
              </button>
            `).join('') : '<p class="gibdd-empty-text">Нет записей</p>'}
          </div>
        </div>
      `;
    } else if (adminView === 'detail' && adminSelected) {
      title = 'Карточка ТС';
      content = `<div class="gibdd-body">${renderCarCard(adminSelected, { editable: true })}</div>`;
    } else if (adminView === 'form') {
      title = adminSelected ? 'Редактирование' : 'Новая запись';
      content = `
        <form class="gibdd-form" id="gibddForm">
          <p class="gibdd-form-section">Транспортное средство</p>
          ${field('brand', 'Марка / Модель', adminForm.brand)}
          ${field('plateNumber', 'Гос. номер', adminForm.plateNumber)}
          ${field('year', 'Год выпуска', adminForm.year, 'number')}
          ${field('color', 'Цвет', adminForm.color)}
          <label class="gibdd-field">
            <span>Категория</span>
            <select name="category">
              ${['A', 'B', 'C', 'D'].map(cat => `<option value="${cat}" ${adminForm.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </label>
          ${field('vin', 'VIN номер', adminForm.vin)}
          ${field('bodyNumber', 'Номер кузова', adminForm.bodyNumber)}
          ${field('engineNumber', 'Номер двигателя', adminForm.engineNumber)}
          ${field('engineVolume', 'Объём двигателя (см³)', adminForm.engineVolume, 'number')}
          ${field('power', 'Мощность (кВт/л.с.)', adminForm.power)}
          ${field('accidents', 'Сведения о ДТП', adminForm.accidents, 'textarea')}
          <p class="gibdd-form-section">Владелец</p>
          ${field('ownerName', 'ФИО', adminForm.ownerName)}
          ${field('ownerBirthDate', 'Дата рождения', adminForm.ownerBirthDate, 'date')}
          ${field('ownerAddress', 'Место регистрации', adminForm.ownerAddress, 'textarea')}
          <button type="submit" class="gibdd-btn gibdd-btn-primary gibdd-btn-wide">Сохранить</button>
        </form>
      `;
    }

    screen.innerHTML = `
      <div class="gibdd-header">
        <button type="button" class="gibdd-back" data-gibdd-nav="back" aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <h1>${esc(title)}</h1>
        ${adminView === 'list'
          ? '<button type="button" class="gibdd-add" data-gibdd-nav="new" aria-label="Добавить">+</button>'
          : '<span class="gibdd-header-spacer"></span>'}
      </div>
      <div class="gibdd-admin-content">${content}</div>
      <div class="home-indicator"></div>
    `;

    screen.querySelector('[data-gibdd-nav="back"]')?.addEventListener('click', () => {
      if (adminView === 'list') {
        if (typeof showScreen === 'function') showScreen('homeScreen');
      } else {
        adminView = 'list';
        adminSelected = null;
        renderAdminApp();
      }
    });

    screen.querySelector('[data-gibdd-nav="new"]')?.addEventListener('click', () => {
      adminSelected = null;
      adminForm = GibddDB.emptyCar();
      adminView = 'form';
      renderAdminApp();
    });

    screen.querySelector('#gibddAdminFilter')?.addEventListener('input', (event) => {
      adminFilter = event.target.value;
      renderAdminApp();
    });

    screen.querySelectorAll('[data-car-id]').forEach(button => {
      button.addEventListener('click', () => {
        const car = GibddDB.loadCars().find(item => item.id === button.dataset.carId);
        if (!car) return;
        adminSelected = car;
        adminView = 'detail';
        renderAdminApp();
      });
    });

    screen.querySelector('[data-gibdd-action="edit"]')?.addEventListener('click', () => {
      adminForm = { ...adminSelected };
      adminView = 'form';
      renderAdminApp();
    });

    screen.querySelector('[data-gibdd-action="delete"]')?.addEventListener('click', () => {
      if (!adminSelected) return;
      if (confirm('Удалить запись?')) {
        GibddDB.deleteCar(adminSelected.id);
        adminSelected = null;
        adminView = 'list';
        renderAdminApp();
      }
    });

    screen.querySelector('#gibddForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const payload = {
        brand: String(data.get('brand') || '').trim(),
        plateNumber: String(data.get('plateNumber') || '').trim(),
        year: Number(data.get('year') || 0),
        color: String(data.get('color') || '').trim(),
        category: String(data.get('category') || 'B'),
        vin: String(data.get('vin') || '').trim(),
        bodyNumber: String(data.get('bodyNumber') || '').trim(),
        engineNumber: String(data.get('engineNumber') || '').trim(),
        engineVolume: Number(data.get('engineVolume') || 0),
        power: String(data.get('power') || '').trim(),
        accidents: String(data.get('accidents') || '').trim(),
        ownerName: String(data.get('ownerName') || '').trim(),
        ownerBirthDate: String(data.get('ownerBirthDate') || ''),
        ownerAddress: String(data.get('ownerAddress') || '').trim(),
      };

      if (!payload.brand || !payload.plateNumber || !payload.ownerName) {
        alert('Заполните марку, гос. номер и ФИО владельца');
        return;
      }

      if (adminSelected) {
        GibddDB.updateCar({ ...adminSelected, ...payload });
      } else {
        GibddDB.addCar(payload);
      }

      adminView = 'list';
      adminSelected = null;
      adminForm = GibddDB.emptyCar();
      renderAdminApp();
    });
  }

  function field(name, label, value, type = 'text') {
    if (type === 'textarea') {
      return `
        <label class="gibdd-field">
          <span>${esc(label)}</span>
          <textarea name="${name}">${esc(value)}</textarea>
        </label>
      `;
    }
    return `
      <label class="gibdd-field">
        <span>${esc(label)}</span>
        <input type="${type}" name="${name}" value="${esc(value)}" />
      </label>
    `;
  }

  function openGibddSearch() {
    searchQuery = '';
    searchResult = null;
    searchLoading = false;
    if (typeof showScreen === 'function') showScreen('gibddApp');
    renderSearchApp();
  }

  function openGibddAdmin() {
    adminView = 'list';
    adminSelected = null;
    adminForm = GibddDB.emptyCar();
    adminFilter = '';
    if (typeof showScreen === 'function') showScreen('gibddAdminApp');
    renderAdminApp();
  }

  function setAdminMode(enabled) {
    adminMode = enabled;
    document.querySelectorAll('.admin-only').forEach(node => {
      node.style.display = enabled ? '' : 'none';
    });
  }

  window.GibddApp = {
    openGibddSearch,
    openGibddAdmin,
    setAdminMode,
    isAdminMode: () => adminMode,
  };
})();
