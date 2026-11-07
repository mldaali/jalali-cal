/**
 * popup.js - Firefox Persian Calendar Popup Logic
 * Real-time dynamic Jalali calculations using native JavaScript Intl API
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Persian month names
const PERSIAN_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

// Weekday names in Persian (starting Saturday = 0)
const PERSIAN_WEEKDAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"
];

// Helper: Convert English/Latin digits to Persian digits
function toPersianDigits(str) {
  if (str === null || str === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
}

/**
 * High precision Jalali <-> Gregorian conversion algorithms
 */
function jalaliToGregorian(jy, jm, jd) {
  jy = parseInt(jy, 10);
  jm = parseInt(jm, 10);
  jd = parseInt(jd, 10);
  let gy;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
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
  let jy;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
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

/**
 * Checks if a Jalali year is a leap year (کبیسه)
 */
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

/**
 * Get number of days in a given Jalali month
 */
function getDaysInJalaliMonth(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isLeapJalali(year) ? 30 : 29;
}

/**
 * Real-time state holder
 */
const AppState = {
  todayJalali: null, // { year, month, day, weekdayIndex }
  currentViewYear: 1405,
  currentViewMonth: 8,
  selectedDay: null,
  showBadge: true,
  theme: "dark"
};

/**
 * Applies theme (dark or light) and updates UI toggle
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
 * Extract live dynamic Jalali date parts using native Intl API
 * Runs every time popup opens to guarantee zero-restart real-time accuracy.
 */
function getLiveJalaliParts(date = new Date()) {
  const intlPersian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
  const parts = intlPersian.formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  // Calculate Iranian weekday index: 0 = Saturday, 1 = Sunday, ..., 6 = Friday
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
 * Updates the live clock badge in real-time every second
 */
function startLiveClock() {
  const clockTextEl = document.getElementById("liveClockText");

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    clockTextEl.textContent = toPersianDigits(`${h}:${m}:${s}`);

    // If midnight passed, refresh today's date dynamically
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
 * Initialize today's Hero card with Jalali, Gregorian, and Islamic dates
 */
function initTodayHero() {
  const now = new Date();
  const today = getLiveJalaliParts(now);
  AppState.todayJalali = today;

  // 1. Jalali Date formatted with native Intl API
  const intlFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const jalaliString = intlFull.format(now);
  document.getElementById("todayJalaliTitle").textContent = jalaliString;

  // 2. Check if today is an official holiday or Friday
  const isHolidayToday = isOfficialHoliday(today.year, today.month, today.day, today.weekdayIndex, now);
  const statusBadge = document.getElementById("todayStatusBadge");
  if (isHolidayToday) {
    statusBadge.textContent = today.weekdayIndex === 6 ? "جمعه (تعطیل)" : "تعطیل رسمی";
    statusBadge.className = "today-status-badge status-holiday";
  } else {
    statusBadge.textContent = "روز کاری";
    statusBadge.className = "today-status-badge status-workday";
  }

  // 3. Gregorian formatted date via native Intl API
  try {
    const intlGregorian = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    const gEn = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(now);
    document.getElementById("todayGregorianText").textContent = `میلادی: ${intlGregorian.format(now)} (${gEn})`;
  } catch (e) {
    document.getElementById("todayGregorianText").textContent = `میلادی: ${now.toLocaleDateString()}`;
  }

  // 4. Lunar Hijri formatted date via native Intl API
  try {
    const intlIslamic = new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    document.getElementById("todayIslamicText").textContent = `قمری: ${intlIslamic.format(now)}`;
  } catch (e) {
    document.getElementById("todayIslamicText").textContent = "قمری: در دسترس نیست";
  }
}

/**
 * Render Calendar Grid for AppState.currentViewYear and currentViewMonth
 */
function renderCalendar() {
  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const today = AppState.todayJalali;

  // Set month & year label
  const monthName = PERSIAN_MONTH_NAMES[month - 1];
  document.getElementById("currentMonthYearLabel").textContent = `${monthName} ${toPersianDigits(year)}`;

  // Find weekday index for Day 1 of this Jalali month
  const gFirst = jalaliToGregorian(year, month, 1);
  const firstDate = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd);
  const startDayOfWeek = (firstDate.getDay() + 1) % 7; // 0=شنبه ... 6=جمعه

  const daysInCurrentMonth = getDaysInJalaliMonth(year, month);

  // Previous month info for padding
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInJalaliMonth(prevYear, prevMonth);

  const gridEl = document.getElementById("daysGrid");
  gridEl.innerHTML = "";

  // 1. Preceding padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i;
    const cell = document.createElement("div");
    cell.className = "day-cell other-month";
    cell.innerHTML = `<span class="jalali-num">${toPersianDigits(pDay)}</span>`;
    cell.addEventListener("click", () => {
      AppState.currentViewYear = prevYear;
      AppState.currentViewMonth = prevMonth;
      AppState.selectedDay = pDay;
      renderCalendar();
      updateSelectedDayDetails(prevYear, prevMonth, pDay);
    });
    gridEl.appendChild(cell);
  }

  // 2. Current Month Days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    // Corresponding Gregorian Date
    const gDay = jalaliToGregorian(year, month, d);
    const cellGDate = new Date(gDay.gy, gDay.gm - 1, gDay.gd);
    const dayOfWeek = (cellGDate.getDay() + 1) % 7; // 0=شنبه ... 6=جمعه

    // Holiday & Friday detection
    const isFriday = dayOfWeek === 6;
    const events = getEventsForDate(year, month, d, cellGDate);
    const isOfficial = events.some(ev => ev.isHoliday);

    if (isFriday) cell.classList.add("friday");
    if (isOfficial) cell.classList.add("holiday");

    // Check if this day is today
    const isToday = today && today.year === year && today.month === month && today.day === d;
    if (isToday) cell.classList.add("today");

    // Check if this day is currently selected
    if (AppState.selectedDay === d) {
      cell.classList.add("selected");
    }

    // Day numbers
    const jNumSpan = document.createElement("span");
    jNumSpan.className = "jalali-num";
    jNumSpan.textContent = toPersianDigits(d);
    cell.appendChild(jNumSpan);

    const gNumSpan = document.createElement("span");
    gNumSpan.className = "gregorian-sub-num";
    gNumSpan.textContent = String(gDay.gd);
    cell.appendChild(gNumSpan);

    // Event indicator dot
    if (events.length > 0 || isOfficial) {
      const dot = document.createElement("div");
      dot.className = `cell-dot-indicator ${isOfficial ? "holiday-dot" : ""}`;
      cell.appendChild(dot);
    }

    // Click handler to select day
    cell.addEventListener("click", () => {
      // Remove previously selected
      document.querySelectorAll(".day-cell.selected").forEach(el => el.classList.remove("selected"));
      cell.classList.add("selected");
      AppState.selectedDay = d;
      updateSelectedDayDetails(year, month, d, cellGDate, dayOfWeek);
    });

    gridEl.appendChild(cell);
  }

  // 3. Trailing padding days to fill 35 or 42 cells
  const totalRendered = startDayOfWeek + daysInCurrentMonth;
  const totalCells = totalRendered > 35 ? 42 : 35;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDayCounter = 1;

  for (let i = totalRendered; i < totalCells; i++) {
    const nDay = nextDayCounter++;
    const cell = document.createElement("div");
    cell.className = "day-cell other-month";
    cell.innerHTML = `<span class="jalali-num">${toPersianDigits(nDay)}</span>`;
    cell.addEventListener("click", () => {
      AppState.currentViewYear = nextYear;
      AppState.currentViewMonth = nextMonth;
      AppState.selectedDay = nDay;
      renderCalendar();
      updateSelectedDayDetails(nextYear, nextMonth, nDay);
    });
    gridEl.appendChild(cell);
  }

  // Also update month events tab list
  renderMonthEventsList(year, month);

  // If no day selected yet, select today if in current view or Day 1
  if (!AppState.selectedDay) {
    if (today && today.year === year && today.month === month) {
      AppState.selectedDay = today.day;
      const g = jalaliToGregorian(year, month, today.day);
      updateSelectedDayDetails(year, month, today.day, new Date(g.gy, g.gm - 1, g.gd), today.weekdayIndex);
    } else {
      AppState.selectedDay = 1;
      const g = jalaliToGregorian(year, month, 1);
      updateSelectedDayDetails(year, month, 1, new Date(g.gy, g.gm - 1, g.gd), startDayOfWeek);
    }
  } else {
    const g = jalaliToGregorian(year, month, AppState.selectedDay);
    const dt = new Date(g.gy, g.gm - 1, g.gd);
    updateSelectedDayDetails(year, month, AppState.selectedDay, dt, (dt.getDay() + 1) % 7);
  }
}

