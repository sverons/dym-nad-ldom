(function () {
  const state = {
    view: 'posts',
    query: '',
    selectedId: null,
    draft: null,
    isNew: false,
    chapter: 1,
  };

  function postChapter(post) {
    return post.chapter || 1;
  }

  function inChapter(post) {
    return postChapter(post) === state.chapter;
  }

  function chapterPosts() {
    return data().posts.filter(inChapter);
  }

  function chapterUserIds() {
    const ids = new Set(chapterPosts().map(p => p.userId));
    return ids;
  }

  const $ = (selector) => document.querySelector(selector);

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function data() {
    return AdminStore.getNovogramData(window.NovogramSeed);
  }

  function userById(id) {
    return data().users.find(user => user.id === id) || null;
  }

  function imageSrc(post) {
    if (post?.image?.src) return post.image.src;
    const category = post?.image?.category || 'city';
    const photo = ((Number(post?.image?.photo || 1) - 1) % 4) + 1;
    return `./assets/novogram/${category}-${photo}.jpg`;
  }

  function nextId(items, prefix) {
    return AdminStore.nextId(items, prefix);
  }

  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.hidden = true; }, 2200);
  }

  function matches(text) {
    return String(text || '').toLowerCase().includes(state.query.toLowerCase());
  }

  function refreshCounts() {
    const posts = chapterPosts();
    const ids = chapterUserIds();
    $('#postsCount').textContent = posts.length;
    $('#usersCount').textContent = data().users.filter(u => ids.has(u.id) || postChapter(u) === state.chapter).length;
    $('#commentsCount').textContent = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
  }

  function setView(view) {
    state.view = view;
    state.selectedId = null;
    state.draft = null;
    state.isNew = false;
    document.querySelectorAll('.nga-nav').forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
    });
    const labels = {
      posts: ['Посты', 'Создание и редактирование ленты Novogram', '+ Новый пост'],
      users: ['Профили', 'Аккаунты жителей, организаций и персонажей', '+ Новый профиль'],
      comments: ['Комментарии', 'Все комментарии ко всем постам', '+ Новый комментарий'],
    };
    $('#viewTitle').textContent = labels[view][0];
    $('#viewSubtitle').textContent = labels[view][1];
    $('#createBtn').textContent = labels[view][2];
    closeEditor();
    renderList();
  }

  function closeEditor() {
    state.selectedId = null;
    state.draft = null;
    state.isNew = false;
    $('#editor').innerHTML = '<div class="nga-empty-editor"><strong>Выберите элемент</strong><span>или создайте новый</span></div>';
    document.querySelectorAll('.nga-item').forEach(item => item.classList.remove('selected'));
  }

  function renderList() {
    refreshCounts();
    if (state.view === 'posts') renderPostsList();
    if (state.view === 'users') renderUsersList();
    if (state.view === 'comments') renderCommentsList();
  }

  function renderPostsList() {
    const current = data();
    const posts = current.posts.filter(post => {
      if (!inChapter(post)) return false;
      const user = current.users.find(item => item.id === post.userId);
      return matches(`${post.caption} ${user?.username} ${user?.name} ${post.image?.label}`);
    });

    $('#content').innerHTML = posts.length ? `<div class="nga-list">${posts.map(post => {
      const user = current.users.find(item => item.id === post.userId);
      return `
        <button type="button" class="nga-item ${state.selectedId === post.id ? 'selected' : ''}" data-post="${esc(post.id)}">
          <img class="nga-thumb" src="${esc(imageSrc(post))}" alt="" />
          <span class="nga-item-main">
            <span class="nga-item-title">@${esc(user?.username || post.userId)}
              ${post.hiddenFromFeed ? '<span class="nga-badge hidden">скрыт</span>' : ''}
              ${post.prepared ? '<span class="nga-badge">prepared</span>' : ''}
            </span>
            <span class="nga-item-text">${esc(post.caption)}</span>
          </span>
          <span class="nga-item-meta">${post.comments?.length || 0} комм.<br>${esc(post.time || '—')}</span>
        </button>
      `;
    }).join('')}</div>` : '<div class="nga-empty">Посты не найдены</div>';

    document.querySelectorAll('[data-post]').forEach(button => {
      button.addEventListener('click', () => editPost(button.dataset.post));
    });
  }

  function renderUsersList() {
    const ids = chapterUserIds();
    const users = data().users
      .filter(user => ids.has(user.id) || postChapter(user) === state.chapter)
      .filter(user => matches(`${user.username} ${user.name} ${user.bio}`));
    $('#content').innerHTML = users.length ? `<div class="nga-list">${users.map(user => `
      <button type="button" class="nga-item ${state.selectedId === user.id ? 'selected' : ''}" data-user="${esc(user.id)}">
        <span class="nga-avatar" style="background:${esc(user.color || '#475569')}">${esc(user.avatar || '?')}</span>
        <span class="nga-item-main">
          <span class="nga-item-title">@${esc(user.username)} ${user.verified ? '<span class="nga-badge">verified</span>' : ''}</span>
          <span class="nga-item-text">${esc(user.name)} · ${esc(user.bio || '')}</span>
        </span>
        <span class="nga-item-meta">${user.posts || 0} постов<br>${user.followers || 0} подписчиков</span>
      </button>
    `).join('')}</div>` : '<div class="nga-empty">Профили не найдены</div>';

    document.querySelectorAll('[data-user]').forEach(button => {
      button.addEventListener('click', () => editUser(button.dataset.user));
    });
  }

  function renderCommentsList() {
    const current = data();
    const rows = [];
    current.posts.filter(inChapter).forEach(post => {
      const postUser = current.users.find(user => user.id === post.userId);
      (post.comments || []).forEach((comment, index) => {
        const author = current.users.find(user => user.id === comment.userId);
        if (!matches(`${comment.text} ${author?.username} ${post.caption}`)) return;
        rows.push({ post, postUser, comment, author, index });
      });
    });

    $('#content').innerHTML = rows.length ? `<div class="nga-list">${rows.map(row => `
      <button type="button" class="nga-item" data-comment-post="${esc(row.post.id)}" data-comment-index="${row.index}">
        <span class="nga-avatar" style="background:${esc(row.author?.color || '#475569')}">${esc(row.author?.avatar || '?')}</span>
        <span class="nga-item-main">
          <span class="nga-item-title">@${esc(row.author?.username || row.comment.userId)}</span>
          <span class="nga-item-text">${esc(row.comment.text)}</span>
        </span>
        <span class="nga-item-meta">к посту<br>@${esc(row.postUser?.username || row.post.userId)}</span>
      </button>
    `).join('')}</div>` : '<div class="nga-empty">Комментарии не найдены</div>';

    document.querySelectorAll('[data-comment-post]').forEach(button => {
      button.addEventListener('click', () => editPost(button.dataset.commentPost, Number(button.dataset.commentIndex)));
    });
  }

  function userOptions(selectedId) {
    return data().users.map(user => `
      <option value="${esc(user.id)}" ${user.id === selectedId ? 'selected' : ''}>@${esc(user.username)} — ${esc(user.name)}</option>
    `).join('');
  }

  function createPost() {
    const current = data();
    state.isNew = true;
    state.selectedId = null;
    state.draft = {
      id: nextId(current.posts, 'admin_post_'),
      userId: current.users[0]?.id || '',
      caption: '',
      likes: 0,
      time: 'сейчас',
      news: state.chapter === 2,
      filler: true,
      hiddenFromFeed: false,
      chapter: state.chapter,
      image: { src: '', label: 'Новоград' },
      comments: [],
    };
    renderPostEditor();
  }

  function editPost(id, focusComment = null) {
    const post = data().posts.find(item => item.id === id);
    if (!post) return;
    state.isNew = false;
    state.selectedId = id;
    state.draft = clone(post);
    state.draft.comments ||= [];
    state.draft.image ||= {};
    renderList();
    renderPostEditor(focusComment);
  }

  function collectComments() {
    return [...document.querySelectorAll('.nga-comment-row')].map((row, index) => ({
      id: row.dataset.commentId || `${state.draft.id}_comment_${Date.now()}_${index}`,
      userId: row.querySelector('[data-comment-user]').value,
      text: row.querySelector('[data-comment-text]').value.trim(),
      time: row.querySelector('[data-comment-time]').value.trim() || 'сейчас',
    })).filter(comment => comment.text);
  }

  function collectPostDraft() {
    const existingImage = state.draft.image || {};
    return {
      ...state.draft,
      id: $('#postId').value.trim(),
      userId: $('#postUser').value,
      caption: $('#postCaption').value.trim(),
      likes: Number($('#postLikes').value) || 0,
      time: $('#postTime').value.trim() || 'сейчас',
      news: $('#postNews').checked,
      filler: $('#postFiller').checked,
      hiddenFromFeed: $('#postHidden').checked,
      image: {
        ...existingImage,
        src: $('#postImageSrc').value.trim() || undefined,
        label: $('#postImageLabel').value.trim(),
      },
      comments: collectComments(),
    };
  }

  function renderPostEditor(focusComment = null) {
    const post = state.draft;
    $('#editor').innerHTML = `
      <div class="nga-editor-head">
        <h3>${state.isNew ? 'Новый пост' : 'Редактирование поста'}</h3>
        <button type="button" class="nga-btn nga-small" id="closeEditor">Закрыть</button>
      </div>
      <div class="nga-form">
        <img class="nga-preview" id="imagePreview" src="${esc(imageSrc(post))}" alt="" />
        <div class="nga-field"><label>ID</label><input id="postId" value="${esc(post.id)}" ${state.isNew ? '' : 'readonly'} /></div>
        <div class="nga-field"><label>Автор</label><select id="postUser">${userOptions(post.userId)}</select></div>
        <div class="nga-field"><label>Текст поста</label><textarea id="postCaption">${esc(post.caption)}</textarea></div>
        <div class="nga-field"><label>Путь или URL изображения</label><input id="postImageSrc" value="${esc(post.image?.src || '')}" placeholder="./assets/novogram/photo.jpg" /></div>
        <div class="nga-field">
          <label>Загрузить изображение</label>
          <input type="file" id="postImageFile" accept="image/*" />
        </div>
        <div class="nga-field"><label>Подпись на изображении</label><input id="postImageLabel" value="${esc(post.image?.label || '')}" /></div>
        <div class="nga-field"><label>Лайки</label><input id="postLikes" type="number" min="0" value="${post.likes || 0}" /></div>
        <div class="nga-field"><label>Время</label><input id="postTime" value="${esc(post.time || '')}" /></div>
        <label class="nga-check"><input type="checkbox" id="postNews" ${post.news ? 'checked' : ''} /> Новостной пост</label>
        <label class="nga-check"><input type="checkbox" id="postFiller" ${post.filler ? 'checked' : ''} /> Показывать как городской пост</label>
        <label class="nga-check"><input type="checkbox" id="postHidden" ${post.hiddenFromFeed ? 'checked' : ''} /> Скрыть из общей ленты</label>

        <h4 class="nga-section-title">Комментарии (${post.comments.length})</h4>
        <div class="nga-comments" id="commentsEditor">
          ${post.comments.map((comment, index) => commentRow(comment, index)).join('')}
        </div>
        <button type="button" class="nga-btn" id="addCommentBtn">+ Добавить комментарий</button>

        <div class="nga-actions">
          <button type="button" class="nga-btn nga-primary" id="savePostBtn">Сохранить</button>
          ${state.isNew ? '' : '<button type="button" class="nga-btn nga-danger" id="deletePostBtn">Удалить</button>'}
        </div>
      </div>
    `;

    $('#closeEditor').addEventListener('click', closeEditor);
    $('#postImageSrc').addEventListener('input', event => {
      $('#imagePreview').src = event.target.value || imageSrc(state.draft);
    });
    $('#postImageFile').addEventListener('change', handleImageUpload);
    $('#addCommentBtn').addEventListener('click', addComment);
    $('#savePostBtn').addEventListener('click', savePost);
    $('#deletePostBtn')?.addEventListener('click', deletePost);
    bindCommentDeletes();

    if (focusComment !== null) {
      document.querySelectorAll('.nga-comment-row')[focusComment]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function commentRow(comment, index) {
    return `
      <div class="nga-comment-row" data-comment-id="${esc(comment.id || '')}">
        <div class="nga-field"><label>Автор</label><select data-comment-user>${userOptions(comment.userId)}</select></div>
        <div class="nga-field"><label>Текст</label><textarea data-comment-text>${esc(comment.text)}</textarea></div>
        <div class="nga-comment-grid">
          <input data-comment-time value="${esc(comment.time || '')}" placeholder="Время" />
          <span></span>
          <button type="button" class="nga-btn nga-small nga-danger" data-remove-comment="${index}">Удалить</button>
        </div>
      </div>
    `;
  }

  function bindCommentDeletes() {
    document.querySelectorAll('[data-remove-comment]').forEach(button => {
      button.addEventListener('click', () => {
        state.draft = collectPostDraft();
        state.draft.comments.splice(Number(button.dataset.removeComment), 1);
        renderPostEditor();
      });
    });
  }

  function addComment() {
    state.draft = collectPostDraft();
    state.draft.comments.push({
      id: `${state.draft.id}_comment_${Date.now()}`,
      userId: data().users[0]?.id || '',
      text: '',
      time: 'сейчас',
    });
    renderPostEditor(state.draft.comments.length - 1);
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 1080, .82);
      $('#postImageSrc').value = dataUrl;
      $('#imagePreview').src = dataUrl;
      toast('Изображение подготовлено');
    } catch {
      alert('Не удалось обработать изображение');
    }
  }

  function resizeImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => { image.src = reader.result; };
      image.onerror = reject;
      image.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      reader.readAsDataURL(file);
    });
  }

  function savePost() {
    const post = collectPostDraft();
    if (!post.id || !post.userId || !post.caption) {
      alert('Заполните ID, автора и текст');
      return;
    }
    AdminStore.upsertNovogramPost(post);
    state.isNew = false;
    state.selectedId = post.id;
    state.draft = post;
    toast('Пост сохранён');
    renderList();
    renderPostEditor();
  }

  function deletePost() {
    if (!confirm('Удалить этот пост?')) return;
    AdminStore.deleteNovogramPost(state.draft.id);
    closeEditor();
    renderList();
    toast('Пост удалён');
  }

  function createUser() {
    state.isNew = true;
    state.selectedId = null;
    state.draft = {
      id: nextId(data().users, 'admin_user_'),
      username: '',
      name: '',
      bio: 'Новоград',
      avatar: 'Н',
      color: '#7c5cff',
      posts: 0,
      followers: 0,
      following: 0,
      verified: false,
      filler: true,
      prepared: true,
      chapter: state.chapter,
    };
    renderUserEditor();
  }

  function editUser(id) {
    const user = data().users.find(item => item.id === id);
    if (!user) return;
    state.isNew = false;
    state.selectedId = id;
    state.draft = clone(user);
    renderList();
    renderUserEditor();
  }

  function renderUserEditor() {
    const user = state.draft;
    $('#editor').innerHTML = `
      <div class="nga-editor-head">
        <h3>${state.isNew ? 'Новый профиль' : 'Редактирование профиля'}</h3>
        <button type="button" class="nga-btn nga-small" id="closeEditor">Закрыть</button>
      </div>
      <div class="nga-form">
        <div class="nga-field"><label>ID</label><input id="userId" value="${esc(user.id)}" ${state.isNew ? '' : 'readonly'} /></div>
        <div class="nga-field"><label>Username</label><input id="userUsername" value="${esc(user.username)}" /></div>
        <div class="nga-field"><label>Имя</label><input id="userName" value="${esc(user.name)}" /></div>
        <div class="nga-field"><label>Bio</label><textarea id="userBio">${esc(user.bio || '')}</textarea></div>
        <div class="nga-field"><label>Аватар (буква)</label><input id="userAvatar" maxlength="2" value="${esc(user.avatar || '')}" /></div>
        <div class="nga-field"><label>Цвет</label><input id="userColor" type="color" value="${esc(user.color || '#7c5cff')}" /></div>
        <div class="nga-field"><label>Подписчики</label><input id="userFollowers" type="number" min="0" value="${user.followers || 0}" /></div>
        <div class="nga-field"><label>Подписки</label><input id="userFollowing" type="number" min="0" value="${user.following || 0}" /></div>
        <label class="nga-check"><input id="userVerified" type="checkbox" ${user.verified ? 'checked' : ''} /> Верифицирован</label>
        <div class="nga-actions">
          <button type="button" class="nga-btn nga-primary" id="saveUserBtn">Сохранить</button>
          ${state.isNew ? '' : '<button type="button" class="nga-btn nga-danger" id="deleteUserBtn">Удалить</button>'}
        </div>
      </div>
    `;
    $('#closeEditor').addEventListener('click', closeEditor);
    $('#saveUserBtn').addEventListener('click', saveUser);
    $('#deleteUserBtn')?.addEventListener('click', deleteUser);
  }

  function saveUser() {
    const existing = state.draft;
    const user = {
      ...existing,
      id: $('#userId').value.trim(),
      username: $('#userUsername').value.trim().replace(/^@/, ''),
      name: $('#userName').value.trim(),
      bio: $('#userBio').value.trim(),
      avatar: $('#userAvatar').value.trim() || 'Н',
      color: $('#userColor').value,
      followers: Number($('#userFollowers').value) || 0,
      following: Number($('#userFollowing').value) || 0,
      verified: $('#userVerified').checked,
      posts: data().posts.filter(post => post.userId === existing.id).length,
    };
    if (!user.id || !user.username || !user.name) {
      alert('Заполните ID, username и имя');
      return;
    }
    AdminStore.upsertNovogramUser(user);
    state.isNew = false;
    state.selectedId = user.id;
    state.draft = user;
    toast('Профиль сохранён');
    renderList();
    renderUserEditor();
  }

  function deleteUser() {
    const posts = data().posts.filter(post => post.userId === state.draft.id).length;
    if (!confirm(`Удалить профиль и его посты (${posts})?`)) return;
    AdminStore.deleteNovogramUser(state.draft.id);
    closeEditor();
    renderList();
    toast('Профиль удалён');
  }

  function createForCurrentView() {
    if (state.view === 'posts') createPost();
    if (state.view === 'users') createUser();
    if (state.view === 'comments') {
      const firstPost = data().posts[0];
      if (!firstPost) return alert('Сначала создайте пост');
      editPost(firstPost.id);
      addComment();
    }
  }

  function exportData() {
    const payload = {
      format: 'novogram-admin-v1',
      exportedAt: new Date().toISOString(),
      overrides: AdminStore.loadNovogramOverrides(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'novogram-admin.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const overrides = payload.overrides || payload.novogram || payload;
      if (!Array.isArray(overrides.users) || !Array.isArray(overrides.posts)) {
        throw new Error('Нет данных Novogram');
      }
      AdminStore.saveNovogramOverrides(overrides);
      closeEditor();
      renderList();
      toast('Данные импортированы');
    } catch (error) {
      alert(`Ошибка импорта: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  }

  function resetData() {
    if (!confirm('Удалить все изменения, сделанные через админку Novogram?')) return;
    AdminStore.resetNovogramOverrides();
    closeEditor();
    renderList();
    toast('Правки сброшены');
  }

  function setChapter(chapter) {
    state.chapter = Number(chapter) === 2 ? 2 : 1;
    document.querySelectorAll('.nga-state-tab').forEach(tab => {
      tab.classList.toggle('active', Number(tab.dataset.chapter) === state.chapter);
    });
    closeEditor();
    renderList();
  }

  function init() {
    document.querySelectorAll('.nga-state-tab').forEach(tab => {
      tab.addEventListener('click', () => setChapter(tab.dataset.chapter));
    });
    document.querySelectorAll('.nga-nav').forEach(button => {
      button.addEventListener('click', () => setView(button.dataset.view));
    });
    $('#searchInput').addEventListener('input', event => {
      state.query = event.target.value;
      renderList();
    });
    $('#createBtn').addEventListener('click', createForCurrentView);
    $('#exportBtn').addEventListener('click', exportData);
    $('#importInput').addEventListener('change', importData);
    $('#resetBtn').addEventListener('click', resetData);
    setView('posts');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
