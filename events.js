/**
 * events.js - Multi-Year Persian Calendar Holidays & Events Engine
 * Supports official holidays and cultural events for all Jalali years (1400-1410+),
 * combining precalculated high-precision datasets with dynamic Intl Umalqura calculation.
 */

// 1. Fixed Persian (Solar) events and national holidays (applicable to all Jalali years)
const SOLAR_EVENTS = {
  // فروردین (Farvardin)
  "1-1": [{ title: "آغاز جشن نوروز (سال نو)", isHoliday: true }],
  "1-2": [{ title: "عید نوروز", isHoliday: true }],
  "1-3": [{ title: "عید نوروز", isHoliday: true }],
  "1-4": [{ title: "عید نوروز", isHoliday: true }],
  "1-12": [{ title: "روز جمهوری اسلامی ایران", isHoliday: true }],
  "1-13": [{ title: "روز طبیعت (سیزده‌بدر)", isHoliday: true }],
  "1-18": [{ title: "روز سلامتی (روز جهانی بهداشت)", isHoliday: false }],
  "1-25": [{ title: "روز بزرگداشت عطار نیشابوری", isHoliday: false }],
  "1-29": [{ title: "روز ارتش جمهوری اسلامی ایران", isHoliday: false }],

  // اردیبهشت (Ordibehesht)
  "2-1": [{ title: "روز بزرگداشت سعدی شیرازی", isHoliday: false }],
  "2-2": [{ title: "جشن گیاه‌آوری / روز زمین پاک", isHoliday: false }],
  "2-3": [{ title: "روز بزرگداشت شیخ بهایی / روز معمار", isHoliday: false }],
  "2-9": [{ title: "روز شوراها", isHoliday: false }],
  "2-10": [{ title: "روز ملی خلیج فارس", isHoliday: false }],
  "2-11": [{ title: "روز جهانی کارگر", isHoliday: false }],
  "2-12": [{ title: "روز معلم / سالروز شهادت استاد مرتضی مطهری", isHoliday: false }],
  "2-15": [{ title: "جشن بهاربد / روز شیراز", isHoliday: false }],
  "2-19": [{ title: "روز اسناد ملی و میراث مکتوب", isHoliday: false }],
  "2-25": [{ title: "روز پاسداشت زبان فارسی و بزرگداشت فردوسی", isHoliday: false }],
  "2-28": [{ title: "روز بزرگداشت حکیم عمر خیام / روز جهانی موزه", isHoliday: false }],

  // خرداد (Khordad)
  "3-1": [{ title: "روز بزرگداشت ملاصدرا", isHoliday: false }],
  "3-3": [{ title: "فتح خرمشهر / روز مقاومت، ایثار و پیروزی", isHoliday: false }],
  "3-14": [{ title: "رحلت حضرت امام خمینی (ره)", isHoliday: true }],
  "3-15": [{ title: "قیام خونین ۱۵ خرداد", isHoliday: true }],
  "3-20": [{ title: "روز صنایع دستی", isHoliday: false }],
  "3-27": [{ title: "روز جهاد کشاورزی", isHoliday: false }],
  "3-31": [{ title: "شهادت دکتر مصطفی چمران / روز بسیج اساتید", isHoliday: false }],

  // تیر (Tir)
  "4-1": [{ title: "جشن آب‌پاشونک (آغاز تابستان) / روز اصناف", isHoliday: false }],
  "4-7": [{ title: "شهادت دکتر بهشتی و ۷۲ تن از یاران انقلاب / روز قوه قضاییه", isHoliday: false }],
  "4-10": [{ title: "روز صنعت و معدن", isHoliday: false }],
  "4-14": [{ title: "روز قلم", isHoliday: false }],
  "4-25": [{ title: "روز بهزیستی و تامین اجتماعی", isHoliday: false }],
  "4-27": [{ title: "اعلام پذیرش قطعنامه ۵۹۸ شورای امنیت", isHoliday: false }],

  // مرداد (Mordad)
  "5-6": [{ title: "روز ترویج آموزش‌های فنی و حرفه‌ای", isHoliday: false }],
  "5-8": [{ title: "روز بزرگداشت شیخ شهاب‌الدین سهروردی (شیخ اشراق)", isHoliday: false }],
  "5-14": [{ title: "سالروز صدور فرمان مشروطیت", isHoliday: false }],
  "5-17": [{ title: "روز خبرنگار", isHoliday: false }],
  "5-26": [{ title: "سالروز بازگشت آزادگان سرافراز به میهن اسلامی", isHoliday: false }],
  "5-28": [{ title: "سالروز کودتای ۲۸ مرداد", isHoliday: false }],

  // شهریور (Shahrivar)
  "6-1": [{ title: "روز پزشک / بزرگداشت ابوعلی سینا", isHoliday: false }],
  "6-2": [{ title: "آغاز هفته دولت", isHoliday: false }],
  "6-4": [{ title: "جشن شهریورگان / روز کارمند", isHoliday: false }],
  "6-5": [{ title: "روز بزرگداشت محمدبن زکریای رازی / روز داروساز", isHoliday: false }],
  "6-8": [{ title: "سالروز انفجار دفتر نخست‌وزیری / روز مبارزه با تروریسم", isHoliday: false }],
  "6-11": [{ title: "روز صنعت چاپ", isHoliday: false }],
  "6-13": [{ title: "روز بزرگداشت ابوریحان بیرونی / روز تعاون", isHoliday: false }],
  "6-21": [{ title: "روز سینما", isHoliday: false }],
  "6-27": [{ title: "روز شعر و ادب فارسی / بزرگداشت استاد شهریار", isHoliday: false }],
  "6-31": [{ title: "آغاز هفته دفاع مقدس", isHoliday: false }],

  // مهر (Mehr)
  "7-1": [{ title: "جشن میتراکانا / آغاز سال تحصیلی جدید", isHoliday: false }],
  "7-7": [{ title: "روز آتش‌نشانی و ایمنی", isHoliday: false }],
  "7-8": [{ title: "روز بزرگداشت مولوی (جلال‌الدین محمد بلخی)", isHoliday: false }],
  "7-10": [{ title: "جشن باستانی مهرگان", isHoliday: false }],
  "7-13": [{ title: "روز نیروی انتظامی", isHoliday: false }],
  "7-14": [{ title: "روز دامپزشکی", isHoliday: false }],
  "7-15": [{ title: "روز روستا و عشایر", isHoliday: false }],
  "7-20": [{ title: "روز بزرگداشت حافظ شیرازی", isHoliday: false }],
  "7-26": [{ title: "روز تربیت بدنی و ورزش", isHoliday: false }],

  // آبان (Aban)
  "8-1": [{ title: "روز آمار و برنامه‌ریزی", isHoliday: false }],
  "8-7": [{ title: "روز کوروش بزرگ", isHoliday: false }],
  "8-8": [{ title: "روز نوجوان / بسیج دانش‌آموزی", isHoliday: false }],
  "8-10": [{ title: "جشن آبانگان", isHoliday: false }],
  "8-13": [{ title: "روز دانش‌آموز / تسخیر لانه جاسوسی", isHoliday: false }],
  "8-14": [{ title: "روز فرهنگ عمومی", isHoliday: false }],
  "8-18": [{ title: "روز ملی کیفیت", isHoliday: false }],
  "8-24": [{ title: "روز کتاب و کتابخوانی / بزرگداشت علامه طباطبایی", isHoliday: false }],

  // آذر (Azar)
  "9-4": [{ title: "روز جهانی مبارزه با خشونت علیه زنان", isHoliday: false }],
  "9-5": [{ title: "روز بسیج مستضعفان", isHoliday: false }],
  "9-7": [{ title: "روز نیروی دریایی", isHoliday: false }],
  "9-9": [{ title: "جشن آذرگان", isHoliday: false }],
  "9-10": [{ title: "روز مجلس / شهادت آیت‌الله مدرس", isHoliday: false }],
  "9-13": [{ title: "روز بیمه", isHoliday: false }],
  "9-16": [{ title: "روز دانشجو", isHoliday: false }],
  "9-25": [{ title: "روز پژوهش", isHoliday: false }],
  "9-26": [{ title: "روز حمل و نقل", isHoliday: false }],
  "9-30": [{ title: "شب یلدا (جشن شب چله)", isHoliday: false }],

  // دی (Dey)
  "10-1": [{ title: "جشن خرم‌روز (نخستین جشن دی‌گان)", isHoliday: false }],
  "10-5": [{ title: "روز ایمنی در برابر زلزله و کاهش بلایای طبیعی (یادبود زلزله بم)", isHoliday: false }],
  "10-13": [{ title: "روز جهانی مقاومت / سالروز شهادت سردار قاسم سلیمانی", isHoliday: false }],
  "10-16": [{ title: "روز شهدای دانشجو (حماسه هویزه)", isHoliday: false }],
  "10-19": [{ title: "قیام خونین مردم قم (۱۳۵۶)", isHoliday: false }],
  "10-26": [{ title: "فرار شاه معدوم از ایران (۱۳۵۷)", isHoliday: false }],

  // بهمن (Bahman)
  "11-1": [{ title: "زادروز حکیم ابوالقاسم فردوسی", isHoliday: false }],
  "11-10": [{ title: "جشن باستانی سده", isHoliday: false }],
  "11-12": [{ title: "آغاز دهه فجر / بازگشت امام خمینی (ره) به میهن", isHoliday: false }],
  "11-19": [{ title: "روز نیروی هوایی", isHoliday: false }],
  "11-22": [{ title: "سالروز پیروزی انقلاب اسلامی ایران", isHoliday: true }],
  "11-29": [{ title: "جشن سپندارمذگان (روز عشق و مهرورزی ایرانی)", isHoliday: false }],

  // اسفند (Esfand)
  "12-5": [{ title: "روز بزرگداشت خواجه نصیرالدین طوسی / روز مهندس", isHoliday: false }],
  "12-14": [{ title: "روز احسان و نیکوکاری", isHoliday: false }],
  "12-15": [{ title: "روز درختکاری / آغاز هفته منابع طبیعی", isHoliday: false }],
  "12-25": [{ title: "روز پایان سرایش شاهنامه فردوسی / بزرگداشت پروین اعتصامی", isHoliday: false }],
  "12-29": [{ title: "روز ملی شدن صنعت نفت ایران", isHoliday: true }]
};

