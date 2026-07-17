(function () {
  let view = 'menu';
  let editingContact = null;
  let editingEmail = null;
  let editingChat = null;
  let editingUser = null;
  let editingNote = null;
  let editingCalendar = null;
  let editingPhoto = null;
  let showForm = false;

  let contactForm = { name: '', phone: '' };
  let emailForm = { from: '', email: '', subject: '', preview: '', body: '', time: '', unread: true };
  let msgForm = { contactId: '', text: '', sent: false, time: '' };
  let userForm = { label: '', passcode: '', adminPasscode: '', templateId: 'alt' };
  let noteForm = { title: '', body: '' };
  let calendarForm = { date: '', title: '', time: '' };
  let photoForm = { title: '', caption: '' };

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resetForms() {
    contactForm = { name: '', phone: '' };
    emailForm = { from: '', email: '', subject: '', preview: '', body: '', time: '', unread: true };
    msgForm = { contactId: '', text: '', sent: false, time: '' };
    userForm = { label: '', passcode: '', adminPasscode: '', templateId: 'alt' };
    showForm = false;
    editingContact = null;
    editingEmail = null;
    editingChat = null;
    editingUser = null;
    editingNote = null;
    editingCalendar = null;
    editingPhoto = null;
  }

  function renderMenu(data) {
    const customUsers = PhoneAccounts.loadCustomAccounts();
    return `
      <div class="admin-menu">
        <a class="admin-menu-item" href="./admin.html">
          <span>Полная админка</span>
          <span>↗</span>
        </a>
        <a class="admin-menu-item" href="./novogram-admin.html">
          <span>Novogram Admin</span>
          <span>↗</span>
        </a>
        <button type="button" class="admin-menu-item" data-view="users">
          <span>Пользователи</span>
          <span>${customUsers.length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="contacts">
          <span>Контакты</span>
          <span>${data.contacts.length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="messages">
          <span>Сообщения</span>
          <span>${data.chats.length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="emails">
          <span>Почта</span>
          <span>${data.emails.length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="notes">
          <span>Заметки</span>
          <span>${(data.notes || []).length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="calendar">
          <span>Календарь</span>
          <span>${(data.calendar || []).length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="photos">
          <span>Фото</span>
          <span>${(data.photos || []).length}</span>
        </button>
        <button type="button" class="admin-menu-item" data-view="gibdd">
          <span>База ГИБДД</span>
          <span>${GibddDB.loadCars().length}</span>
        </button>
        <button type="button" class="admin-menu-item admin-danger" data-action="reset-data">
          Сбросить данные учётки
        </button>
      </div>
    `;
  }

  function renderUsersView() {
    const customUsers = PhoneAccounts.loadCustomAccounts();
    const templates = Object.entries(PhoneAccounts.PHONE_ACCOUNTS)
      .map(([id, acc]) => `<option value="${id}" ${userForm.templateId === id ? 'selected' : ''}>${esc(acc.label)}</option>`)
      .join('');

    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-user">+ Новый пользователь</button>
      </div>
      ${showForm || editingUser !== null ? `
        <div class="admin-form">
          <input type="text" id="adminUserLabel" placeholder="Название (напр. «Следователь»)" value="${esc(userForm.label)}" />
          <input type="text" id="adminUserPasscode" placeholder="Код-пароль (6 цифр)" maxlength="6" value="${esc(userForm.passcode)}" />
          <input type="text" id="adminUserAdminPasscode" placeholder="Админ-код (6 цифр)" maxlength="6" value="${esc(userForm.adminPasscode)}" />
          <select id="adminUserTemplate">${templates}</select>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-user">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${customUsers.length ? customUsers.map(user => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(user.label)}<span class="admin-badge">свой</span></p>
              <p class="admin-list-sub">Код: ${esc(user.passcode)} · Шаблон: ${esc(PhoneAccounts.PHONE_ACCOUNTS[user.templateId]?.label || user.templateId)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-user="${esc(user.id)}" title="Редактировать">✎</button>
              <button type="button" data-delete-user="${esc(user.id)}" title="Удалить">🗑</button>
            </div>
          </div>
        `).join('') : '<p class="admin-hint">Нет пользовательских учёток. Создайте новую — она получит свой код-пароль для входа.</p>'}
      </div>
    `;
  }

  function renderContactsView(data) {
    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-contact">+ Новый контакт</button>
      </div>
      ${showForm || editingContact !== null ? `
        <div class="admin-form">
          <input type="text" id="adminContactName" placeholder="Имя" value="${esc(contactForm.name)}" />
          <input type="text" id="adminContactPhone" placeholder="Телефон" value="${esc(contactForm.phone)}" />
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-contact">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${data.contacts.map(contact => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(contact.name)}</p>
              <p class="admin-list-sub">${esc(contact.phone)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-contact="${contact.id}">✎</button>
              <button type="button" data-delete-contact="${contact.id}">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMessagesView(data) {
    const contactOptions = data.contacts
      .map(c => `<option value="${c.id}" ${String(msgForm.contactId) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`)
      .join('');

    const chatDetail = editingChat !== null ? data.chats.find(c => c.contactId === editingChat) : null;
    const chatContact = chatDetail ? data.contacts.find(c => c.id === chatDetail.contactId) : null;

    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-message">+ Новая переписка</button>
      </div>
      ${showForm ? `
        <div class="admin-form">
          <select id="adminMsgContact">${contactOptions || '<option value="">— нет контактов —</option>'}</select>
          <textarea id="adminMsgText" placeholder="Текст сообщения">${esc(msgForm.text)}</textarea>
          <input type="text" id="adminMsgTime" placeholder="Время (напр. 10:30)" value="${esc(msgForm.time)}" />
          <label><input type="checkbox" id="adminMsgSent" ${msgForm.sent ? 'checked' : ''} /> Исходящее (от меня)</label>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-message">Добавить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      ${chatDetail ? `
        <div class="admin-form">
          <p class="admin-list-title">${esc(chatContact ? chatContact.name : 'Контакт #' + editingChat)}</p>
          <div class="admin-msg-list">
            ${chatDetail.messages.map(msg => `
              <div class="admin-msg-item ${msg.sent ? 'sent' : 'received'}">${esc(msg.text)}<br><small style="opacity:.6">${esc(msg.time)}</small></div>
            `).join('')}
          </div>
          <textarea id="adminChatReply" placeholder="Добавить сообщение..."></textarea>
          <input type="text" id="adminChatReplyTime" placeholder="Время" value="${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}" />
          <label><input type="checkbox" id="adminChatReplySent" /> Исходящее</label>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="add-to-chat">Добавить в переписку</button>
            <button type="button" class="admin-link danger" data-action="delete-chat">Удалить переписку</button>
            <button type="button" class="admin-link" data-action="close-chat">Закрыть</button>
          </div>
        </div>
      ` : `
        <div class="admin-list">
          ${data.chats.length ? data.chats.map(chat => {
            const contact = data.contacts.find(c => c.id === chat.contactId);
            const last = chat.messages[chat.messages.length - 1];
            return `
              <button type="button" class="admin-menu-item" data-open-chat="${chat.contactId}">
                <span>${esc(contact ? contact.name : 'Контакт #' + chat.contactId)}</span>
                <span>${chat.messages.length} msg</span>
              </button>
              <p class="admin-hint" style="padding-top:0;margin-top:-8px">${esc(last ? last.text : 'Пусто')}</p>
            `;
          }).join('') : '<p class="admin-hint">Нет переписок. Создайте новую.</p>'}
        </div>
      `}
    `;
  }

  function renderEmailsView(data) {
    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-email">+ Новое письмо</button>
      </div>
      ${showForm || editingEmail !== null ? `
        <div class="admin-form">
          <input type="text" id="adminEmailFrom" placeholder="От кого" value="${esc(emailForm.from)}" />
          <input type="text" id="adminEmailAddr" placeholder="Email" value="${esc(emailForm.email)}" />
          <input type="text" id="adminEmailSubject" placeholder="Тема" value="${esc(emailForm.subject)}" />
          <input type="text" id="adminEmailPreview" placeholder="Превью (кратко)" value="${esc(emailForm.preview)}" />
          <input type="text" id="adminEmailTime" placeholder="Время" value="${esc(emailForm.time)}" />
          <textarea id="adminEmailBody" placeholder="Текст письма">${esc(emailForm.body)}</textarea>
          <label><input type="checkbox" id="adminEmailUnread" ${emailForm.unread ? 'checked' : ''} /> Непрочитанное</label>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-email">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${data.emails.map(mail => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(mail.from)} ${mail.unread ? '<span class="admin-badge">new</span>' : ''}</p>
              <p class="admin-list-sub">${esc(mail.subject)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-email="${mail.id}">✎</button>
              <button type="button" data-delete-email="${mail.id}">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderNotesView(data) {
    const notes = data.notes || [];
    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-note">+ Новая заметка</button>
      </div>
      ${showForm || editingNote !== null ? `
        <div class="admin-form">
          <input type="text" id="adminNoteTitle" placeholder="Заголовок" value="${esc(noteForm.title)}" />
          <textarea id="adminNoteBody" placeholder="Текст">${esc(noteForm.body)}</textarea>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-note">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${notes.length ? notes.map(note => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(note.title)}</p>
              <p class="admin-list-sub">${esc(note.body)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-note="${note.id}">✎</button>
              <button type="button" data-delete-note="${note.id}">🗑</button>
            </div>
          </div>
        `).join('') : '<p class="admin-hint">Нет заметок.</p>'}
      </div>
    `;
  }

  function renderCalendarView(data) {
    const events = data.calendar || [];
    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-calendar">+ Новое событие</button>
      </div>
      ${showForm || editingCalendar !== null ? `
        <div class="admin-form">
          <input type="text" id="adminCalDate" placeholder="Дата (2026-02-21)" value="${esc(calendarForm.date)}" />
          <input type="text" id="adminCalTitle" placeholder="Событие" value="${esc(calendarForm.title)}" />
          <input type="text" id="adminCalTime" placeholder="Время" value="${esc(calendarForm.time)}" />
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-calendar">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${events.length ? events.map(event => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(event.title)}</p>
              <p class="admin-list-sub">${esc(event.date)} · ${esc(event.time)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-calendar="${event.id}">✎</button>
              <button type="button" data-delete-calendar="${event.id}">🗑</button>
            </div>
          </div>
        `).join('') : '<p class="admin-hint">Нет событий.</p>'}
      </div>
    `;
  }

  function renderPhotosView(data) {
    const photos = data.photos || [];
    return `
      <div class="admin-toolbar">
        <button type="button" class="admin-link" data-action="add-photo">+ Новое фото</button>
      </div>
      ${showForm || editingPhoto !== null ? `
        <div class="admin-form">
          <input type="text" id="adminPhotoTitle" placeholder="Название" value="${esc(photoForm.title)}" />
          <textarea id="adminPhotoCaption" placeholder="Подпись">${esc(photoForm.caption)}</textarea>
          <div class="admin-form-actions">
            <button type="button" class="gibdd-btn gibdd-btn-primary" data-action="save-photo">Сохранить</button>
            <button type="button" class="admin-link danger" data-action="cancel-form">Отмена</button>
          </div>
        </div>
      ` : ''}
      <div class="admin-list">
        ${photos.length ? photos.map(photo => `
          <div class="admin-list-row">
            <div>
              <p class="admin-list-title">${esc(photo.title)}</p>
              <p class="admin-list-sub">${esc(photo.caption)}</p>
            </div>
            <div class="admin-row-actions">
              <button type="button" data-edit-photo="${photo.id}">✎</button>
              <button type="button" data-delete-photo="${photo.id}">🗑</button>
            </div>
          </div>
        `).join('') : '<p class="admin-hint">Нет фото.</p>'}
      </div>
    `;
  }

  function renderGibddView() {
    return `
      <p class="admin-hint">Для редактирования базы авто используйте приложение «ГИБДД+».</p>
      <div style="padding:0 16px">
        <button type="button" class="gibdd-btn gibdd-btn-primary gibdd-btn-wide" data-action="open-gibdd-admin">Открыть ГИБДД+</button>
      </div>
    `;
  }

  function render() {
    const screen = document.getElementById('adminApp');
    if (!screen || !window.PhoneSession) return;

    const account = PhoneSession.getAccount();
    const data = PhoneSession.getData();

    const bodies = {
      menu: renderMenu(data),
      users: renderUsersView(),
      contacts: renderContactsView(data),
      messages: renderMessagesView(data),
      emails: renderEmailsView(data),
      notes: renderNotesView(data),
      calendar: renderCalendarView(data),
      photos: renderPhotosView(data),
      gibdd: renderGibddView(),
    };

    const titles = {
      menu: `Админ — ${account.label}`,
      users: 'Пользователи',
      contacts: 'Контакты',
      messages: 'Сообщения',
      emails: 'Почта',
      notes: 'Заметки',
      calendar: 'Календарь',
      photos: 'Фото',
      gibdd: 'База ГИБДД',
    };

    screen.innerHTML = `
      <div class="gibdd-header admin-header">
        <button type="button" class="gibdd-back" data-admin-nav="back" aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <h1>${esc(titles[view] || 'Админ')}</h1>
        <span class="gibdd-header-spacer"></span>
      </div>
      <div class="admin-body">${bodies[view] || ''}</div>
      <div class="home-indicator"></div>
    `;

    bindEvents(data);
  }

  function bindEvents(data) {
    const screen = document.getElementById('adminApp');
    if (!screen) return;

    screen.querySelector('[data-admin-nav="back"]')?.addEventListener('click', () => {
      if (view === 'menu') {
        showScreen('homeScreen');
      } else {
        view = 'menu';
        resetForms();
        render();
      }
    });

    screen.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        view = btn.dataset.view;
        resetForms();
        render();
      });
    });

    screen.querySelector('[data-action="add-user"]')?.addEventListener('click', () => {
      editingUser = null;
      userForm = { label: '', passcode: '', adminPasscode: '', templateId: 'alt' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-user"]')?.addEventListener('click', () => {
      const label = document.getElementById('adminUserLabel')?.value.trim();
      const passcode = document.getElementById('adminUserPasscode')?.value.trim();
      const adminPasscode = document.getElementById('adminUserAdminPasscode')?.value.trim();
      const templateId = document.getElementById('adminUserTemplate')?.value || 'alt';
      if (!label || !passcode || passcode.length !== 6) {
        alert('Укажите название и 6-значный код-пароль');
        return;
      }
      const list = PhoneAccounts.loadCustomAccounts();
      if (editingUser) {
        const item = list.find(u => u.id === editingUser);
        if (item) {
          item.label = label;
          item.passcode = passcode;
          item.adminPasscode = adminPasscode || passcode;
          item.templateId = templateId;
        }
        PhoneAccounts.saveCustomAccounts(list);
      } else {
        PhoneAccounts.addCustomAccount({ label, passcode, adminPasscode: adminPasscode || passcode, templateId });
      }
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = PhoneAccounts.loadCustomAccounts().find(u => u.id === btn.dataset.editUser);
        if (!user) return;
        editingUser = user.id;
        userForm = { label: user.label, passcode: user.passcode, adminPasscode: user.adminPasscode, templateId: user.templateId };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить пользователя?')) return;
        PhoneAccounts.deleteCustomAccount(btn.dataset.deleteUser);
        render();
      });
    });

    screen.querySelector('[data-action="add-contact"]')?.addEventListener('click', () => {
      editingContact = null;
      contactForm = { name: '', phone: '' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="cancel-form"]')?.addEventListener('click', () => {
      resetForms();
      render();
    });

    screen.querySelector('[data-action="save-contact"]')?.addEventListener('click', () => {
      const name = document.getElementById('adminContactName')?.value.trim();
      const phone = document.getElementById('adminContactPhone')?.value.trim();
      if (!name || !phone) return;
      const d = PhoneSession.getData();
      if (editingContact) {
        const contact = d.contacts.find(c => c.id === editingContact);
        if (contact) {
          contact.name = name;
          contact.phone = phone;
          contact.avatar = name[0].toUpperCase();
        }
      } else {
        const nextId = Math.max(0, ...d.contacts.map(c => c.id)) + 1;
        d.contacts.push({
          id: nextId,
          name,
          phone,
          avatar: name[0].toUpperCase(),
          color: `avatar-${(nextId % 5) + 1}`,
        });
      }
      PhoneSession.saveData();
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-contact]').forEach(btn => {
      btn.addEventListener('click', () => {
        const contact = PhoneSession.getData().contacts.find(c => c.id === Number(btn.dataset.editContact));
        if (!contact) return;
        editingContact = contact.id;
        contactForm = { name: contact.name, phone: contact.phone };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-contact]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.deleteContact);
        if (!confirm('Удалить контакт?')) return;
        const d = PhoneSession.getData();
        d.contacts = d.contacts.filter(c => c.id !== id);
        d.chats = d.chats.filter(c => c.contactId !== id);
        PhoneSession.saveData();
        render();
      });
    });

    screen.querySelector('[data-action="add-message"]')?.addEventListener('click', () => {
      msgForm = { contactId: data.contacts[0]?.id || '', text: '', sent: false, time: '' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-message"]')?.addEventListener('click', () => {
      const contactId = Number(document.getElementById('adminMsgContact')?.value);
      const text = document.getElementById('adminMsgText')?.value.trim();
      const time = document.getElementById('adminMsgTime')?.value.trim() || `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      const sent = document.getElementById('adminMsgSent')?.checked || false;
      if (!contactId || !text) return;
      const d = PhoneSession.getData();
      let chat = d.chats.find(c => c.contactId === contactId);
      if (!chat) {
        chat = { contactId, messages: [], unread: !sent };
        d.chats.unshift(chat);
      }
      chat.messages.push({ text, sent, time });
      PhoneSession.saveData();
      resetForms();
      editingChat = contactId;
      render();
    });

    screen.querySelectorAll('[data-open-chat]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingChat = Number(btn.dataset.openChat);
        showForm = false;
        render();
      });
    });

    screen.querySelector('[data-action="close-chat"]')?.addEventListener('click', () => {
      editingChat = null;
      render();
    });

    screen.querySelector('[data-action="add-to-chat"]')?.addEventListener('click', () => {
      const text = document.getElementById('adminChatReply')?.value.trim();
      const time = document.getElementById('adminChatReplyTime')?.value.trim();
      const sent = document.getElementById('adminChatReplySent')?.checked || false;
      if (!text || editingChat === null) return;
      const d = PhoneSession.getData();
      const chat = d.chats.find(c => c.contactId === editingChat);
      if (!chat) return;
      chat.messages.push({ text, sent, time: time || 'сейчас' });
      PhoneSession.saveData();
      render();
    });

    screen.querySelector('[data-action="delete-chat"]')?.addEventListener('click', () => {
      if (!confirm('Удалить переписку?')) return;
      const d = PhoneSession.getData();
      d.chats = d.chats.filter(c => c.contactId !== editingChat);
      PhoneSession.saveData();
      editingChat = null;
      render();
    });

    screen.querySelector('[data-action="add-email"]')?.addEventListener('click', () => {
      editingEmail = null;
      emailForm = { from: '', email: '', subject: '', preview: '', body: '', time: 'сейчас', unread: true };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-email"]')?.addEventListener('click', () => {
      const from = document.getElementById('adminEmailFrom')?.value.trim();
      const email = document.getElementById('adminEmailAddr')?.value.trim();
      const subject = document.getElementById('adminEmailSubject')?.value.trim();
      const preview = document.getElementById('adminEmailPreview')?.value.trim();
      const body = document.getElementById('adminEmailBody')?.value.trim();
      const time = document.getElementById('adminEmailTime')?.value.trim() || 'сейчас';
      const unread = document.getElementById('adminEmailUnread')?.checked ?? true;
      if (!from || !subject) return;
      const d = PhoneSession.getData();
      if (editingEmail) {
        const mail = d.emails.find(e => e.id === editingEmail);
        if (mail) {
          Object.assign(mail, { from, email, subject, preview: preview || subject, body, time, unread });
        }
      } else {
        const nextId = Math.max(0, ...d.emails.map(e => e.id)) + 1;
        d.emails.unshift({
          id: nextId,
          from,
          email: email || `${from.toLowerCase().replace(/\s/g, '.')}@mail.ru`,
          subject,
          preview: preview || subject,
          body,
          time,
          unread,
          color: `avatar-${(nextId % 5) + 1}`,
        });
      }
      PhoneSession.saveData();
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-email]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mail = PhoneSession.getData().emails.find(e => e.id === Number(btn.dataset.editEmail));
        if (!mail) return;
        editingEmail = mail.id;
        emailForm = { from: mail.from, email: mail.email, subject: mail.subject, preview: mail.preview, body: mail.body, time: mail.time, unread: mail.unread };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-email]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить письмо?')) return;
        const d = PhoneSession.getData();
        d.emails = d.emails.filter(e => e.id !== Number(btn.dataset.deleteEmail));
        PhoneSession.saveData();
        render();
      });
    });

    screen.querySelector('[data-action="open-gibdd-admin"]')?.addEventListener('click', () => {
      GibddApp.openGibddAdmin();
    });

    screen.querySelector('[data-action="reset-data"]')?.addEventListener('click', () => {
      if (!confirm('Сбросить все данные этой учётной записи?')) return;
      PhoneSession.resetData();
      GibddDB.resetCarsToSeed();
      if (window.AdminStore) AdminStore.resetNovogramOverrides();
      render();
    });

    screen.querySelector('[data-action="add-note"]')?.addEventListener('click', () => {
      editingNote = null;
      noteForm = { title: '', body: '' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-note"]')?.addEventListener('click', () => {
      const title = document.getElementById('adminNoteTitle')?.value.trim();
      const body = document.getElementById('adminNoteBody')?.value.trim();
      if (!title) return;
      const d = PhoneSession.getData();
      if (!d.notes) d.notes = [];
      if (editingNote) {
        const note = d.notes.find(n => n.id === editingNote);
        if (note) Object.assign(note, { title, body });
      } else {
        const nextId = Math.max(0, ...d.notes.map(n => Number(n.id) || 0)) + 1;
        d.notes.unshift({ id: nextId, title, body });
      }
      PhoneSession.saveData();
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-note]').forEach(btn => {
      btn.addEventListener('click', () => {
        const note = (PhoneSession.getData().notes || []).find(n => String(n.id) === btn.dataset.editNote);
        if (!note) return;
        editingNote = note.id;
        noteForm = { title: note.title, body: note.body };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-note]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить заметку?')) return;
        const d = PhoneSession.getData();
        d.notes = (d.notes || []).filter(n => String(n.id) !== btn.dataset.deleteNote);
        PhoneSession.saveData();
        render();
      });
    });

    screen.querySelector('[data-action="add-calendar"]')?.addEventListener('click', () => {
      editingCalendar = null;
      calendarForm = { date: '2026-02-21', title: '', time: '10:00' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-calendar"]')?.addEventListener('click', () => {
      const date = document.getElementById('adminCalDate')?.value.trim();
      const title = document.getElementById('adminCalTitle')?.value.trim();
      const time = document.getElementById('adminCalTime')?.value.trim();
      if (!date || !title) return;
      const d = PhoneSession.getData();
      if (!d.calendar) d.calendar = [];
      if (editingCalendar) {
        const event = d.calendar.find(c => c.id === editingCalendar);
        if (event) Object.assign(event, { date, title, time });
      } else {
        const nextId = Math.max(0, ...d.calendar.map(c => Number(c.id) || 0)) + 1;
        d.calendar.push({ id: nextId, date, title, time });
      }
      PhoneSession.saveData();
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-calendar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const event = (PhoneSession.getData().calendar || []).find(c => String(c.id) === btn.dataset.editCalendar);
        if (!event) return;
        editingCalendar = event.id;
        calendarForm = { date: event.date, title: event.title, time: event.time };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-calendar]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить событие?')) return;
        const d = PhoneSession.getData();
        d.calendar = (d.calendar || []).filter(c => String(c.id) !== btn.dataset.deleteCalendar);
        PhoneSession.saveData();
        render();
      });
    });

    screen.querySelector('[data-action="add-photo"]')?.addEventListener('click', () => {
      editingPhoto = null;
      photoForm = { title: '', caption: '' };
      showForm = true;
      render();
    });

    screen.querySelector('[data-action="save-photo"]')?.addEventListener('click', () => {
      const title = document.getElementById('adminPhotoTitle')?.value.trim();
      const caption = document.getElementById('adminPhotoCaption')?.value.trim();
      if (!title) return;
      const d = PhoneSession.getData();
      if (!d.photos) d.photos = [];
      if (editingPhoto) {
        const photo = d.photos.find(p => p.id === editingPhoto);
        if (photo) Object.assign(photo, { title, caption });
      } else {
        const nextId = Math.max(0, ...d.photos.map(p => Number(p.id) || 0)) + 1;
        d.photos.unshift({ id: nextId, title, caption });
      }
      PhoneSession.saveData();
      resetForms();
      render();
    });

    screen.querySelectorAll('[data-edit-photo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const photo = (PhoneSession.getData().photos || []).find(p => String(p.id) === btn.dataset.editPhoto);
        if (!photo) return;
        editingPhoto = photo.id;
        photoForm = { title: photo.title, caption: photo.caption };
        showForm = true;
        render();
      });
    });

    screen.querySelectorAll('[data-delete-photo]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить фото?')) return;
        const d = PhoneSession.getData();
        d.photos = (d.photos || []).filter(p => String(p.id) !== btn.dataset.deletePhoto);
        PhoneSession.saveData();
        render();
      });
    });
  }

  function open() {
    view = 'menu';
    resetForms();
    showScreen('adminApp');
    render();
  }

  window.AdminApp = { open };
})();
