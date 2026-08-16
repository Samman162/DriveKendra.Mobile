export type TourDetailId = 'manakamana' | 'muktinath' | 'kalinchowk';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ManakamanaOption {
  id: string;
  name: string;
  capacity: string;
  sameDay: number;
  overnight: number;
  directTemple?: number;
  vehicleTypeId: 1 | 2 | 3;
}

export interface PaxRate {
  pax: number;
  perPersonRate: number;
}

export const MANAKAMANA_OPTIONS: ManakamanaOption[] = [
  { id: 'car', name: 'Sedan / Hatchback Car', capacity: 'Up to 4 Pax', sameDay: 7500, overnight: 11500, vehicleTypeId: 1 },
  { id: 'suv', name: 'SUV Comfort', capacity: 'Up to 6 Pax', sameDay: 8500, overnight: 13000, vehicleTypeId: 2 },
  { id: 'scorpio', name: 'Scorpio 4x4 Jeep', capacity: 'Up to 7 Pax', sameDay: 11000, overnight: 16000, directTemple: 16000, vehicleTypeId: 2 },
  { id: 'ev_11', name: 'EV Van (11 Seater)', capacity: 'Up to 11 Pax', sameDay: 11000, overnight: 16000, vehicleTypeId: 3 },
  { id: 'ev_14', name: 'EV Van (14 Seater)', capacity: 'Up to 14 Pax', sameDay: 13000, overnight: 18000, vehicleTypeId: 3 },
  { id: 'hiace_17', name: 'Hiace Van (17 Seater)', capacity: 'Up to 17 Pax', sameDay: 15000, overnight: 24000, vehicleTypeId: 3 },
];

export const MANAKAMANA_FAQS: FaqItem[] = [
  {
    question: 'How long does it take from Kathmandu to Kurintar cable car station?',
    answer:
      'The drive from Kathmandu to Kurintar cable car station takes approximately 3 to 3.5 hours (104 km) via the Prithvi Highway, depending on highway traffic.',
  },
  {
    question: 'Can we travel directly to Manakamana Temple without taking the cable car?',
    answer:
      'Yes! We offer direct Scorpio 4x4 Jeep rental service directly from Kathmandu up to Manakamana Temple via the Khairenitar-Bungkot dirt road route.',
  },
  {
    question: 'Are cable car tickets included in the vehicle rental price?',
    answer:
      'Our car rental package covers the vehicle, fuel, driver allowances, toll, and parking. Cable car tickets at Kurintar are purchased separately by passengers.',
  },
  {
    question: 'Can we get doorstep pickup from our hotel or residence in Kathmandu?',
    answer:
      'Yes, our driver will pick you up directly from your doorstep anywhere in Kathmandu, Lalitpur, Bhaktapur, or Tribhuvan International Airport.',
  },
];

export const MUKTINATH_SCORPIO: PaxRate[] = [
  { pax: 8, perPersonRate: 11000 },
  { pax: 7, perPersonRate: 11500 },
  { pax: 6, perPersonRate: 12500 },
  { pax: 5, perPersonRate: 15000 },
];

export const MUKTINATH_EV_VAN: PaxRate[] = [
  { pax: 12, perPersonRate: 7000 },
  { pax: 11, perPersonRate: 7500 },
  { pax: 10, perPersonRate: 8000 },
  { pax: 9, perPersonRate: 9000 },
  { pax: 8, perPersonRate: 10000 },
  { pax: 7, perPersonRate: 10500 },
  { pax: 6, perPersonRate: 11500 },
  { pax: 5, perPersonRate: 13000 },
];

export const MUKTINATH_FAQS: FaqItem[] = [
  {
    question: 'Do Nepalese citizens need special permits for Muktinath & Lower Mustang?',
    answer:
      'Nepalese citizens do not require ACAP or TIMS permits to visit Muktinath and Lower Mustang. Only valid national identity (Citizenship / Passport) is required.',
  },
  {
    question: 'What type of vehicle is best suited for Muktinath roads?',
    answer:
      'A Scorpio 4x4 Jeep is ideal for offroad terrain between Beni and Muktinath. Comfort EV Vans are also available for up to 12 passengers on paved & gravel stretches.',
  },
  {
    question: 'What meals and accommodations are included in the 4-Day package?',
    answer:
      'The package includes 3 nights hotel accommodation, 3 breakfasts, and 3 dinners (veg & non-veg options). Lunch and personal beverage bills are excluded.',
  },
  {
    question: 'What is the altitude of Muktinath Temple and are there precautions for altitude sickness?',
    answer:
      'Muktinath Temple is situated at an elevation of 3,710 meters (12,172 ft). We schedule gradual altitude gain via Tatopani and Jomsom to ensure comfortable acclimatization.',
  },
];

export const KALINCHOWK_SCORPIO: PaxRate[] = [
  { pax: 8, perPersonRate: 4000 },
  { pax: 7, perPersonRate: 4200 },
  { pax: 6, perPersonRate: 4600 },
  { pax: 5, perPersonRate: 5600 },
];

export const KALINCHOWK_EV_VAN: PaxRate[] = [
  { pax: 12, perPersonRate: 3300 },
  { pax: 11, perPersonRate: 3500 },
  { pax: 10, perPersonRate: 3800 },
  { pax: 9, perPersonRate: 4000 },
  { pax: 8, perPersonRate: 4200 },
];

export const KALINCHOWK_FAQS: FaqItem[] = [
  {
    question: 'When is the best season to experience snowfall in Kalinchowk?',
    answer:
      'The best snowfall period is during winter from December to February. Temperatures drop below freezing, covering Kuri Village in thick snow perfect for skiing and snowboarding.',
  },
  {
    question: 'Is a Scorpio 4x4 Jeep necessary for Kalinchowk?',
    answer:
      'A Scorpio 4x4 Jeep is strongly recommended, especially during winter when roads between Charikot and Kuri Village become icy and snowy. EV Vans operate during dry seasons.',
  },
  {
    question: 'What is included in the 2-Day 1-Night Kalinchowk hotel package?',
    answer:
      'The package includes doorstep pickup/drop, vehicle & driver expenses, 1-night hotel accommodation in Kuri Village, welcome drinks, 1 dinner, and 1 breakfast.',
  },
  {
    question: 'How do we reach Kalinchowk Bhagwati Temple from Kuri Village?',
    answer:
      'From Kuri Village, you can take a 5-minute scenic cable car ride directly to the summit where Kalinchowk Bhagwati Temple is located, or enjoy a 1-hour uphill hike.',
  },
];
