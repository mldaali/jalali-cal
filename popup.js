/**
 * popup.js - Persian Calendar Extension (Minimalist Dashboard)
 * Native Intl API calculations, interactive grid, click-to-copy,
 * multi-year holiday engine, local notes/reminders, and keyboard navigation.
 */

const browserAPI = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : {});

// Persian month names
const PERSIAN_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

// Weekday names in Persian (0 = Saturday ... 6 = Friday)
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
 * High-precision Jalali <-> Gregorian conversion algorithms
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
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (days >= salA[gm]) {
    days -= salA[gm];
    gm++;
  }
  return { gy, gm, gd: days + 1 };
}

function gregorianToJalali(gy, gm, gd) {
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
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

function isLeapJalali(year) {
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
  theme: "dark",
  notes: {}, // { "1405-8-16": "یادداشت من" }
  isEditingNote: false
};

function getDateKey(y, m, d) {
  return `${y}-${m}-${d}`;
}

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
 * Display a selected date on the top hero card
 */
function displayDateOnHero(year, month, day, weekdayIndex = null, gDate = null) {
  if (!gDate) {
    const g = jalaliToGregorian(year, month, day);
    gDate = new Date(g.gy, g.gm - 1, g.gd);
  }
  if (weekdayIndex === null) {
    weekdayIndex = (gDate.getDay() + 1) % 7;
  }

  const weekdayName = PERSIAN_WEEKDAYS[weekdayIndex];
  const monthName = PERSIAN_MONTH_NAMES[month - 1];

  // 1. Solar Date
  document.getElementById("heroWeekday").textContent = weekdayName;
  document.getElementById("heroDayNum").textContent = toPersianDigits(day);
  document.getElementById("heroMonthYear").textContent = `${monthName} ${toPersianDigits(year)}`;

  // Store for Click-to-Copy
  const fullSolarStr = `${weekdayName}، ${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
  document.getElementById("heroSolarDate").dataset.copyText = fullSolarStr;

  // 2. Gregorian Subtitle
  let gregorianStr = "";
  try {
    const intlGregorian = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    gregorianStr = intlGregorian.format(gDate);
  } catch (e) {
    gregorianStr = `${gDate.getFullYear()}/${gDate.getMonth() + 1}/${gDate.getDate()}`;
  }
  const heroGregorianEl = document.getElementById("heroGregorian");
  heroGregorianEl.textContent = gregorianStr;
  heroGregorianEl.dataset.copyText = `${gDate.getFullYear()}-${String(gDate.getMonth() + 1).padStart(2, "0")}-${String(gDate.getDate()).padStart(2, "0")}`;

  // 3. Hijri Subtitle
  try {
    const intlIslamic = new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long"
    });
    document.getElementById("heroIslamic").textContent = intlIslamic.format(gDate);
  } catch (e) {
    document.getElementById("heroIslamic").textContent = "";
  }

  // 4. Update the conditional occasion badge
  updateOccasionBadge(year, month, day, weekdayIndex, gDate);

  // 5. Update local note view for this day
  updateNoteSection(year, month, day);
}

/**
 * Updates the conditional occasion badge:
 * - Hidden entirely if there are NO events or holidays.
 * - Rendered in Red for holidays, Blue/Violet for events.
 */
function updateOccasionBadge(year, month, day, weekdayIndex, gDate) {
  const events = typeof getEventsForDate === "function" ? getEventsForDate(year, month, day, gDate) : [];
  const isFriday = weekdayIndex === 6;
  const officialHolidays = events.filter(e => e.isHoliday);

  const container = document.getElementById("occasionContainer");
  const badge = document.getElementById("occasionBadge");
  const textEl = document.getElementById("badgeText");

  if (!container || !badge || !textEl) return;

  if (events.length === 0 && !isFriday) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  badge.className = "occasion-badge";

  if (officialHolidays.length > 0 || isFriday) {
    badge.classList.add("is-holiday");
    if (officialHolidays.length > 0) {
      const title = officialHolidays.map(h => h.title).join(" • ");
      textEl.textContent = `${title} (تعطیل)`;
      badge.title = `${title} (تعطیل رسمی)`;
    } else {
      textEl.textContent = "جمعه (تعطیل هفتگی)";
      badge.title = "تعطیل هفتگی";
    }
  } else if (events.length > 0) {
    badge.classList.add("is-event");
    const title = events.map(e => e.title).join(" • ");
    textEl.textContent = title;
    badge.title = title;
  }
}

/**
 * Local Notes & Reminders (Feature 3)
 */
async function loadNotes() {
  try {
    if (browserAPI.storage && browserAPI.storage.local) {
      const data = await browserAPI.storage.local.get("persian_calendar_notes");
      if (data && data.persian_calendar_notes) {
        AppState.notes = data.persian_calendar_notes;
      }
    } else if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("persian_calendar_notes");
      if (raw) AppState.notes = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not load notes:", err);
  }
}

async function persistNotes() {
  try {
    if (browserAPI.storage && browserAPI.storage.local) {
      await browserAPI.storage.local.set({ "persian_calendar_notes": AppState.notes });
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem("persian_calendar_notes", JSON.stringify(AppState.notes));
    }
  } catch (err) {
    console.warn("Could not persist notes:", err);
  }
}

function updateNoteSection(year, month, day) {
  const section = document.getElementById("noteSection");
  const pill = document.getElementById("notePill");
  const editor = document.getElementById("noteEditor");
  const noteText = document.getElementById("noteText");

  if (!section || !pill || !editor || !noteText) return;

  const key = getDateKey(year, month, day);
  const existingNote = AppState.notes[key];

  if (AppState.isEditingNote) {
    section.classList.remove("hidden");
    pill.classList.add("hidden");
    editor.classList.remove("hidden");
    const input = document.getElementById("noteInput");
    if (input) {
      input.value = existingNote || "";
      setTimeout(() => input.focus(), 50);
    }
    return;
  }

  editor.classList.add("hidden");

  if (existingNote && existingNote.trim().length > 0) {
    section.classList.remove("hidden");
    pill.classList.remove("hidden");
    noteText.textContent = existingNote;
    noteText.title = existingNote;
  } else {
    pill.classList.add("hidden");
    section.classList.add("hidden");
  }
}

async function saveCurrentNote() {
  const input = document.getElementById("noteInput");
  if (!input) return;

  const text = input.value.trim();
  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const day = AppState.selectedDay;
  const key = getDateKey(year, month, day);

  if (text.length > 0) {
    AppState.notes[key] = text;
    showCopyToast("یادداشت ذخیره شد!");
  } else {
    delete AppState.notes[key];
  }

  AppState.isEditingNote = false;
  await persistNotes();
  updateNoteSection(year, month, day);
  renderCalendar();
}

async function deleteCurrentNote() {
  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const day = AppState.selectedDay;
  const key = getDateKey(year, month, day);

  if (AppState.notes[key]) {
    delete AppState.notes[key];
    await persistNotes();
    showCopyToast("یادداشت حذف شد");
  }

  AppState.isEditingNote = false;
  updateNoteSection(year, month, day);
  renderCalendar();
}

/**
 * Shows temporary toast notification for Click-to-Copy
 */
let toastTimeout = null;
function showCopyToast(message = "کپی شد!") {
  const toast = document.getElementById("copyToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

/**
 * Renders the compact 280px calendar matrix
 */
function renderCalendar() {
  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const today = AppState.todayJalali;

  const monthName = PERSIAN_MONTH_NAMES[month - 1];
  document.getElementById("monthTitle").textContent = `${monthName} ${toPersianDigits(year)}`;

  const gFirst = jalaliToGregorian(year, month, 1);
  const firstDate = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd);
  const startDayOfWeek = (firstDate.getDay() + 1) % 7;

  const daysInCurrentMonth = getDaysInJalaliMonth(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInJalaliMonth(prevYear, prevMonth);

  const matrixEl = document.getElementById("daysMatrix");
  matrixEl.innerHTML = "";

  // 1. Preceding month days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i;
    const cell = document.createElement("div");
    cell.className = "cell other-month";
    cell.textContent = toPersianDigits(pDay);
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.addEventListener("click", () => {
      AppState.currentViewYear = prevYear;
      AppState.currentViewMonth = prevMonth;
      AppState.selectedDay = pDay;
      AppState.isEditingNote = false;
      renderCalendar();
      const g = jalaliToGregorian(prevYear, prevMonth, pDay);
      const dt = new Date(g.gy, g.gm - 1, g.gd);
      displayDateOnHero(prevYear, prevMonth, pDay, (dt.getDay() + 1) % 7, dt);
    });
    matrixEl.appendChild(cell);
  }

  // 2. Current Month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = toPersianDigits(d);
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.dataset.day = d;

    const gDay = jalaliToGregorian(year, month, d);
    const cellGDate = new Date(gDay.gy, gDay.gm - 1, gDay.gd);
    const dayOfWeek = (cellGDate.getDay() + 1) % 7;

    const isFriday = dayOfWeek === 6;
    const events = typeof getEventsForDate === "function" ? getEventsForDate(year, month, d, cellGDate) : [];
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

    // Check if day has a personal local note
    const key = getDateKey(year, month, d);
    const hasNote = Boolean(AppState.notes[key]);

    // Indicators
    if (hasNote) {
      const noteDot = document.createElement("span");
      noteDot.className = "cell-dot note-dot";
      noteDot.title = `یادداشت: ${AppState.notes[key]}`;
      cell.appendChild(noteDot);
    } else if (events.length > 0 || isHoliday) {
      const dot = document.createElement("span");
      dot.className = `cell-dot ${isHoliday ? "holiday-dot" : ""}`;
      cell.appendChild(dot);
    }

    // Interactive Click: Updates hero card, occasion badge, and notes
    cell.addEventListener("click", () => {
      document.querySelectorAll(".cell.selected").forEach(el => el.classList.remove("selected"));
      cell.classList.add("selected");
      AppState.selectedDay = d;
      AppState.isEditingNote = false;
      displayDateOnHero(year, month, d, dayOfWeek, cellGDate);
    });

    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cell.click();
      }
    });

    matrixEl.appendChild(cell);
  }

  // 3. Trailing month padding
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
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.addEventListener("click", () => {
      AppState.currentViewYear = nextYear;
      AppState.currentViewMonth = nextMonth;
      AppState.selectedDay = nDay;
      AppState.isEditingNote = false;
      renderCalendar();
      const g = jalaliToGregorian(nextYear, nextMonth, nDay);
      const dt = new Date(g.gy, g.gm - 1, g.gd);
      displayDateOnHero(nextYear, nextMonth, nDay, (dt.getDay() + 1) % 7, dt);
    });
    matrixEl.appendChild(cell);
  }
}

/**
 * Step days forwards or backwards (Keyboard navigation)
 */
function stepDay(delta) {
  let y = AppState.currentViewYear;
  let m = AppState.currentViewMonth;
  let d = (AppState.selectedDay || 1) + delta;

  while (d < 1) {
    if (m === 1) {
      m = 12;
      y--;
    } else {
      m--;
    }
    d += getDaysInJalaliMonth(y, m);
  }

  while (d > getDaysInJalaliMonth(y, m)) {
    d -= getDaysInJalaliMonth(y, m);
    if (m === 12) {
      m = 1;
      y++;
    } else {
      m++;
    }
  }

  AppState.currentViewYear = y;
  AppState.currentViewMonth = m;
  AppState.selectedDay = d;
  AppState.isEditingNote = false;

  renderCalendar();
  const g = jalaliToGregorian(y, m, d);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(y, m, d, (dt.getDay() + 1) % 7, dt);

  // Focus the newly selected cell for seamless accessibility
  const activeCell = document.querySelector(`.cell[data-day="${d}"]`);
  if (activeCell) activeCell.focus();
}

function goToToday() {
  if (AppState.todayJalali) {
    AppState.currentViewYear = AppState.todayJalali.year;
    AppState.currentViewMonth = AppState.todayJalali.month;
    AppState.selectedDay = AppState.todayJalali.day;
    AppState.isEditingNote = false;
    renderCalendar();
    displayDateOnHero(
      AppState.todayJalali.year,
      AppState.todayJalali.month,
      AppState.todayJalali.day,
      AppState.todayJalali.weekdayIndex,
      AppState.todayJalali.rawDate
    );
  }
}

function goToPrevMonth() {
  if (AppState.currentViewMonth === 1) {
    AppState.currentViewMonth = 12;
    AppState.currentViewYear--;
  } else {
    AppState.currentViewMonth--;
  }
  AppState.selectedDay = 1;
  AppState.isEditingNote = false;
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, 1);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, 1, (dt.getDay() + 1) % 7, dt);
}

function goToNextMonth() {
  if (AppState.currentViewMonth === 12) {
    AppState.currentViewMonth = 1;
    AppState.currentViewYear++;
  } else {
    AppState.currentViewMonth++;
  }
  AppState.selectedDay = 1;
  AppState.isEditingNote = false;
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, 1);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, 1, (dt.getDay() + 1) % 7, dt);
}

/**
 * Apply Dark or Light Theme
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
 * Setup Global Keyboard Navigation (Feature 5)
 */
function setupKeyboardNavigation() {
  window.addEventListener("keydown", (e) => {
    // If input is focused, don't intercept standard typing
    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
      if (e.key === "Escape") {
        AppState.isEditingNote = false;
        updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      // In RTL calendar layout, left arrow moves to next day (+1)
      e.preventDefault();
      stepDay(1);
    } else if (e.key === "ArrowRight") {
      // In RTL, right arrow moves to previous day (-1)
      e.preventDefault();
      stepDay(-1);
    } else if (e.key === "ArrowUp") {
      // Move 1 week up (-7 days)
      e.preventDefault();
      stepDay(-7);
    } else if (e.key === "ArrowDown") {
      // Move 1 week down (+7 days)
      e.preventDefault();
      stepDay(7);
    } else if (e.key === "t" || e.key === "T" || e.key === "ف") {
      // Jump to Today
      e.preventDefault();
      goToToday();
    } else if (e.key === "m" || e.key === "M" || e.key === "PageDown") {
      // Next Month (M / PageDown)
      e.preventDefault();
      goToNextMonth();
    } else if (e.key === "p" || e.key === "P" || e.key === "PageUp") {
      // Previous Month (P / PageUp)
      e.preventDefault();
      goToPrevMonth();
    } else if (e.key === "n" || e.key === "N") {
      // Note (N) strictly toggles the personal note editor!
      e.preventDefault();
      AppState.isEditingNote = !AppState.isEditingNote;
      updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
    } else if (e.key === "c" || e.key === "C" || e.key === "ز") {
      // Copy Date
      e.preventDefault();
      const heroSolar = document.getElementById("heroSolarDate");
      if (heroSolar && heroSolar.dataset.copyText) {
        navigator.clipboard.writeText(heroSolar.dataset.copyText).then(() => {
          showCopyToast("تاریخ خورشیدی کپی شد!");
        });
      }
    }
  });
}

/**
 * Setup Event Handlers
 */
function setupEventHandlers() {
  // 1. Month Navigation
  document.getElementById("prevMonthBtn").addEventListener("click", goToPrevMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", goToNextMonth);

  // 2. Jump to Today Button
  document.getElementById("jumpTodayBtn").addEventListener("click", goToToday);

  // 3. Click-to-Copy Handlers
  document.getElementById("heroSolarDate").addEventListener("click", () => {
    const text = document.getElementById("heroSolarDate").dataset.copyText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => showCopyToast("تاریخ خورشیدی کپی شد!"));
    }
  });

  document.getElementById("heroGregorian").addEventListener("click", () => {
    const text = document.getElementById("heroGregorian").dataset.copyText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => showCopyToast("تاریخ میلادی کپی شد!"));
    }
  });

  // 4. Quick Note Actions
  const quickNoteBtn = document.getElementById("quickNoteBtn");
  if (quickNoteBtn) {
    quickNoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      AppState.isEditingNote = !AppState.isEditingNote;
      updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
    });
  }

  const noteText = document.getElementById("noteText");
  if (noteText) {
    noteText.addEventListener("click", (e) => {
      e.stopPropagation();
      AppState.isEditingNote = true;
      updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
    });
  }

  const saveNoteBtn = document.getElementById("saveNoteBtn");
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      saveCurrentNote();
    });
  }

  const cancelNoteBtn = document.getElementById("cancelNoteBtn");
  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      AppState.isEditingNote = false;
      updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
    });
  }

  const noteInput = document.getElementById("noteInput");
  if (noteInput) {
    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveCurrentNote();
      }
    });
  }

  const delNoteBtn = document.getElementById("delNoteBtn");
  if (delNoteBtn) {
    delNoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCurrentNote();
    });
  }

  // 5. Refresh Button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      refreshBtn.classList.add("rotating");
      setTimeout(() => refreshBtn.classList.remove("rotating"), 360);

      const now = new Date();
      AppState.todayJalali = getLiveJalaliParts(now);
      AppState.currentViewYear = AppState.todayJalali.year;
      AppState.currentViewMonth = AppState.todayJalali.month;
      AppState.selectedDay = AppState.todayJalali.day;
      AppState.isEditingNote = false;

      renderCalendar();
      displayDateOnHero(
        AppState.todayJalali.year,
        AppState.todayJalali.month,
        AppState.todayJalali.day,
        AppState.todayJalali.weekdayIndex,
        AppState.todayJalali.rawDate
      );

      try {
        if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
          browserAPI.runtime.sendMessage({ action: "updateIcon" });
        }
      } catch (e) {}
    });
  }

  // 6. Theme Toggle Button
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
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
document.addEventListener("DOMContentLoaded", async () => {
  const now = new Date();
  AppState.todayJalali = getLiveJalaliParts(now);
  AppState.currentViewYear = AppState.todayJalali.year;
  AppState.currentViewMonth = AppState.todayJalali.month;
  AppState.selectedDay = AppState.todayJalali.day;

  await loadNotes();
  setupEventHandlers();
  setupKeyboardNavigation();
  renderCalendar();

  // Initially display today
  displayDateOnHero(
    AppState.todayJalali.year,
    AppState.todayJalali.month,
    AppState.todayJalali.day,
    AppState.todayJalali.weekdayIndex,
    AppState.todayJalali.rawDate
  );

  // Notify background to ensure icon is up-to-date
  try {
    if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
      browserAPI.runtime.sendMessage({ action: "updateIcon" });
    }
  } catch (e) {}
});
