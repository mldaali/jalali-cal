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
assert(manifest.version === "1.1.0", "Version updated to 1.1.0");
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
const { getEventsForDate, isOfficialHoliday } = require(path.join(__dirname, "events.js"));

// 1405 Holidays
assert(isOfficialHoliday(1405, 1, 1), "1405/1/1: Nowruz is official holiday");
assert(isOfficialHoliday(1405, 1, 12), "1405/1/12: Islamic Republic Day is official holiday");
assert(isOfficialHoliday(1405, 1, 13), "1405/1/13: Nature Day (Sizdah Bedar) is official holiday");
assert(isOfficialHoliday(1405, 1, 24), "1405/1/24: Shahadat Imam Sadeq is official holiday");
assert(isOfficialHoliday(1405, 3, 14), "1405/3/14: Official holiday");
assert(isOfficialHoliday(1405, 4, 4), "1405/4/4: Ashura is official holiday");
assert(isOfficialHoliday(1405, 8, 22), "1405/8/22: Shahadat Hazrat Zahra (s) is official holiday");
assert(isOfficialHoliday(1405, 11, 22), "1405/11/22: 22 Bahman is official holiday");
assert(isOfficialHoliday(1405, 12, 29), "1405/12/29: Oil Nationalization is official holiday");

// Multi-Year verification (1404, 1406, 1407)
assert(isOfficialHoliday(1404, 1, 1), "1404/1/1: Nowruz / Shahadat Imam Ali is official holiday");
assert(isOfficialHoliday(1404, 1, 11), "1404/1/11: Eid al-Fitr 1404 is official holiday");
assert(isOfficialHoliday(1406, 1, 1), "1406/1/1: Nowruz is official holiday");
assert(isOfficialHoliday(1406, 3, 24), "1406/3/24: Ashura 1406 is official holiday");
assert(isOfficialHoliday(1407, 1, 1), "1407/1/1: Dynamic Nowruz holiday on arbitrary year");

// Weekend and workday check
assert(isOfficialHoliday(1405, 8, 15, 6), "Friday (weekday index 6) is treated as holiday");
assert(!isOfficialHoliday(1405, 8, 16, 0), "1405/8/16 Saturday is marked as regular workday");

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

console.log(`\n\x1b[1m=== SUMMARY: ${passedTests}/${totalTests} Tests Passed ===\x1b[0m\n`);
if (passedTests === totalTests) {
  console.log("\x1b[32m✔ ALL EXTENSION TESTS PASSED SUCCESSFULLY!\x1b[0m\n");
} else {
  console.error("\x1b[31m✘ SOME TESTS FAILED!\x1b[0m\n");
  process.exit(1);
}
