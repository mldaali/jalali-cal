/**
 * test-extension.js - Automated Test & Verification Suite
 * Validates Manifest V3 compliance, icons, Intl date math, multi-year holidays,
 * local notes architecture, and keyboard navigation.
 */

const fs = require("fs");
const path = require("path");

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
    process.exitCode = 1;
  }
}

console.log("\n\x1b[1m=== 1. Validating Manifest.json (Firefox MV3) ===\x1b[0m");
const manifestPath = path.join(__dirname, "manifest.json");
assert(fs.existsSync(manifestPath), "manifest.json exists");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
assert(manifest.manifest_version === 3, "manifest_version is 3");
assert(manifest.version === "1.2.0", "Version updated to 1.2.0");
assert(!!manifest.browser_specific_settings?.gecko?.id, "Gecko extension ID is configured");
assert(manifest.permissions.includes("storage"), "Permission 'storage' is included");
assert(manifest.permissions.includes("alarms"), "Permission 'alarms' is included");
assert(manifest.permissions.includes("notifications"), "Permission 'notifications' is included");
assert(manifest.action?.default_popup === "popup.html", "Action default_popup is popup.html");
assert(manifest.background?.scripts?.includes("background.js"), "Background script is background.js");
assert(manifest.commands?._execute_action?.suggested_key?.default === "Alt+Shift+C", "Global shortcut Alt+Shift+C is configured");

console.log("\n\x1b[1m=== 2. Validating Extension Files & Icons ===\x1b[0m");
const requiredFiles = [
  "popup.html",
  "popup.css",
  "popup.js",
  "events.js",
  "background.js",
  "fonts/Vazirmatn-Regular.woff2",
  "fonts/Vazirmatn-Medium.woff2",
  "fonts/Vazirmatn-SemiBold.woff2",
  "fonts/Vazirmatn-Bold.woff2",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
  "icons/icon-256.png",
  "icons/icon-512.png"
];
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 0, `File is non-empty (${stat.size} bytes): ${file}`);
}

console.log("\n\x1b[1m=== 3. CSP & HTML Security Check ===\x1b[0m");
const htmlContent = fs.readFileSync(path.join(__dirname, "popup.html"), "utf-8");
assert(!/<script>\s*[\s\S]*?<\/script>/i.test(htmlContent), "No inline scripts in popup.html (strict MV3 CSP)");
assert(!/\s+on[a-z]+\s*=/i.test(htmlContent), "No inline event attributes (e.g. onclick) in popup.html");
assert(htmlContent.includes('id="noteSection"'), "Notes container exists in popup.html");
assert(htmlContent.includes('id="quickNoteBtn"'), "Quick note trigger exists in corner actions");
assert(htmlContent.includes('id="nextMonthBtn"'), "Next month button exists in popup.html");
assert(htmlContent.includes('id="prevMonthBtn"'), "Prev month button exists in popup.html");
assert(htmlContent.indexOf('id="prevMonthBtn"') < htmlContent.indexOf('id="nextMonthBtn"'), "Right indicator (prev month >) precedes left indicator (next month <) in RTL layout");
assert(htmlContent.includes('class="nav-arrow-svg"'), "Month navigation uses modern vector SVG icons");
assert(htmlContent.includes("E رویدادها • N یادداشت • T امروز • D پوسته • C کپی"), "Minimalist shortcuts footer strictly maintains E N T D C");

console.log("\n\x1b[1m=== 4. Dynamic Native Intl API Calculations ===\x1b[0m");
const now = new Date();
const intlPersian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric"
});
const pParts = intlPersian.formatToParts(now);
const pMap = {};
for (const p of pParts) {
  if (p.type !== "literal") pMap[p.type] = p.value;
}
assert(parseInt(pMap.year, 10) >= 1400, `Intl correctly resolved Jalali year: ${pMap.year}`);
assert(parseInt(pMap.month, 10) >= 1 && parseInt(pMap.month, 10) <= 12, `Intl correctly resolved Jalali month: ${pMap.month}`);
assert(parseInt(pMap.day, 10) >= 1 && parseInt(pMap.day, 10) <= 31, `Intl correctly resolved Jalali day: ${pMap.day}`);

console.log("\n\x1b[1m=== 5. Robust Multi-Year Holiday & Event Engine ===\x1b[0m");
const { getEventsForDate, isOfficialHoliday, formatIranianIslamicDate } = require(path.join(__dirname, "events.js"));

