/** Сайты браузера: открываются только по адресу в строке (не показываются на главной). */
window.BrowserSites = [
  {
    id: 'pro-zrenie',
    title: 'ProЗрение',
    host: 'www.pro-zrenie.ru',
    aliases: ['pro-zrenie.ru', 'www.pro-zrenie.ru', 'http://pro-zrenie.ru', 'https://pro-zrenie.ru', 'http://www.pro-zrenie.ru', 'https://www.pro-zrenie.ru'],
    url: './sites/pro-zrenie.html',
    description: 'Офтальмологическая клиника · Новоград',
    color: '#0e7c86',
    letter: 'P',
    listed: false,
  },
];

function normalizeHost(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

function browserSitesSource() {
  if (window.AdminStore?.getEffectiveBrowserSites) return AdminStore.getEffectiveBrowserSites();
  return window.BrowserSites || [];
}

window.BrowserData = {
  findById(id) {
    return browserSitesSource().find(s => s.id === id) || null;
  },
  findByHost(host) {
    const raw = String(host || '').trim().toLowerCase();
    const h = normalizeHost(raw);
    if (!h) return null;

    return browserSitesSource().find(s => {
      const hosts = [s.host, ...(s.aliases || [])].map(normalizeHost);
      return hosts.includes(h) || raw === s.host.toLowerCase();
    }) || null;
  },
  /** Сайты для главной страницы браузера (открытые закладки). */
  listedSites() {
    return browserSitesSource().filter(s => s.listed !== false);
  },
  searchListed(query) {
    const q = String(query || '').trim().toLowerCase();
    const list = this.listedSites();
    if (!q) return list;
    return list.filter(s => {
      const hay = `${s.title} ${s.host} ${s.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  },
};
