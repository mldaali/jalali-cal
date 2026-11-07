/**
 * popup.js - Ultra-Compact Persian Calendar Dashboard
 * Native Intl API calculations with zero-scroll Catppuccin single-screen layout
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Persian month names
const PERSIAN_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

// Weekday names in Persian (0 = Saturday to 6 = Friday)
const PERSIAN_WEEKDAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"
];

// Helper: Convert English digits to Persian digits
function toPersianDigits(str) {
  if (str === null || str === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
}

/**
 * Standard Jalali <-> Gregorian conversion algorithms
 */
function jalaliToGregorian(jy, jm, jd) {
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
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return { gy, gm, gd };
}

function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy > 1600 ? 979 : 0;
  gy -= gy > 1600 ? 1600 : 621;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

function isLeapJalali(year) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let bl = breaks.length, jp = breaks[0], jm, jump, leap, n, i;
  if (year < jp || year >= breaks[bl - 1]) return false;
  for (i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (year < jm) break;
    jp = jm;
  }
  n = year - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) / 33 | 0) * 33;
  leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

function getDaysInJalaliMonth(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isLeapJalali(year) ? 30 : 29;
}

/**
 * Global App State
 */
const AppState = {
  todayJalali: null, // { year, month, day, weekdayIndex, rawDate }
  currentViewYear: 1405,
  currentViewMonth: 8,
  selectedDay: null,
  theme: "dark"
};

/**
 * Extract live dynamic Jalali date parts using native Intl API
 */
function getLiveJalaliParts(date = new Date()) {
  const intlPersian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const parts = intlPersian.formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  const jsDay = date.getDay();
  const iranianWeekdayIndex = (jsDay + 1) % 7;

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    weekdayIndex: iranianWeekdayIndex,
    rawDate: date
  };
}

/**
 * Live Clock (seconds updates)
 */
function startLiveClock() {
  const clockEl = document.getElementById("liveClock");

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    if (clockEl) {
      clockEl.textContent = toPersianDigits(`${h}:${m}:${s}`);
    }

    // Midnight rollover check
    if (AppState.todayJalali) {
      const live = getLiveJalaliParts(now);
      if (live.day !== AppState.todayJalali.day || live.month !== AppState.todayJalali.month) {
        initTodayHero();
        renderCalendar();
      }
    }
  }

  tick();
  setInterval(tick, 1000);
}

/**
 * Initializes the prominent Today Hero section
 */
function initTodayHero() {
  const now = new Date();
  const today = getLiveJalaliParts(now);
  AppState.todayJalali = today;

  // 1. Day of week
  document.getElementById("heroWeekday").textContent = PERSIAN_WEEKDAYS[today.weekdayIndex];

  // 2. Day number & Month Year
  document.getElementById("heroDayNum").textContent = toPersianDigits(today.day);
  document.getElementById("heroMonthYear").textContent = `${PERSIAN_MONTH_NAMES[today.month - 1]} ${toPersianDigits(today.year)}`;

  // 3. Gregorian Subtitle
  try {
    const intlGregorian = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    document.getElementById("heroGregorian").textContent = intlGregorian.format(now);
  } catch (e) {
    document.getElementById("heroGregorian").textContent = now.toLocaleDateString();
  }

  // 4. Islamic Hijri Subtitle
  try {
    const intlIslamic = new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long"
    });
    document.getElementById("heroIslamic").textContent = intlIslamic.format(now);
  } catch (e) {
    document.getElementById("heroIslamic").textContent = "";
  }

  // 5. Update the occasion pill for today
  updateOccasionPill(today.year, today.month, today.day, today.weekdayIndex, now);
}

/**
 * Updates the compact scroll-free occasion/holiday pill
 */
