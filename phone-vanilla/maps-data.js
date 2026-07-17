/**
 * Данные навигатора Новограда — сетка А–Р / 10–110 (буклет «Золотой»).
 * Только публичные POI; цель главы 2 появляется после верного ввода.
 */
(function () {
  const COLS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р'];
  const ROWS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  const VIEW = { w: 100, h: 100, pad: 6 };

  /** CONFIG — правится автором; answer = плейсхолдер, каноном не зафиксирован. */
  const CONFIG = {
    target: {
      answer: ['П-100'],
      label: 'Загородный дом, оз. Голубое',
      chapterUnlock: 2,
      col: 'П',
      row: 100,
    },
    onFail: 'Точка не найдена в данном районе.',
    hintAfter: 4,
    hintText: 'Шеф: сверьте расшифровку с ключом-рисунком ещё раз…',
  };

  const CATEGORIES = {
    office: 'Учреждения',
    medical: 'Медицина',
    shop: 'Торговля',
    media: 'СМИ',
    transport: 'Транспорт',
    police: 'Полиция',
    park: 'Отдых',
    landmark: 'Город',
    post: 'Связь',
    cafe: 'Кафе',
    education: 'Образование',
    culture: 'Культура',
    sport: 'Спорт',
    hotel: 'Гостиницы',
    target: 'Цель',
  };

  /** Публичные пины (цель главы — скрыта до reveal). */
  const POI = [
    { id: 'bureau', name: 'Бюро «Новоград-Право»', addr: 'Центр, контора игроков', cat: 'office', icon: '⚖', col: 'Ж', row: 50, youAreHere: true },
    { id: 'prozrenie', name: 'Клиника «ProЗрение»', addr: 'ул. Профессора Кравцова, 14 к.2', cat: 'medical', icon: '🏥', col: 'Е', row: 60 },
    { id: 'meridian', name: 'ТЦ «Меридиан»', addr: 'ул. Гагарина', cat: 'shop', icon: '🛍', col: 'И', row: 40 },
    { id: 'vesti', name: 'Редакция «Озёрские вести»', addr: 'пл. Редакционная', cat: 'media', icon: '📰', col: 'З', row: 40 },
    { id: 'station', name: 'Ж/д вокзал', addr: 'Привокзальная площадь', cat: 'transport', icon: '🚂', col: 'В', row: 80 },
    { id: 'ovd', name: 'ОВД', addr: 'ул. Советская', cat: 'police', icon: '🚓', col: 'Д', row: 50 },
    { id: 'park', name: 'Городской парк', addr: 'парк Новограда', cat: 'park', icon: '🌳', col: 'К', row: 30 },
    { id: 'embankment', name: 'Набережная', addr: 'наб. Речная', cat: 'park', icon: '🌊', col: 'Б', row: 60 },
    { id: 'square', name: 'Центральная площадь', addr: 'пл. Центральная', cat: 'landmark', icon: '🏛', col: 'Ж', row: 40 },
    { id: 'hospital', name: 'Городская больница №1', addr: 'ул. Медицинская', cat: 'medical', icon: '➕', col: 'Л', row: 70 },
    { id: 'post', name: 'Почтамт', addr: 'ул. Почтовая', cat: 'post', icon: '✉', col: 'Г', row: 40 },
    { id: 'market', name: 'Центральный рынок', addr: 'ул. Торговая', cat: 'shop', icon: '🏪', col: 'Е', row: 40 },
    { id: 'pharmacy', name: 'Аптека «Озёрная»', addr: 'ул. Садовая', cat: 'medical', icon: '💊', col: 'И', row: 60 },
    { id: 'bus', name: 'Автовокзал', addr: 'ул. Вокзальная', cat: 'transport', icon: '🚌', col: 'А', row: 70 },
    { id: 'library', name: 'Городская библиотека', addr: 'ул. Книжная', cat: 'culture', icon: '📚', col: 'З', row: 50 },
    { id: 'museum', name: 'Краеведческий музей', addr: 'пл. Историческая', cat: 'culture', icon: '🏛', col: 'Ж', row: 30 },
    { id: 'school', name: 'Школа №3', addr: 'ул. Школьная', cat: 'education', icon: '🏫', col: 'Л', row: 40 },
    { id: 'uni', name: 'Политехнический колледж', addr: 'ул. Студенческая', cat: 'education', icon: '🎓', col: 'М', row: 50 },
    { id: 'cafe-sever', name: 'Кафе «Север»', addr: 'ул. Северная', cat: 'cafe', icon: '☕', col: 'Д', row: 30 },
    { id: 'cafe-ozero', name: 'Кофейня «У озера»', addr: 'наб. Речная', cat: 'cafe', icon: '☕', col: 'Б', row: 50 },
    { id: 'stadium', name: 'Стадион «Новоград»', addr: 'ул. Спортивная', cat: 'sport', icon: '⚽', col: 'Н', row: 70 },
    { id: 'pool', name: 'Бассейн «Волна»', addr: 'ул. Молодёжная', cat: 'sport', icon: '🏊', col: 'К', row: 60 },
    { id: 'hotel', name: 'Гостиница «Озёрская»', addr: 'ул. Центральная', cat: 'hotel', icon: '🏨', col: 'З', row: 30 },
    { id: 'cinema', name: 'Кинотеатр «Радуга»', addr: 'ул. Киношная', cat: 'culture', icon: '🎬', col: 'И', row: 50 },
    { id: 'fire', name: 'Пожарная часть №2', addr: 'ул. Пожарная', cat: 'office', icon: '🚒', col: 'В', row: 50 },
    { id: 'bank', name: 'Банк «Новоград»', addr: 'ул. Финансовая', cat: 'office', icon: '🏦', col: 'Е', row: 50 },
    { id: 'gas', name: 'АЗС «Путь»', addr: 'ул. Объездная', cat: 'transport', icon: '⛽', col: 'Р', row: 60 },
    { id: 'cemetery', name: 'Городское кладбище', addr: 'ул. Тихая', cat: 'landmark', icon: '🪦', col: 'О', row: 90 },
    { id: 'port', name: 'Речной причал', addr: 'наб. Речная', cat: 'transport', icon: '⚓', col: 'А', row: 50 },
    { id: 'bakery', name: 'Пекарня «Утро»', addr: 'ул. Хлебная', cat: 'cafe', icon: '🥐', col: 'Г', row: 60 },
    { id: 'mall-south', name: 'ТЦ «Южный»', addr: 'ул. Южная', cat: 'shop', icon: '🏬', col: 'М', row: 80 },
  ];

  const TARGET_POI = {
    id: 'target-house',
    name: CONFIG.target.label,
    addr: 'За городом',
    cat: 'target',
    icon: '🏠',
    hidden: true,
  };

  function getTargetPlace() {
    const first = normalizeCell((CONFIG.target.answer || [])[0] || '') || {
      col: CONFIG.target.col,
      row: CONFIG.target.row,
    };
    return enrich({
      ...TARGET_POI,
      name: CONFIG.target.label,
      col: first.col || CONFIG.target.col,
      row: first.row || CONFIG.target.row,
    });
  }

  /** Дороги — реалистичная схема города (полилинии в SVG 0–100). */
  const ROADS_MAJOR = [
    [[4, 48], [28, 49], [52, 47], [76, 49], [96, 48]],
    [[48, 4], [49, 28], [50, 52], [49, 76], [50, 96]],
    [[8, 78], [32, 62], [58, 42], [82, 22], [96, 14]],
    [[6, 22], [40, 24], [70, 20], [94, 22]],
  ];
  const ROADS_MINOR = [
    [[10, 14], [90, 14]],
    [[10, 34], [90, 34]],
    [[10, 58], [90, 58]],
    [[10, 68], [90, 68]],
    [[10, 84], [90, 84]],
    [[16, 8], [16, 92]],
    [[26, 8], [26, 92]],
    [[36, 8], [36, 92]],
    [[64, 8], [64, 92]],
    [[74, 8], [74, 92]],
    [[84, 8], [84, 92]],
    [[12, 42], [44, 42], [44, 72]],
    [[56, 28], [56, 56], [88, 56]],
    [[20, 74], [48, 74], [48, 90]],
    [[60, 66], [88, 66], [88, 88]],
  ];
  const ROADS_LOCAL = [
    [[18, 18], [32, 18]], [[18, 26], [32, 26]],
    [[40, 16], [52, 16]], [[40, 28], [52, 28]],
    [[66, 16], [78, 16]], [[66, 26], [78, 26]],
    [[18, 52], [32, 52]], [[18, 62], [34, 62]],
    [[68, 52], [80, 52]], [[68, 72], [82, 72]],
    [[22, 36], [22, 44]], [[70, 36], [70, 46]],
    [[42, 78], [58, 78]], [[42, 86], [58, 86]],
  ];

  /** Отдельные здания / кварталы. */
  const URBAN_BLOCKS = [
    [11, 9, 4.2, 3.6], [16, 9.5, 5, 3], [22, 9, 3.5, 4], [27, 10, 6, 2.8],
    [11, 15, 5.5, 4], [18, 15.5, 3.8, 3.5], [23, 16, 4.5, 3], [29, 15, 3, 4.2],
    [38, 9, 5, 4], [44, 9.5, 6, 3.2], [51, 9, 4, 4.5], [57, 10, 5.5, 3],
    [66, 9, 4.5, 3.8], [72, 9.5, 5, 3.2], [79, 9, 3.8, 4], [85, 10, 4, 3],
    [11, 28, 6, 4], [18, 29, 4, 3.5], [24, 28, 5.5, 4.2], [31, 29.5, 3.5, 3],
    [38, 28, 4.5, 4], [44, 28.5, 5, 3.5], [52, 28, 3.8, 4.5], [58, 29, 4.2, 3.2],
    [66, 28, 5, 4], [73, 28.5, 4, 3.8], [79, 28, 5.5, 3.5], [86, 29, 3.5, 4],
    [11, 36, 4, 4.5], [17, 37, 5.5, 3], [25, 36, 3.5, 4], [31, 36.5, 4.5, 3.5],
    [39, 36, 5, 4], [46, 37, 4, 3], [53, 36, 5.5, 4.2], [61, 36.5, 3, 3.8],
    [67, 36, 4.5, 4], [74, 37, 5, 3.2], [81, 36, 3.8, 4.5], [87, 37, 4, 3],
    [11, 52, 5, 3.8], [18, 52.5, 4.2, 4], [24, 52, 5.5, 3.5], [32, 53, 3.5, 3],
    [39, 52, 4.8, 4.2], [46, 52.5, 5, 3.5], [54, 52, 4, 4], [60, 53, 4.5, 3.2],
    [67, 52, 5.2, 4], [74, 52.5, 3.8, 3.5], [80, 52, 4.5, 4.2], [87, 53, 3.5, 3],
    [11, 62, 4.5, 4], [17, 62.5, 5, 3.5], [24, 62, 3.8, 4.2], [30, 63, 5.5, 3],
    [39, 62, 4, 4], [45, 62.5, 5.2, 3.5], [53, 62, 4.5, 4], [60, 63, 3.5, 3.2],
    [67, 62, 5, 4.2], [74, 62.5, 4.2, 3.5], [81, 62, 3.8, 4], [87, 63, 4.5, 3],
    [14, 72, 5, 3.5], [21, 72.5, 4, 4], [28, 72, 5.5, 3.2], [36, 73, 3.5, 3.8],
    [44, 72, 6, 4], [52, 72.5, 4.5, 3.5], [60, 72, 4, 4.2],
    [68, 72, 5, 3.5], [75, 72.5, 4.2, 4], [82, 72, 5.5, 3.2],
    [14, 80, 4.5, 4], [21, 80.5, 5, 3.5], [29, 80, 3.8, 4], [36, 81, 4.2, 3],
    [52, 80, 5, 3.8], [60, 80.5, 4.5, 3.5], [68, 80, 5.2, 4], [76, 81, 4, 3.2],
    [84, 80, 4.5, 3.5],
  ];

  const RAIL = 'M 8 82 Q 30 78 48 70 T 78 58 T 96 52';
  const RIVER = 'M 2 54 Q 18 46 32 56 T 58 50 T 78 58 T 98 52';
  const RIVER_FILL = 'M 2 54 Q 18 46 32 56 T 58 50 T 78 58 T 98 52 L 98 63 Q 78 69 58 61 T 32 67 T 2 65 Z';
  const PARK = { cx: 68, cy: 28, rx: 11, ry: 9 };
  const PARK_PATH = 'M 58 22 Q 62 16 70 17 T 80 24 Q 82 30 76 36 T 62 38 Q 56 34 58 22 Z';
  const POND = { cx: 14, cy: 86, rx: 10, ry: 7 };
  const POND_PATH = 'M 6 84 Q 8 78 16 78 T 24 86 Q 22 94 14 94 T 6 84 Z';
  const COAST = 'M 0 0 L 100 0 L 100 9 Q 72 5 42 11 Q 18 15 0 9 Z';
  const GREEN_PATCHES = [
    [42, 40, 8, 5],
    [78, 44, 6, 4],
    [28, 88, 7, 4],
  ];

  function colIndex(col) {
    const c = normalizeCol(col);
    return COLS.indexOf(c);
  }

  function normalizeCol(raw) {
    let s = String(raw || '').trim().toUpperCase();
    // Латиница → кириллица (похожие буквы). Латинская P в шифре = П (плейсхолдер П-100).
    const map = {
      A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'П', C: 'С', T: 'Т', X: 'Х',
    };
    if (map[s]) s = map[s];
    return s.charAt(0);
  }

  function normalizeCell(text) {
    const raw = String(text || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!raw) return null;
    const cleaned = raw
      .replace(/[–—−]/g, '-')
      .replace(/^([A-ZА-ЯЁ])[.\s]*(\d{2,3})$/u, '$1-$2');
    const m = cleaned.match(/^([A-ZА-ЯЁ])-?(\d{2,3})$/u);
    if (!m) return null;
    const col = normalizeCol(m[1]);
    const row = Number(m[2]);
    if (!COLS.includes(col)) return null;
    if (!ROWS.includes(row)) return null;
    return { col, row, key: `${col}-${row}` };
  }

  function gridToXY(col, row) {
    const ci = colIndex(col);
    const ri = ROWS.indexOf(Number(row));
    if (ci < 0 || ri < 0) return null;
    const x0 = VIEW.pad;
    const y0 = VIEW.pad;
    const usableW = VIEW.w - VIEW.pad * 2;
    const usableH = VIEW.h - VIEW.pad * 2;
    const x = x0 + ((ci + 0.5) / COLS.length) * usableW;
    const y = y0 + ((ri + 0.5) / ROWS.length) * usableH;
    return { x, y };
  }

  function enrich(poi) {
    const xy = gridToXY(poi.col, poi.row);
    return {
      ...poi,
      x: xy?.x ?? 50,
      y: xy?.y ?? 50,
      cell: `${poi.col}-${poi.row}`,
      catLabel: CATEGORIES[poi.cat] || poi.cat,
    };
  }

  function publicPlaces() {
    return POI.map(enrich);
  }

  function findPlace(id) {
    if (id === TARGET_POI.id) return getTargetPlace();
    const p = POI.find(item => item.id === id);
    return p ? enrich(p) : null;
  }

  function searchPlaces(query) {
    const q = String(query || '').trim().toLowerCase();
    const list = publicPlaces();
    if (!q) return list;
    return list.filter(p => `${p.name} ${p.addr} ${p.cell} ${p.catLabel}`.toLowerCase().includes(q));
  }

  function placesByCategory() {
    const groups = {};
    publicPlaces().forEach(p => {
      const key = p.catLabel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  function manhattanCells(a, b) {
    const ai = colIndex(a.col);
    const bi = colIndex(b.col);
    const ar = ROWS.indexOf(Number(a.row));
    const br = ROWS.indexOf(Number(b.row));
    return Math.abs(ai - bi) + Math.abs(ar - br);
  }

  function routeBetween(fromId, toId) {
    const from = findPlace(fromId);
    const to = findPlace(toId);
    if (!from || !to || fromId === toId) return null;

    const steps = manhattanCells(from, to);
    const km = Math.max(0.4, Math.round(steps * 0.55 * 10) / 10);
    const min = Math.max(2, Math.round(km * 2.8));

    // Ломаная «по улицам»: горизонталь затем вертикаль через перекрёсток
    const mid = { x: to.x, y: from.y };
    const displayPath = [
      { x: from.x, y: from.y, name: from.name },
      { x: mid.x, y: mid.y, name: '' },
      { x: to.x, y: to.y, name: to.name },
    ];
    // если почти на одной линии — упростить
    if (Math.abs(from.x - to.x) < 1.5 || Math.abs(from.y - to.y) < 1.5) {
      displayPath.splice(1, 1);
    }

    return {
      fromId,
      toId,
      from,
      to,
      km,
      min,
      displayPath,
      fromCell: from.cell,
      toCell: to.cell,
    };
  }

  function isCorrectAnswer(col, row) {
    const key = `${normalizeCol(col)}-${Number(row)}`;
    const variants = (CONFIG.target.answer || []).map(a => {
      const n = normalizeCell(a);
      return n ? n.key : String(a).toUpperCase().replace(/\s+/g, '');
    });
    return variants.includes(key);
  }

  function matchesAnswerText(text) {
    const n = normalizeCell(text);
    if (!n) return false;
    return isCorrectAnswer(n.col, n.row);
  }

  window.MapsData = {
    COLS,
    ROWS,
    VIEW,
    CONFIG,
    CATEGORIES,
    ROADS_MAJOR,
    ROADS_MINOR,
    ROADS_LOCAL,
    URBAN_BLOCKS,
    RAIL,
    RIVER,
    RIVER_FILL,
    PARK,
    PARK_PATH,
    POND,
    POND_PATH,
    COAST,
    GREEN_PATCHES,
    publicPlaces,
    findPlace,
    searchPlaces,
    placesByCategory,
    routeBetween,
    gridToXY,
    normalizeCol,
    normalizeCell,
    isCorrectAnswer,
    matchesAnswerText,
    getTargetPlace,
    // совместимость со старым API (не используется новым UI)
    MAP_PLACES: POI,
  };
})();