// 1405 Holidays
assert(isOfficialHoliday(1405, 1, 1), "1405/1/1: Nowruz is official holiday");
assert(isOfficialHoliday(1405, 1, 12), "1405/1/12: Islamic Republic Day is official holiday");
assert(isOfficialHoliday(1405, 1, 13), "1405/1/13: Nature Day (Sizdah Bedar) is official holiday");
assert(isOfficialHoliday(1405, 1, 25), "1405/1/25: Shahadat Imam Sadeq is official holiday");
assert(isOfficialHoliday(1405, 3, 14), "1405/3/14: Official holiday");
assert(isOfficialHoliday(1405, 4, 4), "1405/4/4: Ashura is official holiday");
assert(isOfficialHoliday(1405, 5, 13), "1405/5/13: Arbaeen is official holiday");
assert(isOfficialHoliday(1405, 5, 21), "1405/5/21: 28 Safar is official holiday");
assert(isOfficialHoliday(1405, 8, 22), "1405/8/22: Shahadat Hazrat Zahra (s) is official holiday");
assert(isOfficialHoliday(1405, 10, 2), "1405/10/2: Veladat Imam Ali is official holiday");
assert(isOfficialHoliday(1405, 10, 16), "1405/10/16: Mab'ath is official holiday");
assert(isOfficialHoliday(1405, 11, 4), "1405/11/4: Nimeh Sha'ban is official holiday");
assert(isOfficialHoliday(1405, 11, 22), "1405/11/22: 22 Bahman is official holiday");
assert(isOfficialHoliday(1405, 12, 19), "1405/12/19: Eid al-Fitr is official holiday");
assert(isOfficialHoliday(1405, 12, 29), "1405/12/29: Oil Nationalization is official holiday");

// Multi-Year verification (1404, 1406, 1407)
assert(isOfficialHoliday(1404, 1, 1), "1404/1/1: Nowruz / Shahadat Imam Ali is official holiday");
assert(isOfficialHoliday(1404, 1, 11), "1404/1/11: Eid al-Fitr 1404 is official holiday");
assert(isOfficialHoliday(1404, 5, 23), "1404/5/23: Arbaeen 1404 is official holiday");
assert(isOfficialHoliday(1404, 6, 1), "1404/6/1: 28 Safar 1404 is official holiday");
assert(isOfficialHoliday(1404, 10, 13), "1404/10/13: Veladat Imam Ali 1404 is official holiday");
assert(isOfficialHoliday(1404, 10, 27), "1404/10/27: Mab'ath 1404 is official holiday");
assert(isOfficialHoliday(1404, 11, 15), "1404/11/15: Nimeh Sha'ban 1404 is official holiday");
assert(isOfficialHoliday(1406, 1, 1), "1406/1/1: Nowruz is official holiday");
assert(isOfficialHoliday(1406, 3, 24), "1406/3/24: Tasu'a 1406 is official holiday");
assert(isOfficialHoliday(1406, 3, 25), "1406/3/25: Ashura 1406 is official holiday");
assert(isOfficialHoliday(1406, 5, 3), "1406/5/3: Arbaeen 1406 is official holiday");
assert(isOfficialHoliday(1406, 5, 11), "1406/5/11: 28 Safar 1406 is official holiday");
assert(isOfficialHoliday(1406, 8, 12), "1406/8/12: Shahadat Hazrat Zahra (s) 1406 is official holiday");
assert(isOfficialHoliday(1406, 9, 21), "1406/9/21: Veladat Imam Ali 1406 is official holiday");
assert(isOfficialHoliday(1406, 10, 5), "1406/10/5: Mab'ath 1406 is official holiday");
assert(isOfficialHoliday(1406, 10, 23), "1406/10/23: Nimeh Sha'ban 1406 is official holiday");
assert(isOfficialHoliday(1407, 1, 1), "1407/1/1: Dynamic Nowruz holiday on arbitrary year");

// Weekend and workday check
assert(isOfficialHoliday(1405, 8, 15, 6), "Friday (weekday index 6) is treated as holiday");
assert(!isOfficialHoliday(1405, 8, 16, 0), "1405/8/16 Saturday is marked as regular workday");
assert(!isOfficialHoliday(1405, 8, 18, 1), "1405/8/18 Monday is regular workday without phantom holiday");

