/**
 * events.js - Multi-Year Persian Calendar Holidays & Events Engine
 * Supports official holidays and cultural events for all Jalali years (1400-1410+),
 * combining precalculated high-precision datasets with dynamic Intl Umalqura calculation.
 *
 * Categories supported for user personalization:
 * - "ancient": مناسبت‌های کهن، باستانی و ادبی ایران (نوروز، یلدا، سده، مهرگان، کوروش، فردوسی و...)
 * - "national": مناسبت‌های ملی، تاریخی و رسمی معاصر (جمهوری اسلامی، ملی شدن نفت، ۲۲ بهمن، خلیج فارس، ارتش و...)
 * - "religious": مناسبت‌های مذهبی و اسلامی (اعیاد فطر و قربان، غدیر، عاشورا، تاسوعا، ولادت‌ها و شهادت‌ها)
 * - "international": مناسبت‌های جهانی و بین‌المللی (روز زمین، کارگر، بهداشت، کتاب، موزه و...)
 * - "gaming": رویدادها و تاریخ انتشار بازی‌های ویدئویی
 */

// 1. Fixed Persian (Solar) events and national holidays (applicable to all Jalali years)
const SOLAR_EVENTS = {
  // فروردین (Farvardin)
  "1-1": [{ title: "آغاز جشن نوروز (سال نو)", isHoliday: true, category: "ancient" }],
  "1-2": [{ title: "عید نوروز", isHoliday: true, category: "ancient" }],
  "1-3": [{ title: "عید نوروز", isHoliday: true, category: "ancient" }],
  "1-4": [{ title: "عید نوروز", isHoliday: true, category: "ancient" }],
  "1-12": [{ title: "روز جمهوری اسلامی ایران", isHoliday: true, category: "national" }],
  "1-13": [{ title: "روز طبیعت (سیزده‌بدر)", isHoliday: true, category: "ancient" }],
  "1-18": [{ title: "روز سلامتی (روز جهانی بهداشت)", isHoliday: false, category: "international" }],
  "1-25": [{ title: "روز بزرگداشت عطار نیشابوری", isHoliday: false, category: "ancient" }],
  "1-29": [{ title: "روز ارتش جمهوری اسلامی ایران", isHoliday: false, category: "national" }],

  // اردیبهشت (Ordibehesht)
  "2-1": [{ title: "روز بزرگداشت سعدی شیرازی", isHoliday: false, category: "ancient" }],
  "2-2": [{ title: "جشن گیاه‌آوری / روز زمین پاک", isHoliday: false, category: "ancient" }],
  "2-3": [{ title: "روز بزرگداشت شیخ بهایی / روز معمار", isHoliday: false, category: "ancient" }],
  "2-9": [{ title: "روز شوراها", isHoliday: false, category: "national" }],
  "2-10": [{ title: "روز ملی خلیج فارس", isHoliday: false, category: "national" }],
  "2-11": [{ title: "روز جهانی کارگر", isHoliday: false, category: "international" }],
  "2-12": [{ title: "روز معلم / سالروز شهادت استاد مرتضی مطهری", isHoliday: false, category: "national" }],
  "2-15": [{ title: "جشن بهاربد / روز شیراز", isHoliday: false, category: "ancient" }],
  "2-19": [{ title: "روز اسناد ملی و میراث مکتوب", isHoliday: false, category: "national" }],
  "2-25": [{ title: "روز پاسداشت زبان فارسی و بزرگداشت فردوسی", isHoliday: false, category: "ancient" }],
  "2-28": [{ title: "روز بزرگداشت حکیم عمر خیام / روز جهانی موزه", isHoliday: false, category: "ancient" }],

  // خرداد (Khordad)
  "3-1": [{ title: "روز بزرگداشت ملاصدرا", isHoliday: false, category: "ancient" }],
  "3-3": [{ title: "فتح خرمشهر / روز مقاومت، ایثار و پیروزی", isHoliday: false, category: "national" }],
  "3-14": [{ title: "رحلت حضرت امام خمینی (ره)", isHoliday: true, category: "religious" }],
  "3-15": [{ title: "قیام خونین ۱۵ خرداد", isHoliday: true, category: "religious" }],
  "3-20": [{ title: "روز صنایع دستی", isHoliday: false, category: "national" }],
  "3-27": [{ title: "روز جهاد کشاورزی", isHoliday: false, category: "national" }],
  "3-31": [{ title: "شهادت دکتر مصطفی چمران / روز بسیج اساتید", isHoliday: false, category: "national" }],

  // تیر (Tir)
  "4-1": [{ title: "جشن آب‌پاشونک (آغاز تابستان) / روز اصناف", isHoliday: false, category: "ancient" }],
  "4-7": [{ title: "شهادت دکتر بهشتی و ۷۲ تن از یاران انقلاب / روز قوه قضاییه", isHoliday: false, category: "national" }],
  "4-10": [{ title: "روز صنعت و معدن", isHoliday: false, category: "national" }],
  "4-14": [{ title: "روز قلم", isHoliday: false, category: "national" }],
  "4-25": [{ title: "روز بهزیستی و تامین اجتماعی", isHoliday: false, category: "national" }],
  "4-27": [{ title: "اعلام پذیرش قطعنامه ۵۹۸ شورای امنیت", isHoliday: false, category: "national" }],

  // مرداد (Mordad)
  "5-6": [{ title: "روز ترویج آموزش‌های فنی و حرفه‌ای", isHoliday: false, category: "national" }],
  "5-8": [{ title: "روز بزرگداشت شیخ شهاب‌الدین سهروردی (شیخ اشراق)", isHoliday: false, category: "ancient" }],
  "5-14": [{ title: "سالروز صدور فرمان مشروطیت", isHoliday: false, category: "national" }],
  "5-17": [{ title: "روز خبرنگار", isHoliday: false, category: "national" }],
  "5-26": [{ title: "سالروز بازگشت آزادگان سرافراز به میهن اسلامی", isHoliday: false, category: "national" }],
  "5-28": [{ title: "سالروز کودتای ۲۸ مرداد", isHoliday: false, category: "national" }],

  // شهریور (Shahrivar)
  "6-1": [{ title: "روز پزشک / بزرگداشت ابوعلی سینا", isHoliday: false, category: "ancient" }],
  "6-2": [{ title: "آغاز هفته دولت", isHoliday: false, category: "national" }],
  "6-4": [{ title: "جشن شهریورگان / روز کارمند", isHoliday: false, category: "ancient" }],
  "6-5": [{ title: "روز بزرگداشت محمدبن زکریای رازی / روز داروساز", isHoliday: false, category: "ancient" }],
  "6-8": [{ title: "سالروز انفجار دفتر نخست‌وزیری / روز مبارزه با تروریسم", isHoliday: false, category: "national" }],
  "6-11": [{ title: "روز صنعت چاپ", isHoliday: false, category: "national" }],
  "6-13": [{ title: "روز بزرگداشت ابوریحان بیرونی / روز تعاون", isHoliday: false, category: "ancient" }],
  "6-21": [{ title: "روز سینما", isHoliday: false, category: "national" }],
  "6-27": [{ title: "روز شعر و ادب فارسی / بزرگداشت استاد شهریار", isHoliday: false, category: "ancient" }],
  "6-31": [{ title: "آغاز هفته دفاع مقدس", isHoliday: false, category: "national" }],

  // مهر (Mehr)
  "7-1": [{ title: "جشن میتراکانا / آغاز سال تحصیلی جدید", isHoliday: false, category: "ancient" }],
  "7-7": [{ title: "روز آتش‌نشانی و ایمنی", isHoliday: false, category: "national" }],
  "7-8": [{ title: "روز بزرگداشت مولوی (جلال‌الدین محمد بلخی)", isHoliday: false, category: "ancient" }],
  "7-10": [{ title: "جشن باستانی مهرگان", isHoliday: false, category: "ancient" }],
  "7-13": [{ title: "روز نیروی انتظامی", isHoliday: false, category: "national" }],
  "7-14": [{ title: "روز دامپزشکی", isHoliday: false, category: "national" }],
  "7-15": [{ title: "روز روستا و عشایر", isHoliday: false, category: "national" }],
  "7-20": [{ title: "روز بزرگداشت حافظ شیرازی", isHoliday: false, category: "ancient" }],
  "7-26": [{ title: "روز تربیت بدنی و ورزش", isHoliday: false, category: "national" }],

  // آبان (Aban)
  "8-1": [{ title: "روز آمار و برنامه‌ریزی", isHoliday: false, category: "national" }],
  "8-7": [{ title: "روز کوروش بزرگ", isHoliday: false, category: "ancient" }],
  "8-8": [{ title: "روز نوجوان / بسیج دانش‌آموزی", isHoliday: false, category: "national" }],
  "8-10": [{ title: "جشن آبانگان", isHoliday: false, category: "ancient" }],
  "8-13": [{ title: "روز دانش‌آموز / تسخیر لانه جاسوسی", isHoliday: false, category: "national" }],
  "8-14": [{ title: "روز فرهنگ عمومی", isHoliday: false, category: "national" }],
  "8-18": [{ title: "روز ملی کیفیت", isHoliday: false, category: "national" }],
  "8-24": [{ title: "روز کتاب و کتابخوانی / بزرگداشت علامه طباطبایی", isHoliday: false, category: "religious" }],

  // آذر (Azar)
  "9-4": [{ title: "روز جهانی مبارزه با خشونت علیه زنان", isHoliday: false, category: "international" }],
  "9-5": [{ title: "روز بسیج مستضعفان", isHoliday: false, category: "national" }],
  "9-7": [{ title: "روز نیروی دریایی", isHoliday: false, category: "national" }],
  "9-9": [{ title: "جشن آذرگان", isHoliday: false, category: "ancient" }],
  "9-10": [{ title: "روز مجلس / شهادت آیت‌الله مدرس", isHoliday: false, category: "national" }],
  "9-13": [{ title: "روز بیمه", isHoliday: false, category: "national" }],
  "9-16": [{ title: "روز دانشجو", isHoliday: false, category: "national" }],
  "9-25": [{ title: "روز پژوهش", isHoliday: false, category: "national" }],
  "9-26": [{ title: "روز حمل و نقل", isHoliday: false, category: "national" }],
  "9-30": [{ title: "شب یلدا (جشن شب چله)", isHoliday: false, category: "ancient" }],

  // دی (Dey)
  "10-1": [{ title: "جشن خرم‌روز (نخستین جشن دی‌گان)", isHoliday: false, category: "ancient" }],
  "10-5": [{ title: "روز ایمنی در برابر زلزله و کاهش بلایای طبیعی (یادبود زلزله بم)", isHoliday: false, category: "national" }],
  "10-13": [{ title: "روز جهانی مقاومت / سالروز شهادت سردار قاسم سلیمانی", isHoliday: false, category: "national" }],
  "10-16": [{ title: "روز شهدای دانشجو (حماسه هویزه)", isHoliday: false, category: "national" }],
  "10-19": [{ title: "قیام خونین مردم قم (۱۳۵۶)", isHoliday: false, category: "national" }],
  "10-26": [{ title: "فرار شاه معدوم از ایران (۱۳۵۷)", isHoliday: false, category: "national" }],

  // بهمن (Bahman)
  "11-1": [{ title: "زادروز حکیم ابوالقاسم فردوسی", isHoliday: false, category: "ancient" }],
  "11-10": [{ title: "جشن باستانی سده", isHoliday: false, category: "ancient" }],
  "11-12": [{ title: "آغاز دهه فجر / بازگشت امام خمینی (ره) به میهن", isHoliday: false, category: "national" }],
  "11-19": [{ title: "روز نیروی هوایی", isHoliday: false, category: "national" }],
  "11-22": [{ title: "سالروز پیروزی انقلاب اسلامی ایران", isHoliday: true, category: "national" }],
  "11-29": [{ title: "جشن سپندارمذگان (روز عشق و مهرورزی ایرانی)", isHoliday: false, category: "ancient" }],

  // اسفند (Esfand)
  "12-5": [{ title: "روز بزرگداشت خواجه نصیرالدین طوسی / روز مهندس", isHoliday: false, category: "ancient" }],
  "12-14": [{ title: "روز احسان و نیکوکاری", isHoliday: false, category: "national" }],
  "12-15": [{ title: "روز درختکاری / آغاز هفته منابع طبیعی", isHoliday: false, category: "national" }],
  "12-25": [{ title: "روز پایان سرایش شاهنامه فردوسی / بزرگداشت پروین اعتصامی", isHoliday: false, category: "ancient" }],
  "12-29": [{ title: "روز ملی شدن صنعت نفت ایران", isHoliday: true, category: "national" }]
};

