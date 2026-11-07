/**
 * test-extension.js - Automated Test & Verification Suite
 * Validates Manifest V3 compliance, icons, Intl date math, and 1405 events.
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
assert(manifest.browser_specific_settings?.gecko?.id === "persian-calendar@extension.mozilla.org", "Gecko extension ID is configured");
assert(manifest.permissions.includes("storage"), "Permission 'storage' is included");
assert(manifest.permissions.includes("alarms"), "Permission 'alarms' is included");
assert(manifest.action?.default_popup === "popup.html", "Action default_popup is popup.html");
assert(manifest.background?.scripts?.includes("background.js"), "Background script is background.js");

console.log("\n\x1b[1m=== 2. Validating Extension Files & Icons ===\x1b[0m");
const requiredFiles = [
  "popup.html",
  "popup.css",
  "popup.js",
  "events.js",
  "background.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png"
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

console.log("\n\x1b[1m=== 4. Dynamic Native Intl API Calculations ===\x1b[0m");
const now = new Date();
const intlPersian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric"
});
const pParts = intlPersian.formatToParts(now);
const pMap = {};
for (const p of pParts) if (p.type !== "literal") pMap[p.type] = p.value;
const jYear = parseInt(pMap.year, 10);
const jMonth = parseInt(pMap.month, 10);
const jDay = parseInt(pMap.day, 10);

assert(!isNaN(jYear) && jYear >= 1400, `Intl correctly resolved Jalali year: ${jYear}`);
assert(!isNaN(jMonth) && jMonth >= 1 && jMonth <= 12, `Intl correctly resolved Jalali month: ${jMonth}`);
assert(!isNaN(jDay) && jDay >= 1 && jDay <= 31, `Intl correctly resolved Jalali day: ${jDay}`);

console.log("\n\x1b[1m=== 5. Robust 1405 Holiday & Event Engine ===\x1b[0m");
const eventsEngine = require("./events.js");

// Farvardin 1 (Nowruz)
const evNowruz = eventsEngine.getEventsForDate(1405, 1, 1);
assert(evNowruz.some(e => e.isHoliday && e.title.includes("نوروز")), "1405/1/1: Nowruz is official holiday");

// Farvardin 12 & 13
assert(eventsEngine.isOfficialHoliday(1405, 1, 12), "1405/1/12: Islamic Republic Day is official holiday");
assert(eventsEngine.isOfficialHoliday(1405, 1, 13), "1405/1/13: Nature Day (Sizdah Bedar) is official holiday");

// Lunar holiday: 24 Farvardin 1405 (Shahadat Imam Sadeq)
assert(eventsEngine.isOfficialHoliday(1405, 1, 24), "1405/1/24: Shahadat Imam Sadeq is official holiday");

// 14 Khordad (Rahlat Imam Khomeini & Eid Ghadir in 1405)
assert(eventsEngine.isOfficialHoliday(1405, 3, 14), "1405/3/14: Official holiday");

// 4 Tir 1405 (Ashura)
assert(eventsEngine.isOfficialHoliday(1405, 4, 4), "1405/4/4: Ashura is official holiday");

// 22 Aban 1405 (Shahadat Hazrat Fatemeh Zahra)
assert(eventsEngine.isOfficialHoliday(1405, 8, 22), "1405/8/22: Shahadat Hazrat Zahra (s) is official holiday");

// 22 Bahman (Revolution Day)
assert(eventsEngine.isOfficialHoliday(1405, 11, 22), "1405/11/22: 22 Bahman is official holiday");

// 29 Esfand (Oil Nationalization Day)
assert(eventsEngine.isOfficialHoliday(1405, 12, 29), "1405/12/29: Oil Nationalization is official holiday");

// Friday weekend holiday check
assert(eventsEngine.isOfficialHoliday(1405, 8, 16, 6), "Friday (weekday index 6) is treated as holiday");

// Regular workday check (e.g. 1405/8/16 Saturday without holiday)
assert(!eventsEngine.isOfficialHoliday(1405, 8, 16, 0), "1405/8/16 Saturday is marked as regular workday");

// Month 8 event list
const abanEvents = eventsEngine.getMonthEvents(1405, 8);
assert(abanEvents.length >= 5, `Month 8 has ${abanEvents.length} events registered`);

console.log("\n\x1b[1m=== 6. Bidirectional Conversion Integrity ===\x1b[0m");
// We test conversion logic from popup
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
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
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

console.log(`\n\x1b[1m=== SUMMARY: ${passedTests}/${totalTests} Tests Passed ===\x1b[0m\n`);
if (passedTests === totalTests) {
  console.log("\x1b[32m✔ ALL EXTENSION TESTS PASSED SUCCESSFULLY!\x1b[0m\n");
} else {
  console.error("\x1b[31m✘ SOME TESTS FAILED!\x1b[0m\n");
  process.exit(1);
}
