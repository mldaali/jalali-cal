/**
 * events.js - Persian Calendar Holidays & Events Engine
 * Supports full official holidays and cultural events for Jalali year 1405,
 * with dynamic calculation support for any year via native Intl API.
 */

// Fixed Persian (Solar) events and national holidays (applicable to all Jalali years)
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
  "7-1": [{ title: "آغاز سال تحصیلی و بازگشایی مدارس", isHoliday: false }],
  "7-7": [{ title: "روز آتش‌نشانی و ایمنی / بزرگداشت شمس تبریزی", isHoliday: false }],
  "7-8": [{ title: "روز بزرگداشت مولوی (جلال‌الدین محمد بلخی)", isHoliday: false }],
  "7-9": [{ title: "روز جهانی ناشنوایان / روز جهانی ترجمه", isHoliday: false }],
  "7-13": [{ title: "روز نیروی انتظامی", isHoliday: false }],
  "7-14": [{ title: "روز دامپزشکی", isHoliday: false }],
  "7-15": [{ title: "روز روستا و عشایر", isHoliday: false }],
  "7-16": [{ title: "روز جهانی کودک", isHoliday: false }],
  "7-20": [{ title: "روز بزرگداشت حافظ شیرازی", isHoliday: false }],
  "7-24": [{ title: "روز ملی اولیا و مربیان", isHoliday: false }],
  "7-26": [{ title: "روز تربیت بدنی و ورزش", isHoliday: false }],
  "7-29": [{ title: "روز صادرات", isHoliday: false }],

  // آبان (Aban)
  "8-1": [{ title: "روز آمار و برنامه‌ریزی", isHoliday: false }],
  "8-7": [{ title: "سالروز ورود کوروش بزرگ به بابل", isHoliday: false }],
  "8-8": [{ title: "روز نوجوان / شهادت محمدحسین فهمیده", isHoliday: false }],
  "8-10": [{ title: "جشن آبانگان", isHoliday: false }],
  "8-13": [{ title: "روز دانش‌آموز / روز ملی مبارزه با استکبار جهانی", isHoliday: false }],
  "8-24": [{ title: "روز کتاب و کتاب‌خوانی / بزرگداشت علامه طباطبایی", isHoliday: false }],
  "8-30": [{ title: "روز جهانی کودک (یونیسف)", isHoliday: false }],

  // آذر (Azar)
  "9-5": [{ title: "روز بسیج مستضعفان", isHoliday: false }],
  "9-7": [{ title: "روز نیروی دریایی", isHoliday: false }],
  "9-9": [{ title: "جشن آذرگان", isHoliday: false }],
  "9-13": [{ title: "روز جهانی معلولان", isHoliday: false }],
  "9-16": [{ title: "روز دانشجو", isHoliday: false }],
  "9-25": [{ title: "روز پژوهش", isHoliday: false }],
  "9-26": [{ title: "روز حمل و نقل", isHoliday: false }],
  "9-30": [{ title: "جشن شب یلدا (چله) / آغاز زمستان", isHoliday: false }],

  // دی (Dey)
  "10-1": [{ title: "جشن خرم‌روز / آغاز فصل زمستان", isHoliday: false }],
  "10-5": [{ title: "روز ایمنی در برابر زلزله و کاهش بلایای طبیعی", isHoliday: false }],
  "10-16": [{ title: "روز شهدای دانشجو (شهدای هویزه)", isHoliday: false }],
  "10-20": [{ title: "سالروز شهادت میرزا تقی‌خان امیرکبیر", isHoliday: false }],
  "10-27": [{ title: "سالروز شهادت فدائیان اسلام", isHoliday: false }],

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

// Verified Islamic Lunar Holidays aligned to Jalali Year 1405
// (Derived from astronomical calculation of 1447-1448 AH)
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

// Canonical Islamic calendar events by Hijri month and day
// (used as dynamic fallback for any other year via Intl Islamic calendar)
const HIJRI_EVENTS_MAP = {
  "1-9": { title: "تاسوعای حسینی", isHoliday: true },
  "1-10": { title: "عاشورای حسینی", isHoliday: true },
  "2-20": { title: "اربعین حسینی", isHoliday: true },
  "2-28": { title: "رحلت حضرت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true },
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
 * Extract Hijri date parts using native JavaScript Intl API
 * @param {Date} date
 * @returns {{ hYear: number, hMonth: number, hDay: number } | null}
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
    console.warn("Intl islamic calendar formatting error:", e);
    return null;
  }
}

/**
 * Returns all events and holidays for a given Jalali date
 * @param {number} jYear - Jalali year (e.g. 1405)
 * @param {number} jMonth - Jalali month (1-12)
 * @param {number} jDay - Jalali day (1-31)
 * @param {Date} [gDate] - Corresponding Gregorian Date (optional, used for dynamic lunar check)
 * @returns {Array<{ title: string, isHoliday: boolean }>}
 */
function getEventsForDate(jYear, jMonth, jDay, gDate = null) {
  const events = [];
  const key = `${jMonth}-${jDay}`;

  // 1. Add Solar events
  if (SOLAR_EVENTS[key]) {
    events.push(...SOLAR_EVENTS[key]);
  }

  // 2. Add Lunar events:
  // If year is 1405, use high-precision precalculated dataset
  if (jYear === 1405) {
    if (LUNAR_HOLIDAYS_1405[key]) {
      // Check if duplicate title already added (e.g. Farvardin 1 holiday)
      for (const ev of LUNAR_HOLIDAYS_1405[key]) {
        if (!events.some(e => e.title === ev.title)) {
          events.push(ev);
        }
      }
    }
  } else if (gDate instanceof Date && !isNaN(gDate)) {
    // For other years, dynamically calculate using Intl Islamic calendar
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
 * @param {number} jYear
 * @param {number} jMonth
 * @param {number} jDay
 * @param {number} [iranianWeekdayIndex] - 0=Saturday ... 6=Friday
 * @param {Date} [gDate]
 * @returns {boolean}
 */
function isOfficialHoliday(jYear, jMonth, jDay, iranianWeekdayIndex = null, gDate = null) {
  if (iranianWeekdayIndex === 6) {
    return true; // Friday is always weekend holiday in Iran
  }
  const events = getEventsForDate(jYear, jMonth, jDay, gDate);
  return events.some(ev => ev.isHoliday);
}

/**
 * Get all events for an entire Jalali month
 * @param {number} jYear
 * @param {number} jMonth
 * @returns {Array<{ day: number, events: Array<{ title: string, isHoliday: boolean }> }>}
 */
function getMonthEvents(jYear, jMonth) {
  const list = [];
  const daysInMonth = jMonth <= 6 ? 31 : (jMonth <= 11 ? 30 : (jYear === 1403 || jYear === 1408 ? 30 : 29));
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
    LUNAR_HOLIDAYS_1405,
    HIJRI_EVENTS_MAP,
    getHijriParts,
    getEventsForDate,
    isOfficialHoliday,
    getMonthEvents
  };
}