// 2. Precalculated Lunar Holidays for 1404, 1405, and 1406 (All categorized as "religious")
// Calibrated with official Calendar Center of Geophysics Institute, University of Tehran
const LUNAR_HOLIDAYS_1404 = {
  "1-1": [{ title: "شهادت حضرت علی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۱ رمضان" }],
  "1-11": [{ title: "عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۱ شوال" }],
  "1-12": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۲ شوال" }],
  "2-4": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۵ شوال" }],
  "3-16": [{ title: "عید سعید قربان", isHoliday: true, category: "religious", hijriDateStr: "۱۰ ذی‌الحجه" }],
  "3-24": [{ title: "عید سعید غدیر خم", isHoliday: true, category: "religious", hijriDateStr: "۱۸ ذی‌الحجه" }],
  "4-14": [{ title: "تاسوعای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۹ محرم" }],
  "4-15": [{ title: "عاشورای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۱۰ محرم" }],
  "5-23": [{ title: "اربعین حسینی", isHoliday: true, category: "religious", hijriDateStr: "۲۰ صفر" }],
  "6-1": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۸ صفر" }],
  "6-2": [{ title: "شهادت امام رضا (ع)", isHoliday: true, category: "religious", hijriDateStr: "۳۰ صفر" }],
  "6-10": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true, category: "religious", hijriDateStr: "۸ ربیع‌الاول" }],
  "6-19": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۱۷ ربیع‌الاول" }],
  "9-3": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true, category: "religious", hijriDateStr: "۳ جمادی‌الثانی" }],
  "10-13": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true, category: "religious", hijriDateStr: "۱۳ رجب" }],
  "10-27": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true, category: "religious", hijriDateStr: "۲۷ رجب" }],
  "11-15": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true, category: "religious", hijriDateStr: "۱۵ شعبان" }],
  "12-20": [{ title: "شهادت حضرت علی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۱ رمضان" }]
};

