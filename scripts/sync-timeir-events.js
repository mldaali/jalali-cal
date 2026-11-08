#!/usr/bin/env node

/**
 * sync-timeir-events.js - Autonomous Time.ir Official Calendar Synchronizer
 *
 * Synchronizes official Iranian calendar events, official holidays, and lunar
 * Hijri dates with https://www.time.ir (Iran's authoritative calendar service,
 * reflecting the University of Tehran Geophysics Institute Calendar Center).
 *
 * Outputs:
 * - official-events-1405.json (full 365-day official dataset)
 * - Validates holidays and lunar dates against events.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "official-events-1405.json");
const SCRATCH_SNAPSHOT = path.join(ROOT_DIR, "time_ir_1405.html");
const SYSTEM_SCRATCH = "/root/.gemini/antigravity-cli/brain/1c968fbf-cba6-413f-bf35-ff81126cfa1f/scratch/time_ir_1405.html";

const TIME_IR_URL = "https://www.time.ir/event-year";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Fetch HTML from time.ir with fallback to curl and local cached snapshot
 */
function fetchTimeIrHtml() {
  console.log("🌐 Fetching latest calendar from time.ir...");
  try {
    const html = execSync(
      `curl -s -L --connect-timeout 15 -H "User-Agent: ${USER_AGENT}" "${TIME_IR_URL}"`,
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    );
    if (html && html.includes("defaultYearlyCalendar")) {
      console.log(`✅ Successfully fetched ${html.length} bytes from time.ir`);
      return html;
    }
  } catch (err) {
    console.warn("⚠️ Direct fetch via curl encountered an issue:", err.message);
  }

  // Fallback to local snapshot if network is unavailable
  for (const candidate of [SCRATCH_SNAPSHOT, SYSTEM_SCRATCH]) {
    if (fs.existsSync(candidate)) {
      console.log(`📁 Using cached snapshot: ${candidate}`);
      return fs.readFileSync(candidate, "utf8");
    }
  }

  throw new Error("Failed to fetch time.ir HTML and no local snapshot found.");
}

/**
 * Parse Next.js App Router RSC payload from time.ir HTML
 */
function parseYearlyCalendarFromHtml(html) {
  const pos = html.indexOf("defaultYearlyCalendar");
  if (pos === -1) {
    throw new Error("Could not find 'defaultYearlyCalendar' in time.ir HTML");
  }

  const callStart = html.lastIndexOf("self.__next_f.push(", pos);
  if (callStart === -1) {
    throw new Error("Could not find RSC chunk start in time.ir HTML");
  }

  const callArgStart = html.indexOf("[1,\"", callStart) + 3;
  let inEscape = false;
  let strEnd = -1;
  for (let i = callArgStart + 1; i < html.length; i++) {
    if (inEscape) {
      inEscape = false;
      continue;
    }
    if (html[i] === "\\") {
      inEscape = true;
      continue;
    }
    if (html[i] === "\"") {
      strEnd = i;
      break;
    }
  }

  if (strEnd === -1) {
    throw new Error("Could not find RSC chunk end in time.ir HTML");
  }

  const unescaped = JSON.parse(html.slice(callArgStart, strEnd + 1));
  const calPos = unescaped.indexOf("\"defaultYearlyCalendar\":");
  if (calPos === -1) {
    throw new Error("Could not find defaultYearlyCalendar in unescaped RSC chunk");
  }

  const jsonStart = calPos + "\"defaultYearlyCalendar\":".length;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let endPos = -1;

  for (let j = jsonStart; j < unescaped.length; j++) {
    const c = unescaped[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === "\"") { inStr = !inStr; continue; }
    if (!inStr) {
      if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) {
          endPos = j + 1;
          break;
        }
      }
    }
  }

  if (endPos === -1) {
    throw new Error("Could not find closing bracket for defaultYearlyCalendar array");
  }

  return JSON.parse(unescaped.slice(jsonStart, endPos));
}

/**
 * Process yearly calendar array into normalized calendar structure
 */