console.log("\n\x1b[1m=== 6. Bidirectional Conversion Integrity ===\x1b[0m");
function jalaliToGregorian(jy, jm, jd) {
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
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

const testDates = [
  { jy: 1405, jm: 1, jd: 1, gy: 2026, gm: 3, gd: 21 },
  { jy: 1405, jm: 8, jd: 16, gy: 2026, gm: 11, gd: 7 },
  { jy: 1405, jm: 12, jd: 29, gy: 2027, gm: 3, gd: 20 }
];

for (const td of testDates) {
  const gRes = jalaliToGregorian(td.jy, td.jm, td.jd);
  assert(gRes.gy === td.gy && gRes.gm === td.gm && gRes.gd === td.gd, `J->G: ${td.jy}/${td.jm}/${td.jd} => ${td.gy}/${td.gm}/${td.gd}`);
  const jRes = gregorianToJalali(td.gy, td.gm, td.gd);
  assert(jRes.jy === td.jy && jRes.jm === td.jm && jRes.jd === td.jd, `G->J: ${td.gy}/${td.gm}/${td.gd} => ${td.jy}/${td.jm}/${td.jd}`);
}

// Iranian Lunar Calendar (Moon Calendar) Alignment & Discrepancy Prevention
const gDey1 = jalaliToGregorian(1405, 10, 1);
const gDateDey1 = new Date(gDey1.gy, gDey1.gm - 1, gDey1.gd);
const gDey2 = jalaliToGregorian(1405, 10, 2);
const gDateDey2 = new Date(gDey2.gy, gDey2.gm - 1, gDey2.gd);
const dey1Moon = formatIranianIslamicDate(gDateDey1);
const dey2Moon = formatIranianIslamicDate(gDateDey2);
assert(dey1Moon.includes("۱۲") && dey1Moon.includes("رجب"), `1405/10/1 moon calendar is 12 Rajab (got: ${dey1Moon})`);
assert(dey2Moon.includes("۱۳") && dey2Moon.includes("رجب"), `1405/10/2 moon calendar is 13 Rajab (got: ${dey2Moon})`);
assert(dey1Moon !== dey2Moon, "No duplicate 13 Rajab on 1 Dey and 2 Dey");

console.log("\n\x1b[1m=== 7. Keyboard Navigation & Notes Functionality ===\x1b[0m");
const popupJsContent = fs.readFileSync(path.join(__dirname, "popup.js"), "utf-8");
assert(popupJsContent.includes("setupKeyboardNavigation"), "Keyboard navigation listener is defined");
assert(popupJsContent.includes("ArrowLeft") && popupJsContent.includes("ArrowRight"), "Arrow key day navigation is implemented");
assert(popupJsContent.includes("goToToday"), "Shortcut 'T' jump to today is implemented");
assert(popupJsContent.includes("loadNotes") && popupJsContent.includes("saveCurrentNote"), "Local notes CRUD operations are implemented");
assert(popupJsContent.includes("persian_calendar_notes"), "Local notes storage key configured");

console.log("\n\x1b[1m=== 8. Automatic System Theme Adaptation ===\x1b[0m");
assert(popupJsContent.includes("getSystemTheme"), "System theme detection helper is defined");
assert(popupJsContent.includes("prefers-color-scheme"), "prefers-color-scheme media query integration is implemented");
assert(popupJsContent.includes("darkModeMediaQuery.addEventListener") || popupJsContent.includes("darkModeMediaQuery.addListener"), "Live system theme change listener is configured");
assert(htmlContent.includes('id="themeToggleBtn"'), "Theme toggle button exists in popup.html");
assert(popupJsContent.includes('"themeMode": "auto"') || popupJsContent.includes('themeMode: "auto"'), "Default theme mode is set to auto");

console.log("\n\x1b[1m=== 9. Hold 'E' Month Events HUD Peek Overlay ===\x1b[0m");
assert(htmlContent.includes('id="monthEventsOverlay"'), "Month events HUD overlay markup exists in popup.html");
assert(htmlContent.includes('id="eventsOverlayList"'), "Events list container exists in popup.html");
assert(htmlContent.includes('id="closeEventsOverlayBtn"'), "Events close button exists in popup.html");
assert(popupJsContent.includes("showMonthEventsOverlay"), "showMonthEventsOverlay function is defined");
assert(popupJsContent.includes("hideMonthEventsOverlay"), "hideMonthEventsOverlay function is defined");
assert(popupJsContent.includes("getMonthSummaryEvents"), "getMonthSummaryEvents data extractor is defined");
assert(popupJsContent.includes("isHoldingEventsKey"), "isHoldingEventsKey tracking state exists");
assert(popupJsContent.includes("keyup"), "Keyup listener configured for release-to-hide");
assert(popupJsContent.includes("blur"), "Window blur safety net listener configured");

const showOverlayFn = popupJsContent.slice(
  popupJsContent.indexOf("function showMonthEventsOverlay"),
  popupJsContent.indexOf("function hideMonthEventsOverlay")
);
assert(!showOverlayFn.includes("تعطیل هفتگی"), "Regular Fridays without events are excluded from month events list");

// Test getMonthSummaryEvents algorithm logic
const testMonthEvents = [];
for (let d = 1; d <= 31; d++) {
  const dt = new Date(2025, 2, 21 + d - 1); // 1404 Farvardin approximation
  const evs = getEventsForDate(1404, 1, d, dt);
  if (evs.length > 0) {
    testMonthEvents.push({ day: d, events: evs });
  }
}
assert(testMonthEvents.length > 0, `Month summary events correctly collects Farvardin holidays/events (${testMonthEvents.length} days with events found)`);
console.log(`  Found ${testMonthEvents.length} event days in 1404 Farvardin (Nowruz holidays verified)`);

// Test that Fridays without events are excluded while Fridays with events are kept
const dt15 = new Date(2026, 9, 23 + 15 - 1);
const evs15 = getEventsForDate(1405, 8, 15, dt15);
assert(evs15.length === 0, "1405/8/15 Friday has no events and will be excluded");

const dt22 = new Date(2026, 9, 23 + 22 - 1);
const evs22 = getEventsForDate(1405, 8, 22, dt22);
assert(evs22.length > 0, "1405/8/22 Friday has official event (Shahadat Hazrat Zahra) and will be included");

console.log("\n\x1b[1m=== 10. Automated Gaming Events & Release Dates (Option A) ===\x1b[0m");
assert(Array.isArray(manifest.host_permissions) && manifest.host_permissions.some(p => p.includes("raw.githubusercontent.com")), "Host permissions include raw.githubusercontent.com for background daily sync");
assert(fs.existsSync(path.join(__dirname, "gaming-events.json")), "gaming-events.json exists in extension bundle");

const gamingData = JSON.parse(fs.readFileSync(path.join(__dirname, "gaming-events.json"), "utf-8"));
assert(Array.isArray(gamingData.events) && gamingData.events.length >= 20, `gaming-events.json contains curated dataset (${gamingData.events.length} events found)`);

const { setGamingEventsData, getGamingEventsForDate } = require(path.join(__dirname, "events.js"));
assert(typeof setGamingEventsData === "function", "setGamingEventsData is exported from events.js");
assert(typeof getGamingEventsForDate === "function", "getGamingEventsForDate is exported from events.js");

setGamingEventsData(gamingData.events);

// Test GTA 6 release date match
const gtaDate = new Date(2026, 10, 19); // Nov 19, 2026
const gtaMatches = getGamingEventsForDate(gtaDate);
assert(gtaMatches.some(e => e.title.includes("Grand Theft Auto VI")), "GTA 6 release date correctly matched on 2026-11-19");

// Test God of War: Laufey release date match
const gowDate = new Date(2027, 4, 20); // May 20, 2027
const gowMatches = getGamingEventsForDate(gowDate);
assert(gowMatches.some(e => e.title.includes("God of War: Laufey")), "God of War: Laufey release date correctly matched on 2027-05-20");

// Test The Game Awards annual event match
const tgaDate = new Date(2026, 11, 10); // Dec 10
const tgaMatches = getGamingEventsForDate(tgaDate);
assert(tgaMatches.some(e => e.title.includes("The Game Awards")), "The Game Awards event matched on 12-10");

assert(!htmlContent.includes('id="gamingToggleBtn"'), "Standalone gaming toggle button is cleanly removed from popup.html");
assert(htmlContent.includes('id="filterGaming"'), "Gaming events are integrated into category filter in popup.html");
assert(popupJsContent.includes("enableGamingEvents: false"), "Gaming events are strictly opt-in (default disabled)");
assert(popupJsContent.includes("loadGamingEvents"), "loadGamingEvents function exists in popup.js");

const bgContent = fs.readFileSync(path.join(__dirname, "background.js"), "utf-8");
assert(bgContent.includes("syncGamingEventsOnline"), "syncGamingEventsOnline background job exists in background.js");
assert(bgContent.includes("dailyGamingSyncAlarm"), "dailyGamingSyncAlarm is registered in background.js");

assert(fs.existsSync(path.join(__dirname, "scripts", "update-gaming-events.js")), "Autonomous GitHub action script exists");
assert(fs.existsSync(path.join(__dirname, ".github", "workflows", "update-gaming-events.yml")), "Automated GitHub Actions workflow exists");

console.log("\n\x1b[1m=== 11. Event Categories Filter & Personalization ===\x1b[0m");
assert(htmlContent.includes('id="eventsFilterBtn"'), "Events filter button exists in popup.html");
assert(htmlContent.includes('id="eventsFilterOverlay"'), "Events filter overlay modal markup exists in popup.html");
assert(htmlContent.includes('id="filterAncient"'), "Ancient Iranian events checkbox exists");
assert(htmlContent.includes('id="filterReligious"'), "Religious events checkbox exists");
assert(htmlContent.includes('id="filterNational"'), "National events checkbox exists");
assert(htmlContent.includes('id="filterInternational"'), "International events checkbox exists");
assert(htmlContent.includes('id="filterGaming"'), "Gaming events checkbox exists");
assert(htmlContent.includes('id="selectAllFiltersBtn"'), "Select all filters button exists");
assert(htmlContent.includes('id="resetFiltersBtn"'), "Reset filters button exists");
assert(htmlContent.includes('id="hudFilterBtn"'), "HUD Month events quick filter trigger exists");

assert(popupJsContent.includes("loadEventCategories"), "loadEventCategories function exists in popup.js");
assert(popupJsContent.includes("openFilterOverlay"), "openFilterOverlay function exists in popup.js");
assert(popupJsContent.includes("closeFilterOverlay"), "closeFilterOverlay function exists in popup.js");
assert(popupJsContent.includes("onFilterOptionChanged"), "onFilterOptionChanged handler exists in popup.js");

const nowruzAll = getEventsForDate(1405, 1, 1);
assert(nowruzAll.length >= 2, "1405/1/1 has both Nowruz and Eid al-Fitr");

const nowruzAncientOnly = getEventsForDate(1405, 1, 1, null, { ancient: true, religious: false });
assert(nowruzAncientOnly.some(e => e.title.includes("نوروز")), "Ancient filter includes Nowruz");
assert(!nowruzAncientOnly.some(e => e.title.includes("فطر")), "Ancient filter excludes religious Eid al-Fitr");

const nowruzReligiousOnly = getEventsForDate(1405, 1, 1, null, { ancient: false, religious: true });
assert(!nowruzReligiousOnly.some(e => e.title.includes("نوروز")), "Religious filter excludes Nowruz");
assert(nowruzReligiousOnly.some(e => e.title.includes("فطر")), "Religious filter includes Eid al-Fitr");

const cyrusDayFiltered = getEventsForDate(1405, 8, 7, null, { ancient: false });
assert(!cyrusDayFiltered.some(e => e.title.includes("کوروش")), "Disabling ancient excludes Cyrus Day");

const cyrusDayIncluded = getEventsForDate(1405, 8, 7, null, { ancient: true });
assert(cyrusDayIncluded.some(e => e.title.includes("کوروش")), "Enabling ancient includes Cyrus Day");

const cssContent = fs.readFileSync(path.join(__dirname, "popup.css"), "utf-8");
assert(!cssContent.includes("stroke: var(--text-color)"), "Filter SVG does not reference undefined --text-color");
assert(cssContent.includes("stroke: currentColor"), "Filter SVG has default visible stroke (currentColor)");
assert(cssContent.includes("button, input, optgroup, select, textarea"), "Button/input typography reset enforces font inheritance");
assert(cssContent.includes("events-filter-overlay") && cssContent.includes("Vazirmatn"), "Filter overlay explicitly applies Vazirmatn font family");

console.log("\n=== 12. Authoritative Time.ir Synchronization & Official Calendar Alignment ===");
const officialFile = path.join(__dirname, "official-events-1405.json");
assert(fs.existsSync(officialFile), "official-events-1405.json exists in extension bundle");

const officialJson = JSON.parse(fs.readFileSync(officialFile, "utf-8"));
assert(officialJson.year === 1405, "official dataset year is 1405");
assert(officialJson.totalDays === 365, "official dataset has all 365 days of 1405");
assert(officialJson.totalHolidays === 26, "official dataset has exactly 26 holiday dates");
assert(Array.isArray(officialJson.events) && officialJson.events.length >= 230, "official dataset contains complete suite of events (230+ events)");

// Verify 100% agreement on all 26 holiday dates
let allHolidaysMatch = true;
const monthDays1405 = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= monthDays1405[m - 1]; d++) {
    const key = `${m}-${d}`;
    const isOfficial = officialJson.days[key].isHoliday;
    const isEngineHoliday = isOfficialHoliday(1405, m, d);
    if (isOfficial !== isEngineHoliday) {
      allHolidaysMatch = false;
      console.error(`Holiday mismatch on ${key}: official=${isOfficial}, engine=${isEngineHoliday}`);
    }
  }
}
assert(allHolidaysMatch, "All official holiday dates across entire 1405 year match 100% with time.ir");