const LUNAR_HOLIDAYS_1405 = {
  "1-1": [{ title: "عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۱ شوال" }],
  "1-2": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۲ شوال" }],
  "1-25": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۵ شوال" }],
  "3-6": [{ title: "عید سعید قربان", isHoliday: true, category: "religious", hijriDateStr: "۱۰ ذی‌الحجه" }],
  "3-14": [{ title: "عید سعید غدیر خم", isHoliday: true, category: "religious", hijriDateStr: "۱۸ ذی‌الحجه" }],
  "4-3": [{ title: "تاسوعای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۹ محرم" }],
  "4-4": [{ title: "عاشورای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۱۰ محرم" }],
  "5-13": [{ title: "اربعین حسینی", isHoliday: true, category: "religious", hijriDateStr: "۲۰ صفر" }],
  "5-21": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۸ صفر" }],
  "5-22": [{ title: "شهادت امام رضا (ع)", isHoliday: true, category: "religious", hijriDateStr: "۳۰ صفر" }],
  "5-30": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true, category: "religious", hijriDateStr: "۸ ربیع‌الاول" }],
  "6-8": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۱۷ ربیع‌الاول" }],
  "8-22": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true, category: "religious", hijriDateStr: "۳ جمادی‌الثانی" }],
  "10-2": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true, category: "religious", hijriDateStr: "۱۳ رجب" }],
  "10-16": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true, category: "religious", hijriDateStr: "۲۷ رجب" }],
  "11-4": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true, category: "religious", hijriDateStr: "۱۵ شعبان" }],
  "12-9": [{ title: "شهادت حضرت علی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۱ رمضان" }],
  "12-19": [{ title: "عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۱ شوال" }],
  "12-20": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۲ شوال" }]
};

