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
  themeMode: "auto", // "auto", "light", or "dark"
  theme: "dark",     // effective theme: "light" or "dark"
  notes: {}, // { "1405-8-16": "یادداشت من" }
  isEditingNote: false,
  enableGamingEvents: false,
  eventCategories: {
    ancient: true,
    religious: true,
    national: true,
    international: true,
    gaming: false
  }
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

  // 3. Hijri Subtitle (Calendar by Moon)
  try {
    const dayEvents = typeof getEventsForDate === "function" ? getEventsForDate(year, month, day, gDate) : [];
    const relEv = dayEvents.find(e => e.category === "religious" && e.hijriDateStr);
    if (relEv && relEv.hijriDateStr) {
      document.getElementById("heroIslamic").textContent = relEv.hijriDateStr;
    } else if (typeof formatIranianIslamicDate === "function") {
      document.getElementById("heroIslamic").textContent = formatIranianIslamicDate(gDate, year, month, day);
    } else {
      const intlIslamic = new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long"
      });
      document.getElementById("heroIslamic").textContent = intlIslamic.format(gDate);
    }
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
  const events = typeof getEventsForDate === "function" ? getEventsForDate(year, month, day, gDate, AppState.eventCategories) : [];
  const isFriday = weekdayIndex === 6;
  const officialHolidays = events.filter(e => e.isHoliday);
  const gamingEvents = (AppState.enableGamingEvents && typeof getGamingEventsForDate === "function" && gDate)
    ? getGamingEventsForDate(gDate, AppState.eventCategories)
    : [];

  const container = document.getElementById("occasionContainer");
  const badge = document.getElementById("occasionBadge");
  const textEl = document.getElementById("badgeText");

  if (!container || !badge || !textEl) return;

  if (events.length === 0 && !isFriday && gamingEvents.length === 0) {
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
    if (gamingEvents.length > 0) {
      badge.title += ` • 🎮 ${gamingEvents[0].title}`;
    }
  } else if (events.length > 0) {
    badge.classList.add("is-event");
    const title = events.map(e => e.title).join(" • ");
    textEl.textContent = title;
    badge.title = title;
    if (gamingEvents.length > 0) {
      badge.title += ` • 🎮 ${gamingEvents[0].title}`;
    }
  } else if (gamingEvents.length > 0) {
    badge.classList.add("is-gaming");
    const title = gamingEvents.map(e => `🎮 ${e.title}`).join(" • ");
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

/**
 * Gaming Events Management (Option A)
 */
async function loadGamingEvents() {
  try {
    let enabled = false;
    let cachedEvents = null;

    if (browserAPI.storage && browserAPI.storage.local) {
      const res = await browserAPI.storage.local.get(["enableGamingEvents", "cachedGamingEvents"]);
      enabled = Boolean(res && res.enableGamingEvents);
      if (res && res.cachedGamingEvents && Array.isArray(res.cachedGamingEvents)) {
        cachedEvents = res.cachedGamingEvents;
      }
    } else if (typeof localStorage !== "undefined") {
      enabled = localStorage.getItem("enableGamingEvents") === "true";
      const raw = localStorage.getItem("cachedGamingEvents");
      if (raw) cachedEvents = JSON.parse(raw);
    }

    AppState.enableGamingEvents = enabled;

    // If cache not in storage, fetch bundled file
    if (!cachedEvents) {
      try {
        const bundledUrl = (browserAPI.runtime && browserAPI.runtime.getURL)
          ? browserAPI.runtime.getURL("gaming-events.json")
          : "gaming-events.json";
        const fetchRes = await fetch(bundledUrl);
        if (fetchRes.ok) {
          const json = await fetchRes.json();
          if (json && Array.isArray(json.events)) {
            cachedEvents = json.events;
            if (browserAPI.storage && browserAPI.storage.local) {
              await browserAPI.storage.local.set({ cachedGamingEvents: json.events });
            }
          }
        }
      } catch (e) {
        console.warn("Could not load bundled gaming events:", e);
      }
    }

    if (cachedEvents && typeof setGamingEventsData === "function") {
      setGamingEventsData(cachedEvents);
    }

    updateGamingToggleUI();
  } catch (err) {
    console.warn("Failed to initialize gaming events in popup:", err);
  }
}

function updateGamingToggleUI() {
  const icon = document.getElementById("gamingIcon");
  const btn = document.getElementById("gamingToggleBtn");
  if (!icon || !btn) return;

  if (AppState.enableGamingEvents) {
    icon.className = "gaming-icon-active";
    btn.title = "رویدادهای گیمینگ: فعال (کلیک برای غیرفعال‌سازی)";
  } else {
    icon.className = "gaming-icon-muted";
    btn.title = "رویدادهای گیمینگ: غیرفعال (کلیک برای فعال‌سازی)";
  }
}

/**
 * Load official pre-synced calendar data for a specific year
 */
async function loadOfficialCalendarData(year) {
  try {
    if (typeof loadOfficialYearData !== "function") return;
    const url = (browserAPI.runtime && browserAPI.runtime.getURL)
      ? browserAPI.runtime.getURL(`official-events-${year}.json`)
      : `official-events-${year}.json`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      loadOfficialYearData(year, json);
    }
  } catch (e) {
    // Graceful fallback to built-in multi-year astronomical engine
  }
}