// 2. Precalculated Lunar Holidays for 1404, 1405, and 1406
const LUNAR_HOLIDAYS_1404 = {
  "1-1": [{ title: "شهادت حضرت علی (ع)", isHoliday: true }],
  "1-11": [{ title: "عید سعید فطر", isHoliday: true }],
  "1-12": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true }],
  "2-4": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true }],
  "3-16": [{ title: "عید سعید قربان", isHoliday: true }],
  "3-24": [{ title: "عید سعید غدیر خم", isHoliday: true }],
  "4-14": [{ title: "تاسوعای حسینی", isHoliday: true }],
  "4-15": [{ title: "عاشورای حسینی", isHoliday: true }],
  "5-23": [{ title: "اربعین حسینی", isHoliday: true }],
  "5-31": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true }],
  "6-2": [{ title: "شهادت امام رضا (ع)", isHoliday: true }],
  "6-10": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true }],
  "6-19": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true }],
  "9-3": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true }],
  "10-12": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true }],
  "10-26": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true }],
  "11-14": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true }],
  "12-20": [{ title: "شهادت حضرت علی (ع)", isHoliday: true }],
  "12-30": [{ title: "عید سعید فطر", isHoliday: true }]
};

const LUNAR_HOLIDAYS_1405 = {
  "1-1": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true }],
  "1-24": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true }],
  "3-6": [{ title: "عید سعید قربان", isHoliday: true }],
  "3-14": [{ title: "عید سعید غدیر خم", isHoliday: true }],
  "4-3": [{ title: "تاسوعای حسینی", isHoliday: true }],
  "4-4": [{ title: "عاشورای حسینی", isHoliday: true }],
  "5-12": [{ title: "اربعین حسینی", isHoliday: true }],
  "5-20": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true }],
  "5-22": [{ title: "شهادت امام رضا (ع)", isHoliday: true }],
  "5-30": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true }],
  "6-8": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true }],
  "8-22": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true }],
  "10-1": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true }],
  "10-15": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true }],
  "11-3": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true }],
  "12-9": [{ title: "شهادت حضرت علی (ع)", isHoliday: true }],
  "12-18": [{ title: "عید سعید فطر", isHoliday: true }],
  "12-19": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true }]
};

