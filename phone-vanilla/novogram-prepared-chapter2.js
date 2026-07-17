/** Novogram — глава 2 (23 марта 2026). Отдельный набор постов и жителей. */
(function () {
  const seed = window.NovogramSeed;
  if (!seed) return;

  const C = 2;
  const IMG = './assets/novogram/';

  const users = [
    { id: 'ch2_novograd_vesna', username: 'novograd.vesna', name: 'Новоград Весна', bio: 'город · март', avatar: 'В', color: '#0ea5e9', followers: 9400, following: 12, verified: true },
    { id: 'ch2_kostya_reka', username: 'kostya.reka', name: 'Костя', bio: 'набережная · фото', avatar: 'K', color: '#2563eb', followers: 640, following: 210 },
    { id: 'ch2_terrasa_zerno', username: 'terrasa.zerno', name: 'Кофейня «Зерно»', bio: 'кофе · терраса', avatar: 'З', color: '#b45309', followers: 3120, following: 44, verified: true },
    { id: 'ch2_dvor_subbotnik', username: 'dvor.subbotnik', name: 'Наш двор', bio: 'ул. Садовая', avatar: 'Д', color: '#16a34a', followers: 410, following: 88 },
    { id: 'ch2_park_flora', username: 'park.flora', name: 'Оля · парк', bio: 'растения · прогулки', avatar: 'О', color: '#65a30d', followers: 980, following: 305 },
    { id: 'ch2_velo_ng', username: 'velo.ng', name: 'Веломаршруты NG', bio: 'велосезон открыт', avatar: 'В', color: '#0891b2', followers: 2210, following: 63 },
    { id: 'ch2_rassada_marina', username: 'rassada.marina', name: 'Марина · сад', bio: 'рассада · балкон', avatar: 'М', color: '#15803d', followers: 1520, following: 240 },
    { id: 'ch2_dima_i_barsik', username: 'dima.i.barsik', name: 'Дима и Барсик', bio: 'пёс на прогулке', avatar: 'Б', color: '#a16207', followers: 760, following: 130 },
    { id: 'ch2_run_club_ng', username: 'run.club.ng', name: 'Беговой клуб NG', bio: 'бег · Новоград', avatar: 'Р', color: '#dc2626', followers: 3400, following: 51 },
    { id: 'ch2_lena_okno', username: 'lena.u.okna', name: 'Лена', bio: 'дом · уют', avatar: 'Л', color: '#db2777', followers: 890, following: 176 },
    { id: 'ch2_remont_pavel', username: 'remont.pavel', name: 'Павел · ремонт', bio: 'своими руками', avatar: 'П', color: '#7c3aed', followers: 540, following: 92 },
    { id: 'ch2_yarmarka_ng', username: 'yarmarka.ng', name: 'Весенняя ярмарка', bio: 'центр · выходные', avatar: 'Я', color: '#ea580c', followers: 2760, following: 30 },
    { id: 'ch2_dacha_igor', username: 'dacha.igor', name: 'Игорь · дача', bio: 'шашлык · участок', avatar: 'И', color: '#b91c1c', followers: 430, following: 210 },
    { id: 'ch2_nastya_vecher', username: 'nastya.vecher', name: 'Настя', bio: 'вечерний город', avatar: 'Н', color: '#4f46e5', followers: 1180, following: 264 },
    { id: 'ch2_avto_myjka', username: 'avto.myjka.ng', name: 'Автомойка на Лесной', bio: 'после зимы', avatar: 'А', color: '#334155', followers: 610, following: 18 },
    { id: 'ch2_kids_ruchei', username: 'mama.tri.ruchya', name: 'Аня · мама', bio: 'дети · прогулки', avatar: 'А', color: '#0d9488', followers: 720, following: 198 },
  ].map(u => ({ ...u, posts: 0, chapter: C, filler: true, prepared: true }));

  function c(id, userId, text) {
    return { id, userId, text, time: '' };
  }

  const posts = [
    {
      id: 'ch2_post_01', userId: 'ch2_kostya_reka', chapter: C, news: true, filler: true, prepared: true, likes: 512, time: '2 ч',
      image: { src: IMG + 'ch2_01_ledohod.png', label: 'Ледоход' },
      caption: 'Лёд пошёл 🧊 Река проснулась — стою на набережной и не могу оторваться.\n\n#Новоград #ледоход #весна #река',
      comments: [
        c('ch2_post_01_c1', 'ch2_nastya_vecher', 'Вот это да! Уже?'),
        c('ch2_post_01_c2', 'ch2_park_flora', 'Значит, зима точно всё 🙌'),
        c('ch2_post_01_c3', 'ch2_dima_i_barsik', 'Барсик бы туда не полез, а я бы посмотрел'),
      ],
    },
    {
      id: 'ch2_post_02', userId: 'ch2_terrasa_zerno', chapter: C, news: true, filler: true, prepared: true, likes: 934, time: '3 ч',
      image: { src: IMG + 'ch2_02_terrasa.png', label: 'Терраса' },
      caption: '☀️ Открыли летнюю террасу! Первый капучино на улице в этом году — приходите греться на солнце.\n\n#Зерно #кофе #терраса #Новоград',
      comments: [
        c('ch2_post_02_c1', 'ch2_lena_okno', 'Наконец-то! Бегу'),
        c('ch2_post_02_c2', 'ch2_run_club_ng', 'После пробежки — только к вам'),
        c('ch2_post_02_c3', 'ch2_kostya_reka', 'Лучшая новость марта'),
        c('ch2_post_02_c4', 'ch2_nastya_vecher', 'Столик у окна ещё свободен?'),
      ],
    },
    {
      id: 'ch2_post_03', userId: 'ch2_dvor_subbotnik', chapter: C, news: true, filler: true, prepared: true, likes: 288, time: '4 ч',
      image: { src: IMG + 'ch2_03_subbotnik.png', label: 'Субботник' },
      caption: '🧹 Вышли всем двором на субботник. За два часа собрали то, что копилось всю зиму. Спасибо каждому!\n\n#субботник #Садовая #Новоград #весна',
      comments: [
        c('ch2_post_03_c1', 'ch2_remont_pavel', 'Молодцы! В следующий раз с нами'),
        c('ch2_post_03_c2', 'ch2_rassada_marina', 'Клумбы уже готовим?'),
      ],
    },
    {
      id: 'ch2_post_04', userId: 'ch2_park_flora', chapter: C, news: true, filler: true, prepared: true, likes: 671, time: '5 ч',
      image: { src: IMG + 'ch2_04_podsnezhniki.png', label: 'Подснежники' },
      caption: 'Первые подснежники в городском парке 🌱 Каждый год их жду больше, чем любой праздник.\n\n#подснежники #парк #весна #Новоград',
      comments: [
        c('ch2_post_04_c1', 'ch2_kids_ruchei', 'Пойдём завтра покажу детям!'),
        c('ch2_post_04_c2', 'ch2_lena_okno', 'Красотища 😍'),
        c('ch2_post_04_c3', 'ch2_terrasa_zerno', 'Весна на фото — оживает лента'),
      ],
    },
    {
      id: 'ch2_post_05', userId: 'ch2_velo_ng', chapter: C, news: true, filler: true, prepared: true, likes: 1043, time: '6 ч',
      image: { src: IMG + 'ch2_05_velosezon.png', label: 'Велосезон' },
      caption: '🚲 Достал велик из кладовки — велосезон официально открыт! Асфальт сухой, солнце светит, что ещё надо.\n\n#велосипед #велосезон #Новоград',
      comments: [
        c('ch2_post_05_c1', 'ch2_run_club_ng', 'Догоним на пробежке 😄'),
        c('ch2_post_05_c2', 'ch2_dacha_igor', 'До дачи докатишь?'),
      ],
    },
    {
      id: 'ch2_post_06', userId: 'ch2_rassada_marina', chapter: C, news: true, filler: true, prepared: true, likes: 486, time: '7 ч',
      image: { src: IMG + 'ch2_06_rassada.png', label: 'Рассада' },
      caption: '🌱 Балкон превратился в маленькую теплицу. Томаты и перцы уже проклюнулись — жду лета.\n\n#рассада #сад #балкон #Новоград',
      comments: [
        c('ch2_post_06_c1', 'ch2_park_flora', 'Поделишься семенами?'),
        c('ch2_post_06_c2', 'ch2_kids_ruchei', 'Мы тоже с детьми посадили'),
        c('ch2_post_06_c3', 'ch2_dvor_subbotnik', 'На клумбы двора возьмём у вас совет'),
      ],
    },
    {
      id: 'ch2_post_07', userId: 'ch2_dima_i_barsik', chapter: C, news: true, filler: true, prepared: true, likes: 622, time: '9 ч',
      image: { src: IMG + 'ch2_07_gryaznyy_pes.png', label: 'После прогулки' },
      caption: 'Весна — это когда пёс возвращается с прогулки такого цвета 🐕😅 Барсик доволен, я — не очень.\n\n#пёс #весна #грязь #Новоград',
      comments: [
        c('ch2_post_07_c1', 'ch2_nastya_vecher', 'Ахаха, знакомо!'),
        c('ch2_post_07_c2', 'ch2_avto_myjka', 'Приводите, и его отмоем 😄'),
      ],
    },
    {
      id: 'ch2_post_08', userId: 'ch2_nastya_vecher', chapter: C, news: true, filler: true, prepared: true, likes: 815, time: '11 ч',
      image: { src: IMG + 'ch2_08_zakat_krysha.png', label: 'Закат' },
      caption: 'Дни стали длиннее — и это лучшее, что случилось за март 🌇 Закат с крыши, ветер уже тёплый.\n\n#закат #город #весна #Новоград',
      comments: [
        c('ch2_post_08_c1', 'ch2_kostya_reka', 'Кадр — огонь'),
        c('ch2_post_08_c2', 'ch2_lena_okno', 'Где это? Хочу туда'),
      ],
    },
    {
      id: 'ch2_post_09', userId: 'ch2_remont_pavel', chapter: C, news: true, filler: true, prepared: true, likes: 344, time: '13 ч',
      image: { src: IMG + 'ch2_09_remont.png', label: 'Ремонт' },
      caption: '🎨 Весеннее обострение: перекрашиваю комнату. Цвет назвали «первая зелень», по-моему в точку.\n\n#ремонт #своимируками #дом #Новоград',
      comments: [
        c('ch2_post_09_c1', 'ch2_dvor_subbotnik', 'Заходи потом к нам красить лавочки 😄'),
        c('ch2_post_09_c2', 'ch2_lena_okno', 'Классный цвет!'),
      ],
    },
    {
      id: 'ch2_post_10', userId: 'ch2_kids_ruchei', chapter: C, news: true, filler: true, prepared: true, likes: 559, time: '15 ч',
      image: { src: IMG + 'ch2_10_korabliki.png', label: 'Кораблики' },
      caption: 'Пускаем кораблики в ручьях 🚢 Дети в восторге, я промочила ноги. Весна, что тут скажешь.\n\n#дети #ручьи #весна #Новоград',
      comments: [
        c('ch2_post_10_c1', 'ch2_park_flora', 'Самое весеннее фото ленты'),
        c('ch2_post_10_c2', 'ch2_rassada_marina', 'Мои тоже просятся на улицу'),
      ],
    },
    {
      id: 'ch2_post_11', userId: 'ch2_lena_okno', chapter: C, news: true, filler: true, prepared: true, likes: 728, time: '17 ч',
      image: { src: IMG + 'ch2_11_kot_okno.png', label: 'Кот на окне' },
      caption: 'Мой кот нашёл первое весеннее солнце и никому его не отдаёт ☀️🐈\n\n#кот #солнце #окно #весна',
      comments: [
        c('ch2_post_11_c1', 'ch2_dima_i_barsik', 'Барсик одобряет'),
        c('ch2_post_11_c2', 'ch2_nastya_vecher', 'Идеальное настроение'),
        c('ch2_post_11_c3', 'ch2_terrasa_zerno', 'Приходите с солнцем к нам на террасу ☕'),
      ],
    },
    {
      id: 'ch2_post_12', userId: 'ch2_run_club_ng', chapter: C, news: true, filler: true, prepared: true, likes: 1290, time: '19 ч',
      image: { src: IMG + 'ch2_12_probezhka.png', label: 'Пробежка' },
      caption: '🏃 Открыли беговой сезон! 30 человек на утренней пробежке по набережной. В воскресенье — снова, присоединяйтесь.\n\n#бег #Новоград #весна #спорт',
      comments: [
        c('ch2_post_12_c1', 'ch2_velo_ng', 'А мы рядом на великах 🚲'),
        c('ch2_post_12_c2', 'ch2_kostya_reka', 'Снимал вас с моста — красиво бежите'),
      ],
    },
    {
      id: 'ch2_post_13', userId: 'ch2_avto_myjka', chapter: C, news: true, filler: true, prepared: true, likes: 402, time: '21 ч',
      image: { src: IMG + 'ch2_13_avtomoyka.png', label: 'После зимы' },
      caption: 'Смываем с машин всю зиму 🚗💦 Реагенты, соль, грязь — за март у нас аншлаг. Записывайтесь заранее.\n\n#автомойка #весна #Новоград',
      comments: [
        c('ch2_post_13_c1', 'ch2_dacha_igor', 'Заеду перед дачей'),
        c('ch2_post_13_c2', 'ch2_remont_pavel', 'Моя после зимы — как из карьера 😅'),
      ],
    },
    {
      id: 'ch2_post_14', userId: 'ch2_yarmarka_ng', chapter: C, news: true, filler: true, prepared: true, likes: 963, time: '22 ч',
      image: { src: IMG + 'ch2_14_yarmarka.png', label: 'Ярмарка' },
      caption: '🎪 В эти выходные — весенняя ярмарка на центральной площади! Мёд, выпечка, рассада, ремёсла. Ждём всех!\n\n#ярмарка #выходные #Новоград #весна',
      comments: [
        c('ch2_post_14_c1', 'ch2_rassada_marina', 'Буду с рассадой у третьего ряда 🌱'),
        c('ch2_post_14_c2', 'ch2_kids_ruchei', 'Придём всей семьёй'),
        c('ch2_post_14_c3', 'ch2_lena_okno', 'Обожаю эту ярмарку'),
      ],
    },
    {
      id: 'ch2_post_15', userId: 'ch2_dacha_igor', chapter: C, news: true, filler: true, prepared: true, likes: 517, time: '1 д',
      image: { src: IMG + 'ch2_15_shashlyk.png', label: 'Первый шашлык' },
      caption: '🔥 Открыли дачный сезон! Первый шашлык этого года, снег ещё в тени лежит, а мы уже жарим.\n\n#дача #шашлык #весна #Новоград',
      comments: [
        c('ch2_post_15_c1', 'ch2_velo_ng', 'Докатил бы, но далеко 😄'),
        c('ch2_post_15_c2', 'ch2_nastya_vecher', 'Запах через экран!'),
      ],
    },
    {
      id: 'ch2_post_16', userId: 'ch2_park_flora', chapter: C, news: true, filler: true, prepared: true, likes: 604, time: '1 д',
      image: { src: IMG + 'ch2_16_verba.png', label: 'Верба' },
      caption: 'Верба распустилась 🌿 Принесла веточку домой — и сразу теплее на душе.\n\n#верба #весна #дом #Новоград',
      comments: [
        c('ch2_post_16_c1', 'ch2_lena_okno', 'У меня тоже стоит в вазе'),
        c('ch2_post_16_c2', 'ch2_kids_ruchei', 'Пойдём наберём с детьми'),
      ],
    },
    {
      id: 'ch2_post_17', userId: 'ch2_nastya_vecher', chapter: C, news: true, filler: true, prepared: true, likes: 889, time: '1 д',
      image: { src: IMG + 'ch2_17_luzhi_otrazhenie.png', label: 'Отражения' },
      caption: 'Вечерний город в лужах красивее, чем днём 🌆 Мокрый асфальт, огни, весна.\n\n#вечер #город #отражения #Новоград',
      comments: [
        c('ch2_post_17_c1', 'ch2_kostya_reka', 'Отражения — моя слабость'),
        c('ch2_post_17_c2', 'ch2_terrasa_zerno', 'После такого — к нам за какао ☕'),
      ],
    },
    {
      id: 'ch2_post_18', userId: 'ch2_velo_ng', chapter: C, news: true, filler: true, prepared: true, likes: 733, time: '2 д',
      image: { src: IMG + 'ch2_18_most_velo.png', label: 'Мост' },
      caption: '🌉 Прокатились через новый мост — вид на разлив реки просто космос. Маршрут выходного дня готов.\n\n#велосипед #мост #маршрут #Новоград',
      comments: [
        c('ch2_post_18_c1', 'ch2_run_club_ng', 'Мы там бегали, подтверждаю 👍'),
        c('ch2_post_18_c2', 'ch2_dima_i_barsik', 'С Барсиком дойдём пешком'),
      ],
    },
    {
      id: 'ch2_post_19', userId: 'ch2_rassada_marina', chapter: C, news: true, filler: true, prepared: true, likes: 458, time: '2 д',
      image: { src: IMG + 'ch2_19_peresadka.png', label: 'Пересадка' },
      caption: '🪴 Пересаживаю комнатные — весной они как будто сами просят новый горшок. Руки в земле, душа на месте.\n\n#растения #дом #весна #Новоград',
      comments: [
        c('ch2_post_19_c1', 'ch2_park_flora', 'Земля правильная — половина успеха'),
        c('ch2_post_19_c2', 'ch2_lena_okno', 'Надо и мне заняться'),
      ],
    },
    {
      id: 'ch2_post_20', userId: 'ch2_novograd_vesna', chapter: C, news: true, filler: true, prepared: true, likes: 1512, time: '2 д',
      image: { src: IMG + 'ch2_20_ploschad_vesna.png', label: 'Центр' },
      caption: 'Новоград весной просыпается 🌷 Центральная площадь, тёплое солнце, люди без шапок. С весной, город!\n\n#Новоград #весна #город #март',
      comments: [
        c('ch2_post_20_c1', 'ch2_nastya_vecher', 'С весной! ❤️'),
        c('ch2_post_20_c2', 'ch2_kids_ruchei', 'Уже гуляли там — прекрасно'),
        c('ch2_post_20_c3', 'ch2_run_club_ng', 'Отличный кадр!'),
        c('ch2_post_20_c4', 'ch2_yarmarka_ng', 'А в выходные тут будет ярмарка 🎪'),
      ],
    },
  ];

  posts.forEach(p => {
    const author = users.find(u => u.id === p.userId);
    if (author) author.posts += 1;
  });

  seed.users = [...seed.users, ...users];
  seed.posts = [...seed.posts, ...posts];
  // Новостные аккаунты главы 2 — городская афиша + ключевые сообщества.
  seed.newsAccounts = [...(seed.newsAccounts || []), 'ch2_novograd_vesna', 'ch2_terrasa_zerno', 'ch2_run_club_ng', 'ch2_yarmarka_ng'];
})();