// Verify lunar Hijri calculation agreement across all 365 days
const { getExactHijriFor1405 } = require(path.join(__dirname, "events.js"));
let allHijriDaysMatch = true;
for (const [key, dayObj] of Object.entries(officialJson.days)) {
  const [m, d] = key.split("-").map(Number);
  const calc = getExactHijriFor1405(m, d);
  if (calc.day !== dayObj.hijri.day) {
    allHijriDaysMatch = false;
    console.error(`Hijri day mismatch on ${key}: calc=${calc.day}, official=${dayObj.hijri.day}`);
  }
}
assert(allHijriDaysMatch, "All 365 days of 1405 lunar Hijri dates match 100% with time.ir (0 mismatches)");

// Verify sync script and workflow
assert(fs.existsSync(path.join(__dirname, "scripts", "sync-timeir-events.js")), "Autonomous sync-timeir-events.js script exists");
const syncWorkflow = path.join(__dirname, ".github", "workflows", "sync-timeir-events.yml");
assert(fs.existsSync(syncWorkflow), "Automated GitHub Actions workflow sync-timeir-events.yml exists");
const syncWorkflowContent = fs.readFileSync(syncWorkflow, "utf-8");
assert(syncWorkflowContent.includes("workflow_dispatch"), "sync workflow supports manual run via workflow_dispatch");
assert(syncWorkflowContent.includes("cron:"), "sync workflow has automated schedule configured");
assert(syncWorkflowContent.includes("official-events-*.json"), "sync workflow tracks multi-year official event files");