/**
 * Event Categories Filter Management
 */
async function loadEventCategories() {
  const defaultCategories = {
    ancient: true,
    religious: true,
    national: true,
    international: true,
    gaming: false
  };

  try {
    if (browserAPI.storage && browserAPI.storage.local) {
      const res = await browserAPI.storage.local.get(["eventCategories", "enableGamingEvents"]);
      if (res && res.eventCategories && typeof res.eventCategories === "object") {
        AppState.eventCategories = { ...defaultCategories, ...res.eventCategories };
      } else {
        AppState.eventCategories = { ...defaultCategories };
        if (res && typeof res.enableGamingEvents === "boolean") {
          AppState.eventCategories.gaming = res.enableGamingEvents;
        }
      }
    } else if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("eventCategories");
      if (raw) {
        AppState.eventCategories = { ...defaultCategories, ...JSON.parse(raw) };
      } else {
        AppState.eventCategories = { ...defaultCategories };
      }
    }
  } catch (err) {
    console.warn("Could not load event categories:", err);
    AppState.eventCategories = { ...defaultCategories };
  }

  AppState.enableGamingEvents = Boolean(AppState.eventCategories.gaming);
  updateFilterCheckboxUI();
  updateGamingToggleUI();
}

function updateFilterCheckboxUI() {
  const map = {
    ancient: "filterAncient",
    religious: "filterReligious",
    national: "filterNational",
    international: "filterInternational",
    gaming: "filterGaming"
  };

  for (const [cat, id] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      el.checked = AppState.eventCategories[cat] !== false;
    }
  }
}

async function saveEventCategories() {
  try {
    AppState.enableGamingEvents = Boolean(AppState.eventCategories.gaming);
    if (browserAPI.storage && browserAPI.storage.local) {
      await browserAPI.storage.local.set({
        eventCategories: AppState.eventCategories,
        enableGamingEvents: AppState.enableGamingEvents
      });
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem("eventCategories", JSON.stringify(AppState.eventCategories));
      localStorage.setItem("enableGamingEvents", String(AppState.enableGamingEvents));
    }
  } catch (err) {
    console.warn("Could not save event categories:", err);
  }
  updateGamingToggleUI();
}

function openFilterOverlay() {
  const overlay = document.getElementById("eventsFilterOverlay");
  if (overlay) {
    updateFilterCheckboxUI();
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }
}