/**
 * Updates the details card below the calendar for the selected day
 */
function updateSelectedDayDetails(year, month, day, gDate = null, weekdayIndex = null) {
  if (!gDate) {
    const g = jalaliToGregorian(year, month, day);
    gDate = new Date(g.gy, g.gm - 1, g.gd);
  }
  if (weekdayIndex === null) {
    weekdayIndex = (gDate.getDay() + 1) % 7;
  }

  const weekdayName = PERSIAN_WEEKDAYS[weekdayIndex];
  const monthName = PERSIAN_MONTH_NAMES[month - 1];
  const title = `${weekdayName}، ${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
  document.getElementById("detailsDateTitle").textContent = title;

  // Events & Holiday
  const events = getEventsForDate(year, month, day, gDate);
  const isFriday = weekdayIndex === 6;
  const isOfficial = events.some(ev => ev.isHoliday) || isFriday;

  const badgeEl = document.getElementById("detailsHolidayBadge");
  if (isOfficial) {
    badgeEl.textContent = isFriday ? "جمعه (تعطیل)" : "تعطیل رسمی";
    badgeEl.className = "today-status-badge status-holiday";
  } else {
    badgeEl.textContent = "روز کاری";
    badgeEl.className = "today-status-badge status-workday";
  }

  const listContainer = document.getElementById("eventsListContainer");
  listContainer.innerHTML = "";

  if (events.length === 0) {
    listContainer.innerHTML = '<div class="no-event-text">مناسبتی برای این روز ثبت نشده است.</div>';
  } else {
    for (const ev of events) {
      const item = document.createElement("div");
      item.className = "event-item";
      item.innerHTML = `
        <span class="event-bullet ${ev.isHoliday ? "holiday-bullet" : ""}"></span>
        <span>${ev.title} ${ev.isHoliday ? '<strong style="color:var(--accent-holiday)">(تعطیل)</strong>' : ""}</span>
      `;
      listContainer.appendChild(item);
    }
  }
}

/**
 * Render the Month Events Tab list for current year and month
 */
function renderMonthEventsList(year, month) {
  const container = document.getElementById("monthEventsListContainer");
  container.innerHTML = "";

  const monthEvs = getMonthEvents(year, month);
  const monthName = PERSIAN_MONTH_NAMES[month - 1];

  if (monthEvs.length === 0) {
    container.innerHTML = `<div class="no-event-text" style="text-align:center; padding: 20px 0;">مناسبتی در ${monthName} ثبت نشده است.</div>`;
    return;
  }

  for (const item of monthEvs) {
    for (const ev of item.events) {
      const row = document.createElement("div");
      row.className = "month-event-row";
      row.innerHTML = `
        <div class="month-event-day-badge ${ev.isHoliday ? "holiday-badge" : ""}">
          ${toPersianDigits(item.day)}
        </div>
        <div class="month-event-info">
          <span class="month-event-title">${ev.title}</span>
          ${ev.isHoliday ? '<span class="month-event-tag">تعطیل رسمی</span>' : ""}
        </div>
      `;
      // Click on event row navigates directly to that day in the calendar tab
      row.addEventListener("click", () => {
        document.getElementById("tabCalendarBtn").click();
        AppState.selectedDay = item.day;
        renderCalendar();
      });
      container.appendChild(row);
    }
  }
}

/**
 * Setup navigation buttons and tabs
 */
function setupEventHandlers() {
  // 1. Month Navigation
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
    }
  });

  // 2. Tabs Switcher
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-target");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // 3. Date Converter handlers
  document.getElementById("btnConvertJtoG").addEventListener("click", () => {
    const jy = parseInt(document.getElementById("jConvYear").value, 10);
    const jm = parseInt(document.getElementById("jConvMonth").value, 10);
    const jd = parseInt(document.getElementById("jConvDay").value, 10);

    if (isNaN(jy) || isNaN(jm) || isNaN(jd) || jd < 1 || jd > 31) {
      document.getElementById("resultJtoG").textContent = "لطفاً تاریخ معتبر وارد کنید.";
      return;
    }

    const g = jalaliToGregorian(jy, jm, jd);
    const dt = new Date(g.gy, g.gm - 1, g.gd);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const formatted = dt.toLocaleDateString("en-US", options);
    document.getElementById("resultJtoG").textContent = `نتیجه: ${g.gy}/${g.gm}/${g.gd} — (${formatted})`;
  });

  document.getElementById("btnConvertGtoJ").addEventListener("click", () => {
    const gy = parseInt(document.getElementById("gConvYear").value, 10);
    const gm = parseInt(document.getElementById("gConvMonth").value, 10);
    const gd = parseInt(document.getElementById("gConvDay").value, 10);

    if (isNaN(gy) || isNaN(gm) || isNaN(gd) || gd < 1 || gd > 31) {
      document.getElementById("resultGtoJ").textContent = "لطفاً تاریخ معتبر وارد کنید.";
      return;
    }

    const j = gregorianToJalali(gy, gm, gd);
    const mName = PERSIAN_MONTH_NAMES[j.jm - 1];
    document.getElementById("resultGtoJ").textContent = `نتیجه: ${toPersianDigits(j.jd)} ${mName} ${toPersianDigits(j.jy)} (${toPersianDigits(j.jy)}/${toPersianDigits(j.jm)}/${toPersianDigits(j.jd)})`;
  });

  // 4. Toggle Badge option in storage
  const badgeToggle = document.getElementById("toggleBadgeOption");
  badgeToggle.addEventListener("click", async () => {
    AppState.showBadge = !AppState.showBadge;
    badgeToggle.textContent = AppState.showBadge ? "نشانگر نوار ابزار: فعال" : "نشانگر نوار ابزار: غیرفعال";
    try {
      if (browserAPI.storage && browserAPI.storage.local) {
        await browserAPI.storage.local.set({ showBadge: AppState.showBadge });
      }
      if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
        browserAPI.runtime.sendMessage({ action: "updateBadge" });
      }
    } catch (err) {
      console.warn("Storage update error:", err);
    }
  });

  // Load badge state from storage
  if (browserAPI.storage && browserAPI.storage.local) {
    browserAPI.storage.local.get("showBadge").then(res => {
      if (typeof res.showBadge === "boolean") {
        AppState.showBadge = res.showBadge;
        badgeToggle.textContent = AppState.showBadge ? "نشانگر نوار ابزار: فعال" : "نشانگر نوار ابزار: غیرفعال";
      }
    }).catch(() => {});
  }

  // 5. Theme Toggle handler
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
        console.warn("Failed to persist theme:", err);
      }
    });
  }

  // Load theme from storage or system preference
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

  // Set initial view to today's year and month
  if (AppState.todayJalali) {
    AppState.currentViewYear = AppState.todayJalali.year;
    AppState.currentViewMonth = AppState.todayJalali.month;
    AppState.selectedDay = AppState.todayJalali.day;
  }

  setupEventHandlers();
  renderCalendar();
});