function updateOccasionPill(year, month, day, weekdayIndex = null, gDate = null) {
  if (!gDate) {
    const g = jalaliToGregorian(year, month, day);
    gDate = new Date(g.gy, g.gm - 1, g.gd);
  }
  if (weekdayIndex === null) {
    weekdayIndex = (gDate.getDay() + 1) % 7;
  }

  const events = getEventsForDate(year, month, day, gDate);
  const isFriday = weekdayIndex === 6;
  const officialHolidays = events.filter(e => e.isHoliday);

  const pillEl = document.getElementById("occasionPill");
  const textEl = document.getElementById("occasionText");

  pillEl.className = "occasion-pill";

  if (officialHolidays.length > 0 || isFriday) {
    pillEl.classList.add("is-holiday");
    if (officialHolidays.length > 0) {
      const title = officialHolidays.map(h => h.title).join(" • ");
      textEl.textContent = `${title} (تعطیل)`;
      pillEl.title = `${title} (تعطیل رسمی)`;
    } else {
      textEl.textContent = "جمعه (تعطیل هفتگی)";
      pillEl.title = "تعطیل هفتگی";
    }
  } else if (events.length > 0) {
    pillEl.classList.add("is-event");
    const title = events.map(e => e.title).join(" • ");
    textEl.textContent = title;
    pillEl.title = title;
  } else {
    pillEl.classList.add("is-workday");
    textEl.textContent = "روز عادی";
    pillEl.title = "روز عادی (کاری)";
  }
}

/**
 * Renders the compact 7x6 calendar grid without scrolling
 */
function renderCalendar() {
  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const today = AppState.todayJalali;

  // Update month title
  const monthName = PERSIAN_MONTH_NAMES[month - 1];
  document.getElementById("monthTitle").textContent = `${monthName} ${toPersianDigits(year)}`;

  // Find start day of week for Day 1
  const gFirst = jalaliToGregorian(year, month, 1);
  const firstDate = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd);
  const startDayOfWeek = (firstDate.getDay() + 1) % 7; // 0=شنبه ... 6=جمعه

  const daysInCurrentMonth = getDaysInJalaliMonth(year, month);

  // Preceding month info
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInJalaliMonth(prevYear, prevMonth);

  const matrixEl = document.getElementById("daysMatrix");
  matrixEl.innerHTML = "";

  // 1. Preceding month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i;
    const cell = document.createElement("div");
    cell.className = "cell other-month";
    cell.textContent = toPersianDigits(pDay);
    cell.addEventListener("click", () => {
      AppState.currentViewYear = prevYear;
      AppState.currentViewMonth = prevMonth;
      AppState.selectedDay = pDay;
      renderCalendar();
      updateOccasionPill(prevYear, prevMonth, pDay);
    });
    matrixEl.appendChild(cell);
  }

  // 2. Current Month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = toPersianDigits(d);

    const gDay = jalaliToGregorian(year, month, d);
    const cellGDate = new Date(gDay.gy, gDay.gm - 1, gDay.gd);
    const dayOfWeek = (cellGDate.getDay() + 1) % 7;

    const isFriday = dayOfWeek === 6;
    const events = getEventsForDate(year, month, d, cellGDate);
    const isHoliday = events.some(e => e.isHoliday);

    if (isFriday) cell.classList.add("friday");
    if (isHoliday) cell.classList.add("holiday");

    // Is Today
    const isToday = today && today.year === year && today.month === month && today.day === d;
    if (isToday) cell.classList.add("today");

    // Is Selected
    if (AppState.selectedDay === d) {
      cell.classList.add("selected");
    }

    // Dot indicator if events or holidays
    if (events.length > 0 || isHoliday) {
      const dot = document.createElement("span");
      dot.className = `cell-dot ${isHoliday ? "holiday-dot" : ""}`;
      cell.appendChild(dot);
    }

    // Click handler to select and update the occasion pill
    cell.addEventListener("click", () => {
      document.querySelectorAll(".cell.selected").forEach(el => el.classList.remove("selected"));
      cell.classList.add("selected");
      AppState.selectedDay = d;
      updateOccasionPill(year, month, d, dayOfWeek, cellGDate);
    });

    matrixEl.appendChild(cell);
  }

  // 3. Trailing month padding (fill exactly 35 or 42 cells)
  const totalRendered = startDayOfWeek + daysInCurrentMonth;
  const totalCells = totalRendered > 35 ? 42 : 35;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDayCounter = 1;

  for (let i = totalRendered; i < totalCells; i++) {
    const nDay = nextDayCounter++;
    const cell = document.createElement("div");
    cell.className = "cell other-month";
    cell.textContent = toPersianDigits(nDay);
    cell.addEventListener("click", () => {
      AppState.currentViewYear = nextYear;
      AppState.currentViewMonth = nextMonth;
      AppState.selectedDay = nDay;
      renderCalendar();
      updateOccasionPill(nextYear, nextMonth, nDay);
    });
    matrixEl.appendChild(cell);
  }

  // Default selection
  if (!AppState.selectedDay) {
    if (today && today.year === year && today.month === month) {
      AppState.selectedDay = today.day;
      updateOccasionPill(year, month, today.day, today.weekdayIndex, today.rawDate);
    } else {
      AppState.selectedDay = 1;
      updateOccasionPill(year, month, 1, startDayOfWeek);
    }
  }
}