const LUNAR_HOLIDAYS_1406 = {
  "1-13": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true }],
  "2-26": [{ title: "عید سعید قربان", isHoliday: true }],
  "3-4": [{ title: "عید سعید غدیر خم", isHoliday: true }],
  "3-23": [{ title: "تاسوعای حسینی", isHoliday: true }],
  "3-24": [{ title: "عاشورای حسینی", isHoliday: true }],
  "5-2": [{ title: "اربعین حسینی", isHoliday: true }],
  "5-10": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true }],
  "5-12": [{ title: "شهادت امام رضا (ع)", isHoliday: true }],
  "5-20": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true }],
  "5-29": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true }],
  "8-11": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true }],
  "9-20": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true }],
  "10-4": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true }],
  "10-22": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true }],
  "11-28": [{ title: "شهادت حضرت علی (ع)", isHoliday: true }],
  "12-8": [{ title: "عید سعید فطر", isHoliday: true }],
  "12-9": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true }]
};

// 3. Canonical Islamic calendar events mapped to Hijri (Lunar) month & day
const HIJRI_EVENTS_MAP = {
  "1-9": { title: "تاسوعای حسینی", isHoliday: true },
  "1-10": { title: "عاشورای حسینی", isHoliday: true },
  "2-20": { title: "اربعین حسینی", isHoliday: true },
  "2-28": { title: "رحلت حضرت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true },
  "2-29": { title: "شهادت امام رضا (ع)", isHoliday: true },
  "2-30": { title: "شهادت امام رضا (ع)", isHoliday: true },
  "3-8": { title: "شهادت امام حسن عسکری (ع)", isHoliday: true },
  "3-17": { title: "میلاد حضرت رسول اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true },
  "6-3": { title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true },
  "7-13": { title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true },
  "7-27": { title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true },
  "8-15": { title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true },
  "9-21": { title: "شهادت حضرت علی (ع)", isHoliday: true },
  "10-1": { title: "عید سعید فطر", isHoliday: true },
  "10-2": { title: "تعطیل به مناسبت عید فطر", isHoliday: true },
  "10-25": { title: "شهادت امام جعفر صادق (ع)", isHoliday: true },
  "12-10": { title: "عید سعید قربان", isHoliday: true },
  "12-18": { title: "عید سعید غدیر خم", isHoliday: true }
};

/**
 * Built-in Bidirectional Calendar Helpers
 */
function isLeapJalaliYear(year) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097];
  let jp = breaks[0];
  if (year < jp || year >= breaks[breaks.length - 1]) return false;
  let jump = 0;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (year < jm) break;
    jp = jm;
  }
  let n = year - jp;
  if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;
  let leap = ((n + 1) % 33) - 1;
  if (leap === -1) leap = 4;
  return leap % 4 === 0;
}

