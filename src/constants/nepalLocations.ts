export type LocationCategory =
  | 'Airport'
  | 'Kathmandu'
  | 'Outstation'
  | 'Heritage'
  | 'Hotel'
  | 'BusPark'
  | 'City';

export interface NepalLocationItem {
  id: string;
  name: string;
  secondaryText: string;
  category: LocationCategory;
  district: string;
  icon?: string;
  popular?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const NEPAL_LOCATIONS: NepalLocationItem[] = [
  // --- POKHARA REGION ---
  {
    id: 'pokhara_city',
    name: 'Pokhara, Nepal',
    secondaryText: 'Kaski District, Gandaki Province',
    category: 'City',
    district: 'Kaski',
    popular: true,
    coordinates: { latitude: 28.2096, longitude: 83.9856 },
  },
  {
    id: 'pokhara_pia_airport',
    name: 'Pokhara International Airport (PIA), Pokhara, Nepal',
    secondaryText: 'Chhinedanda, Pokhara, Gandaki',
    category: 'Airport',
    district: 'Kaski',
    popular: true,
    coordinates: { latitude: 28.1884, longitude: 84.0139 },
  },
  {
    id: 'pokhara_university',
    name: 'Pokhara University, Pokhara, Nepal',
    secondaryText: 'Lekhnath, Kaski District',
    category: 'Outstation',
    district: 'Kaski',
    popular: false,
    coordinates: { latitude: 28.1633, longitude: 84.0531 },
  },
  {
    id: 'pokhariya_nepal',
    name: 'Pokhariya, Nepal',
    secondaryText: 'Parsa District, Madhesh Province',
    category: 'Outstation',
    district: 'Parsa',
    popular: false,
    coordinates: { latitude: 27.0500, longitude: 84.8167 },
  },
  {
    id: 'pokhara_bazar',
    name: 'Pokhara Bazar, Nepal',
    secondaryText: 'Mahendrapool / Chipledhunga, Pokhara',
    category: 'City',
    district: 'Kaski',
    popular: true,
    coordinates: { latitude: 28.2250, longitude: 83.9900 },
  },
  {
    id: 'pokhara_lakeside',
    name: 'Pokhara Lakeside, Pokhara, Nepal',
    secondaryText: 'Baidam / Phewa Lake Tourism Strip',
    category: 'Outstation',
    district: 'Kaski',
    popular: true,
    coordinates: { latitude: 28.2096, longitude: 83.9595 },
  },

  // --- KATHMANDU VALLEY ---
  {
    id: 'kathmandu_city',
    name: 'Kathmandu, Nepal',
    secondaryText: 'Capital City, Bagmati Province',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7172, longitude: 85.3240 },
  },
  {
    id: 'tia_intl',
    name: 'Tribhuvan International Airport (TIA), Kathmandu, Nepal',
    secondaryText: 'Ring Road, Terminal Arrivals & Departures',
    category: 'Airport',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.6966, longitude: 85.3591 },
  },
  {
    id: 'thamel_ktm',
    name: 'Thamel, Kathmandu, Nepal',
    secondaryText: 'Chaksibari Marg / Z-Street Tourism District',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7154, longitude: 85.3123 },
  },
  {
    id: 'lazimpat_ktm',
    name: 'Lazimpat, Kathmandu, Nepal',
    secondaryText: 'Hotel Shanker & Embassy District',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7225, longitude: 85.3190 },
  },
  {
    id: 'durbar_marg_ktm',
    name: 'Durbar Marg, Kathmandu, Nepal',
    secondaryText: 'King’s Way Boulevard & Narayanhiti',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7107, longitude: 85.3168 },
  },
  {
    id: 'boudhanath_ktm',
    name: 'Boudhanath Stupa, Kathmandu, Nepal',
    secondaryText: 'Boudha UNESCO World Heritage Shrine',
    category: 'Heritage',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7215, longitude: 85.3620 },
  },
  {
    id: 'pashupatinath_ktm',
    name: 'Pashupatinath Temple, Kathmandu, Nepal',
    secondaryText: 'Gaushala / Bagmati River Bank',
    category: 'Heritage',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7105, longitude: 85.3487 },
  },
  {
    id: 'swayambhunath_ktm',
    name: 'Swayambhunath (Monkey Temple), Kathmandu, Nepal',
    secondaryText: 'Chhauni / Swayambhu Ridge',
    category: 'Heritage',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7149, longitude: 85.2904 },
  },
  {
    id: 'patan_durbar_lalitpur',
    name: 'Patan Durbar Square, Lalitpur, Nepal',
    secondaryText: 'Mangalbazar / Patan Heritage City',
    category: 'Heritage',
    district: 'Lalitpur',
    popular: true,
    coordinates: { latitude: 27.6744, longitude: 85.3250 },
  },
  {
    id: 'lalitpur_city',
    name: 'Lalitpur, Nepal',
    secondaryText: 'Patan, Pulchowk, Jhamsikhel',
    category: 'Kathmandu',
    district: 'Lalitpur',
    popular: true,
    coordinates: { latitude: 27.6667, longitude: 85.3167 },
  },
  {
    id: 'bhaktapur_city',
    name: 'Bhaktapur Durbar Square, Bhaktapur, Nepal',
    secondaryText: 'Taumadhi / Pottery Square Heritage Town',
    category: 'Heritage',
    district: 'Bhaktapur',
    popular: true,
    coordinates: { latitude: 27.6710, longitude: 85.4298 },
  },
  {
    id: 'gongabu_buspark',
    name: 'Gongabu New Bus Park, Kathmandu, Nepal',
    secondaryText: 'Balaju Ring Road Inter-City Terminal',
    category: 'BusPark',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.7346, longitude: 85.3088 },
  },
  {
    id: 'kalanki_chowk',
    name: 'Kalanki Chowk, Kathmandu, Nepal',
    secondaryText: 'Prithvi Highway Outbound Departure Hub',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.6938, longitude: 85.2813 },
  },
  {
    id: 'koteshwor_chowk',
    name: 'Koteshwor Chowk, Kathmandu, Nepal',
    secondaryText: 'BP Highway & Araniko Highway Departure',
    category: 'Kathmandu',
    district: 'Kathmandu',
    popular: true,
    coordinates: { latitude: 27.6766, longitude: 85.3479 },
  },

  // --- OUTSTATION CITIES & POPULAR HUBS ---
  {
    id: 'chitwan_sauraha',
    name: 'Chitwan (Sauraha), Nepal',
    secondaryText: 'Chitwan National Park Safari Gateway',
    category: 'Outstation',
    district: 'Chitwan',
    popular: true,
    coordinates: { latitude: 27.5804, longitude: 84.4981 },
  },
  {
    id: 'bharatpur_city',
    name: 'Bharatpur, Chitwan, Nepal',
    secondaryText: 'Chitwan District Commercial Center & Airport',
    category: 'City',
    district: 'Chitwan',
    popular: true,
    coordinates: { latitude: 27.6775, longitude: 84.4289 },
  },
  {
    id: 'nagarkot_view',
    name: 'Nagarkot Sunrise Viewpoint, Nepal',
    secondaryText: 'Panoramic Himalayan Ridge, Bhaktapur',
    category: 'Outstation',
    district: 'Bhaktapur',
    popular: true,
    coordinates: { latitude: 27.7175, longitude: 85.5200 },
  },
  {
    id: 'dhulikhel_resort',
    name: 'Dhulikhel, Kavre, Nepal',
    secondaryText: 'Araniko Highway Hill Resort Station',
    category: 'Outstation',
    district: 'Kavrepalanchok',
    popular: true,
    coordinates: { latitude: 27.6253, longitude: 85.5561 },
  },
  {
    id: 'manakamana_cablecar',
    name: 'Manakamana Cable Car, Kurintar, Nepal',
    secondaryText: 'Prithvi Highway, Trishuli Riverside Station',
    category: 'Heritage',
    district: 'Chitwan',
    popular: true,
    coordinates: { latitude: 27.9042, longitude: 84.5843 },
  },
  {
    id: 'kalinchowk_kuri',
    name: 'Kalinchowk (Kuri Village), Dolakha, Nepal',
    secondaryText: 'Charikot Cable Car & Snow Altitude View',
    category: 'Outstation',
    district: 'Dolakha',
    popular: true,
    coordinates: { latitude: 27.7289, longitude: 86.0247 },
  },
  {
    id: 'bandipur_town',
    name: 'Bandipur Heritage Town, Tanahun, Nepal',
    secondaryText: 'Preserved Newari Mountain Settlement',
    category: 'Outstation',
    district: 'Tanahun',
    popular: true,
    coordinates: { latitude: 27.9333, longitude: 84.4167 },
  },
  {
    id: 'lumbini_sacred',
    name: 'Lumbini Sacred Garden, Nepal',
    secondaryText: 'Birthplace of Lord Buddha, Rupandehi',
    category: 'Heritage',
    district: 'Rupandehi',
    popular: true,
    coordinates: { latitude: 27.4840, longitude: 83.2760 },
  },
  {
    id: 'bhairahawa_city',
    name: 'Bhairahawa (Siddharthanagar), Nepal',
    secondaryText: 'Gautam Buddha International Airport Hub',
    category: 'City',
    district: 'Rupandehi',
    popular: true,
    coordinates: { latitude: 27.5056, longitude: 83.4162 },
  },
  {
    id: 'butwal_city',
    name: 'Butwal, Rupandehi, Nepal',
    secondaryText: 'East-West & Siddhartha Highway Junction',
    category: 'City',
    district: 'Rupandehi',
    popular: true,
    coordinates: { latitude: 27.7000, longitude: 83.4500 },
  },
  {
    id: 'birgunj_city',
    name: 'Birgunj, Parsa, Nepal',
    secondaryText: 'Commercial Gateway & Integrated Check Post',
    category: 'City',
    district: 'Parsa',
    popular: true,
    coordinates: { latitude: 27.0139, longitude: 84.8772 },
  },
  {
    id: 'janakpur_dham',
    name: 'Janakpur (Janaki Mandir), Nepal',
    secondaryText: 'Historic Mithila Cultural Center, Dhanusha',
    category: 'Heritage',
    district: 'Dhanusha',
    popular: true,
    coordinates: { latitude: 26.7271, longitude: 85.9242 },
  },
  {
    id: 'hetauda_city',
    name: 'Hetauda, Makwanpur, Nepal',
    secondaryText: 'Bagmati Province Capital Hub',
    category: 'City',
    district: 'Makwanpur',
    popular: false,
    coordinates: { latitude: 27.4286, longitude: 85.0331 },
  },
  {
    id: 'biratnagar_city',
    name: 'Biratnagar, Morang, Nepal',
    secondaryText: 'Eastern Nepal Metropolitan Center & Airport',
    category: 'City',
    district: 'Morang',
    popular: false,
    coordinates: { latitude: 26.4817, longitude: 87.2642 },
  },
  {
    id: 'dharan_city',
    name: 'Dharan, Sunsari, Nepal',
    secondaryText: 'Bhedetar Gateway & BP Koirala Institute',
    category: 'City',
    district: 'Sunsari',
    popular: false,
    coordinates: { latitude: 26.8125, longitude: 87.2833 },
  },
  {
    id: 'itahari_city',
    name: 'Itahari, Sunsari, Nepal',
    secondaryText: 'Eastern Highway Junction Hub',
    category: 'City',
    district: 'Sunsari',
    popular: false,
    coordinates: { latitude: 26.6667, longitude: 87.2833 },
  },
  {
    id: 'nepalgunj_city',
    name: 'Nepalgunj, Banke, Nepal',
    secondaryText: 'Western Nepal Center & Airport',
    category: 'City',
    district: 'Banke',
    popular: false,
    coordinates: { latitude: 28.1053, longitude: 81.6669 },
  },
  {
    id: 'muktinath_jomsom',
    name: 'Muktinath Temple & Jomsom, Mustang, Nepal',
    secondaryText: 'Mustang High Altitude Pilgrimage (3,710m)',
    category: 'Heritage',
    district: 'Mustang',
    popular: false,
    coordinates: { latitude: 28.8167, longitude: 83.8711 },
  },
  {
    id: 'daman_viewpoint',
    name: 'Daman, Makwanpur, Nepal',
    secondaryText: 'Tribhuvan Highway Himalayan Viewpoint',
    category: 'Outstation',
    district: 'Makwanpur',
    popular: false,
    coordinates: { latitude: 27.6083, longitude: 85.0886 },
  },
  {
    id: 'besisahar_gateway',
    name: 'Besisahar, Lamjung, Nepal',
    secondaryText: 'Annapurna Circuit 4x4 Departure Hub',
    category: 'Outstation',
    district: 'Lamjung',
    popular: false,
    coordinates: { latitude: 28.2311, longitude: 84.3756 },
  },
];

export const LOCATION_CATEGORY_TABS: { label: string; value: 'All' | LocationCategory }[] = [
  { label: 'All Places', value: 'All' },
  { label: 'Airports', value: 'Airport' },
  { label: 'Kathmandu Hubs', value: 'Kathmandu' },
  { label: 'Outstation & Hills', value: 'Outstation' },
  { label: 'Heritage & Temples', value: 'Heritage' },
  { label: 'Cities', value: 'City' },
];

/**
 * Filter and search Nepal locations by term and category.
 */
export function searchNepalLocations(
  query: string,
  category: 'All' | LocationCategory = 'All',
): NepalLocationItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return NEPAL_LOCATIONS.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) return false;

    if (!normalizedQuery) return true;

    const inName = item.name.toLowerCase().includes(normalizedQuery);
    const inSecondary = item.secondaryText.toLowerCase().includes(normalizedQuery);
    const inDistrict = item.district.toLowerCase().includes(normalizedQuery);

    return inName || inSecondary || inDistrict;
  });
}
