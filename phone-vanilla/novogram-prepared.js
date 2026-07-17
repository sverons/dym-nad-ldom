/** Подготовленные посты жителей Новограда. */
(function () {
  const seed = window.NovogramSeed;
  if (!seed) return;

  const users = [
  {
    "id": "prepared_lera_naberezhnaya",
    "username": "lera.naberezhnaya",
    "name": "lera.naberezhnaya",
    "bio": "Новоград",
    "avatar": "L",
    "color": "#2563eb",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_dima_zarechny",
    "username": "dima.zarechny",
    "name": "dima.zarechny",
    "bio": "Новоград",
    "avatar": "D",
    "color": "#0f766e",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_anya_coffee_ng",
    "username": "anya_coffee_ng",
    "name": "anya_coffee_ng",
    "bio": "Новоград",
    "avatar": "A",
    "color": "#9333ea",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_mama_galina52",
    "username": "mama_galina52",
    "name": "mama_galina52",
    "bio": "Новоград",
    "avatar": "M",
    "color": "#c2410c",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_igor_volkov92",
    "username": "igor.volkov92",
    "name": "igor.volkov92",
    "bio": "Новоград",
    "avatar": "I",
    "color": "#be123c",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_serik_petrovich",
    "username": "serik_petrovich",
    "name": "serik_petrovich",
    "bio": "Новоград",
    "avatar": "S",
    "color": "#0369a1",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_zhanna_pr",
    "username": "zhanna.pr",
    "name": "zhanna.pr",
    "bio": "Новоград",
    "avatar": "Z",
    "color": "#4f46e5",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_kvartal_14",
    "username": "kvartal_14",
    "name": "kvartal_14",
    "bio": "Новоград",
    "avatar": "K",
    "color": "#15803d",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_olga_klinika",
    "username": "olga.klinika",
    "name": "olga.klinika",
    "bio": "Новоград",
    "avatar": "O",
    "color": "#2563eb",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_roma_zimin",
    "username": "roma_zimin",
    "name": "roma_zimin",
    "bio": "Новоград",
    "avatar": "R",
    "color": "#0f766e",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_katya_and_max",
    "username": "katya_and_max",
    "name": "katya_and_max",
    "bio": "Новоград",
    "avatar": "K",
    "color": "#9333ea",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_max_photo_ng",
    "username": "max_photo_ng",
    "name": "max_photo_ng",
    "bio": "Новоград",
    "avatar": "M",
    "color": "#c2410c",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_tisha_fisher",
    "username": "tisha_fisher",
    "name": "tisha_fisher",
    "bio": "Новоград",
    "avatar": "T",
    "color": "#be123c",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_inna_salon",
    "username": "inna_salon",
    "name": "inna_salon",
    "bio": "Новоград",
    "avatar": "I",
    "color": "#0369a1",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_kvadrat_rieltor",
    "username": "kvadrat_rieltor",
    "name": "kvadrat_rieltor",
    "bio": "Новоград",
    "avatar": "K",
    "color": "#4f46e5",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_buyer_ng2025",
    "username": "buyer_ng2025",
    "name": "buyer_ng2025",
    "bio": "Новоград",
    "avatar": "B",
    "color": "#15803d",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_eugene_t_partners",
    "username": "eugene.t_partners",
    "name": "eugene.t_partners",
    "bio": "Новоград",
    "avatar": "E",
    "color": "#2563eb",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_kristina_sec",
    "username": "kristina.sec",
    "name": "kristina.sec",
    "bio": "Новоград",
    "avatar": "K",
    "color": "#0f766e",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_pasha_smart",
    "username": "pasha_smart",
    "name": "pasha_smart",
    "bio": "Новоград",
    "avatar": "P",
    "color": "#9333ea",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_pekarnja_na_tihoy",
    "username": "pekarnja_na_tihoy",
    "name": "pekarnja_na_tihoy",
    "bio": "Новоград",
    "avatar": "P",
    "color": "#c2410c",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_babushka_rynok",
    "username": "babushka_rynok",
    "name": "babushka_rynok",
    "bio": "Новоград",
    "avatar": "B",
    "color": "#be123c",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_stas_office",
    "username": "stas_office",
    "name": "stas_office",
    "bio": "Новоград",
    "avatar": "S",
    "color": "#0369a1",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_natalya_prozrenie",
    "username": "natalya_prozrenie",
    "name": "natalya_prozrenie",
    "bio": "Новоград",
    "avatar": "N",
    "color": "#4f46e5",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_lev_iz_sektora_b",
    "username": "lev_iz_sektora_b",
    "name": "lev_iz_sektora_b",
    "bio": "Новоград",
    "avatar": "L",
    "color": "#15803d",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_fan_brigada152",
    "username": "fan_brigada152",
    "name": "fan_brigada152",
    "bio": "Новоград",
    "avatar": "F",
    "color": "#2563eb",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_anna_gold_sq",
    "username": "anna_gold_sq",
    "name": "anna_gold_sq",
    "bio": "Новоград",
    "avatar": "A",
    "color": "#0f766e",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_taxi_ng_night",
    "username": "taxi_ng_night",
    "name": "taxi_ng_night",
    "bio": "Новоград",
    "avatar": "T",
    "color": "#9333ea",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_galina_rynok",
    "username": "galina_rynok",
    "name": "galina_rynok",
    "bio": "Новоград",
    "avatar": "G",
    "color": "#c2410c",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_prozrenie_front",
    "username": "prozrenie_front",
    "name": "prozrenie_front",
    "bio": "Новоград",
    "avatar": "P",
    "color": "#be123c",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_viktor_ophthal",
    "username": "viktor_ophthal",
    "name": "viktor_ophthal",
    "bio": "Новоград",
    "avatar": "V",
    "color": "#0369a1",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_polina_busstop",
    "username": "polina.busstop",
    "name": "polina.busstop",
    "bio": "Новоград",
    "avatar": "P",
    "color": "#4f46e5",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_zerno_cafe_ng",
    "username": "zerno_cafe_ng",
    "name": "zerno_cafe_ng",
    "bio": "Новоград",
    "avatar": "Z",
    "color": "#15803d",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_artur_skory_press",
    "username": "artur.skory_press",
    "name": "artur.skory_press",
    "bio": "Новоград",
    "avatar": "A",
    "color": "#2563eb",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_zhurnalist_kafe",
    "username": "zhurnalist_kafe",
    "name": "zhurnalist_kafe",
    "bio": "Новоград",
    "avatar": "Z",
    "color": "#0f766e",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_cvety_molodezhnaya",
    "username": "cvety_molodezhnaya",
    "name": "cvety_molodezhnaya",
    "bio": "Новоград",
    "avatar": "C",
    "color": "#9333ea",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_veronika_m",
    "username": "veronika.m",
    "name": "veronika.m",
    "bio": "Новоград",
    "avatar": "V",
    "color": "#c2410c",
    "posts": 0,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_mama_mari",
    "username": "mama_mari",
    "name": "mama_mari",
    "bio": "Новоград",
    "avatar": "M",
    "color": "#be123c",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_nasty_fit_ng",
    "username": "nasty_fit_ng",
    "name": "nasty_fit_ng",
    "bio": "Новоград",
    "avatar": "N",
    "color": "#0369a1",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_ugol_barber_ng",
    "username": "ugol_barber_ng",
    "name": "ugol_barber_ng",
    "bio": "Новоград",
    "avatar": "U",
    "color": "#4f46e5",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  },
  {
    "id": "prepared_katok_central_ng",
    "username": "katok_central_ng",
    "name": "katok_central_ng",
    "bio": "Новоград",
    "avatar": "K",
    "color": "#15803d",
    "posts": 1,
    "followers": 0,
    "following": 0,
    "verified": false,
    "filler": true,
    "prepared": true
  }
];
  const posts = [
  {
    "id": "prepared_post_01",
    "userId": "prepared_lera_naberezhnaya",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/01_naberezhnaya_kofe.png",
      "label": "Набережная"
    },
    "caption": "☕ 7:12. Набережная ещё спит, а я уже с кофе.\nНовоград умеет быть тихим — правда, только до восьми.\n\n#Новоград #утро #набережная #кофе",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_01_comment_1",
        "userId": "prepared_dima_zarechny",
        "text": "Красота. Вчера на Заречной туман был ещё гуще",
        "time": ""
      },
      {
        "id": "prepared_post_01_comment_2",
        "userId": "prepared_anya_coffee_ng",
        "text": "Какой кофе? Если из «Зерна» — я тоже туда пересела",
        "time": ""
      },
      {
        "id": "prepared_post_01_comment_3",
        "userId": "prepared_mama_galina52",
        "text": "Лер, шапку надень, потом болеть будешь",
        "time": ""
      },
      {
        "id": "prepared_post_01_comment_4",
        "userId": "prepared_igor_volkov92",
        "text": "Набережная утром — самое честное место в городе",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_02",
    "userId": "prepared_serik_petrovich",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/02_dvor_sobaka.png",
      "label": "ул. Школьная"
    },
    "caption": "Вечерний круг с Жучкой. Двор на Школьной, как всегда: снег, окна чужих жизней и собака, которой всё равно на наши дела.\n\n#двор #Новоград #собака #вечер",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_02_comment_1",
        "userId": "prepared_zhanna_pr",
        "text": "Жучка звезда. Добрый вечер, Сергей Петрович",
        "time": ""
      },
      {
        "id": "prepared_post_02_comment_2",
        "userId": "prepared_kvartal_14",
        "text": "У нас на 14-м тоже такая тишина по вечерам",
        "time": ""
      },
      {
        "id": "prepared_post_02_comment_3",
        "userId": "prepared_olga_klinika",
        "text": "Милота. Держитесь теплее ❄️",
        "time": ""
      },
      {
        "id": "prepared_post_02_comment_4",
        "userId": "prepared_roma_zimin",
        "text": "Классика Новограда. Только шапка у вас фирменная 😄",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_03",
    "userId": "prepared_katya_and_max",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/03_ozero_para.png",
      "label": "Озеро"
    },
    "caption": "Съездили к озеру. Лёд тонкий, разговаривать толком не о чем — и так нормально.\nИногда город надо оставлять за спиной.\n\n#озеро #мы #выходной #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_03_comment_1",
        "userId": "prepared_lera_naberezhnaya",
        "text": "Ох какая картинка",
        "time": ""
      },
      {
        "id": "prepared_post_03_comment_2",
        "userId": "prepared_max_photo_ng",
        "text": "Катя, это же почти открытка",
        "time": ""
      },
      {
        "id": "prepared_post_03_comment_3",
        "userId": "prepared_tisha_fisher",
        "text": "Осторожно на льду, в прошлом году просадка была",
        "time": ""
      },
      {
        "id": "prepared_post_03_comment_4",
        "userId": "prepared_inna_salon",
        "text": "Вы самые красивые в этом городе, я сказала",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_04",
    "userId": "prepared_kvadrat_rieltor",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/04_rieltor_kvartira.png",
      "label": "ул. Строителей, 11"
    },
    "caption": "Показ на Строителей 11. Свет хороший, вид на двор — честный, без прикрас.\nЕсли ищете двушку — пишите в директ. Новоград всё ещё умеет удивлять планировками 😊\n\n#риелтор #квартира #Новоград #показ",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_04_comment_1",
        "userId": "prepared_buyer_ng2025",
        "text": "Сколько? Ипотека возможна?",
        "time": ""
      },
      {
        "id": "prepared_post_04_comment_2",
        "userId": "prepared_eugene_t_partners",
        "text": "Хороший свет, да. Клиент уйдёт довольный",
        "time": ""
      },
      {
        "id": "prepared_post_04_comment_3",
        "userId": "prepared_kristina_sec",
        "text": "Ой я эту площадку знаю 👀",
        "time": ""
      },
      {
        "id": "prepared_post_04_comment_4",
        "userId": "prepared_pasha_smart",
        "text": "А умный дом там есть или «как получится»?",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_05",
    "userId": "prepared_pekarnja_na_tihoy",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/05_pekarnja.png",
      "label": "ул. Тихая"
    },
    "caption": "Свежая партия. Кто первый за круассанами — тот чемпион утра.\nМы на Тихой, с 7:00. Хлеб ещё тёплый.\n\n#пекарня #Тихая #Новоград #выпечка",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_05_comment_1",
        "userId": "prepared_lera_naberezhnaya",
        "text": "Вы спасаете мои утра",
        "time": ""
      },
      {
        "id": "prepared_post_05_comment_2",
        "userId": "prepared_babushka_rynok",
        "text": "Раньше булки были пышнее… шучу, берите всё",
        "time": ""
      },
      {
        "id": "prepared_post_05_comment_3",
        "userId": "prepared_stas_office",
        "text": "Заеду после совещания. Оставьте один с маком",
        "time": ""
      },
      {
        "id": "prepared_post_05_comment_4",
        "userId": "prepared_natalya_prozrenie",
        "text": "Взяла вчера для клиники — коллеги разобрали за 10 минут",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_06",
    "userId": "prepared_lev_iz_sektora_b",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/06_stadion_fan.png",
      "label": "Стадион"
    },
    "caption": "ЛЬВЫЫЫЫ 🔥\n1:0 — и весь Новоград орёт вместе с нами.\nСектор Б не замолкает.\n\n#НовоградскиеЛьвы #футбол #нашгород",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_06_comment_1",
        "userId": "prepared_fan_brigada152",
        "text": "СЕКТОР Б НА МЕСТЕ",
        "time": ""
      },
      {
        "id": "prepared_post_06_comment_2",
        "userId": "prepared_dima_zarechny",
        "text": "А я по радио слушал. Какой матч",
        "time": ""
      },
      {
        "id": "prepared_post_06_comment_3",
        "userId": "prepared_anna_gold_sq",
        "text": "Соседи снизу тоже орали. Поздравляю 🦁",
        "time": ""
      },
      {
        "id": "prepared_post_06_comment_4",
        "userId": "prepared_taxi_ng_night",
        "text": "После матча пробки на час. Но оно того стоило",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_07",
    "userId": "prepared_galina_rynok",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/07_rynok_babushka.png",
      "label": "Городской рынок"
    },
    "caption": "Рынок как рынок: яблоки, очереди и все знакомы с малолетства.\nНовоград зимой пахнет морозом и яблочной кожурой.\n\n#рынок #Новоград #утро",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_07_comment_1",
        "userId": "prepared_pekarnja_na_tihoy",
        "text": "Галина, а свеклу брали? Мы пироги печём",
        "time": ""
      },
      {
        "id": "prepared_post_07_comment_2",
        "userId": "prepared_serik_petrovich",
        "text": "Доброе утро! Жучка сегодня дома — жарко ей",
        "time": ""
      },
      {
        "id": "prepared_post_07_comment_3",
        "userId": "prepared_olga_klinika",
        "text": "Вы всегда выбираете самое лучшее 🍎",
        "time": ""
      },
      {
        "id": "prepared_post_07_comment_4",
        "userId": "prepared_kvartal_14",
        "text": "Рынок — единственное место, где ещё здороваются",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_08",
    "userId": "prepared_prozrenie_front",
    "filler": true,
    "prepared": true,
    "hiddenFromFeed": true,
    "image": {
      "src": "./assets/novogram/08_klinika_admin.png",
      "label": "ProЗрение"
    },
    "caption": "Доброе утро от администраторов «ProЗрение» 👁\nЗапись на проверку зрения — в директ или по телефону на рецепции.\nПусть в Новограде все видят ясно.\n\n#ProЗрение #клиника #Новоград #здоровье",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_08_comment_1",
        "userId": "prepared_natalya_prozrenie",
        "text": "Коллеги, красотки 💙",
        "time": ""
      },
      {
        "id": "prepared_post_08_comment_2",
        "userId": "prepared_viktor_ophthal",
        "text": "Хороший кадр. Аквариум в кадре следующий раз? 😄",
        "time": ""
      },
      {
        "id": "prepared_post_08_comment_3",
        "userId": "prepared_lera_naberezhnaya",
        "text": "Записалась на четверг!",
        "time": ""
      },
      {
        "id": "prepared_post_08_comment_4",
        "userId": "prepared_kristina_sec",
        "text": "У вас всегда так чисто… завидую тихо",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_09",
    "userId": "prepared_polina_busstop",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/09_ostanovka_naushniki.png",
      "label": "ул. Молодёжная"
    },
    "caption": "15 минут задержка.\nНаушники + снег = мой Новоград.\nЕсли 42-й снова не приедет — иду пешком через Молодёжную.\n\n#остановка #снег #настроение #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_09_comment_1",
        "userId": "prepared_lev_iz_sektora_b",
        "text": "42-й легенда. Жди или сдавайся",
        "time": ""
      },
      {
        "id": "prepared_post_09_comment_2",
        "userId": "prepared_katya_and_max",
        "text": "Полина, так атмосферно сняла",
        "time": ""
      },
      {
        "id": "prepared_post_09_comment_3",
        "userId": "prepared_mama_galina52",
        "text": "Полиночка, так поздно на улице!",
        "time": ""
      },
      {
        "id": "prepared_post_09_comment_4",
        "userId": "prepared_igor_volkov92",
        "text": "Молодёжная ночью — отдельный фильм",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_10",
    "userId": "prepared_tisha_fisher",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/10_rybak_tuman.png",
      "label": "Река"
    },
    "caption": "Туман над водой. Город ещё спит, а река уже работает.\nКлёва сегодня нет. Тишины — с избытком.\n\n#рыбалка #туман #Новоград #утро",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_10_comment_1",
        "userId": "prepared_serik_petrovich",
        "text": "Классика. Чай в термосе есть?",
        "time": ""
      },
      {
        "id": "prepared_post_10_comment_2",
        "userId": "prepared_dima_zarechny",
        "text": "С Заречной то же небо. Красиво",
        "time": ""
      },
      {
        "id": "prepared_post_10_comment_3",
        "userId": "prepared_roma_zimin",
        "text": "Дым над водой — будто город курит",
        "time": ""
      },
      {
        "id": "prepared_post_10_comment_4",
        "userId": "prepared_max_photo_ng",
        "text": "Можно в печать. Серьёзно",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_11",
    "userId": "prepared_zerno_cafe_ng",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/11_kofeinja_barista.png",
      "label": "Набережная, 15"
    },
    "caption": "Новый латте. Рисуем сердца — бесплатно, улыбки — по желанию.\nЖдём на Набережной, 15.\n\n#зерно #кофейня #Новоград #латте",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_11_comment_1",
        "userId": "prepared_lera_naberezhnaya",
        "text": "ЭТО МОЙ ЛАТТЕ. Я была первой сегодня",
        "time": ""
      },
      {
        "id": "prepared_post_11_comment_2",
        "userId": "prepared_artur_skory_press",
        "text": "Хорошее место для текста. Тихо до 11",
        "time": ""
      },
      {
        "id": "prepared_post_11_comment_3",
        "userId": "prepared_anya_coffee_ng",
        "text": "Пена космос",
        "time": ""
      },
      {
        "id": "prepared_post_11_comment_4",
        "userId": "prepared_zhurnalist_kafe",
        "text": "Закладывайте столик у окна — вид лучший",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_12",
    "userId": "prepared_taxi_ng_night",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/12_nochnoe_taksi.png",
      "label": "Ночной Новоград"
    },
    "caption": "Смена. Дождь. Аптечный крест горит как маяк.\nНовоград ночью — другой город: меньше людей, больше отражений.\n\n#такси #ночь #Новоград #смена",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_12_comment_1",
        "userId": "prepared_polina_busstop",
        "text": "Узнала этот перекрёсток",
        "time": ""
      },
      {
        "id": "prepared_post_12_comment_2",
        "userId": "prepared_lev_iz_sektora_b",
        "text": "После матча вы нас спасаете",
        "time": ""
      },
      {
        "id": "prepared_post_12_comment_3",
        "userId": "prepared_inna_salon",
        "text": "Езжу только с вами, честно",
        "time": ""
      },
      {
        "id": "prepared_post_12_comment_4",
        "userId": "prepared_stas_office",
        "text": "«Меньше людей, больше отражений» — в цитату",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_13",
    "userId": "prepared_cvety_molodezhnaya",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/13_cvetj_magazin.png",
      "label": "ул. Молодёжная, 5"
    },
    "caption": "Зимний букет без повода — тоже повод.\nМы на Молодёжной, 5. Собираем за 15 минут.\n\n#цветы #букет #Новоград #Молодёжная",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_13_comment_1",
        "userId": "prepared_katya_and_max",
        "text": "Макс, смотри и учись 😏",
        "time": ""
      },
      {
        "id": "prepared_post_13_comment_2",
        "userId": "prepared_kvadrat_rieltor",
        "text": "Брали у вас на сдачу квартиры — клиент растаял",
        "time": ""
      },
      {
        "id": "prepared_post_13_comment_3",
        "userId": "prepared_veronika_m",
        "text": "Хочу такой же 💗",
        "time": ""
      },
      {
        "id": "prepared_post_13_comment_4",
        "userId": "prepared_galina_rynok",
        "text": "Живые и красивые. Как надо",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_14",
    "userId": "prepared_stas_office",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/14_obed_v_ofise.png",
      "label": "Офис"
    },
    "caption": "Обед с видом на крыши.\nСегодня гречка. Завтра снова гречка.\nНовоградский open space не про романтику — про термос и дедлайны.\n\n#работа #офис #обед #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_14_comment_1",
        "userId": "prepared_zerno_cafe_ng",
        "text": "Можно же к нам спуститься…",
        "time": ""
      },
      {
        "id": "prepared_post_14_comment_2",
        "userId": "prepared_pasha_smart",
        "text": "У тебя окна лучше, чем у меня умный дом",
        "time": ""
      },
      {
        "id": "prepared_post_14_comment_3",
        "userId": "prepared_eugene_t_partners",
        "text": "Классика. Гречка объединяет",
        "time": ""
      },
      {
        "id": "prepared_post_14_comment_4",
        "userId": "prepared_buyer_ng2025",
        "text": "Вид как у нас в объявлении 😄",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_15",
    "userId": "prepared_mama_mari",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/15_shkola_utrom.png",
      "label": "Школа"
    },
    "caption": "Школа. Мороз. «Мам, быстрее».\nКаждое утро одно и то же — и каждый раз немного другое.\nНовоград растит нас вместе с детьми.\n\n#школа #утро #мамыНовограда",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_15_comment_1",
        "userId": "prepared_galina_rynok",
        "text": "Держитесь, девочки. Мы тоже так росли",
        "time": ""
      },
      {
        "id": "prepared_post_15_comment_2",
        "userId": "prepared_pekarnja_na_tihoy",
        "text": "После школы — за булочкой!",
        "time": ""
      },
      {
        "id": "prepared_post_15_comment_3",
        "userId": "prepared_olga_klinika",
        "text": "У вас такие красивые моменты",
        "time": ""
      },
      {
        "id": "prepared_post_15_comment_4",
        "userId": "prepared_kvartal_14",
        "text": "Школьная — родная остановка всех мам",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_16",
    "userId": "prepared_artur_skory_press",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/16_zhurnalist_kafe.png",
      "label": "Кофейня"
    },
    "caption": "Черновик в блокноте. Кофе стынет.\nГород даёт темы медленно — надо уметь ждать.\n\n#заметки #Новоград #пресса #работа",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_16_comment_1",
        "userId": "prepared_zerno_cafe_ng",
        "text": "Артур, ваш столик свободен всегда ☕",
        "time": ""
      },
      {
        "id": "prepared_post_16_comment_2",
        "userId": "prepared_max_photo_ng",
        "text": "Когда репортаж — зови",
        "time": ""
      },
      {
        "id": "prepared_post_16_comment_3",
        "userId": "prepared_zhanna_pr",
        "text": "Читаю ваши тексты. Держите планку",
        "time": ""
      },
      {
        "id": "prepared_post_16_comment_4",
        "userId": "prepared_viktor_ophthal",
        "text": "Интересно, о чём на этот раз?",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_17",
    "userId": "prepared_nasty_fit_ng",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/17_zal_selfi.png",
      "label": "Зал"
    },
    "caption": "День ног. Без отмазок.\nКто из Новограда тоже в зале сегодня — отметьтесь.\n\n#спорт #зал #мотивация #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_17_comment_1",
        "userId": "prepared_lev_iz_sektora_b",
        "text": "Я только с матча… завтра точно",
        "time": ""
      },
      {
        "id": "prepared_post_17_comment_2",
        "userId": "prepared_polina_busstop",
        "text": "Завидую дисциплине",
        "time": ""
      },
      {
        "id": "prepared_post_17_comment_3",
        "userId": "prepared_inna_salon",
        "text": "После зала — к нам на восстановление 💇‍♀️",
        "time": ""
      },
      {
        "id": "prepared_post_17_comment_4",
        "userId": "prepared_katya_and_max",
        "text": "Настя машина",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_18",
    "userId": "prepared_ugol_barber_ng",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/18_barbershop.png",
      "label": "ул. Складская"
    },
    "caption": "Классика машинкой. Разговор ни о чём — лучший сервис.\nЗапись в директ. Угол Складской.\n\n#барбер #стрижка #Новоград #мужское",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_18_comment_1",
        "userId": "prepared_igor_volkov92",
        "text": "Брат, как всегда огонь",
        "time": ""
      },
      {
        "id": "prepared_post_18_comment_2",
        "userId": "prepared_serik_petrovich",
        "text": "Мне бы так аккуратно…",
        "time": ""
      },
      {
        "id": "prepared_post_18_comment_3",
        "userId": "prepared_taxi_ng_night",
        "text": "Заеду между сменами",
        "time": ""
      },
      {
        "id": "prepared_post_18_comment_4",
        "userId": "prepared_roma_zimin",
        "text": "Единственный, кому доверяю виски и виски-фейд",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_19",
    "userId": "prepared_roma_zimin",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/19_balkon_dym.png",
      "label": "Балкон"
    },
    "caption": "Балкон. Дым. Крыши.\nИногда весь Новоград кажется одним долгим выдохом.\n\n#вечер #балкон #настроение #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_19_comment_1",
        "userId": "prepared_tisha_fisher",
        "text": "Дым над крышами. Понимаю",
        "time": ""
      },
      {
        "id": "prepared_post_19_comment_2",
        "userId": "prepared_artur_skory_press",
        "text": "Сильный кадр. Можно было бы в газету",
        "time": ""
      },
      {
        "id": "prepared_post_19_comment_3",
        "userId": "prepared_lera_naberezhnaya",
        "text": "Ром, лирика пошла?",
        "time": ""
      },
      {
        "id": "prepared_post_19_comment_4",
        "userId": "prepared_dima_zarechny",
        "text": "У нас на Заречной тот же свет",
        "time": ""
      }
    ]
  },
  {
    "id": "prepared_post_20",
    "userId": "prepared_katok_central_ng",
    "filler": true,
    "prepared": true,
    "image": {
      "src": "./assets/novogram/20_katok_druzya.png",
      "label": "Центральный каток"
    },
    "caption": "Центральный каток открыт!\nДрузья, коньки и гирлянды — Новоград умеет быть мягким.\nБилеты / прокат — в сторис.\n\n#каток #зима #друзья #Новоград",
    "likes": 0,
    "time": "",
    "comments": [
      {
        "id": "prepared_post_20_comment_1",
        "userId": "prepared_katya_and_max",
        "text": "Мы там были вчера!!!",
        "time": ""
      },
      {
        "id": "prepared_post_20_comment_2",
        "userId": "prepared_polina_busstop",
        "text": "Хочу с вами на лёд",
        "time": ""
      },
      {
        "id": "prepared_post_20_comment_3",
        "userId": "prepared_nasty_fit_ng",
        "text": "Это тоже тренировка 😎",
        "time": ""
      },
      {
        "id": "prepared_post_20_comment_4",
        "userId": "prepared_mama_mari",
        "text": "Детей завтра приведём",
        "time": ""
      },
      {
        "id": "prepared_post_20_comment_5",
        "userId": "prepared_zerno_cafe_ng",
        "text": "После катка — согревающий какао у нас",
        "time": ""
      }
    ]
  }
];

  seed.users = [...seed.users, ...users];
  seed.posts = [...seed.posts, ...posts];
})();
