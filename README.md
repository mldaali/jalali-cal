# 📅 تقویم فارسی | Persian Jalali Calendar

> افزونه مدرن و فوق‌فشرده تقویم هجری شمسی برای موزیلا فایرفاکس (Firefox Manifest V3) با طراحی Catppuccin، تایپوگرافی آفلاین وزیرمتن و نشانگر زنده نوار ابزار.

<div align="center">

[![Firefox Add-on](https://img.shields.io/badge/Firefox_AMO-Install_Now-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%82%D9%88%DB%8C%D9%85-%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C/)
[![GitHub Release](https://img.shields.io/github/v/release/mldaali/jalali-cal?style=for-the-badge&logo=github&color=blue)](https://github.com/mldaali/jalali-cal/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-56%2F56_Passed-success.svg?style=for-the-badge)](#-تست‌های-خودکار-automated-tests)

[**دریافت از فروشگاه رسمی افزونه‌های فایرفاکس (Firefox Add-ons)**](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%82%D9%88%DB%8C%D9%85-%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C/) • [**دانلود مستقیم بسته XPI (نسخه ۱.۰.۰)**](https://github.com/mldaali/jalali-cal/releases/download/v1.0.0/persian-calendar-v1.0.0.xpi)

</div>

---

## ✨ ویژگی‌های کلیدی (Key Features)

* **طراحی تک‌صفحه‌ای بدون اسکرول (Zero-Scroll Dashboard):** ابعاد فشرده ۲۸۰ پیکسلی بدون نوار اسکرول اضافی با دسترسی سریع به تمام روزهای ماه و مناسبت‌ها در یک نگاه.
* **آیکون زنده نوار ابزار (Dynamic Canvas Icon):** رندر بی‌درنگ عدد روز جاری با فونت فارسی و کنتراست ۲۱:۱ روی نوار ابزار فایرفاکس همراه با تم متمایز روزهای جمعه و تعطیل.
* **تقویم تعاملی و کپی سریع (Click-to-Copy):** امکان کلیک روی تمام روزهای ماه و مشاهده تاریخ معادل میلادی/قمری و کپی آسان تاریخ به کلیپ‌بورد با یک کلیک.
* **کپسول هوشمند مناسبت‌ها:** نمایش پویای مناسبت‌های ملی و مذهبی سال ۱۴۰۵ به همراه برچسب قرمز برای تعطیلات رسمی (بدون اشغال فضای اضافی در روزهای عادی).
* **دو پوسته تاریک و روشن (Catppuccin Mocha & Latte):** هماهنگ با سلیقه کاربر و قابلیت ذخیره خودکار پوسته انتخابی.
* **تایپوگرافی استاندارد آفلاین (Vazirmatn):** فونت‌های استاندارد وزیرمتن به‌صورت توکار در بسته افزونه جهت اجرای کاملاً آفلاین و حفظ حریم خصوصی.
* **امنیت و حریم خصوصی مطلق:** بدون ارسال هیچ‌گونه داده به اینترنت (`data_collection: none`) و سازگار با سخت‌گیرانه‌ترین استانداردهای امنیتی Mozilla AMO.

---

## 🚀 نصب (Installation)

### ۱. نصب مستقیم از فروشگاه موزیلا (پیشنهادی)
به صفحه رسمی افزونه در فروشگاه موزیلا بروید و روی **Add to Firefox** کلیک کنید:
👉 **[نصب تقویم فارسی از Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/persian-calendar-%D8%AA%D9%82%D9%88%DB%8C%D9%85-%D8%AE%D9%88%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C/)**

### ۲. نصب دستی نسخه توسعه (Developer Mode)
1. در فایرفاکس به آدرس `about:debugging#/runtime/this-firefox` بروید.
2. روی دکمه **Load Temporary Add-on...** کلیک کنید.
3. فایل `manifest.json` را از پوشه پروژه انتخاب کنید.

> همچنین می‌توانید فایل بسته‌بندی‌شده [`persian-calendar-v1.0.0.xpi`](https://github.com/mldaali/jalali-cal/releases/download/v1.0.0/persian-calendar-v1.0.0.xpi) را از بخش Release دانلود کرده و مستقیماً در فایرفاکس درگ اند دراپ نمایید.

---

## 📁 ساختار پروژه (Structure)

```text
├── manifest.json       # پیکربندی رسمی Firefox Manifest V3
├── popup.html / .css   # داشبورد فشرده ۲۸۰px با تم Catppuccin
├── popup.js            # منطق تعاملی، محاسبات Intl و رویدادها
├── events.js           # بانک جامع تعطیلات و مناسبت‌های شمسی/قمری ۱۴۰۵
├── background.js       # سرویس پس‌زمینه و موتور رندر Canvas آیکون داینامیک
├── fonts/              # فونت‌های توکار وزیرمتن (WOFF2)
├── icons/              # آیکون‌های وکتور و شطرنجی (۱۶ تا ۵۱۲px)
└── test-extension.js   # مجموعه تست‌های جامع اعتبارسنجی
```

---

## 🧪 تست‌های خودکار (Automated Tests)

برای اجرای تمامی آزمون‌های سلامت افزونه (تست منیفست، امنیت CSP، محاسبات بومی Intl، تبدیل‌های دوطرفه تاریخ و تعطیلات سال ۱۴۰۵):

```bash
node test-extension.js
```
*(تمامی ۵۶ آزمون با موفقیت پاس می‌شوند).*

---

## 📄 مجوز (License)

این پروژه تحت مجوز [MIT](LICENSE) منتشر شده است. فونت «وزیرمتن» نیز تحت مجوز [SIL Open Font License 1.1](http://scripts.sil.org/OFL) ارائه می‌شود.