function closeFilterOverlay() {
  const overlay = document.getElementById("eventsFilterOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }
}

async function onFilterOptionChanged(category, isChecked) {
  AppState.eventCategories[category] = isChecked;
  if (category === "gaming") {
    AppState.enableGamingEvents = isChecked;
  }
  await saveEventCategories();
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay, (dt.getDay() + 1) % 7, dt);

  const monthOverlay = document.getElementById("monthEventsOverlay");
  if (monthOverlay && !monthOverlay.classList.contains("hidden")) {
    showMonthEventsOverlay();
  }
}

async function selectAllFilterCategories() {
  for (const k of Object.keys(AppState.eventCategories)) {
    AppState.eventCategories[k] = true;
  }
  AppState.enableGamingEvents = true;
  updateFilterCheckboxUI();
  await saveEventCategories();
  showCopyToast("همه دسته‌ها فعال شدند");
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay, (dt.getDay() + 1) % 7, dt);
  const monthOverlay = document.getElementById("monthEventsOverlay");
  if (monthOverlay && !monthOverlay.classList.contains("hidden")) {
    showMonthEventsOverlay();
  }
}

async function resetFilterCategories() {
  AppState.eventCategories = {
    ancient: true,
    religious: true,
    national: true,
    international: true,
    gaming: false
  };
  AppState.enableGamingEvents = false;
  updateFilterCheckboxUI();
  await saveEventCategories();
  showCopyToast("تنظیمات فیلتر به حالت پیش‌فرض بازگشت");
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay, (dt.getDay() + 1) % 7, dt);
  const monthOverlay = document.getElementById("monthEventsOverlay");
  if (monthOverlay && !monthOverlay.classList.contains("hidden")) {
    showMonthEventsOverlay();
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
  const occasionContainer = document.getElementById("occasionContainer");

  if (AppState.isEditingNote) {
    if (occasionContainer) occasionContainer.classList.add("hidden");
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
  const gDate = jalaliToGregorian(year, month, day);
  const dObj = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  const weekdayIndex = (dObj.getDay() + 1) % 7;
  updateOccasionBadge(year, month, day, weekdayIndex, dObj);
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
    const events = typeof getEventsForDate === "function" ? getEventsForDate(year, month, d, cellGDate, AppState.eventCategories) : [];
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
    const gamingEvs = (AppState.enableGamingEvents && typeof getGamingEventsForDate === "function")
      ? getGamingEventsForDate(cellGDate, AppState.eventCategories)
      : [];

    // Indicators
    if (hasNote) {
      const noteDot = document.createElement("span");
      noteDot.className = "cell-dot note-dot";
      noteDot.title = `یادداشت: ${AppState.notes[key]}`;
      cell.appendChild(noteDot);
    } else if (events.length > 0 || isHoliday) {
      const dot = document.createElement("span");
      const primaryCat = events[0]?.category || "national";
      dot.className = `cell-dot ${isHoliday ? "holiday-dot" : `${primaryCat}-dot`}`;
      cell.appendChild(dot);
    } else if (gamingEvs.length > 0) {
      const gamingDot = document.createElement("span");
      gamingDot.className = "cell-dot gaming-dot";
      gamingDot.title = `🎮 ${gamingEvs[0].title}`;
      cell.appendChild(gamingDot);
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
  const oldYear = AppState.currentViewYear;
  if (AppState.currentViewMonth === 1) {
    AppState.currentViewMonth = 12;
    AppState.currentViewYear--;
  } else {
    AppState.currentViewMonth--;
  }
  if (oldYear !== AppState.currentViewYear) {
    loadOfficialCalendarData(AppState.currentViewYear);
  }
  AppState.selectedDay = 1;
  AppState.isEditingNote = false;
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, 1);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, 1, (dt.getDay() + 1) % 7, dt);
}

