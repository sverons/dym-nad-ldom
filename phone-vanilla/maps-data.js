const MAP_PLACES = [
  { id: 'novograd', name: 'Новоград', type: 'city', x: 11, y: 14 },
  { id: 'kalinovka', name: 'Калиновка', type: 'village', x: 20, y: 44 },
  { id: 'zarechye', name: 'Заречье', type: 'village', x: 17, y: 66 },
  { id: 'ermolovo', name: 'Ермолово', type: 'village', x: 10, y: 86 },
  { id: 'levinka', name: 'Левинка', type: 'village', x: 30, y: 24 },
  { id: 'dubki', name: 'Дубки', type: 'village', x: 40, y: 18 },
  { id: 'vasilkovo', name: 'Васильково', type: 'village', x: 48, y: 10 },
  { id: 'shevelevka', name: 'Шевелёвка', type: 'village', x: 62, y: 20 },
  { id: 'beryozovka', name: 'Берёзовка', type: 'village', x: 72, y: 32 },
  { id: 'zyryanovo', name: 'Зыряново', type: 'village', x: 48, y: 38 },
  { id: 'kp-zolotoy', name: 'КП Золотой', type: 'poi', x: 55, y: 45 },
  { id: 'olkhovka', name: 'Ольховка', type: 'village', x: 68, y: 48 },
  { id: 'vyazma', name: 'Вязьма', type: 'village', x: 72, y: 72 },
  { id: 'lugovoe', name: 'Луговое', type: 'village', x: 48, y: 78 },
  { id: 'lake-goluboe', name: 'Озеро Голубое', type: 'lake', x: 52, y: 48 },
  { id: 'lake-lebedinoye', name: 'Озеро Лебединое', type: 'lake', x: 78, y: 18 },
  { id: 'lake-lesnoye', name: 'Озеро Лесное', type: 'lake', x: 82, y: 62 },
  { id: 'lake-sosnovoye', name: 'Озеро Сосновое', type: 'lake', x: 85, y: 82 },
  { id: 'stroyitely', name: 'ул. Строителей, 9', type: 'poi', sub: 'Клиника ProЗрение', x: 36, y: 74 },
  { id: 'lesnaya-7', name: 'ул. Лесная, 7', type: 'poi', sub: 'Морозов А.С.', x: 40, y: 68 },
  { id: 'sadovaya-18', name: 'ул. Садовая, 18', type: 'poi', sub: 'Крылов Д.В.', x: 44, y: 66 },
  { id: 'prozrenie', name: 'Клиника ProЗрение', type: 'poi', sub: 'Иванов, Иванова', x: 36, y: 74 },
  { id: 'staroe-ozero', name: 'Старое Озеро', type: 'lake', sub: 'Авария 2009', x: 58, y: 52 },
];

/** Рёбра дорог: [от, до, км] */
const MAP_ROADS = [
  ['novograd', 'levinka', 9],
  ['novograd', 'kalinovka', 11],
  ['levinka', 'dubki', 7],
  ['levinka', 'zyryanovo', 8],
  ['dubki', 'vasilkovo', 6],
  ['dubki', 'zyryanovo', 7],
  ['vasilkovo', 'shevelevka', 9],
  ['shevelevka', 'beryozovka', 8],
  ['beryozovka', 'zyryanovo', 10],
  ['beryozovka', 'olkhovka', 9],
  ['zyryanovo', 'kp-zolotoy', 4],
  ['zyryanovo', 'kalinovka', 9],
  ['kp-zolotoy', 'olkhovka', 6],
  ['kp-zolotoy', 'vyazma', 12],
  ['olkhovka', 'vyazma', 10],
  ['kalinovka', 'lugovoe', 11],
  ['kalinovka', 'zarechye', 8],
  ['zarechye', 'lugovoe', 7],
  ['zarechye', 'ermolovo', 6],
  ['lugovoe', 'vyazma', 9],
  ['lugovoe', 'stroyitely', 5],
  ['zarechye', 'stroyitely', 6],
  ['lesnaya-7', 'lugovoe', 4],
  ['lesnaya-7', 'sadovaya-18', 3],
  ['sadovaya-18', 'stroyitely', 5],
  ['prozrenie', 'stroyitely', 0],
];

/** Географическая привязка района Новограда (вымышленные координаты) */
const MAP_GEO = {
  latMin: 56.72,
  latMax: 56.94,
  lonMin: 37.08,
  lonMax: 37.38,
};

const customPoints = {};

function buildGraph() {
  const graph = {};
  MAP_PLACES.forEach(p => { graph[p.id] = []; });
  MAP_ROADS.forEach(([a, b, km]) => {
    graph[a].push({ to: b, km });
    graph[b].push({ to: a, km });
  });
  return graph;
}

function xyToLatLon(x, y) {
  return {
    lat: MAP_GEO.latMax - (y / 100) * (MAP_GEO.latMax - MAP_GEO.latMin),
    lon: MAP_GEO.lonMin + (x / 100) * (MAP_GEO.lonMax - MAP_GEO.lonMin),
  };
}

function latLonToXy(lat, lon) {
  return {
    x: ((lon - MAP_GEO.lonMin) / (MAP_GEO.lonMax - MAP_GEO.lonMin)) * 100,
    y: ((MAP_GEO.latMax - lat) / (MAP_GEO.latMax - MAP_GEO.latMin)) * 100,
  };
}