/**
 * Apply Theme (Dark or Light)
 */
function applyTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = document.getElementById("themeIcon");
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeIcon) {
    themeIcon.textContent = theme === "light" ? "🌙" : "☀️";
  }
  if (themeBtn) {
    themeBtn.title = theme === "light" ? "تغییر به پوسته تیره" : "تغییر به پوسته روشن";
  }
}

/**
 * Setup Event Listeners
 */
function setupEventHandlers() {
  // Month Nav
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    if (AppState.currentViewMonth === 1) {
      AppState.currentViewMonth = 12;
      AppState.currentViewYear--;
    } else {
      AppState.currentViewMonth--;
    }
    AppState.selectedDay = 1;
    renderCalendar();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    if (AppState.currentViewMonth === 12) {
      AppState.currentViewMonth = 1;
      AppState.currentViewYear++;
    } else {
      AppState.currentViewMonth++;
    }
    AppState.selectedDay = 1;
    renderCalendar();
  });

  // Jump to Today
  document.getElementById("jumpTodayBtn").addEventListener("click", () => {
    if (AppState.todayJalali) {
      AppState.currentViewYear = AppState.todayJalali.year;
      AppState.currentViewMonth = AppState.todayJalali.month;
      AppState.selectedDay = AppState.todayJalali.day;
      renderCalendar();
      updateOccasionPill(
        AppState.todayJalali.year,
        AppState.todayJalali.month,
        AppState.todayJalali.day,
        AppState.todayJalali.weekdayIndex,
        AppState.todayJalali.rawDate
      );
    }
  });

  // Refresh Button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.classList.add("rotating");
      setTimeout(() => refreshBtn.classList.remove("rotating"), 350);

      initTodayHero();
      if (AppState.todayJalali) {
        AppState.currentViewYear = AppState.todayJalali.year;
        AppState.currentViewMonth = AppState.todayJalali.month;
        AppState.selectedDay = AppState.todayJalali.day;
      }
      renderCalendar();
    });
  }

  // Theme Toggle
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", async () => {
      const nextTheme = AppState.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      try {
        if (browserAPI.storage && browserAPI.storage.local) {
          await browserAPI.storage.local.set({ theme: nextTheme });
        }
      } catch (err) {
        console.warn("Theme storage error:", err);
      }
    });
  }

  // Load persisted theme
  if (browserAPI.storage && browserAPI.storage.local) {
    browserAPI.storage.local.get("theme").then(res => {
      if (res && (res.theme === "light" || res.theme === "dark")) {
        applyTheme(res.theme);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        applyTheme("light");
      } else {
        applyTheme("dark");
      }
    }).catch(() => {
      applyTheme("dark");
    });
  }
}

// Bootstrap on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  startLiveClock();
  initTodayHero();

  if (AppState.todayJalali) {
    AppState.currentViewYear = AppState.todayJalali.year;
    AppState.currentViewMonth = AppState.todayJalali.month;
    AppState.selectedDay = AppState.todayJalali.day;
  }

  setupEventHandlers();
  renderCalendar();
});