const LUNAR_HOLIDAYS_1406 = {
  "1-14": [{ title: "شهادت امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۵ شوال" }],
  "2-27": [{ title: "عید سعید قربان", isHoliday: true, category: "religious", hijriDateStr: "۱۰ ذی‌الحجه" }],
  "3-4": [{ title: "عید سعید غدیر خم", isHoliday: true, category: "religious", hijriDateStr: "۱۸ ذی‌الحجه" }],
  "3-24": [{ title: "تاسوعای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۹ محرم" }],
  "3-25": [{ title: "عاشورای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۱۰ محرم" }],
  "5-3": [{ title: "اربعین حسینی", isHoliday: true, category: "religious", hijriDateStr: "۲۰ صفر" }],
  "5-11": [{ title: "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۸ صفر" }],
  "5-13": [{ title: "شهادت امام رضا (ع)", isHoliday: true, category: "religious", hijriDateStr: "۳۰ صفر" }],
  "5-20": [{ title: "شهادت امام حسن عسکری (ع)", isHoliday: true, category: "religious", hijriDateStr: "۸ ربیع‌الاول" }],
  "5-29": [{ title: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۱۷ ربیع‌الاول" }],
  "8-12": [{ title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true, category: "religious", hijriDateStr: "۳ جمادی‌الثانی" }],
  "9-21": [{ title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true, category: "religious", hijriDateStr: "۱۳ رجب" }],
  "10-5": [{ title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true, category: "religious", hijriDateStr: "۲۷ رجب" }],
  "10-23": [{ title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true, category: "religious", hijriDateStr: "۱۵ شعبان" }],
  "11-28": [{ title: "شهادت حضرت علی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۱ رمضان" }],
  "12-8": [{ title: "عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۱ شوال" }],
  "12-9": [{ title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۲ شوال" }]
};

// 3. Canonical Islamic calendar events mapped to Hijri (Lunar) month & day
const HIJRI_EVENTS_MAP = {
  "1-9": { title: "تاسوعای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۹ محرم" },
  "1-10": { title: "عاشورای حسینی", isHoliday: true, category: "religious", hijriDateStr: "۱۰ محرم" },
  "2-20": { title: "اربعین حسینی", isHoliday: true, category: "religious", hijriDateStr: "۲۰ صفر" },
  "2-28": { title: "رحلت حضرت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۸ صفر" },
  "2-29": { title: "شهادت امام رضا (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۹ صفر" },
  "2-30": { title: "شهادت امام رضا (ع)", isHoliday: true, category: "religious", hijriDateStr: "۳۰ صفر" },
  "3-8": { title: "شهادت امام حسن عسکری (ع)", isHoliday: true, category: "religious", hijriDateStr: "۸ ربیع‌الاول" },
  "3-17": { title: "میلاد حضرت رسول اکرم (ص) و امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۱۷ ربیع‌الاول" },
  "6-3": { title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true, category: "religious", hijriDateStr: "۳ جمادی‌الثانی" },
  "7-13": { title: "ولادت حضرت علی (ع) و روز پدر", isHoliday: true, category: "religious", hijriDateStr: "۱۳ رجب" },
  "7-27": { title: "مبعث حضرت رسول اکرم (ص)", isHoliday: true, category: "religious", hijriDateStr: "۲۷ رجب" },
  "8-15": { title: "ولادت حضرت قائم (عج) - نیمه شعبان", isHoliday: true, category: "religious", hijriDateStr: "۱۵ شعبان" },
  "9-21": { title: "شهادت حضرت علی (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۱ رمضان" },
  "10-1": { title: "عید سعید فطر", isHoliday: true, category: "religious", hijriDateStr: "۱ شوال" },
  "10-2": { title: "تعطیل به مناسبت عید فطر", isHoliday: true, category: "religious", hijriDateStr: "۲ شوال" },
  "10-25": { title: "شهادت امام جعفر صادق (ع)", isHoliday: true, category: "religious", hijriDateStr: "۲۵ شوال" },
  "12-10": { title: "عید سعید قربان", isHoliday: true, category: "religious", hijriDateStr: "۱۰ ذی‌الحجه" },
  "12-18": { title: "عید سعید غدیر خم", isHoliday: true, category: "religious", hijriDateStr: "۱۸ ذی‌الحجه" }
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
  if (n >= jump) return false;
  let leap = ((n + 1) * 682) % 2816;
  return leap < 682;
}

function jalaliToGregorianInternal(jy, jm, jd) {
  jy = parseInt(jy, 10);
  jm = parseInt(jm, 10);
  jd = parseInt(jd, 10);
  let gy = jy > 979 ? 1600 : 621;
  jy -= jy > 979 ? 979 : 0;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (days >= salA[gm]) {
    days -= salA[gm];
    gm++;
  }
  return new Date(gy, gm - 1, days + 1);
}

function gregorianToJalaliInternal(gy, gm, gd) {
  gy = parseInt(gy, 10);
  gm = parseInt(gm, 10);
  gd = parseInt(gd, 10);
  const g_d_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd;
  for (let i = 0; i < gm; ++i) days += g_d_m[i];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const salA = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jm = 0;
  for (jm = 0; jm < 13; jm++) {
    const v = salA[jm];
    if (days < v) break;
    days -= v;
  }
  return { jy, jm, jd: days + 1 };
}

const FARSI_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function toPersianDigits(n) {
  return String(n).replace(/\d/g, d => FARSI_DIGITS[Number(d)]);
}

// Authoritative lunar month starts for 1405 strictly calibrated against Time.ir
// (Tehran University Geophysics Institute Calendar Center official dates)
const HIJRI_1405_MONTHS = [
  { startJDayOfYear: 1, year: 1447, month: 10, name: "شوال" },
  { startJDayOfYear: 30, year: 1447, month: 11, name: "ذوالقعده" },
  { startJDayOfYear: 59, year: 1447, month: 12, name: "ذوالحجه" },
  { startJDayOfYear: 88, year: 1448, month: 1, name: "محرم" },
  { startJDayOfYear: 118, year: 1448, month: 2, name: "صفر" },
  { startJDayOfYear: 147, year: 1448, month: 3, name: "ربیع‌الاول" },
  { startJDayOfYear: 177, year: 1448, month: 4, name: "ربیع‌الثانی" },
  { startJDayOfYear: 206, year: 1448, month: 5, name: "جمادی‌الاول" },
  { startJDayOfYear: 236, year: 1448, month: 6, name: "جمادی‌الثانی" },
  { startJDayOfYear: 266, year: 1448, month: 7, name: "رجب" },
  { startJDayOfYear: 296, year: 1448, month: 8, name: "شعبان" },
  { startJDayOfYear: 325, year: 1448, month: 9, name: "رمضان" },
  { startJDayOfYear: 355, year: 1448, month: 10, name: "شوال" }
];

function getJalaliDayOfYear(m, d) {
  if (m <= 6) return (m - 1) * 31 + d;
  return 186 + (m - 7) * 30 + d;
}

function getExactHijriFor1405(jm, jd) {
  const doy = getJalaliDayOfYear(jm, jd);
  let cur = HIJRI_1405_MONTHS[0];
  for (let i = 1; i < HIJRI_1405_MONTHS.length; i++) {
    if (doy >= HIJRI_1405_MONTHS[i].startJDayOfYear) cur = HIJRI_1405_MONTHS[i];
    else break;
  }
  const hDay = doy - cur.startJDayOfYear + 1;
  return {
    year: cur.year,
    month: cur.month,
    monthName: cur.name,
    day: hDay,
    formatted: `${toPersianDigits(hDay)} ${cur.name}`
  };
}

const LUNAR_MONTH_OFFSETS = {
  // Iranian crescent sighting offsets relative to Saudi Umm al-Qura
  "1446-9": 0, "1446-10": -1, "1446-11": -1, "1446-12": 0,
  "1447-1": -1, "1447-2": -1, "1447-3": -1, "1447-4": -1, "1447-5": 0, "1447-6": 0,
  "1447-7": -1, "1447-8": -1, "1447-9": -1, "1447-10": -1, "1447-11": -1, "1447-12": 0,
  "1448-1": 0, "1448-2": -1, "1448-3": 0, "1448-4": 0, "1448-5": 0, "1448-6": 0,
  "1448-7": -1, "1448-8": -1, "1448-9": 0, "1448-10": -1, "1448-11": -1, "1448-12": -1,
  "1449-1": 0, "1449-2": -1, "1449-3": -1, "1449-4": -1, "1449-5": -1, "1449-6": -1,
  "1449-7": -1, "1449-8": -1, "1449-9": 0, "1449-10": -1, "1449-11": -1, "1449-12": -1
};

function formatIranianIslamicDate(gDate, jYear = null, jMonth = null, jDay = null) {
  try {
    if (jYear === 1405 && jMonth && jDay) {
      return getExactHijriFor1405(jMonth, jDay).formatted;
    }
    if (gDate) {
      const jDate = gregorianToJalaliInternal(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
      if (jDate.jy === 1405) {
        return getExactHijriFor1405(jDate.jm, jDate.jd).formatted;
      }
    }

    const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    });
    const parts = formatter.formatToParts(gDate);
    let hMonth = 1, hYear = 1445;
    for (const part of parts) {
      if (part.type === "month") hMonth = parseInt(part.value, 10);
      if (part.type === "year") hYear = parseInt(part.value, 10);
    }
    const key = `${hYear}-${hMonth}`;
    const offset = LUNAR_MONTH_OFFSETS[key] !== undefined ? LUNAR_MONTH_OFFSETS[key] : 0;
    const adjustedDate = offset === 0 ? gDate : new Date(gDate.getTime() + offset * 86400000);
    const intlPersianIslamic = new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long"
    });
    return intlPersianIslamic.format(adjustedDate);
  } catch (e) {
    return "";
  }
}

function getHijriParts(gDate, jYear = null, jMonth = null, jDay = null) {
  try {
    if (jYear === 1405 && jMonth && jDay) {
      const h1405 = getExactHijriFor1405(jMonth, jDay);
      return { hDay: h1405.day, hMonth: h1405.month, hYear: h1405.year, monthName: h1405.monthName };
    }
    if (gDate) {
      const jDate = gregorianToJalaliInternal(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
      if (jDate.jy === 1405) {
        const h1405 = getExactHijriFor1405(jDate.jm, jDate.jd);
        return { hDay: h1405.day, hMonth: h1405.month, hYear: h1405.year, monthName: h1405.monthName };
      }
    }

    const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    });
    const parts = formatter.formatToParts(gDate);
    let hDay = 1, hMonth = 1, hYear = 1445;
    for (const part of parts) {
      if (part.type === "day") hDay = parseInt(part.value, 10);
      if (part.type === "month") hMonth = parseInt(part.value, 10);
      if (part.type === "year") hYear = parseInt(part.value, 10);
    }
    const key = `${hYear}-${hMonth}`;
    const offset = LUNAR_MONTH_OFFSETS[key] !== undefined ? LUNAR_MONTH_OFFSETS[key] : 0;
    if (offset !== 0) {
      const adjustedDate = new Date(gDate.getTime() + offset * 86400000);
      const adjParts = formatter.formatToParts(adjustedDate);
      for (const part of adjParts) {
        if (part.type === "day") hDay = parseInt(part.value, 10);
        if (part.type === "month") hMonth = parseInt(part.value, 10);
        if (part.type === "year") hYear = parseInt(part.value, 10);
      }
    }
    return { hDay, hMonth, hYear };
  } catch (e) {
    return null;
  }
}

