/** Локальное приложение Novogram — вход, лента новостей, профили, комментарии. */
(function () {
  const STORAGE_KEY = 'dym_novogram_extra_comments_v1';
  const LIKED_KEY = 'dym_novogram_liked_v1';
  const SESSION_KEY = 'dym_novogram_session_v1';

  let view = 'login'; // login | feed | search | profile | post | user
  let activePostId = null;
  let activeUserId = null;
  let postReturnView = 'feed';
  let commentDraft = '';
  let loginError = '';
  let loginUser = '';
  let loginPass = '';

  function esc(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentChapter() {
    return window.StoryState ? StoryState.getChapter() : 1;
  }

  function seed() {
    const base = window.NovogramSeed || { users: [], posts: [], viewerId: null, auth: null, newsAccounts: [] };
    const data = window.AdminStore?.getNovogramData ? AdminStore.getNovogramData(base) : base;
    const chapter = currentChapter();

    // Посты текущей главы: без явной пометки = глава 1.
    const seenImages = new Set();
    const posts = data.posts
      .filter(post => (post.chapter || 1) === chapter)
      .filter(post => {
        const key = photoFingerprint(photoSrc(post));
        if (seenImages.has(key)) return false;
        seenImages.add(key);
        return true;
      });

    // Пользователи: зритель + авторы, у которых есть посты в текущей главе.
    const activeIds = new Set(posts.map(p => p.userId));
    if (data.viewerId) activeIds.add(data.viewerId);
    const users = data.users.filter(u => activeIds.has(u.id));
    const newsAccounts = (data.newsAccounts || []).filter(id => activeIds.has(id));

    return { ...data, users, posts, newsAccounts };
  }

  const TIME_FALLBACK = ['4 ч', '6 ч', '8 ч', '11 ч', '14 ч', '1 д', '1 д', '2 д'];

  function postTime(post) {
    if (post && post.time) return post.time;
    const id = String(post?.id || '');
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return TIME_FALLBACK[hash % TIME_FALLBACK.length];
  }

  function isLoggedIn() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return session?.username === seed().auth?.username;
    } catch {
      return false;
    }
  }

  function setSession(username) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, at: Date.now() }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function loadExtraComments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveExtraComments(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function loadLiked() {
    try {
      return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function saveLiked(set) {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
  }

  function userById(id) {
    return seed().users.find(u => u.id === id) || null;
  }

  function userByUsername(name) {
    const key = String(name || '').replace(/^@/, '').toLowerCase();
    return seed().users.find(u => String(u.username).toLowerCase() === key) || null;
  }

  function postById(id) {
    return seed().posts.find(p => p.id === id) || null;
  }

  function commentsFor(post) {
    const extra = loadExtraComments()[post.id] || [];
    return [...(post.comments || []), ...extra];
  }

  function postsByUser(userId) {
    return seed().posts.filter(p => p.userId === userId);
  }

  function newsPosts() {
    const storyIds = new Set(seed().newsAccounts || []);
    const fillerIds = new Set(seed().fillerAccountIds || []);
    const visiblePosts = seed().posts.filter(p => !p.hiddenFromFeed);
    const story = visiblePosts.filter(p => (p.news && !p.filler) || storyIds.has(p.userId));
    const filler = visiblePosts.filter(p => p.filler || fillerIds.has(p.userId));
    const ordered = [...story, ...filler];
    const seenImages = new Set();
    return ordered.filter(post => {
      const key = photoFingerprint(photoSrc(post));
      if (seenImages.has(key)) return false;
      seenImages.add(key);
      return true;
    });
  }

  function formatText(text) {
    const raw = String(text ?? '');
    const parts = [];
    const re = /@([A-Za-z0-9_.\u0400-\u04FF]+)/g;
    let last = 0;
    let m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) parts.push(esc(raw.slice(last, m.index)));
      const user = userByUsername(m[1]);
      if (user) {
        parts.push(
          `<button type="button" class="ng-mention" data-ng-user="${esc(user.id)}">@${esc(user.username)}</button>`
        );
      } else {
        parts.push(esc(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < raw.length) parts.push(esc(raw.slice(last)));
    return parts.join('');
  }

  function avatarHtml(user, sizeClass) {
    if (!user) return `<span class="ng-avatar ${sizeClass || ''}">?</span>`;
    return `<span class="ng-avatar ${sizeClass || ''}" style="background:${esc(user.color)}">${esc(user.avatar)}</span>`;
  }

  function photoHash(id) {
    const s = String(id || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const PHOTO_CATEGORIES = [
    'food', 'dessert', 'coffee', 'tea', 'car', 'city', 'books', 'cat', 'dog',
    'weather', 'snow', 'garden', 'music', 'sport', 'bike', 'yoga', 'office',
    'fishing', 'bread', 'travel', 'dance', 'market', 'art', 'court', 'news',
    'school', 'hobby', 'night',
  ];

  function detectCategory(post) {
    const comments = (post?.comments || []).map(c => c.text).join(' ');
    const text = `${post?.caption || ''} ${comments} ${post?.image?.label || ''}`.toLowerCase();
    const rules = [
      [/кофе|латте|капуч|эспрессо|бариста|cafe|круассан|фильтр-кофе/, 'coffee'],
      [/чай|мята/, 'tea'],
      [/торт|кекс|чизкейк|десерт|шоколад|глазур|сладк|булочк/, 'dessert'],
      [/борщ|сырник|пирог|ужин|обед|кухн|паста|блин|рецепт|сковород|заготовк|курица|салат|зелень/, 'food'],
      [/хлеб|батон|булоч|пекарн|ржаной|пирожок/, 'bread'],
      [/рынок|овощ|зелен|яблок|мёд|морков|фермер/, 'market'],
      [/машин|дорог|парков|бензин|резин|трафик|аккумулятор|заправ|разметк/, 'car'],
      [/велосипед|вело|колесо|шлем|самокат/, 'bike'],
      [/кот|кошк|ошейник|парадн/, 'cat'],
      [/пёс|собак|питомец|приют|хвост/, 'dog'],
      [/книг|библиотек|рассказ|читал|полк|автор|детектив|блокнот/, 'books'],
      [/снего|мороз|гололёд|зим|антициклон/, 'snow'],
      [/погод|ветер|туман|закат|влажност|прогноз|небо|ясн/, 'weather'],
      [/сад|клумб|рассад|дач|яблон|семена|тюльпан|черенк|грядк|перц/, 'garden'],
      [/концерт|плейлист|джаз|гитар|музык|винил|микрофон|песн|бас/, 'music'],
      [/пробежк|футбол|матч|спорт|тренир|плаван|хоккей|разминк|зал /, 'sport'],
      [/йога|асан|дыхани|коврик|практик/, 'yoga'],
      [/танц|хореограф|репетиц/, 'dance'],
      [/митап|код|сервер|python|wifi|wi‑fi|ваканси|хакатон|резюме|бэкап/, 'office'],
      [/офис|ноутбук|переговор/, 'office'],
      [/рыбалк|удочк|окун|щук|клёв|берег/, 'fishing'],
      [/поездк|маршрут|навигатор|отпуск|выезд/, 'travel'],
      [/школ|портфел|контрол|уроки|собрани|каникул|буфет|линейк/, 'school'],
      [/пазл|модель|рукодел|хобби|бусин|сборк|открытк|миниатюр/, 'hobby'],
      [/картин|холст|живопис|выставк|художн/, 'art'],
      [/суд|защит|обвинен|адвокат|процесс|ходатайств|верси/, 'court'],
      [/срочно|убийств|подозрева|полици|следстви|новост|газет|материал/, 'news'],
      [/ночь|ночной|фонар/, 'night'],
      [/город|набережн|улиц|мост|новоград|здание|витрин/, 'city'],
    ];
    for (const [re, cat] of rules) {
      if (re.test(text)) return cat;
    }
    if (post?.image?.category && PHOTO_CATEGORIES.includes(post.image.category)) {
      return post.image.category;
    }
    return 'city';
  }

  function photoSrc(post) {
    if (post?.image?.src) return post.image.src;
    const cat = detectCategory(post);
    const explicit = Number(post?.image?.photo);
    const variant = Number.isFinite(explicit) && explicit > 0
      ? ((Math.floor(explicit) - 1) % 4) + 1
      : (photoHash(post?.id) % 4) + 1;
    return `./assets/novogram/${cat}-${variant}.jpg`;
  }

  function photoFingerprint(path) {
    const normalized = String(path || '').replace(/^\.\//, '');
    return window.NovogramPhotoFingerprints?.[normalized] || normalized;
  }

  function photoHtml(post, big) {
    const img = post.image || {};
    return `
      <div class="ng-photo ${big ? 'ng-photo-lg' : ''}">
        <img class="ng-photo-img" src="${esc(photoSrc(post))}" alt="" loading="lazy" decoding="async" draggable="false" />
        ${img.label ? `<span class="ng-photo-label">${esc(img.label)}</span>` : ''}
      </div>
    `;
  }

  function iconHome(active) {
    return active
      ? '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>';
  }

  function iconSearch(active) {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${active ? '2.4' : '1.8'}"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
  }

  function iconUser(active) {
    return active
      ? '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>';
  }

  function header(title, opts = {}) {
    const back = opts.back
      ? `<button type="button" class="ng-back" data-ng-back aria-label="Назад">
           <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
           <span class="ng-back-label">Назад</span>
         </button>`
      : `<button type="button" class="ng-back" data-ng-close aria-label="Закрыть Novagram">
           <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
           <span class="ng-back-label">Закрыть</span>
         </button>`;
    return `
      <div class="ng-header">
        ${back}
        <h1 class="ng-title ${opts.logo ? 'ng-logo' : ''}">${opts.logo ? 'Novagram' : esc(title)}</h1>
        <span class="ng-header-spacer"></span>
      </div>
    `;
  }

  function tabBar() {
    return `
      <nav class="ng-tabs">
        <button type="button" class="ng-tab ${view === 'feed' ? 'active' : ''}" data-ng-tab="feed" aria-label="Лента">${iconHome(view === 'feed')}</button>
        <button type="button" class="ng-tab ${view === 'search' ? 'active' : ''}" data-ng-tab="search" aria-label="Поиск">${iconSearch(view === 'search')}</button>
        <button type="button" class="ng-tab ${view === 'profile' ? 'active' : ''}" data-ng-tab="profile" aria-label="Профиль">${iconUser(view === 'profile')}</button>
      </nav>
    `;
  }

  function loginHtml() {
    return `
      <div class="ng-header">
        <button type="button" class="ng-back" data-ng-close aria-label="Закрыть Novagram">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          <span class="ng-back-label">Закрыть</span>
        </button>
        <h1 class="ng-title ng-logo">Novagram</h1>
        <span class="ng-header-spacer"></span>
      </div>
      <div class="ng-body ng-login-body">
        <div class="ng-login-card">
          <div class="ng-login-brand">Novagram</div>
          <p class="ng-login-sub">Войдите, чтобы читать ленту новостей Новограда</p>
          <form class="ng-login-form" data-ng-login>
            <input type="text" id="ngLoginUser" name="username" placeholder="Имя пользователя" autocomplete="username" value="${esc(loginUser)}" />
            <input type="password" id="ngLoginPass" name="password" placeholder="Пароль" autocomplete="current-password" value="${esc(loginPass)}" />
            ${loginError ? `<p class="ng-login-error">${esc(loginError)}</p>` : ''}
            <button type="submit" class="ng-login-btn">Войти</button>
          </form>
        </div>
      </div>
    `;
  }

  function newsSourcesHtml() {
    const sources = (seed().newsAccounts || []).map(id => userById(id)).filter(Boolean);
    const fillerCount = (seed().fillerAccountIds || []).length;
    return `
      <div class="ng-news-bar">
        <div class="ng-news-bar-title">Лента новостей</div>
        <div class="ng-news-sources">
          ${sources.map(u => `
            <button type="button" class="ng-news-chip" data-ng-user="${esc(u.id)}">
              ${avatarHtml(u, 'ng-avatar-xs')}
              <span>@${esc(u.username)}</span>
            </button>
          `).join('')}
          ${fillerCount ? `<span class="ng-news-chip ng-news-chip-muted">+${fillerCount} городских</span>` : ''}
        </div>
      </div>
    `;
  }

  function postCardHtml(post) {
    const user = userById(post.userId);
    const liked = loadLiked().has(post.id);
    const comments = commentsFor(post);
    const likes = post.likes + (liked ? 1 : 0);
    return `
      <article class="ng-post ${post.news ? 'ng-post-news' : ''}" data-post-id="${esc(post.id)}">
        <div class="ng-post-top">
          <button type="button" class="ng-post-user" data-ng-user="${esc(post.userId)}">
            ${avatarHtml(user, 'ng-avatar-sm')}
            <span>@${esc(user?.username || 'user')}${user?.verified ? ' <span class="ng-badge" aria-label="Подтверждён">✓</span>' : ''}</span>
          </button>
          <span class="ng-post-time">${esc(postTime(post))}</span>
        </div>
        <button type="button" class="ng-post-media" data-ng-open-post="${esc(post.id)}" aria-label="Открыть пост">
          ${photoHtml(post)}
        </button>
        <div class="ng-post-actions">
          <button type="button" class="ng-action ${liked ? 'liked' : ''}" data-ng-like="${esc(post.id)}" aria-label="Нравится">
            ${liked
              ? '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ed4956" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
              : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-9.5-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z"/></svg>'}
          </button>
          <button type="button" class="ng-action" data-ng-open-post="${esc(post.id)}" aria-label="Комментарии">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H5l-3 3V12A8.5 8.5 0 1 1 21 12z"/></svg>
          </button>
        </div>
        <div class="ng-post-likes">${likes.toLocaleString('ru-RU')} отметок «Нравится»</div>
        <div class="ng-post-caption">
          <strong data-ng-user="${esc(post.userId)}">${esc(user?.username || '')}</strong>
          ${formatText(post.caption)}
        </div>
        ${comments.length ? `
          <button type="button" class="ng-view-comments" data-ng-open-post="${esc(post.id)}">
            Смотреть комментарии (${comments.length})
          </button>
        ` : ''}
      </article>
    `;
  }

  function feedHtml() {
    const posts = newsPosts();
    return `
      ${header('Novagram', { logo: true })}
      <div class="ng-body">
        ${newsSourcesHtml()}
        <div class="ng-feed">
          ${posts.length ? posts.map(postCardHtml).join('') : '<p class="ng-empty">Нет новостей</p>'}
        </div>
      </div>
      ${tabBar()}
    `;
  }

  function searchHtml() {
    const users = seed().users;
    return `
      ${header('Поиск')}
      <div class="ng-body">
        <div class="ng-search-list">
          ${users.map(u => `
            <button type="button" class="ng-user-row" data-ng-user="${esc(u.id)}">
              ${avatarHtml(u, 'ng-avatar-md')}
              <span class="ng-user-meta">
                <strong>@${esc(u.username)}</strong>
                <small>${esc(u.name)}</small>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
      ${tabBar()}
    `;
  }

  function profileHtml(userId) {
    const user = userById(userId) || userById(seed().viewerId);
    if (!user) return `<div class="ng-body"><p class="ng-empty">Пользователь не найден</p></div>`;
    const posts = postsByUser(user.id);
    const isOwn = user.id === seed().viewerId && view === 'profile';
    return `
      ${header(user.username, { back: !isOwn && view === 'user' })}
      <div class="ng-body">
        <div class="ng-profile">
          ${avatarHtml(user, 'ng-avatar-lg')}
          <div class="ng-profile-stats">
            <div><strong>${posts.length}</strong><span>постов</span></div>
            <div><strong>${user.followers.toLocaleString('ru-RU')}</strong><span>подписчиков</span></div>
            <div><strong>${user.following}</strong><span>подписок</span></div>
          </div>
        </div>
        <div class="ng-profile-bio">
          <strong>${esc(user.name)}${user.verified ? ' <span class="ng-badge">✓</span>' : ''}</strong>
          <p>${esc(user.bio)}</p>
        </div>
        ${isOwn ? '<button type="button" class="ng-logout" data-ng-logout>Выйти</button>' : ''}
        <div class="ng-grid">
          ${posts.length ? posts.map(p => `
            <button type="button" class="ng-grid-item" data-ng-open-post="${esc(p.id)}" aria-label="Пост">
              ${photoHtml(p)}
            </button>
          `).join('') : '<p class="ng-empty">Нет публикаций</p>'}
        </div>
      </div>
      ${isOwn || view === 'profile' ? tabBar() : ''}
    `;
  }

  function postDetailHtml(postId) {
    const post = postById(postId);
    if (!post) return `<div class="ng-body"><p class="ng-empty">Пост не найден</p></div>`;
    const user = userById(post.userId);
    const comments = commentsFor(post);
    const liked = loadLiked().has(post.id);
    const likes = post.likes + (liked ? 1 : 0);
    return `
      ${header('Публикация', { back: true })}
      <div class="ng-body ng-post-detail">
        <div class="ng-post-top">
          <button type="button" class="ng-post-user" data-ng-user="${esc(post.userId)}">
            ${avatarHtml(user, 'ng-avatar-sm')}
            <span>@${esc(user?.username || '')}</span>
          </button>
          <span class="ng-post-time">${esc(postTime(post))}</span>
        </div>
        ${photoHtml(post, true)}
        <div class="ng-post-actions">
          <button type="button" class="ng-action ${liked ? 'liked' : ''}" data-ng-like="${esc(post.id)}" aria-label="Нравится">
            ${liked
              ? '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ed4956" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
              : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-9.5-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z"/></svg>'}
          </button>
        </div>
        <div class="ng-post-likes">${likes.toLocaleString('ru-RU')} отметок «Нравится»</div>
        <div class="ng-post-caption">
          <strong data-ng-user="${esc(post.userId)}">${esc(user?.username || '')}</strong>
          ${formatText(post.caption)}
        </div>
        <div class="ng-comments-title">Комментарии</div>
        <div class="ng-comments">
          ${comments.length ? comments.map(c => {
            const cu = userById(c.userId);
            return `
              <div class="ng-comment">
                ${avatarHtml(cu, 'ng-avatar-xs')}
                <div class="ng-comment-body">
                  <p><strong data-ng-user="${esc(c.userId)}">${esc(cu?.username || 'user')}</strong> ${formatText(c.text)}</p>
                  <span class="ng-comment-time">${esc(c.time || 'сейчас')}</span>
                </div>
              </div>
            `;
          }).join('') : '<p class="ng-empty">Пока нет комментариев</p>'}
        </div>
      </div>
      <form class="ng-comment-bar" data-ng-comment-form>
        ${avatarHtml(userById(seed().viewerId), 'ng-avatar-xs')}
        <input type="text" id="ngCommentInput" placeholder="Добавить комментарий…" autocomplete="off" value="${esc(commentDraft)}" />
        <button type="submit" ${commentDraft.trim() ? '' : 'disabled'}>Опубл.</button>
      </form>
    `;
  }

  function tryLogin(username, password) {
    const auth = seed().auth || {};
    if (username === auth.username && password === auth.password) {
      setSession(username);
      loginError = '';
      loginUser = '';
      loginPass = '';
      view = 'feed';
      render();
      return;
    }
    loginError = 'Неверный логин или пароль';
    loginUser = username;
    loginPass = password;
    render();
  }

  function logout() {
    clearSession();
    view = 'login';
    activePostId = null;
    activeUserId = null;
    commentDraft = '';
    loginError = '';
    render();
  }

  function render() {
    const screen = document.getElementById('novogramApp');
    if (!screen) return;

    if (!isLoggedIn()) {
      view = 'login';
    }

    let html = '';
    if (view === 'login') html = loginHtml();
    else if (view === 'feed') html = feedHtml();
    else if (view === 'search') html = searchHtml();
    else if (view === 'profile') html = profileHtml(seed().viewerId);
    else if (view === 'user') html = profileHtml(activeUserId);
    else if (view === 'post') html = postDetailHtml(activePostId);
    else html = feedHtml();

    screen.innerHTML = html;
    bind(screen);
  }

  function goBack() {
    if (view === 'post') {
      view = postReturnView === 'user' && activeUserId ? 'user' : (postReturnView || 'feed');
      if (view !== 'user') activeUserId = null;
      activePostId = null;
      commentDraft = '';
      render();
      return;
    }
    if (view === 'user') {
      view = postReturnView === 'feed' || postReturnView === 'post' ? 'feed' : 'search';
      activeUserId = null;
      render();
      return;
    }
    close();
  }

  function close() {
    view = isLoggedIn() ? 'feed' : 'login';
    activePostId = null;
    activeUserId = null;
    postReturnView = 'feed';
    commentDraft = '';
    if (typeof showScreen === 'function') showScreen('homeScreen');
  }

  function toggleLike(postId) {
    const liked = loadLiked();
    if (liked.has(postId)) liked.delete(postId);
    else liked.add(postId);
    saveLiked(liked);
    render();
  }

  function addComment(postId, text) {
    const map = loadExtraComments();
    if (!map[postId]) map[postId] = [];
    map[postId].push({
      id: `local-${Date.now()}`,
      userId: seed().viewerId,
      text: text.trim(),
      time: 'сейчас',
    });
    saveExtraComments(map);
    commentDraft = '';
    render();
  }

  function bind(screen) {
    screen.querySelector('[data-ng-close]')?.addEventListener('click', close);
    screen.querySelector('[data-ng-back]')?.addEventListener('click', goBack);
    screen.querySelector('[data-ng-logout]')?.addEventListener('click', logout);

    const loginForm = screen.querySelector('[data-ng-login]');
    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = screen.querySelector('#ngLoginUser')?.value?.trim() || '';
        const pass = screen.querySelector('#ngLoginPass')?.value || '';
        tryLogin(user, pass);
      });
    }

    screen.querySelectorAll('[data-ng-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        view = btn.dataset.ngTab;
        activePostId = null;
        activeUserId = null;
        commentDraft = '';
        render();
      });
    });

    screen.querySelectorAll('[data-ng-user]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const id = el.getAttribute('data-ng-user');
        if (!id) return;
        postReturnView = view === 'post' ? 'post' : view;
        if (id === seed().viewerId) {
          view = 'profile';
          activeUserId = null;
        } else {
          view = 'user';
          activeUserId = id;
        }
        render();
      });
    });

    screen.querySelectorAll('[data-ng-open-post]').forEach(el => {
      el.addEventListener('click', () => {
        postReturnView = view === 'post' ? postReturnView : view;
        activePostId = el.getAttribute('data-ng-open-post');
        view = 'post';
        commentDraft = '';
        render();
        const input = document.getElementById('ngCommentInput');
        if (input) setTimeout(() => input.focus(), 50);
      });
    });

    screen.querySelectorAll('[data-ng-like]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        toggleLike(el.getAttribute('data-ng-like'));
      });
    });

    const form = screen.querySelector('[data-ng-comment-form]');
    const input = screen.querySelector('#ngCommentInput');
    if (form && input) {
      input.addEventListener('input', () => {
        commentDraft = input.value;
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = !commentDraft.trim();
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !activePostId) return;
        addComment(activePostId, text);
      });
    }
  }

  function open() {
    activePostId = null;
    activeUserId = null;
    postReturnView = 'feed';
    commentDraft = '';
    loginError = '';
    view = isLoggedIn() ? 'feed' : 'login';
    if (typeof showScreen === 'function') showScreen('novogramApp');
    render();
  }

  if (window.StoryState) {
    StoryState.onChange(() => {
      const screen = document.getElementById('novogramApp');
      if (screen && screen.classList.contains('active')) {
        view = isLoggedIn() ? 'feed' : 'login';
        activePostId = null;
        activeUserId = null;
        render();
      }
    });
  }

  window.NovogramApp = { open, render };
})();