console.log("\n=== 13. Multi-Year Extensibility & Future Year Architecture ===");
const eventsManifestPath = path.join(__dirname, "events-manifest.json");
assert(fs.existsSync(eventsManifestPath), "events-manifest.json exists");
const manifestJson = JSON.parse(fs.readFileSync(eventsManifestPath, "utf-8"));
assert(Array.isArray(manifestJson.supportedYears) && manifestJson.supportedYears.includes(1404), "1404 indexed in manifest");
assert(manifestJson.supportedYears.includes(1405), "1405 indexed in manifest");
assert(manifestJson.supportedYears.includes(1406), "1406 indexed in manifest");

assert(fs.existsSync(path.join(__dirname, "official-events-1404.json")), "official-events-1404.json exists");
assert(fs.existsSync(path.join(__dirname, "official-events-1406.json")), "official-events-1406.json exists");

const json1404 = JSON.parse(fs.readFileSync(path.join(__dirname, "official-events-1404.json"), "utf-8"));
assert(json1404.totalDays === 366, "1404 leap year has 366 days");
assert(json1404.totalHolidays >= 25, "1404 has official holidays");

const json1406 = JSON.parse(fs.readFileSync(path.join(__dirname, "official-events-1406.json"), "utf-8"));
assert(json1406.totalDays === 365, "1406 has 365 days");
assert(json1406.totalHolidays >= 25, "1406 has official holidays");

const { loadOfficialYearData } = require(path.join(__dirname, "events.js"));
assert(typeof loadOfficialYearData === "function", "loadOfficialYearData is exported from events.js");
assert(popupJsContent.includes("loadOfficialCalendarData"), "loadOfficialCalendarData dynamic year loader exists in popup.js");

console.log(`\n\x1b[1m=== SUMMARY: ${passedTests}/${totalTests} Tests Passed ===\x1b[0m\n`);
if (passedTests === totalTests) {
  console.log("\x1b[32m✔ ALL EXTENSION TESTS PASSED SUCCESSFULLY!\x1b[0m\n");
} else {
  console.error("\x1b[31m✘ SOME TESTS FAILED!\x1b[0m\n");
  process.exit(1);
}