const OFFICIAL_YEARS_CACHE = {};

function loadOfficialYearData(year, data) {
  if (year && data && data.days) {
    OFFICIAL_YEARS_CACHE[year] = data;
  }
}

/**
 * Get all events for a given Jalali date (with optional categories filter)
 * @param {number} jYear
 * @param {number} jMonth
 * @param {number} jDay
 * @param {Date} [gDate]
 * @param {Object} [filterCategories] - e.g. { ancient: true, religious: true, national: true, international: true, gaming: false }
 * @returns {Array} List of matching event objects
 */
function getEventsForDate(jYear, jMonth, jDay, gDate = null, filterCategories = null) {
  let events = [];
  const key = `${jMonth}-${jDay}`;
  const hasOfficialData = Boolean(OFFICIAL_YEARS_CACHE[jYear] && OFFICIAL_YEARS_CACHE[jYear].days);

  // 0. Use official pre-synced dataset if loaded for this year
  if (hasOfficialData && OFFICIAL_YEARS_CACHE[jYear].days[key]) {
    const dayData = OFFICIAL_YEARS_CACHE[jYear].days[key];
    if (Array.isArray(dayData.events) && dayData.events.length > 0) {
      events = dayData.events.map(e => ({
        title: e.title,
        isHoliday: !!e.isHoliday,
        category: e.category || "national",
        hijriDateStr: e.dateString
      }));
    }
  }

  // Fallback to static tables only if no official dataset loaded for this year
  if (!hasOfficialData) {
    // 1. Solar Events (National, Ancient, Cultural, International)
    if (SOLAR_EVENTS[key]) {
      events = events.concat(SOLAR_EVENTS[key].map(e => ({ ...e })));
    }

    // 2. Lunar Hijri Events
    let lunarTable = null;
    if (jYear === 1404) lunarTable = LUNAR_HOLIDAYS_1404;
    else if (jYear === 1405) lunarTable = LUNAR_HOLIDAYS_1405;
    else if (jYear === 1406) lunarTable = LUNAR_HOLIDAYS_1406;

    if (lunarTable) {
      if (lunarTable[key]) {
        for (const ev of lunarTable[key]) {
          if (!events.some(e => e.title === ev.title)) {
            events.push({ ...ev });
          }
        }
      }
    } else if (events.length === 0 || !events.some(e => e.category === "religious")) {
      // Dynamic Astronomical / Intl Calculation for ANY arbitrary year outside pre-synced tables
      if (!gDate) {
        gDate = jalaliToGregorianInternal(jYear, jMonth, jDay);
      }
      const hijri = getHijriParts(gDate, jYear, jMonth, jDay);
      if (hijri) {
        const hKey = `${hijri.hMonth}-${hijri.hDay}`;
        if (HIJRI_EVENTS_MAP[hKey]) {
          const ev = HIJRI_EVENTS_MAP[hKey];
          if (!events.some(e => e.title === ev.title)) {
            events.push({ ...ev });
          }
        }
      }
    }
  }

  // Apply category filtering if filter object is provided
  if (filterCategories && typeof filterCategories === "object") {
    events = events.filter(e => {
      const cat = e.category || "national";
      return filterCategories[cat] !== false;
    });
  }

  return events;
}

