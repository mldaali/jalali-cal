# 📅 تقویم فارسی | Persian Jalali Calendar

<div align="center">

> **افزونه سبک، سریع و مدرن تقویم هجری شمسی برای موزیلا فایرفاکس (Firefox Manifest V3)**  
> همگام با مرکز تقویم دانشگاه تهران و Time.ir • فونت توکار وزیرمتن • یادداشت‌های محلی • کلیدهای میانبر سریع

<br/>

[![Firefox Add-on](https://img.shields.io/badge/Firefox_AMO-Install_Now-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%82%D9%88%DB%8C%D9%85-%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C/)
[![GitHub Release](https://img.shields.io/github/v/release/mldaali/jalali-cal?style=for-the-badge&logo=github&color=blue)](https://github.com/mldaali/jalali-cal/releases)
[![Tests](https://img.shields.io/badge/Tests-184%2F184_Passed-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white)](#-تست‌های-خودکار-automated-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

[**🚀 نصب مستقیم از فروشگاه افزونه‌های موزیلا**](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%82%D9%88%DB%8C%D9%85-%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C/) • [**📦 دانلود بسته افزونه (XPI)**](https://github.com/mldaali/jalali-cal/releases)

</div>

---

<div dir="rtl">

## ✨ ویژگی‌های برجسته

### 🎨 طراحی و رابط کاربری
* **کامپکت و بدون اسکرول (Zero-Scroll & 0px CLS):** عرض بهینه ۲۸۰ پیکسل با حفظ کامل ثبات عمودی و حذف پرش صفحه.
* **پوسته هوشمند تطبیقی (Auto System Theme):** انطباق خودکار با حالت تیره/روشن سیستم‌عامل (`Catppuccin Mocha` و `Latte`).
* **آیکون زنده نوار ابزار (Dynamic Canvas Icon):** نمایش بی‌درنگ شماره روز با فونت فارسی و تم متمایز تعطیلات.
* **تایپوگرافی آفلاین (Vazirmatn):** فونت‌های بهینه‌سازی‌شده استاندارد وزیرمتن به‌صورت محلی در افزونه.

### 📅 رویدادها، مناسبت‌ها و تعطیلات
* **همگام‌سازی رسمی و چندساله با Time.ir:** تطابق ۱۰۰٪ تمام تعطیلات رسمی و ماه‌های قمری با مرکز تقویم ژئوفیزیک دانشگاه تهران برای سال‌های ۱۴۰۴، ۱۴۰۵، ۱۴۰۶ و سیستم خودکار GitHub Actions برای دریافت خودکار سال‌های بعد (۱۴۰۷ و بعد) به محض انتشار رسمی.
* **فیلتر دسته‌بندی مناسبت‌ها (Categories Filter):** امکان فعال یا غیرفعال‌سازی آزادانه هر یک از دسته‌ها:
  * 🏛️ مناسبت‌های کهن و باستانی ایران (نوروز، یلدا، سده، مهرگان، کوروش و...)
  * 🌙 مناسبت‌های مذهبی و اسلامی (اعیاد فطر و قربان، غدیر، عاشورا، ولادت‌ها و شهادت‌ها)
  * 🇮🇷 مناسبت‌های ملی و تاریخی معاصر
  * 🌍 مناسبت‌های جهانی و بین‌المللی
  * 🎮 رویدادها و تاریخ انتشار بازی‌های ویدئویی (کاملاً اختیاری)
* **پیش‌نمایش سریع رویدادها (HUD Month Events Peek):** با فشردن و نگه‌داشتن کلید `E` (یا `ث`) برای مشاهده فوری مناسبت‌های ماه.

### 📝 یادداشت‌ها و حریم خصوصی
* **یادداشت‌های محلی روزها:** ثبت، ویرایش و حذف سریع یادداشت برای هر روز با نشانگر نقطه سبز روی تقویم.
* **حریم خصوصی ۱۰۰٪ مطلق:** بدون جمع‌آوری اطلاعات و بدون ارسال داده به سرورهای خارجی (`data_collection: none`).

---

## ⌨️ کلیدهای میانبر (Keyboard Shortcuts)

| کلید میانبر | عملکرد |
| :---: | :--- |
| **`Alt + Shift + C`** | باز کردن فوری تقویم از هر جای فایرفاکس (Global Shortcut) |
| **`E`** یا **`ث`** | **نگه‌داشتن:** پیش‌نمایش سریع مناسبت‌های ماه (HUD) • **رها کردن:** بستن |
| **`N`** | باز کردن ویرایشگر یادداشت روز انتخابی (*Note*) |
| **`T`** | پرش سریع به امروز (*Today*) |
| **`D`** | تغییر حالت تم (خودکار سیستم / روشن / تیره) (*Dark Mode*) |
| **`C`** | کپی سریع تاریخ کامل روز به کلیپ‌بورد (*Copy*) |
| **`←` / `→`** | حرکت روزانه در روزهای ماه |
| **`↑` / `↓`** | حرکت هفتگی (۷ روز قبل / بعد) |
| **`P` / `M`** | جابجایی سریع به ماه قبل و ماه بعد |
| **`Escape`** | بستن پنجره HUD رویدادها، فیلتر یا انصراف از یادداشت |

---

## 🚀 نصب (Installation)

### ۱. نصب از فروشگاه موزیلا (پیشنهادی)
به [صفحه رسمی افزونه تقویم فارسی](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%8تقویم-خورشیدی/) در فایرفاکس مراجعه کرده و روی **Add to Firefox** کلیک کنید.

### ۲. نصب دستی بسته رسمی (XPI)
فایل آماده `persian-calendar-v1.2.0.xpi` را از [بخش Releases گیت‌هاب](https://github.com/mldaali/jalali-cal/releases) دانلود کرده و به داخل پنجره فایرفاکس بکشید (Drag & Drop).

---

## 📁 ساختار فایل‌های پروژه

</div>

```text
├── manifest.json              # پیکربندی رسمی Manifest V3 و کلیدهای میانبر
├── popup.html / .css          # داشبورد ۲۸۰px، اورلی رویدادها و پالت تم Catppuccin
├── popup.js                   # منطق تعاملی، ناوبری کیبورد، مدیریت یادداشت‌ها و رویدادها
├── events.js                  # موتور جامع چندساله رویدادها و تقویم قمری هماهنگ با Time.ir
├── events-manifest.json       # مانیفست تقویم رسمی و سال‌های پشتیبانی‌شده
├── official-events-1404.json  # پایگاه رسمی سال ۱۴۰۴ هماهنگ با مرکز تقویم
├── official-events-1405.json  # پایگاه رسمی ۳۶۵ روزه سال ۱۴۰۵ استخراج‌شده از Time.ir
├── official-events-1406.json  # پایگاه رسمی سال ۱۴۰۶ هماهنگ با مرکز تقویم
├── gaming-events.json         # تقویم تاریخ عرضه و رویدادهای بازی‌ها (اختیاری)
├── background.js              # سرویس ورکر پس‌زمینه و رندر دینامیک آیکون نوار ابزار
├── scripts/
│   ├── sync-timeir-events.js  # اسکریپت همگام‌ساز خودکار چندساله با Time.ir
│   └── update-gaming-events.js# اسکریپت بروزرسانی رویدادهای گیمینگ
├── .github/workflows/         # ربات‌های همگام‌سازی خودکار تقویم و گیمینگ در GitHub Actions
└── test-extension.js          # آزمون‌های جامع اعتبارسنجی (۱۸۴ تست خودکار)
```

<div dir="rtl">

---

## 🧪 تست‌های خودکار (Automated Tests)

تمامی قابلیت‌ها و صحت محاسبات به وسیله ۱۸۴ آزمون اعتبارسنجی تست می‌شوند:

```bash
node test-extension.js
```
```text
✔ ALL 184 EXTENSION TESTS PASSED SUCCESSFULLY!
```

---

## 📄 مجوز (License)

این پروژه تحت مجوز **[MIT](LICENSE)** منتشر شده است.  
فونت «وزیرمتن» نیز تحت مجوز **[SIL Open Font License 1.1](http://scripts.sil.org/OFL)** ارائه می‌شود.

</div>