function jalaliToGregorianInternal(jy, jm, jd) {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let jp = (jm < 7) ? (jm - 1) * 31 : (jm - 7) * 30 + 186;
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + jp;
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 1461) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (days >= salA[gm]) {
    days -= salA[gm];
    gm++;
  }
  return new Date(gy, gm - 1, days + 1);
}

/**
 * Extract Hijri date parts using native JavaScript Intl API
 */
function getHijriParts(date) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }
    return {
      hYear: parseInt(map.year, 10),
      hMonth: parseInt(map.month, 10),
      hDay: parseInt(map.day, 10)
    };
  } catch (e) {
    return null;
  }
}

/**
 * Multi-Year Events Resolver:
 * Resolves events and holidays for ANY Jalali year (1400-1410+)
 */
function getEventsForDate(jYear, jMonth, jDay, gDate = null) {
  const events = [];
  const key = `${jMonth}-${jDay}`;

  // 1. Add fixed Solar events
  if (SOLAR_EVENTS[key]) {
    events.push(...SOLAR_EVENTS[key]);
  }

  // 2. Add Islamic Lunar Holidays
  if (jYear === 1404 && LUNAR_HOLIDAYS_1404[key]) {
    for (const ev of LUNAR_HOLIDAYS_1404[key]) {
      if (!events.some(e => e.title === ev.title)) events.push(ev);
    }
  } else if (jYear === 1405 && LUNAR_HOLIDAYS_1405[key]) {
    for (const ev of LUNAR_HOLIDAYS_1405[key]) {
      if (!events.some(e => e.title === ev.title)) events.push(ev);
    }
  } else if (jYear === 1406 && LUNAR_HOLIDAYS_1406[key]) {
    for (const ev of LUNAR_HOLIDAYS_1406[key]) {
      if (!events.some(e => e.title === ev.title)) events.push(ev);
    }
  } else {
    // Dynamic Astronomical / Intl Calculation for ANY arbitrary year
    if (!gDate) {
      gDate = jalaliToGregorianInternal(jYear, jMonth, jDay);
    }
    const hijri = getHijriParts(gDate);
    if (hijri) {
      const hKey = `${hijri.hMonth}-${hijri.hDay}`;
      if (HIJRI_EVENTS_MAP[hKey]) {
        const ev = HIJRI_EVENTS_MAP[hKey];
        if (!events.some(e => e.title === ev.title)) {
          events.push(ev);
        }
      }
    }
  }

  return events;
}