/**
 * Check if a date is an official holiday (or Friday)
 */
function isOfficialHoliday(jYear, jMonth, jDay, iranianWeekdayIndex = null, gDate = null, filterCategories = null) {
  if (iranianWeekdayIndex === 6) {
    return true; // Friday is weekend in Iran
  }
  const events = getEventsForDate(jYear, jMonth, jDay, gDate, filterCategories);
  return events.some(ev => ev.isHoliday);
}

/**
 * Get all events for an entire Jalali month
 */
function getMonthEvents(jYear, jMonth, filterCategories = null) {
  const list = [];
  const daysInMonth = jMonth <= 6 ? 31 : (jMonth <= 11 ? 30 : (isLeapJalaliYear(jYear) ? 30 : 29));
  for (let d = 1; d <= daysInMonth; d++) {
    const evs = getEventsForDate(jYear, jMonth, d, null, filterCategories);
    if (evs.length > 0) {
      list.push({ day: d, events: evs });
    }
  }
  return list;
}

/**
 * Gaming Events Registry & Matcher (Option A)
 */
let GAMING_EVENTS_REGISTRY = [];

function setGamingEventsData(data) {
  if (Array.isArray(data)) {
    GAMING_EVENTS_REGISTRY = data;
  } else if (data && Array.isArray(data.events)) {
    GAMING_EVENTS_REGISTRY = data.events;
  }
}