function formatCoords(lat, lon) {
  return `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;
}

function parseCoordinates(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const normalized = raw.replace(/[;]/g, ',').replace(/\s+/g, ' ');
  const pair = normalized.match(/^(-?\d+[.,]?\d*)\s*[, ]\s*(-?\d+[.,]?\d*)$/);
  if (!pair) return null;

  const lat = parseFloat(pair[1].replace(',', '.'));
  const lon = parseFloat(pair[2].replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < MAP_GEO.latMin - 0.05 || lat > MAP_GEO.latMax + 0.05) return null;
  if (lon < MAP_GEO.lonMin - 0.05 || lon > MAP_GEO.lonMax + 0.05) return null;

  const { x, y } = latLonToXy(lat, lon);
  if (x < -2 || x > 102 || y < -2 || y > 102) return null;

  return { lat, lon, x, y };
}

function getPlaceCoords(place) {
  if (!place) return null;
  if (place.lat != null && place.lon != null) return { lat: place.lat, lon: place.lon };
  if (place.x == null || place.y == null) return null;
  return xyToLatLon(place.x, place.y);
}

function registerCustomPoint(lat, lon, label) {
  const id = `coord-${lat.toFixed(5)}-${lon.toFixed(5)}`;
  const { x, y } = latLonToXy(lat, lon);
  const point = {
    id,
    name: label || formatCoords(lat, lon),
    sub: 'Координаты',
    type: 'coord',
    lat,
    lon,
    x,
    y,
    custom: true,
  };
  customPoints[id] = point;
  return point;
}

function findPlace(id) {
  if (!id) return null;
  return MAP_PLACES.find(p => p.id === id) || customPoints[id] || null;
}

function searchPlaces(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return MAP_PLACES.filter(p => p.type !== 'lake');
  return MAP_PLACES.filter(p => {
    const geo = getPlaceCoords(p);
    const coordHay = geo ? `${geo.lat.toFixed(4)} ${geo.lon.toFixed(4)}` : '';
    const hay = `${p.name} ${p.sub || ''} ${coordHay}`.toLowerCase();
    return hay.includes(q);
  });
}

function findRoute(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return null;
  const graph = buildGraph();
  const dist = { [fromId]: 0 };
  const prev = {};
  const visited = new Set();
  const queue = [fromId];

  while (queue.length) {
    queue.sort((a, b) => (dist[a] ?? Infinity) - (dist[b] ?? Infinity));
    const node = queue.shift();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === toId) break;

    (graph[node] || []).forEach(({ to, km }) => {
      const next = (dist[node] ?? Infinity) + km;
      if (next < (dist[to] ?? Infinity)) {
        dist[to] = next;
        prev[to] = node;
        if (!visited.has(to)) queue.push(to);
      }
    });
  }

  if (dist[toId] === undefined) return null;

  const path = [];
  let cur = toId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return { path, km: dist[toId], min: Math.round(dist[toId] * 1.4) };
}

function getEdgeKm(a, b) {
  const road = MAP_ROADS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return road ? road[2] : 0;
}

function distanceXY(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function snapToRoadNode(refId) {
  const ref = findPlace(refId);
  if (!ref) return null;

  const nodes = MAP_PLACES.filter(p => p.type !== 'lake');
  let best = nodes[0];
  let bestDist = Infinity;

  nodes.forEach(node => {
    const d = distanceXY(ref, node);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  });

  return { nodeId: best.id, node: best, dist: bestDist };
}

function findRouteResolved(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return null;

  const fromSnap = snapToRoadNode(fromId);
  const toSnap = snapToRoadNode(toId);
  if (!fromSnap || !toSnap) return null;

  const core = findRoute(fromSnap.nodeId, toSnap.nodeId);
  if (!core) return null;

  const from = findPlace(fromId);
  const to = findPlace(toId);
  const accessKm = (fromSnap.dist + toSnap.dist) * 0.35;
  const totalKm = core.km + accessKm;

  const displayPath = [];
  if (from) displayPath.push({ x: from.x, y: from.y, name: from.name });

  core.path.forEach((id, i) => {
    if (i === 0 && id === fromSnap.nodeId && fromId === fromSnap.nodeId) return;
    if (i === core.path.length - 1 && id === toSnap.nodeId && toId === toSnap.nodeId) return;
    const p = findPlace(id);
    if (p) displayPath.push({ x: p.x, y: p.y, name: p.name });
  });

  if (to) {
    const last = displayPath[displayPath.length - 1];
    if (!last || last.x !== to.x || last.y !== to.y) {
      displayPath.push({ x: to.x, y: to.y, name: to.name });
    }
  }

  return {
    path: core.path,
    displayPath,
    km: Math.round(totalKm * 10) / 10,
    min: Math.round(totalKm * 1.4),
    fromId,
    toId,
    fromSnap: fromSnap.nodeId,
    toSnap: toSnap.nodeId,
  };
}

window.MapsData = {
  MAP_PLACES,
  MAP_ROADS,
  MAP_GEO,
  findPlace,
  searchPlaces,
  findRoute,
  findRouteResolved,
  getEdgeKm,
  parseCoordinates,
  formatCoords,
  xyToLatLon,
  latLonToXy,
  getPlaceCoords,
  registerCustomPoint,
  snapToRoadNode,
};
