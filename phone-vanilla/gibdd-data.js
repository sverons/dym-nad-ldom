const GIBDD_FULL_SEED = [
  {
    id: 'car-1',
    brand: 'BMW X5',
    plateNumber: 'А123БВ777',
    year: 2021,
    color: 'Чёрный',
    category: 'B',
    vin: 'WBAFR9C50LC123456',
    bodyNumber: 'FR9C50123456',
    engineNumber: 'B58B30123456',
    engineVolume: 2998,
    power: '249 л.с.',
    accidents: 'ДТП 14.03.2024 — мелкое столкновение на парковке ТЦ «Галерея». Без пострадавших.',
    photo: '',
    ownerName: 'Акунин Сергей Викторович',
    ownerBirthDate: '1986-04-12',
    ownerAddress: 'г. Москва, ул. Профсоюзная, д. 18, кв. 84',
  },
  {
    id: 'car-2',
    brand: 'Mercedes-Benz E 200',
    plateNumber: 'К456МН199',
    year: 2019,
    color: 'Серебристый',
    category: 'B',
    vin: 'WDD2130421A654321',
    bodyNumber: '213042165432',
    engineNumber: 'M27492054321',
    engineVolume: 1991,
    power: '184 л.с.',
    accidents: 'Нет',
    photo: '',
    ownerName: 'Акунина Анна Дмитриевна',
    ownerBirthDate: '1988-09-03',
    ownerAddress: 'г. Москва, ул. Профсоюзная, д. 18, кв. 84',
  },
  {
    id: 'car-3',
    brand: 'Toyota Camry',
    plateNumber: 'В789ОР750',
    year: 2017,
    color: 'Белый',
    category: 'B',
    vin: 'JTNB11HK503456789',
    bodyNumber: 'B11HK5034567',
    engineNumber: '6ARU1234567',
    engineVolume: 2494,
    power: '181 л.с.',
    accidents: 'ДТП 07.02.2009 — авария на льду, озеро Сенеж. ТС ушло под воду. Владелец погиб.',
    photo: '',
    ownerName: 'Крылова Елена Сергеевна',
    ownerBirthDate: '1975-11-22',
    ownerAddress: 'Московская обл., г. Солнечногорск, ул. Красная, д. 5',
  },
  {
    id: 'car-4',
    brand: 'Volkswagen Polo',
    plateNumber: 'Е321КХ777',
    year: 2020,
    color: 'Красный',
    category: 'B',
    vin: 'WVWZZZ6RZLY123456',
    bodyNumber: 'ZZZ6RZ123456',
    engineNumber: 'DLA123456',
    engineVolume: 1598,
    power: '110 л.с.',
    accidents: 'Нет',
    photo: '',
    ownerName: 'Морозова Вероника Игоревна',
    ownerBirthDate: '1994-06-15',
    ownerAddress: 'г. Москва, ул. Большая Ордынка, д. 42, кв. 17',
  },
  {
    id: 'car-5',
    brand: 'Hyundai Solaris',
    plateNumber: 'М555АА750',
    year: 2018,
    color: 'Серый',
    category: 'B',
    vin: 'Z94CB41AAGR123456',
    bodyNumber: 'CB41A123456',
    engineNumber: 'G4FG123456',
    engineVolume: 1591,
    power: '123 л.с.',
    accidents: 'Нет',
    photo: '',
    ownerName: 'Иванов Виктор Петрович',
    ownerBirthDate: '1979-01-30',
    ownerAddress: 'г. Москва, ул. Строителей, д. 9, кв. 112',
  },
  {
    id: 'car-6',
    brand: 'Skoda Octavia',
    plateNumber: 'Н902СК777',
    year: 2020,
    color: 'Синий',
    category: 'B',
    vin: 'TMBJG7NE0L0123456',
    bodyNumber: 'JG7NE012345',
    engineNumber: 'DKZ123456',
    engineVolume: 1498,
    power: '150 л.с.',
    accidents: 'Нет',
    photo: '',
    ownerName: 'Скорый Артур Николаевич',
    ownerBirthDate: '1982-03-08',
    ownerAddress: 'г. Москва, ул. Пятницкая, д. 31, кв. 5',
  },
  {
    id: 'car-7',
    brand: 'Lada Granta',
    plateNumber: 'Т114КР750',
    year: 2016,
    color: 'Белый',
    category: 'B',
    vin: 'XTA219010G0123456',
    bodyNumber: '219010G12345',
    engineNumber: '11186123456',
    engineVolume: 1596,
    power: '87 л.с.',
    accidents: 'Нет',
    photo: '',
    ownerName: 'Иванов Виктор Петрович',
    ownerBirthDate: '1979-01-30',
    ownerAddress: 'г. Москва, ул. Строителей, д. 9, кв. 112',
  },
];

let GIBDD_STORAGE_KEY = 'dym_gibdd_cars_v1';
let GIBDD_SEED = GIBDD_FULL_SEED.map(car => ({ ...car }));

function normalizePlate(plate) {
  return String(plate || '').replace(/\s+/g, '').toUpperCase();
}

function emptyCar() {
  return {
    brand: '',
    plateNumber: '',
    year: new Date().getFullYear(),
    color: '',
    category: 'B',
    vin: '',
    bodyNumber: '',
    engineNumber: '',
    engineVolume: 0,
    power: '',
    accidents: 'Нет',
    photo: '',
    ownerName: '',
    ownerBirthDate: '',
    ownerAddress: '',
  };
}

function cloneSeed(seed) {
  return seed.map(car => ({ ...car }));
}

function loadCars() {
  try {
    const raw = localStorage.getItem(GIBDD_STORAGE_KEY);
    if (!raw) {
      saveCars(cloneSeed(GIBDD_SEED));
      return cloneSeed(GIBDD_SEED);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : cloneSeed(GIBDD_SEED);
  } catch {
    return cloneSeed(GIBDD_SEED);
  }
}

function saveCars(cars) {
  localStorage.setItem(GIBDD_STORAGE_KEY, JSON.stringify(cars));
}

function searchCarByPlate(plate) {
  const query = normalizePlate(plate);
  if (!query) return null;
  return loadCars().find(car => normalizePlate(car.plateNumber) === query) || null;
}

function addCar(car) {
  const cars = loadCars();
  const entry = {
    ...emptyCar(),
    ...car,
    id: `car-${Date.now()}`,
    plateNumber: String(car.plateNumber || '').toUpperCase(),
  };
  cars.push(entry);
  saveCars(cars);
  return entry;
}

function updateCar(car) {
  const cars = loadCars();
  const index = cars.findIndex(item => item.id === car.id);
  if (index === -1) return null;
  cars[index] = {
    ...cars[index],
    ...car,
    plateNumber: String(car.plateNumber || '').toUpperCase(),
  };
  saveCars(cars);
  return cars[index];
}

function deleteCar(id) {
  const cars = loadCars().filter(car => car.id !== id);
  saveCars(cars);
}

function resetCarsToSeed() {
  saveCars(cloneSeed(GIBDD_SEED));
  return cloneSeed(GIBDD_SEED);
}

function configure(storageKey, seed) {
  if (storageKey) GIBDD_STORAGE_KEY = storageKey;
  if (seed) GIBDD_SEED = cloneSeed(seed);
}

window.GIBDD_FULL_SEED = GIBDD_FULL_SEED;

window.GibddDB = {
  configure,
  loadCars,
  saveCars,
  searchCarByPlate,
  addCar,
  updateCar,
  deleteCar,
  emptyCar,
  resetCarsToSeed,
  normalizePlate,
};