function getGamingEventsForDate(gDate, filterCategories = null) {
  if (filterCategories && filterCategories.gaming === false) {
    return [];
  }
  if (!gDate || !Array.isArray(GAMING_EVENTS_REGISTRY) || GAMING_EVENTS_REGISTRY.length === 0) {
    return [];
  }
  const y = gDate.getFullYear();
  const m = String(gDate.getMonth() + 1).padStart(2, "0");
  const d = String(gDate.getDate()).padStart(2, "0");
  const ymd = `${y}-${m}-${d}`;
  const md = `${m}-${d}`;

  const matches = [];
  for (const item of GAMING_EVENTS_REGISTRY) {
    if (item.date === ymd || item.date === md) {
      matches.push({
        title: item.title,
        titleEn: item.titleEn,
        type: item.type,
        category: "gaming",
        subCategory: item.category,
        isGaming: true
      });
    }
  }
  return matches;
}

// Export for ES modules and standard browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SOLAR_EVENTS,
    LUNAR_HOLIDAYS_1404,
    LUNAR_HOLIDAYS_1405,
    LUNAR_HOLIDAYS_1406,
    HIJRI_EVENTS_MAP,
    HIJRI_1405_MONTHS,
    getExactHijriFor1405,
    gregorianToJalaliInternal,
    toPersianDigits,
    isLeapJalaliYear,
    getHijriParts,
    getEventsForDate,
    isOfficialHoliday,
    getMonthEvents,
    setGamingEventsData,
    getGamingEventsForDate,
    formatIranianIslamicDate,
    LUNAR_MONTH_OFFSETS,
    loadOfficialYearData,
    OFFICIAL_YEARS_CACHE
  };
}