function goToNextMonth() {
  const oldYear = AppState.currentViewYear;
  if (AppState.currentViewMonth === 12) {
    AppState.currentViewMonth = 1;
    AppState.currentViewYear++;
  } else {
    AppState.currentViewMonth++;
  }
  if (oldYear !== AppState.currentViewYear) {
    loadOfficialCalendarData(AppState.currentViewYear);
  }
  AppState.selectedDay = 1;
  AppState.isEditingNote = false;
  renderCalendar();
  const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, 1);
  const dt = new Date(g.gy, g.gm - 1, g.gd);
  displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, 1, (dt.getDay() + 1) % 7, dt);
}

/**
 * Detect current system color scheme preference
 */
function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

/**
 * Resolve effective theme ("light" or "dark") given a mode ("auto", "light", or "dark")
 */
function resolveEffectiveTheme(mode) {
  if (mode === "auto") {
    return getSystemTheme();
  }
  return mode === "light" ? "light" : "dark";
}

/**
 * Apply Theme Mode: "auto", "light", or "dark"
 * Automatically adapts to system theme in real time when set to "auto".
 */
function applyTheme(themeMode) {
  if (themeMode !== "auto" && themeMode !== "light" && themeMode !== "dark") {
    themeMode = "auto";
  }

  AppState.themeMode = themeMode;
  const effectiveTheme = resolveEffectiveTheme(themeMode);
  AppState.theme = effectiveTheme;

  // Set attribute on html element
  document.documentElement.setAttribute("data-theme", themeMode);

  const themeIcon = document.getElementById("themeIcon");
  const themeBtn = document.getElementById("themeToggleBtn");

  if (themeIcon) {
    if (themeMode === "auto") {
      themeIcon.textContent = "🌓";
    } else if (themeMode === "light") {
      themeIcon.textContent = "☀️";
    } else {
      themeIcon.textContent = "🌙";
    }
  }

  if (themeBtn) {
    if (themeMode === "auto") {
      const modeFa = effectiveTheme === "light" ? "روشن" : "تیره";
      themeBtn.title = `پوسته: خودکار بر اساس سیستم (${modeFa}) • کلیک برای تغییر`;
    } else if (themeMode === "light") {
      themeBtn.title = "پوسته: روشن • کلیک برای تغییر به تیره";
    } else {
      themeBtn.title = "پوسته: تیره • کلیک برای تغییر به خودکار بر اساس سیستم";
    }
  }
}

/**
 * State and helpers for Month Events HUD Peek Overlay
 */
let isHoldingEventsKey = false;

function getMonthSummaryEvents(year, month) {
  const isLeap = typeof isLeapJalaliYear === "function" ? isLeapJalaliYear(year) : false;
  const daysInMonth = month <= 6 ? 31 : (month <= 11 ? 30 : (isLeap ? 30 : 29));
  const list = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const g = jalaliToGregorian(year, month, d);
    const dt = new Date(g.gy, g.gm - 1, g.gd);
    const weekdayIndex = (dt.getDay() + 1) % 7;
    const isFriday = weekdayIndex === 6;
    const evs = typeof getEventsForDate === "function" ? getEventsForDate(year, month, d, dt, AppState.eventCategories) : [];
    const noteKey = getDateKey(year, month, d);
    const userNote = AppState.notes ? AppState.notes[noteKey] : null;
    const gamingEvs = (AppState.enableGamingEvents && typeof getGamingEventsForDate === "function")
      ? getGamingEventsForDate(dt, AppState.eventCategories)
      : [];

    // Only list days that have actual occasions/events, personal notes, or gaming events (when enabled)
    if (evs.length > 0 || (userNote && userNote.trim()) || gamingEvs.length > 0) {
      list.push({
        day: d,
        weekday: PERSIAN_WEEKDAYS[weekdayIndex],
        weekdayIndex,
        isFriday,
        events: evs,
        gamingEvents: gamingEvs,
        note: userNote && userNote.trim() ? userNote.trim() : null
      });
    }
  }

  return list;
}

