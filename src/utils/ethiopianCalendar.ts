/**
 * Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) Converter & Utilities
 * Provides mathematically exact conversion between Gregorian and Ethiopian calendars,
 * month names in English and Ge'ez/Amharic, and calendar matrix generators.
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1-13
  day: number;   // 1-30 (or 1-6 for Pagume)
  monthNameEn: string;
  monthNameAm: string;
  dayOfWeekAm: string;
  isLeapYear: boolean;
}

export const ETHIOPIAN_MONTHS = [
  { id: 1, en: 'Meskerem', am: 'መስከረም', days: 30 },
  { id: 2, en: 'Tikimt', am: 'ጥቅምት', days: 30 },
  { id: 3, en: 'Hidar', am: 'ህዳር', days: 30 },
  { id: 4, en: 'Tahsas', am: 'ታህሳስ', days: 30 },
  { id: 5, en: 'Tir', am: 'ጥር', days: 30 },
  { id: 6, en: 'Yakatit', am: 'የካቲት', days: 30 },
  { id: 7, en: 'Megabit', am: 'መጋቢት', days: 30 },
  { id: 8, en: 'Miazia', am: 'ሚያዝያ', days: 30 },
  { id: 9, en: 'Ginbot', am: 'ግንቦት', days: 30 },
  { id: 10, en: 'Sene', am: 'ሰኔ', days: 30 },
  { id: 11, en: 'Hamle', am: 'ሐምሌ', days: 30 },
  { id: 12, en: 'Nehase', am: 'ነሐሴ', days: 30 },
  { id: 13, en: 'Pagume', am: 'ጳጉሜ', days: 5 }, // 6 on leap year
];

export const AMHARIC_DAYS = [
  { en: 'Sunday', am: 'እሁድ', short: 'እሁ' },
  { en: 'Monday', am: 'ሰኞ', short: 'ሰኞ' },
  { en: 'Tuesday', am: 'ማክሰኞ', short: 'ማክ' },
  { en: 'Wednesday', am: 'ረቡዕ', short: 'ረቡ' },
  { en: 'Thursday', am: 'ሐሙስ', short: 'ሐሙ' },
  { en: 'Friday', am: 'አርብ', short: 'አር' },
  { en: 'Saturday', am: 'ቅዳሜ', short: 'ቅዳ' },
];

/**
 * Checks if an Ethiopian year is a leap year (takes place every 4 years when year % 4 === 3)
 */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

/**
 * Converts a Gregorian Date to an Ethiopian Date
 * Based on Julian Day Number (JDN) epoch offset.
 * Epoch difference: JDN of Ethiopian epoch (1 Meskerem 1) is 1723856.
 */
export function gregorianToEthiopian(date: Date): EthiopianDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  // Calculate Julian Day Number from Gregorian Date
  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - a;
  const m = gMonth + 12 * a - 3;
  const jdn =
    gDay +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // JDN to Ethiopian conversion
  // Ethiopian epoch in JDN = 1723856
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const ethYear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);

  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const monthMeta = ETHIOPIAN_MONTHS[Math.min(ethMonth - 1, 12)];
  const dayOfWeekIndex = date.getDay();
  const dayMeta = AMHARIC_DAYS[dayOfWeekIndex];

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameEn: monthMeta.en,
    monthNameAm: monthMeta.am,
    dayOfWeekAm: dayMeta.am,
    isLeapYear: isEthiopianLeapYear(ethYear),
  };
}

/**
 * Converts Ethiopian Date to Gregorian Date
 */
export function ethiopianToGregorian(year: number, month: number, day: number): Date {
  const jdn =
    1723856 +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1;

  // Convert JDN to Gregorian Date
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l1 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l1 + 1)) / 1461001);
  const l2 = l1 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l2) / 2447);
  const gDay = l2 - Math.floor((2447 * j) / 80);
  const l3 = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l3;
  const gYear = 100 * (n - 49) + i + l3;

  return new Date(gYear, gMonth - 1, gDay);
}

/**
 * Returns formatted string representing both dates
 * e.g., "Wednesday, Nov 11, 2026 • ረቡዕ፣ ህዳር 2, 2019 ዓ.ም."
 */
export function formatDualDate(date: Date = new Date()): {
  gregorianStr: string;
  ethiopianStr: string;
  dualStr: string;
} {
  const eth = gregorianToEthiopian(date);
  const gregorianStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const ethiopianStr = `${eth.dayOfWeekAm}፣ ${eth.monthNameAm} ${eth.day}፣ ${eth.year} ዓ.ም.`;
  const dualStr = `${gregorianStr} • ${eth.monthNameEn} ${eth.day}, ${eth.year} E.C. (${eth.monthNameAm})`;

  return {
    gregorianStr,
    ethiopianStr,
    dualStr,
  };
}

/**
 * Generates calendar days for an Ethiopian month
 */
export function getEthiopianMonthCalendar(year: number, month: number) {
  const isLeap = isEthiopianLeapYear(year);
  const daysInMonth = month === 13 ? (isLeap ? 6 : 5) : 30;

  // First day of this Ethiopian month in Gregorian
  const firstDayGreg = ethiopianToGregorian(year, month, 1);
  const startDayOfWeek = firstDayGreg.getDay(); // 0 is Sunday

  const days: Array<{
    ethDay: number;
    ethMonth: number;
    ethYear: number;
    gregDate: Date;
    isCurrentMonth: boolean;
  }> = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const gregDate = ethiopianToGregorian(year, month, i);
    days.push({
      ethDay: i,
      ethMonth: month,
      ethYear: year,
      gregDate,
      isCurrentMonth: true,
    });
  }

  return {
    year,
    month,
    monthMeta: ETHIOPIAN_MONTHS[month - 1],
    startDayOfWeek,
    daysInMonth,
    days,
  };
}
