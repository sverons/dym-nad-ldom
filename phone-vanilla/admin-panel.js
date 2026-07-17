(function () {
  const SECTIONS = [
    { id: 'contacts', title: 'Контакты', count: d => d.contacts?.length || 0 },
    { id: 'messages', title: 'Сообщения', count: d => d.chats?.length || 0 },
    { id: 'emails', title: 'Почта', count: d => d.emails?.length || 0 },
    { id: 'notes', title: 'Заметки', count: d => d.notes?.length || 0 },
    { id: 'calendar', title: 'Календарь', count: d => d.calendar?.length || 0 },
    { id: 'photos', title: 'Фото', count: d => d.photos?.length || 0 },
    { id: 'novogram-users', title: 'Novagram · профили', count: () => AdminStore.getNovogramData().users.length },
    { id: 'novogram-posts', title: 'Novagram · посты', count: () => AdminStore.getNovogramData().posts.length },
    { id: 'browser', title: 'Сайты браузера', count: () => AdminStore.loadBrowserSites().length },
    { id: 'gibdd', title: 'ГИБДД', count: () => AdminStore.loadGibddCars(state.accountId).length },
    { id: 'accounts', title: 'Учётки телефона', count: () => PhoneAccounts.loadCustomAccounts().length },
    { id: 'system', title: 'Система', count: () => 0 },
  ];

  const state = {
    accountId: 'main',
    section: 'contacts',
    mode: 'list',
    editingId: null,
    editingChatId: null,
    form: {},
  };

  const $ = (sel) => document.querySelector(sel);

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function phoneData() {
    return AdminStore.loadPhoneData(state.accountId);
  }

  function savePhone(patchFn) {
    const data = phoneData();
    patchFn(data);
    AdminStore.savePhoneData(state.accountId, data);
    toast('Сохранено');
    render();
    refreshPreview();
  }

  function refreshPreview() {
    const frame = $('#phonePreview');
    if (!frame) return;
    frame.src = frame.src.split('?')[0] + '?t=' + Date.now();
    $('#previewStatus').textContent = 'обновлено';
  }

  function setSection(id) {
    state.section = id;
    state.mode = 'list';
    state.editingId = null;
    state.editingChatId = null;
    state.form = {};
    render();
  }

  function openForm(form, id = null) {
    state.mode = 'form';
    state.editingId = id;
    state.form = { ...form };
    render();
  }

  function renderSidebar() {
    const data = phoneData();
    $('#sidebar').innerHTML = SECTIONS.map(section => `
      <button type="button" class="admin-nav-btn ${state.section === section.id ? 'active' : ''}" data-section="${section.id}">
        <span>${section.title}</span>
        <span>${section.count(data)}</span>
      </button>
    `).join('');
    $('#sidebar').querySelectorAll('[data-section]').forEach(btn => {
      btn.addEventListener('click', () => setSection(btn.dataset.section));
    });
  }

  function renderToolbar(title, actionsHtml = '') {
    $('#toolbar').innerHTML = `
      <h2>${esc(title)}</h2>
      <div class="admin-row-actions">${actionsHtml}</div>
    `;
  }

  function renderList(rowsHtml) {
    $('#content').innerHTML = `<div class="admin-card"><div class="admin-card-body admin-list">${rowsHtml || '<div class="admin-empty">Пусто</div>'}</div></div>`;
  }

  function renderForm(title, fieldsHtml, saveAction) {
    $('#content').innerHTML = `
      <div class="admin-card">
        <div class="admin-card-head"><strong>${esc(title)}</strong></div>
        <div class="admin-card-body admin-form-grid">${fieldsHtml}</div>
        <div class="admin-card-body admin-row-actions">
          <button type="button" class="admin-btn admin-btn-primary" data-save="${saveAction}">Сохранить</button>
          <button type="button" class="admin-btn" data-cancel-form>Отмена</button>
        </div>
      </div>
    `;
    $('#content').querySelector('[data-cancel-form]')?.addEventListener('click', () => {
      state.mode = 'list';
      state.editingId = null;
      state.form = {};
      render();
    });
    $('#content').querySelector(`[data-save="${saveAction}"]`)?.addEventListener('click', () => handlers[saveAction]?.());
  }

  function field(id, label, value = '', type = 'text', extra = '') {
    if (type === 'textarea') {
      return `<div class="admin-field"><label for="${id}">${esc(label)}</label><textarea id="${id}">${esc(value)}</textarea></div>`;
    }
    if (type === 'select') {
      return `<div class="admin-field"><label for="${id}">${esc(label)}</label><select id="${id}">${extra}</select></div>`;
    }
    if (type === 'checkbox') {
      return `<label class="admin-check"><input type="checkbox" id="${id}" ${value ? 'checked' : ''} /> ${esc(label)}</label>`;
    }
    return `<div class="admin-field"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" value="${esc(value)}" ${extra} /></div>`;
  }

  function rowActions(editAction, deleteAction) {
    return `
      <div class="admin-row-actions">
        <button type="button" class="admin-btn admin-btn-small" data-edit="${editAction}">Изменить</button>
        <button type="button" class="admin-btn admin-btn-small admin-btn-danger" data-delete="${deleteAction}">Удалить</button>
      </div>
    `;
  }

  function bindRowActions() {
    $('#content').querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => handlers[btn.dataset.edit]?.(btn.dataset.id));
    });
    $('#content').querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => handlers[btn.dataset.delete]?.(btn.dataset.id));
    });
  }

  function read(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value;
  }

  const handlers = {
    'contacts:new': () => openForm({ name: '', phone: '' }),
    'contacts:edit': (id) => {
      const item = phoneData().contacts.find(c => String(c.id) === String(id));
      if (!item) return;
      openForm({ name: item.name, phone: item.phone }, item.id);
    },
    'contacts:delete': (id) => {
      if (!confirm('Удалить контакт?')) return;
      savePhone(data => {
        data.contacts = data.contacts.filter(c => String(c.id) !== String(id));
        data.chats = data.chats.filter(c => String(c.contactId) !== String(id));
      });
    },
    'contacts:save': () => {
      const name = read('f_name').trim();
      const phone = read('f_phone').trim();
      if (!name || !phone) return alert('Заполните имя и телефон');
      savePhone(data => {
        if (state.editingId != null) {
          const item = data.contacts.find(c => String(c.id) === String(state.editingId));
          if (item) {
            item.name = name;
            item.phone = phone;
            item.avatar = name[0].toUpperCase();
          }
        } else {
          const nextId = AdminStore.nextId(data.contacts, 'c');
          data.contacts.push({ id: nextId, name, phone, avatar: name[0].toUpperCase(), color: 'avatar-1' });
        }
      });
      state.mode = 'list';
      state.editingId = null;
    },

    'emails:new': () => openForm({ from: '', email: '', subject: '', preview: '', body: '', time: 'сейчас', unread: true }),
    'emails:edit': (id) => {
      const item = phoneData().emails.find(e => String(e.id) === String(id));
      if (!item) return;
      openForm({ ...item }, item.id);
    },
    'emails:delete': (id) => {
      if (!confirm('Удалить письмо?')) return;
      savePhone(data => { data.emails = data.emails.filter(e => String(e.id) !== String(id)); });
    },
    'emails:save': () => {
      const payload = {
        from: read('f_from').trim(),
        email: read('f_email').trim(),
        subject: read('f_subject').trim(),
        preview: read('f_preview').trim(),
        body: read('f_body').trim(),
        time: read('f_time').trim() || 'сейчас',
        unread: read('f_unread'),
      };
      if (!payload.from || !payload.subject) return alert('Заполните отправителя и тему');
      savePhone(data => {
        if (state.editingId != null) {
          const item = data.emails.find(e => String(e.id) === String(state.editingId));
          if (item) Object.assign(item, payload, { preview: payload.preview || payload.subject });
        } else {
          const nextId = AdminStore.nextId(data.emails, 'mail');
          data.emails.unshift({ id: nextId, color: 'avatar-1', ...payload, preview: payload.preview || payload.subject });
        }
      });
      state.mode = 'list';
      state.editingId = null;
    },

    'notes:new': () => openForm({ title: '', body: '' }),
    'notes:edit': (id) => {
      const item = phoneData().notes.find(n => String(n.id) === String(id));
      if (!item) return;
      openForm({ title: item.title, body: item.body }, item.id);
    },
    'notes:delete': (id) => {
      if (!confirm('Удалить заметку?')) return;
      savePhone(data => { data.notes = data.notes.filter(n => String(n.id) !== String(id)); });
    },
    'notes:save': () => {
      const title = read('f_title').trim();
      const body = read('f_body').trim();
      if (!title) return alert('Укажите заголовок');
      savePhone(data => {
        if (!data.notes) data.notes = [];
        if (state.editingId != null) {
          const item = data.notes.find(n => String(n.id) === String(state.editingId));
          if (item) Object.assign(item, { title, body });
        } else {
          data.notes.unshift({ id: AdminStore.nextId(data.notes, 'note'), title, body });
        }
      });
      state.mode = 'list';
      state.editingId = null;
    },

    'calendar:new': () => openForm({ date: '2026-02-21', title: '', time: '10:00' }),
    'calendar:edit': (id) => {
      const item = phoneData().calendar.find(c => String(c.id) === String(id));
      if (!item) return;
      openForm({ date: item.date, title: item.title, time: item.time }, item.id);
    },
    'calendar:delete': (id) => {
      if (!confirm('Удалить событие?')) return;
      savePhone(data => { data.calendar = data.calendar.filter(c => String(c.id) !== String(id)); });
    },
    'calendar:save': () => {
      const payload = { date: read('f_date').trim(), title: read('f_title').trim(), time: read('f_time').trim() };
      if (!payload.title || !payload.date) return alert('Заполните дату и название');
      savePhone(data => {
        if (!data.calendar) data.calendar = [];
        if (state.editingId != null) {
          const item = data.calendar.find(c => String(c.id) === String(state.editingId));
          if (item) Object.assign(item, payload);
        } else {
          data.calendar.push({ id: AdminStore.nextId(data.calendar, 'cal'), ...payload });
        }
      });
      state.mode = 'list';
      state.editingId = null;
    },

    'photos:new': () => openForm({ title: '', caption: '' }),
    'photos:edit': (id) => {
      const item = (phoneData().photos || []).find(p => String(p.id) === String(id));
      if (!item) return;
      openForm({ title: item.title, caption: item.caption }, item.id);
    },
    'photos:delete': (id) => {
      if (!confirm('Удалить фото?')) return;
      savePhone(data => { data.photos = (data.photos || []).filter(p => String(p.id) !== String(id)); });
    },
    'photos:save': () => {
      const title = read('f_title').trim();
      const caption = read('f_caption').trim();
      if (!title) return alert('Укажите название');
      savePhone(data => {
        if (!data.photos) data.photos = [];
        if (state.editingId != null) {
          const item = data.photos.find(p => String(p.id) === String(state.editingId));
          if (item) Object.assign(item, { title, caption });
        } else {
          data.photos.unshift({ id: AdminStore.nextId(data.photos, 'photo'), title, caption });
        }
      });
      state.mode = 'list';
      state.editingId = null;
    },

    'messages:open': (contactId) => {
      state.editingChatId = contactId;
      state.mode = 'chat';
      render();
    },
    'messages:delete': (contactId) => {
      if (!confirm('Удалить переписку?')) return;
      savePhone(data => { data.chats = data.chats.filter(c => String(c.contactId) !== String(contactId)); });
      state.editingChatId = null;
      state.mode = 'list';
    },
    'messages:add': () => {
      const contactId = read('f_contact');
      const text = read('f_text').trim();
      const time = read('f_time').trim() || 'сейчас';
      const sent = read('f_sent');
      if (!contactId || !text) return alert('Выберите контакт и текст');
      savePhone(data => {
        let chat = data.chats.find(c => String(c.contactId) === String(contactId));
        if (!chat) {
          chat = { contactId: Number(contactId) || contactId, messages: [], unread: !sent };
          data.chats.unshift(chat);
        }
        chat.messages.push({ text, sent, time });
      });
      state.editingChatId = contactId;
      state.mode = 'chat';
    },

    'novogram-users:new': () => openForm({ id: '', username: '', name: '', bio: 'Новоград', avatar: 'N', color: '#3b82f6', verified: false }),
    'novogram-users:edit': (id) => {
      const item = AdminStore.getNovogramData().users.find(u => u.id === id);
      if (!item) return;
      openForm({ ...item }, item.id);
    },
    'novogram-users:delete': (id) => {
      if (!confirm('Удалить профиль Novagram?')) return;
      AdminStore.deleteNovogramUser(id);
      toast('Профиль удалён');
      render();
      refreshPreview();
    },
    'novogram-users:save': () => {
      const user = {
        id: read('f_id').trim() || AdminStore.nextId(AdminStore.getNovogramData().users, 'ng_user_'),
        username: read('f_username').trim(),
        name: read('f_name').trim() || read('f_username').trim(),
        bio: read('f_bio').trim(),
        avatar: read('f_avatar').trim() || 'N',
        color: read('f_color').trim() || '#3b82f6',
        posts: Number(read('f_posts')) || 0,
        followers: Number(read('f_followers')) || 0,
        following: Number(read('f_following')) || 0,
        verified: read('f_verified'),
        filler: true,
        prepared: true,
      };
      if (!user.username) return alert('Укажите username');
      AdminStore.upsertNovogramUser(user);
      toast('Профиль сохранён');
      state.mode = 'list';
      state.editingId = null;
      render();
      refreshPreview();
    },

    'novogram-posts:new': () => openForm({
      id: '', userId: AdminStore.getNovogramData().users[0]?.id || '', caption: '', likes: 0, time: '1 ч',
      imageLabel: '', imageSrc: '', news: false, filler: true,
    }),
    'novogram-posts:edit': (id) => {
      const item = AdminStore.getNovogramData().posts.find(p => p.id === id);
      if (!item) return;
      openForm({
        id: item.id,
        userId: item.userId,
        caption: item.caption,
        likes: item.likes || 0,
        time: item.time || '',
        imageLabel: item.image?.label || '',
        imageSrc: item.image?.src || '',
        news: !!item.news,
        filler: item.filler !== false,
        commentsJson: JSON.stringify(item.comments || [], null, 2),
      }, item.id);
    },
    'novogram-posts:delete': (id) => {
      if (!confirm('Удалить пост?')) return;
      AdminStore.deleteNovogramPost(id);
      toast('Пост удалён');
      render();
      refreshPreview();
    },
    'novogram-posts:save': () => {
      let comments = [];
      try {
        comments = JSON.parse(read('f_commentsJson') || '[]');
      } catch {
        return alert('Комментарии должны быть валидным JSON-массивом');
      }
      const post = {
        id: read('f_id').trim() || AdminStore.nextId(AdminStore.getNovogramData().posts, 'ng_post_'),
        userId: read('f_userId').trim(),
        caption: read('f_caption').trim(),
        likes: Number(read('f_likes')) || 0,
        time: read('f_time').trim() || '1 ч',
        news: read('f_news'),
        filler: read('f_filler'),
        image: {
          src: read('f_imageSrc').trim() || undefined,
          label: read('f_imageLabel').trim() || 'Новоград',
        },
        comments,
      };
      if (!post.userId || !post.caption) return alert('Укажите автора и текст');
      if (!post.image.src) {
        post.image = {
          category: 'city',
          photo: 1,
          gradient: 'linear-gradient(145deg,#1e3a5f 0%,#4a7c9b 55%,#c5d5e0 100%)',
          emoji: '🏙',
          label: post.image.label,
        };
      }
      AdminStore.upsertNovogramPost(post);
      toast('Пост сохранён');
      state.mode = 'list';
      state.editingId = null;
      render();
      refreshPreview();
    },

    'browser:new': () => openForm({ id: '', title: '', host: '', url: '', description: '', color: '#2563eb', letter: 'N', listed: true }),
    'browser:edit': (id) => {
      const item = AdminStore.loadBrowserSites().find(s => s.id === id);
      if (!item) return;
      openForm({ ...item, aliases: (item.aliases || []).join(', ') }, item.id);
    },
    'browser:delete': (id) => {
      if (!confirm('Удалить сайт?')) return;
      const sites = AdminStore.loadBrowserSites().filter(s => s.id !== id);
      AdminStore.saveBrowserSites(sites);
      toast('Сайт удалён');
      render();
      refreshPreview();
    },
    'browser:save': () => {
      const site = {
        id: read('f_id').trim() || AdminStore.nextId(AdminStore.loadBrowserSites(), 'site_'),
        title: read('f_title').trim(),
        host: read('f_host').trim(),
        url: read('f_url').trim(),
        description: read('f_description').trim(),
        color: read('f_color').trim() || '#2563eb',
        letter: read('f_letter').trim() || 'N',
        listed: read('f_listed'),
        aliases: read('f_aliases').split(',').map(s => s.trim()).filter(Boolean),
      };
      if (!site.title || !site.host || !site.url) return alert('Заполните название, host и url');
      const sites = AdminStore.loadBrowserSites().filter(s => s.id !== site.id);
      sites.push(site);
      AdminStore.saveBrowserSites(sites);
      toast('Сайт сохранён');
      state.mode = 'list';
      state.editingId = null;
      render();
      refreshPreview();
    },

    'gibdd:new': () => openForm(GibddDB.emptyCar()),
    'gibdd:edit': (id) => {
      const item = AdminStore.loadGibddCars(state.accountId).find(c => c.id === id);
      if (!item) return;
      openForm({ ...item }, item.id);
    },
    'gibdd:delete': (id) => {
      if (!confirm('Удалить авто?')) return;
      const cars = AdminStore.loadGibddCars(state.accountId).filter(c => c.id !== id);
      AdminStore.saveGibddCars(state.accountId, cars);
      toast('Авто удалено');
      render();
      refreshPreview();
    },
    'gibdd:save': () => {
      const car = {
        id: read('f_id').trim() || AdminStore.nextId(AdminStore.loadGibddCars(state.accountId), 'car_'),
        brand: read('f_brand').trim(),
        plateNumber: read('f_plateNumber').trim(),
        year: read('f_year').trim(),
        color: read('f_color').trim(),
        category: read('f_category').trim(),
        vin: read('f_vin').trim(),
        bodyNumber: read('f_bodyNumber').trim(),
        engineNumber: read('f_engineNumber').trim(),
        engineVolume: read('f_engineVolume').trim(),
        power: read('f_power').trim(),
        ptsNumber: read('f_ptsNumber').trim(),
        accidents: read('f_accidents').trim(),
        ownerName: read('f_ownerName').trim(),
        ownerBirthDate: read('f_ownerBirthDate').trim(),
        ownerAddress: read('f_ownerAddress').trim(),
      };
      if (!car.plateNumber || !car.brand) return alert('Укажите марку и номер');
      const cars = AdminStore.loadGibddCars(state.accountId).filter(c => c.id !== car.id);
      cars.push(car);
      AdminStore.saveGibddCars(state.accountId, cars);
      toast('Авто сохранено');
      state.mode = 'list';
      state.editingId = null;
      render();
      refreshPreview();
    },

    'accounts:new': () => openForm({ label: '', passcode: '', adminPasscode: '', templateId: 'alt' }),
    'accounts:edit': (id) => {
      const item = PhoneAccounts.loadCustomAccounts().find(a => a.id === id);
      if (!item) return;
      openForm({ ...item }, item.id);
    },
    'accounts:delete': (id) => {
      if (!confirm('Удалить учётку?')) return;
      PhoneAccounts.deleteCustomAccount(id);
      toast('Учётка удалена');
      renderAccountsSelect();
      render();
    },
    'accounts:save': () => {
      const payload = {
        label: read('f_label').trim(),
        passcode: read('f_passcode').trim(),
        adminPasscode: read('f_adminPasscode').trim(),
        templateId: read('f_templateId'),
      };
      if (!payload.label || payload.passcode.length !== 6) return alert('Нужны название и 6-значный код');
      const list = PhoneAccounts.loadCustomAccounts();
      if (state.editingId) {
        const item = list.find(a => a.id === state.editingId);
        if (item) Object.assign(item, payload, { adminPasscode: payload.adminPasscode || payload.passcode });
        PhoneAccounts.saveCustomAccounts(list);
      } else {
        PhoneAccounts.addCustomAccount({ ...payload, adminPasscode: payload.adminPasscode || payload.passcode });
      }
      toast('Учётка сохранена');
      state.mode = 'list';
      state.editingId = null;
      renderAccountsSelect();
      render();
    },
  };

  function renderContacts() {
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Редактирование контакта' : 'Новый контакт');
      renderForm('Контакт',
        field('f_name', 'Имя', state.form.name) +
        field('f_phone', 'Телефон', state.form.phone),
        'contacts:save');
      return;
    }
    renderToolbar('Контакты', '<button type="button" class="admin-btn admin-btn-primary" data-action="contacts:new">+ Новый</button>');
    const rows = phoneData().contacts.map(item => `
      <div class="admin-row">
        <div>
          <p class="admin-row-title">${esc(item.name)}</p>
          <p class="admin-row-sub">${esc(item.phone)}</p>
        </div>
        ${rowActions('contacts:edit', 'contacts:delete')}
      </div>
    `).join('');
    renderList(rows);
    phoneData().contacts.forEach((item, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', item.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', item.id);
    });
    $('#toolbar [data-action="contacts:new"]')?.addEventListener('click', () => handlers['contacts:new']());
    bindRowActions();
  }

  function renderSimpleList(section, items, mapRow, formFields, saveHandler, newHandler) {
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Редактирование' : 'Создание');
      renderForm(section, formFields(state.form), saveHandler);
      return;
    }
    renderToolbar(section, `<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новый</button>`);
    renderList(items.map(mapRow).join(''));
    items.forEach((item, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', item.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', item.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', newHandler);
    bindRowActions();
  }

  function renderEmails() {
    renderSimpleList(
      'Почта',
      phoneData().emails,
      item => `<div class="admin-row"><div><p class="admin-row-title">${esc(item.from)} ${item.unread ? '<span class="admin-badge">new</span>' : ''}</p><p class="admin-row-sub">${esc(item.subject)}</p></div>${rowActions('emails:edit', 'emails:delete')}</div>`,
      form => field('f_from', 'От кого', form.from) + field('f_email', 'Email', form.email) + field('f_subject', 'Тема', form.subject) + field('f_preview', 'Превью', form.preview) + field('f_time', 'Время', form.time) + field('f_body', 'Текст', form.body, 'textarea') + field('f_unread', 'Непрочитанное', form.unread, 'checkbox'),
      'emails:save',
      () => handlers['emails:new'](),
    );
  }

  function renderNotes() {
    renderSimpleList(
      'Заметки',
      phoneData().notes || [],
      item => `<div class="admin-row"><div><p class="admin-row-title">${esc(item.title)}</p><p class="admin-row-sub">${esc(item.body)}</p></div>${rowActions('notes:edit', 'notes:delete')}</div>`,
      form => field('f_title', 'Заголовок', form.title) + field('f_body', 'Текст', form.body, 'textarea'),
      'notes:save',
      () => handlers['notes:new'](),
    );
  }

  function renderCalendar() {
    renderSimpleList(
      'Календарь',
      phoneData().calendar || [],
      item => `<div class="admin-row"><div><p class="admin-row-title">${esc(item.title)}</p><p class="admin-row-sub">${esc(item.date)} · ${esc(item.time)}</p></div>${rowActions('calendar:edit', 'calendar:delete')}</div>`,
      form => field('f_date', 'Дата', form.date) + field('f_title', 'Событие', form.title) + field('f_time', 'Время', form.time),
      'calendar:save',
      () => handlers['calendar:new'](),
    );
  }

  function renderPhotos() {
    renderSimpleList(
      'Фото',
      phoneData().photos || [],
      item => `<div class="admin-row"><div><p class="admin-row-title">${esc(item.title)}</p><p class="admin-row-sub">${esc(item.caption)}</p></div>${rowActions('photos:edit', 'photos:delete')}</div>`,
      form => field('f_title', 'Название', form.title) + field('f_caption', 'Подпись', form.caption, 'textarea'),
      'photos:save',
      () => handlers['photos:new'](),
    );
  }

  function renderMessages() {
    const data = phoneData();
    if (state.mode === 'chat' && state.editingChatId != null) {
      const chat = data.chats.find(c => String(c.contactId) === String(state.editingChatId));
      const contact = data.contacts.find(c => String(c.id) === String(state.editingChatId));
      renderToolbar(`Переписка · ${contact?.name || state.editingChatId}`, '<button type="button" class="admin-btn" data-action="back-list">К списку</button>');
      const options = data.contacts.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      $('#content').innerHTML = `
        <div class="admin-card"><div class="admin-card-body admin-comments">
          ${(chat?.messages || []).map(msg => `<div class="admin-comment"><strong>${msg.sent ? 'Я' : contact?.name || 'Контакт'}</strong> · ${esc(msg.time)}<br>${esc(msg.text)}</div>`).join('') || '<div class="admin-empty">Сообщений нет</div>'}
        </div></div>
        <div class="admin-card"><div class="admin-card-body admin-form-grid">
          ${field('f_contact', 'Контакт', state.editingChatId, 'select', options)}
          ${field('f_text', 'Новое сообщение', '', 'textarea')}
          ${field('f_time', 'Время', new Date().toTimeString().slice(0, 5))}
          ${field('f_sent', 'Исходящее', false, 'checkbox')}
          <div class="admin-row-actions">
            <button type="button" class="admin-btn admin-btn-primary" data-action="messages:add">Добавить</button>
            <button type="button" class="admin-btn admin-btn-danger" data-action="messages:delete-chat">Удалить переписку</button>
          </div>
        </div></div>
      `;
      $('#toolbar [data-action="back-list"]')?.addEventListener('click', () => { state.mode = 'list'; state.editingChatId = null; render(); });
      $('#content [data-action="messages:add"]')?.addEventListener('click', () => handlers['messages:add']());
      $('#content [data-action="messages:delete-chat"]')?.addEventListener('click', () => handlers['messages:delete'](state.editingChatId));
      return;
    }
    renderToolbar('Сообщения');
    renderList(data.chats.map(chat => {
      const contact = data.contacts.find(c => String(c.id) === String(chat.contactId));
      const last = chat.messages[chat.messages.length - 1];
      return `<button type="button" class="admin-row" data-open-chat="${chat.contactId}" style="width:100%;cursor:pointer;text-align:left;border:1px solid var(--line);background:rgba(255,255,255,.02)"><div><p class="admin-row-title">${esc(contact?.name || chat.contactId)}</p><p class="admin-row-sub">${esc(last?.text || 'Пусто')} · ${chat.messages.length} сообщ.</p></div></button>`;
    }).join(''));
    $('#content').querySelectorAll('[data-open-chat]').forEach(btn => {
      btn.addEventListener('click', () => handlers['messages:open'](btn.dataset.openChat));
    });
  }

  function renderNovogramUsers() {
    const users = AdminStore.getNovogramData().users;
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Профиль Novagram' : 'Новый профиль');
      renderForm('Профиль',
        field('f_id', 'ID', state.form.id) +
        field('f_username', 'Username', state.form.username) +
        field('f_name', 'Имя', state.form.name) +
        field('f_bio', 'Bio', state.form.bio) +
        field('f_avatar', 'Аватар (буква)', state.form.avatar) +
        field('f_color', 'Цвет', state.form.color) +
        field('f_posts', 'Постов', state.form.posts ?? 0) +
        field('f_followers', 'Подписчики', state.form.followers ?? 0) +
        field('f_following', 'Подписки', state.form.following ?? 0) +
        field('f_verified', 'Верифицирован', state.form.verified, 'checkbox'),
        'novogram-users:save');
      return;
    }
    renderToolbar('Novagram · профили', '<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новый</button>');
    renderList(users.slice(0, 120).map(user => `
      <div class="admin-row">
        <div>
          <p class="admin-row-title">@${esc(user.username)} ${user.verified ? '<span class="admin-badge">verified</span>' : ''}</p>
          <p class="admin-row-sub">${esc(user.name)} · ${esc(user.bio || '')}</p>
        </div>
        ${rowActions('novogram-users:edit', 'novogram-users:delete')}
      </div>
    `).join(''));
    users.slice(0, 120).forEach((user, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', user.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', user.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', () => handlers['novogram-users:new']());
    bindRowActions();
  }

  function renderNovogramPosts() {
    const posts = AdminStore.getNovogramData().posts;
    const users = AdminStore.getNovogramData().users;
    const userOptions = users.map(u => `<option value="${u.id}" ${state.form.userId === u.id ? 'selected' : ''}>@${esc(u.username)}</option>`).join('');
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Пост Novagram' : 'Новый пост');
      renderForm('Пост',
        field('f_id', 'ID', state.form.id) +
        field('f_userId', 'Автор', state.form.userId, 'select', userOptions) +
        field('f_caption', 'Текст', state.form.caption, 'textarea') +
        field('f_imageSrc', 'Картинка (src)', state.form.imageSrc) +
        field('f_imageLabel', 'Подпись на фото', state.form.imageLabel) +
        field('f_likes', 'Лайки', state.form.likes ?? 0) +
        field('f_time', 'Время', state.form.time || '1 ч') +
        field('f_news', 'Новостной пост', state.form.news, 'checkbox') +
        field('f_filler', 'Городской (filler)', state.form.filler !== false, 'checkbox') +
        field('f_commentsJson', 'Комментарии (JSON)', state.form.commentsJson || '[]', 'textarea'),
        'novogram-posts:save');
      return;
    }
    renderToolbar('Novagram · посты', '<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новый</button>');
    renderList(posts.slice(0, 100).map(post => {
      const user = users.find(u => u.id === post.userId);
      return `<div class="admin-row"><div><p class="admin-row-title">@${esc(user?.username || post.userId)}</p><p class="admin-row-sub">${esc((post.caption || '').slice(0, 120))}</p></div>${rowActions('novogram-posts:edit', 'novogram-posts:delete')}</div>`;
    }).join(''));
    posts.slice(0, 100).forEach((post, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', post.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', post.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', () => handlers['novogram-posts:new']());
    bindRowActions();
  }

  function renderBrowser() {
    const sites = AdminStore.loadBrowserSites();
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Сайт браузера' : 'Новый сайт');
      renderForm('Сайт',
        field('f_id', 'ID', state.form.id) +
        field('f_title', 'Название', state.form.title) +
        field('f_host', 'Host', state.form.host) +
        field('f_url', 'URL', state.form.url) +
        field('f_description', 'Описание', state.form.description) +
        field('f_color', 'Цвет', state.form.color) +
        field('f_letter', 'Буква', state.form.letter) +
        field('f_aliases', 'Алиасы (через запятую)', state.form.aliases || '') +
        field('f_listed', 'Показывать на главной', state.form.listed !== false, 'checkbox'),
        'browser:save');
      return;
    }
    renderToolbar('Сайты браузера', '<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новый</button>');
    renderList(sites.map(site => `<div class="admin-row"><div><p class="admin-row-title">${esc(site.title)}</p><p class="admin-row-sub">${esc(site.host)} → ${esc(site.url)}</p></div>${rowActions('browser:edit', 'browser:delete')}</div>`).join(''));
    sites.forEach((site, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', site.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', site.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', () => handlers['browser:new']());
    bindRowActions();
  }

  function renderGibdd() {
    const cars = AdminStore.loadGibddCars(state.accountId);
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Автомобиль' : 'Новое авто');
      renderForm('ГИБДД',
        `<div class="admin-form-grid two">${field('f_id', 'ID', state.form.id)}${field('f_brand', 'Марка/модель', state.form.brand)}${field('f_plateNumber', 'Госномер', state.form.plateNumber)}${field('f_year', 'Год', state.form.year)}${field('f_color', 'Цвет', state.form.color)}${field('f_category', 'Категория', state.form.category)}${field('f_vin', 'VIN', state.form.vin)}${field('f_ownerName', 'Владелец', state.form.ownerName)}${field('f_ownerAddress', 'Адрес', state.form.ownerAddress)}${field('f_accidents', 'ДТП', state.form.accidents, 'textarea')}</div>`,
        'gibdd:save');
      return;
    }
    renderToolbar('ГИБДД', '<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новое авто</button>');
    renderList(cars.map(car => `<div class="admin-row"><div><p class="admin-row-title">${esc(car.plateNumber)}</p><p class="admin-row-sub">${esc(car.brand)} · ${esc(car.ownerName || '')}</p></div>${rowActions('gibdd:edit', 'gibdd:delete')}</div>`).join(''));
    cars.forEach((car, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', car.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', car.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', () => handlers['gibdd:new']());
    bindRowActions();
  }

  function renderAccounts() {
    const accounts = PhoneAccounts.loadCustomAccounts();
    const templates = Object.entries(PhoneAccounts.PHONE_ACCOUNTS).map(([id, acc]) => `<option value="${id}" ${state.form.templateId === id ? 'selected' : ''}>${esc(acc.label)}</option>`).join('');
    if (state.mode === 'form') {
      renderToolbar(state.editingId ? 'Учётка телефона' : 'Новая учётка');
      renderForm('Учётка',
        field('f_label', 'Название', state.form.label) +
        field('f_passcode', 'Код-пароль', state.form.passcode) +
        field('f_adminPasscode', 'Админ-код', state.form.adminPasscode) +
        field('f_templateId', 'Шаблон', state.form.templateId, 'select', templates),
        'accounts:save');
      return;
    }
    renderToolbar('Учётки телефона', '<button type="button" class="admin-btn admin-btn-primary" data-action="new">+ Новая</button>');
    renderList(accounts.map(acc => `<div class="admin-row"><div><p class="admin-row-title">${esc(acc.label)}</p><p class="admin-row-sub">Код ${esc(acc.passcode)} · шаблон ${esc(acc.templateId)}</p></div>${rowActions('accounts:edit', 'accounts:delete')}</div>`).join(''));
    accounts.forEach((acc, index) => {
      const row = $('#content').querySelectorAll('.admin-row')[index];
      row?.querySelector('[data-edit]')?.setAttribute('data-id', acc.id);
      row?.querySelector('[data-delete]')?.setAttribute('data-id', acc.id);
    });
    $('#toolbar [data-action="new"]')?.addEventListener('click', () => handlers['accounts:new']());
    bindRowActions();
  }

  function renderSystem() {
    renderToolbar('Система');
    $('#content').innerHTML = `
      <div class="admin-card"><div class="admin-card-body admin-form-grid">
        <p class="admin-row-sub">Сброс вернёт данные выбранной учётки к seed-значениям. Overrides Novagram и сайты браузера сбрасываются отдельно.</p>
        <div class="admin-row-actions">
          <button type="button" class="admin-btn admin-btn-danger" id="resetPhoneBtn">Сбросить телефон</button>
          <button type="button" class="admin-btn admin-btn-danger" id="resetNovogramBtn">Сбросить Novagram overrides</button>
          <button type="button" class="admin-btn admin-btn-danger" id="resetBrowserBtn">Сбросить сайты браузера</button>
        </div>
      </div></div>
    `;
    $('#resetPhoneBtn')?.addEventListener('click', () => {
      if (!confirm('Сбросить данные выбранной учётки?')) return;
      AdminStore.resetPhoneData(state.accountId);
      toast('Телефон сброшен');
      render();
      refreshPreview();
    });
    $('#resetNovogramBtn')?.addEventListener('click', () => {
      if (!confirm('Сбросить все правки Novagram?')) return;
      AdminStore.resetNovogramOverrides();
      toast('Novagram overrides сброшены');
      render();
      refreshPreview();
    });
    $('#resetBrowserBtn')?.addEventListener('click', () => {
      if (!confirm('Сбросить сайты браузера?')) return;
      AdminStore.resetBrowserSites();
      toast('Сайты браузера сброшены');
      render();
      refreshPreview();
    });
  }

  function renderAccountsSelect() {
    const select = $('#accountSelect');
    if (!select) return;
    select.innerHTML = AdminStore.listAccounts().map(acc => `<option value="${acc.id}" ${acc.id === state.accountId ? 'selected' : ''}>${esc(acc.label)}</option>`).join('');
  }

  function render() {
    renderSidebar();
    const map = {
      contacts: renderContacts,
      messages: renderMessages,
      emails: renderEmails,
      notes: renderNotes,
      calendar: renderCalendar,
      photos: renderPhotos,
      'novogram-users': renderNovogramUsers,
      'novogram-posts': renderNovogramPosts,
      browser: renderBrowser,
      gibdd: renderGibdd,
      accounts: renderAccounts,
      system: renderSystem,
    };
    (map[state.section] || renderContacts)();
  }

  function syncStateTabs() {
    const n = window.StoryState ? StoryState.getState() : 1;
    document.querySelectorAll('.admin-state-tab').forEach(tab => {
      tab.classList.toggle('active', Number(tab.dataset.storyState) === n);
    });
  }

  function initStoryStateBar() {
    document.querySelectorAll('.admin-state-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (window.StoryState) StoryState.setState(Number(tab.dataset.storyState));
        syncStateTabs();
        refreshPreview();
      });
    });
    $('#storyResetBtn')?.addEventListener('click', () => {
      if (!confirm('Сбросить игру? Вернёт первое состояние и экран пароля.')) return;
      if (window.StoryState) StoryState.reset();
      syncStateTabs();
      refreshPreview();
      toast('Игра сброшена');
    });
    syncStateTabs();
  }

  function init() {
    renderAccountsSelect();
    initStoryStateBar();
    $('#accountSelect')?.addEventListener('change', (e) => {
      state.accountId = e.target.value;
      state.mode = 'list';
      state.editingId = null;
      render();
    });
    $('#refreshPreviewBtn')?.addEventListener('click', refreshPreview);
    $('#exportBtn')?.addEventListener('click', () => {
      const payload = AdminStore.exportAll(state.accountId);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phone-admin-${state.accountId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $('#importInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text());
        if (payload.accountId) state.accountId = payload.accountId;
        AdminStore.importAll(payload);
        renderAccountsSelect();
        render();
        refreshPreview();
        toast('Импорт завершён');
      } catch (err) {
        alert('Не удалось импортировать JSON: ' + err.message);
      } finally {
        e.target.value = '';
      }
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