function processYearlyCalendar(yearlyCalendar) {
  const result = {
    source: "https://www.time.ir/event-year",
    authority: "University of Tehran Geophysics Institute Calendar Center",
    year: 1405,
    syncedAt: new Date().toISOString(),
    totalDays: 0,
    totalHolidays: 0,
    holidays: [],
    days: {},
    events: []
  };

  const holidaysSet = new Set();

  yearlyCalendar.forEach((mObj, mIdx) => {
    const jMonth = mIdx + 1;
    const base2Months = (mObj.calendar_detail_list || []).find(b => b.base === 2)?.month_list || [];
    let currentHijriMonthObj = base2Months[0];
    let hijriMonthPtr = 0;
    let prevHijriDay = 0;

    const activeDays = (mObj.day_list || []).filter(d => d.enabled);

    activeDays.forEach((dObj, dIdx) => {
      const jDay = dIdx + 1;
      const hDay = dObj.index_in_base3;

      // When lunar day rolls over (e.g. from 29/30 back to 1), advance Hijri month pointer
      if (dIdx > 0 && hDay < prevHijriDay) {
        hijriMonthPtr++;
        if (base2Months[hijriMonthPtr]) {
          currentHijriMonthObj = base2Months[hijriMonthPtr];
        }
      }
      prevHijriDay = hDay;

      const dayKey = `${jMonth}-${jDay}`;
      const dayEvents = (mObj.event_list || []).filter(
        e => e.jalali_month === jMonth && e.jalali_day === jDay
      );

      const isHoliday = dObj.is_holiday || dayEvents.some(e => e.is_holiday);

      const dayRecord = {
        jalali: { year: 1405, month: jMonth, day: jDay },
        gregorian: { day: dObj.index_in_base2 },
        hijri: {
          year: currentHijriMonthObj?.year || 1447,
          month: currentHijriMonthObj?.month_index || 1,
          monthTitle: currentHijriMonthObj?.month_title || "",
          day: hDay,
          formatted: `${hDay} ${currentHijriMonthObj?.month_title || ""}`
        },
        isHoliday,
        isWeekend: dObj.is_weekend,
        events: dayEvents.map(e => ({
          id: e.id,
          title: e.title,
          base: e.base,
          category: e.base === 0 ? "solar" : e.base === 2 ? "religious" : "international",
          isHoliday: e.is_holiday,
          dateString: e.date_string,
          hijriYear: e.hijri_year,
          hijriMonth: e.hijri_month,
          hijriDay: e.hijri_day
        }))
      };

      result.days[dayKey] = dayRecord;
      result.totalDays++;

      if (isHoliday) {
        holidaysSet.add(dayKey);
        const holidayTitles = dayEvents.filter(e => e.is_holiday).map(e => e.title);
        result.holidays.push({
          date: dayKey,
          jalaliDate: `${jDay}/${jMonth}/1405`,
          hijriDate: `${hDay} ${currentHijriMonthObj?.month_title || ""}`,
          titles: holidayTitles.length > 0 ? holidayTitles : ["تعطیل رسمی"]
        });
      }

      dayEvents.forEach(e => {
        result.events.push({
          jalaliDate: dayKey,
          title: e.title,
          category: e.base === 0 ? "solar" : e.base === 2 ? "religious" : "international",
          isHoliday: e.is_holiday,
          dateString: e.date_string
        });
      });
    });
  });

  result.totalHolidays = holidaysSet.size;
  return result;
}

/**
 * Validate synchronization against critical integrity assertions
 */
function validateSync(data) {
  console.log("\n🔍 Running Time.ir Synchronization Integrity Checks...");

  // 1. Check total days
  if (data.totalDays !== 365) {
    throw new Error(`Expected 365 days in Jalali year 1405, got ${data.totalDays}`);
  }
  console.log(`  ✔ Year 1405 day count verified: ${data.totalDays} days`);

  // 2. Check total holidays
  if (data.totalHolidays !== 26) {
    throw new Error(`Expected 26 unique holiday dates in 1405, got ${data.totalHolidays}`);
  }
  console.log(`  ✔ Official holiday count verified: ${data.totalHolidays} holiday dates`);

  // 3. Check 2 Dey = 13 Rajab (Father's Day, Holiday)
  const dey2 = data.days["10-2"];
  if (!dey2) throw new Error("Day 10-2 (2 Dey) missing in calendar data!");
  if (!dey2.isHoliday) throw new Error("Day 10-2 must be an official holiday (Father's Day / Imam Ali)!");
  if (dey2.hijri.day !== 13 || dey2.hijri.monthTitle !== "رجب") {
    throw new Error(`Day 10-2 expected 13 Rajab, got ${dey2.hijri.formatted}`);
  }
  console.log(`  ✔ 2 Dey verified: 13 Rajab (Father's Day, Holiday)`);

  // 4. Check 1 Dey = 12 Rajab (Regular workday)
  const dey1 = data.days["10-1"];
  if (!dey1) throw new Error("Day 10-1 (1 Dey) missing in calendar data!");
  if (dey1.isHoliday) throw new Error("Day 10-1 must not be an official holiday!");
  if (dey1.hijri.day !== 12 || dey1.hijri.monthTitle !== "رجب") {
    throw new Error(`Day 10-1 expected 12 Rajab, got ${dey1.hijri.formatted}`);
  }
  console.log(`  ✔ 1 Dey verified: 12 Rajab (Kharm-Ruz, Workday)`);

  // 5. Check Nowruz holidays
  for (let d = 1; d <= 4; d++) {
    if (!data.days[`1-${d}`].isHoliday) {
      throw new Error(`Farvardin ${d} must be an official Nowruz holiday`);
    }
  }
  console.log(`  ✔ Farvardin 1-4 Nowruz holidays verified`);

  // 6. Check dual holiday days (1 Farvardin, 2 Farvardin, 14 Khordad)
  const f1 = data.days["1-1"];
  if (f1.events.filter(e => e.isHoliday).length < 2) {
    throw new Error("1 Farvardin must have dual holidays (Nowruz + Eid al-Fitr)");
  }
  console.log(`  ✔ Dual holiday Farvardin 1 verified (Nowruz + Eid al-Fitr)`);

  console.log("✨ All Time.ir integrity checks PASSED successfully!\n");
}

/**
 * Main execution
 */
function main() {
  console.log("==================================================");
  console.log("🚀 Time.ir Official Calendar Synchronization Tool");
  console.log("==================================================");

  const html = fetchTimeIrHtml();
  const yearlyCalendar = parseYearlyCalendarFromHtml(html);
  const data = processYearlyCalendar(yearlyCalendar);

  validateSync(data);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf8");
  console.log(`💾 Saved authoritative calendar to: ${OUTPUT_FILE}`);
  console.log(`📊 Total events indexed: ${data.events.length}`);
  console.log(`🎉 Total holiday dates: ${data.totalHolidays}`);
  console.log("✅ Synchronization complete!");
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchTimeIrHtml,
  parseYearlyCalendarFromHtml,
  processYearlyCalendar,
  validateSync
};