/**
 * Check if a date is an official holiday (or Friday)
 */
function isOfficialHoliday(jYear, jMonth, jDay, iranianWeekdayIndex = null, gDate = null) {
  if (iranianWeekdayIndex === 6) {
    return true; // Friday is weekend in Iran
  }
  const events = getEventsForDate(jYear, jMonth, jDay, gDate);
  return events.some(ev => ev.isHoliday);
}

/**
 * Get all events for an entire Jalali month
 */
function getMonthEvents(jYear, jMonth) {
  const list = [];
  const daysInMonth = jMonth <= 6 ? 31 : (jMonth <= 11 ? 30 : (isLeapJalaliYear(jYear) ? 30 : 29));
  for (let d = 1; d <= daysInMonth; d++) {
    const evs = getEventsForDate(jYear, jMonth, d);
    if (evs.length > 0) {
      list.push({ day: d, events: evs });
    }
  }
  return list;
}

// Export for ES modules and standard browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SOLAR_EVENTS,
    LUNAR_HOLIDAYS_1404,
    LUNAR_HOLIDAYS_1405,
    LUNAR_HOLIDAYS_1406,
    HIJRI_EVENTS_MAP,
    isLeapJalaliYear,
    getHijriParts,
    getEventsForDate,
    isOfficialHoliday,
    getMonthEvents
  };
}