function showMonthEventsOverlay() {
  const overlay = document.getElementById("monthEventsOverlay");
  const listEl = document.getElementById("eventsOverlayList");
  const titleEl = document.getElementById("eventsOverlayTitle");
  if (!overlay || !listEl) return;

  const year = AppState.currentViewYear;
  const month = AppState.currentViewMonth;
  const monthName = PERSIAN_MONTH_NAMES[month - 1];

  if (titleEl) {
    titleEl.textContent = `رویدادهای ${monthName} ${toPersianDigits(year)}`;
  }

  listEl.innerHTML = "";
  const items = getMonthSummaryEvents(year, month);

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "events-empty-state";
    empty.textContent = "هیچ رویدادی در این ماه ثبت نشده است.";
    listEl.appendChild(empty);
  } else {
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "event-row-item";
      row.title = "کلیک برای پرش به این روز";

      const hasOfficialHoliday = item.events.some(e => e.isHoliday) || item.isFriday;
      const isOnlyGaming = !hasOfficialHoliday && item.events.length === 0 && !item.note && item.gamingEvents && item.gamingEvents.length > 0;

      const badge = document.createElement("div");
      badge.className = `event-row-badge ${hasOfficialHoliday ? "is-holiday" : (isOnlyGaming ? "is-gaming" : "")}`;

      const badgeWd = document.createElement("span");
      badgeWd.className = "badge-weekday";
      badgeWd.textContent = item.weekday;

      const badgeNum = document.createElement("span");
      badgeNum.className = "badge-daynum";
      badgeNum.textContent = toPersianDigits(item.day);

      badge.appendChild(badgeWd);
      badge.appendChild(badgeNum);
      row.appendChild(badge);

      const content = document.createElement("div");
      content.className = "event-row-content";

      if (item.events.length > 0) {
        item.events.forEach(ev => {
          const t = document.createElement("div");
          t.className = `event-row-title ${ev.isHoliday ? "is-holiday" : ""}`;

          const cat = ev.category || "national";
          const catLabels = {
            ancient: "🏛️ باستانی",
            religious: "🌙 مذهبی",
            national: "🇮🇷 ملی",
            international: "🌍 جهانی"
          };
          const badgeSpan = document.createElement("span");
          badgeSpan.className = `event-row-badge is-${cat}`;
          badgeSpan.textContent = catLabels[cat] || cat;
          badgeSpan.style.marginRight = "4px";
          badgeSpan.style.fontSize = "7.5px";
          badgeSpan.style.padding = "0 4px";
          badgeSpan.style.display = "inline-block";
          t.appendChild(badgeSpan);

          const titleSpan = document.createElement("span");
          titleSpan.textContent = ev.isHoliday ? ` ${ev.title} (تعطیل)` : ` ${ev.title}`;
          t.appendChild(titleSpan);

          content.appendChild(t);
        });
      }

      if (item.gamingEvents && item.gamingEvents.length > 0) {
        item.gamingEvents.forEach(gev => {
          const t = document.createElement("div");
          t.className = "event-row-title is-gaming";

          const badgeSpan = document.createElement("span");
          badgeSpan.className = "event-row-badge is-gaming";
          badgeSpan.textContent = "🎮 گیمینگ";
          badgeSpan.style.marginRight = "4px";
          badgeSpan.style.fontSize = "7.5px";
          badgeSpan.style.padding = "0 4px";
          badgeSpan.style.display = "inline-block";
          t.appendChild(badgeSpan);

          const titleSpan = document.createElement("span");
          titleSpan.textContent = ` ${gev.title}`;
          t.appendChild(titleSpan);

          content.appendChild(t);
        });
      }

      if (item.note) {
        const noteEl = document.createElement("div");
        noteEl.className = "event-row-note";

        const pin = document.createElement("span");
        pin.textContent = "📌";

        const txt = document.createElement("span");
        txt.textContent = item.note;

        noteEl.appendChild(pin);
        noteEl.appendChild(txt);
        content.appendChild(noteEl);
      }

      row.appendChild(content);

      row.addEventListener("click", () => {
        AppState.selectedDay = item.day;
        const g = jalaliToGregorian(year, month, item.day);
        const dt = new Date(g.gy, g.gm - 1, g.gd);
        displayDateOnHero(year, month, item.day, item.weekdayIndex, dt);
        renderCalendar();
        hideMonthEventsOverlay();
      });

      listEl.appendChild(row);
    });
  }

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function hideMonthEventsOverlay() {
  const overlay = document.getElementById("monthEventsOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }
  isHoldingEventsKey = false;
}

/**
 * Setup Global Keyboard Navigation (Feature 5 & Hold 'E' to Peek)
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

    if (e.key === "Escape") {
      closeFilterOverlay();
      hideMonthEventsOverlay();
      AppState.isEditingNote = false;
      updateNoteSection(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
      return;
    }

    // Ignore single-key shortcuts if Ctrl / Meta / Alt modifiers are pressed
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    // Hold 'E' / 'ث' to peek at month events overlay
    if (e.key === "e" || e.key === "E" || e.key === "ث") {
      e.preventDefault();
      if (!isHoldingEventsKey) {
        isHoldingEventsKey = true;
        showMonthEventsOverlay();
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
    } else if (e.key === "d" || e.key === "D" || e.key === "ی") {
      // Toggle theme mode (Auto -> Light -> Dark -> Auto)
      e.preventDefault();
      const themeBtn = document.getElementById("themeToggleBtn");
      if (themeBtn) themeBtn.click();
    }
  });

  // Release 'E' / 'ث' key hides the peek overlay immediately
  window.addEventListener("keyup", (e) => {
    if (e.key === "e" || e.key === "E" || e.key === "ث") {
      if (isHoldingEventsKey) {
        hideMonthEventsOverlay();
      }
    }
  });

  // Safety net: ensure overlay disappears if window blurs while key is down
  window.addEventListener("blur", () => {
    hideMonthEventsOverlay();
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
      const gDate = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
      const dObj = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
      const weekdayIndex = (dObj.getDay() + 1) % 7;
      updateOccasionBadge(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay, weekdayIndex, dObj);
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
      let nextMode;
      if (AppState.themeMode === "auto") {
        nextMode = AppState.theme === "light" ? "dark" : "light";
      } else if (AppState.themeMode === "light") {
        nextMode = "dark";
      } else {
        nextMode = "auto";
      }

      applyTheme(nextMode);

      try {
        if (browserAPI.storage && browserAPI.storage.local) {
          await browserAPI.storage.local.set({ theme: nextMode });
        }
      } catch (err) {
        console.warn("Theme storage error:", err);
      }
    });

    // Right-click shortcut to quickly restore Auto (System Theme)
    themeToggleBtn.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyTheme("auto");
      try {
        if (browserAPI.storage && browserAPI.storage.local) {
          await browserAPI.storage.local.set({ theme: "auto" });
        }
      } catch (err) {
        console.warn("Theme storage error:", err);
      }
      showCopyToast("پوسته خودکار فعال شد");
    });
  }

  // 7. Live System Theme Listener (tracks OS/browser theme changes in real-time)
  if (typeof window !== "undefined" && window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (AppState.themeMode === "auto") {
        applyTheme("auto");
      }
    };
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener("change", handleSystemThemeChange);
    } else if (darkModeMediaQuery.addListener) {
      darkModeMediaQuery.addListener(handleSystemThemeChange);
    }
  }

  // 8. Load persisted theme from storage (defaults to "auto" system preference)
  if (browserAPI.storage && browserAPI.storage.local) {
    browserAPI.storage.local.get("theme").then(res => {
      if (res && (res.theme === "auto" || res.theme === "light" || res.theme === "dark")) {
        applyTheme(res.theme);
      } else {
        applyTheme("auto");
      }
    }).catch(() => {
      applyTheme("auto");
    });
  } else {
    applyTheme("auto");
  }

  // 9. Month Events Overlay (Click month title to toggle, close button or backdrop click to dismiss)
  const monthTitle = document.getElementById("monthTitle");
  if (monthTitle) {
    monthTitle.addEventListener("click", () => {
      const overlay = document.getElementById("monthEventsOverlay");
      if (overlay && !overlay.classList.contains("hidden")) {
        hideMonthEventsOverlay();
      } else {
        showMonthEventsOverlay();
      }
    });
  }

  const closeEventsOverlayBtn = document.getElementById("closeEventsOverlayBtn");
  if (closeEventsOverlayBtn) {
    closeEventsOverlayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hideMonthEventsOverlay();
    });
  }

  const monthEventsOverlay = document.getElementById("monthEventsOverlay");
  if (monthEventsOverlay) {
    monthEventsOverlay.addEventListener("click", (e) => {
      // If clicked on backdrop outside of the events card
      if (e.target === monthEventsOverlay) {
        hideMonthEventsOverlay();
      }
    });
  }

  // 10. Gaming Events Toggle Button (Option A)
  const gamingToggleBtn = document.getElementById("gamingToggleBtn");
  if (gamingToggleBtn) {
    gamingToggleBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      AppState.enableGamingEvents = !AppState.enableGamingEvents;
      AppState.eventCategories.gaming = AppState.enableGamingEvents;
      await saveEventCategories();
      updateFilterCheckboxUI();
      showCopyToast(AppState.enableGamingEvents ? "رویدادهای گیمینگ فعال شد 🎮" : "رویدادهای گیمینگ غیرفعال شد");
      renderCalendar();
      const g = jalaliToGregorian(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay);
      const dt = new Date(g.gy, g.gm - 1, g.gd);
      displayDateOnHero(AppState.currentViewYear, AppState.currentViewMonth, AppState.selectedDay, (dt.getDay() + 1) % 7, dt);

      // If Month Events Overlay is visible, refresh it
      const overlay = document.getElementById("monthEventsOverlay");
      if (overlay && !overlay.classList.contains("hidden")) {
        showMonthEventsOverlay();
      }
    });
  }

  // 11. Event Categories Filter Modal Handlers
  const eventsFilterBtn = document.getElementById("eventsFilterBtn");
  if (eventsFilterBtn) {
    eventsFilterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFilterOverlay();
    });
  }

  const hudFilterBtn = document.getElementById("hudFilterBtn");
  if (hudFilterBtn) {
    hudFilterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFilterOverlay();
    });
  }

  const closeFilterOverlayBtn = document.getElementById("closeFilterOverlayBtn");
  if (closeFilterOverlayBtn) {
    closeFilterOverlayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFilterOverlay();
    });
  }

  const eventsFilterOverlay = document.getElementById("eventsFilterOverlay");
  if (eventsFilterOverlay) {
    eventsFilterOverlay.addEventListener("click", (e) => {
      if (e.target === eventsFilterOverlay) {
        closeFilterOverlay();
      }
    });
  }

  // Category Checkboxes
  const categoryMap = [
    { id: "filterAncient", cat: "ancient" },
    { id: "filterReligious", cat: "religious" },
    { id: "filterNational", cat: "national" },
    { id: "filterInternational", cat: "international" },
    { id: "filterGaming", cat: "gaming" }
  ];

  categoryMap.forEach(({ id, cat }) => {
    const chk = document.getElementById(id);
    if (chk) {
      chk.addEventListener("change", (e) => {
        onFilterOptionChanged(cat, e.target.checked);
      });
    }
  });

  const selectAllFiltersBtn = document.getElementById("selectAllFiltersBtn");
  if (selectAllFiltersBtn) {
    selectAllFiltersBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectAllFilterCategories();
    });
  }

  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetFilterCategories();
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

  await loadOfficialCalendarData(AppState.currentViewYear);
  await loadNotes();
  await loadGamingEvents();
  await loadEventCategories();
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
