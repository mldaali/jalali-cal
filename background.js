/**
 * background.js - Dynamic Canvas-based Toolbar Icon Generator
 * Renders high-DPI 64x64 rounded rectangle icon with Persian day number
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Helper: Convert digits to Persian
function toPersianDigits(str) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
}

/**
 * Get current Jalali day, weekday, and holiday status
 */
function getTodayInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const parts = formatter.formatToParts(now);
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const weekdayIndex = (now.getDay() + 1) % 7; // 0=Saturday ... 6=Friday
  const isFriday = weekdayIndex === 6;

  // Check holiday status from events.js
  let holiday = isFriday;
  if (typeof isOfficialHoliday === "function") {
    holiday = isOfficialHoliday(year, month, day, weekdayIndex, now);
  }

  return {
    day,
    dayFa: toPersianDigits(day),
    isHoliday: holiday
  };
}

/**
 * Draws rounded rectangle path on Canvas
 */
function drawRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Dynamically generate a 64x64 icon ImageData
 */
function generateDynamicIconData(dayText, isHoliday) {
  const size = 64;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 1. Clear Canvas
  ctx.clearRect(0, 0, size, size);

  // 2. Rounded Rectangle Background (Catppuccin aesthetic)
  const radius = 14;
  const pad = 3;
  drawRoundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, radius);

  // Background color
  ctx.fillStyle = isHoliday ? "#281822" : "#1e1e2e";
  ctx.fill();

  // Subtle accent border
  ctx.lineWidth = 3;
  ctx.strokeStyle = isHoliday ? "#f38ba8" : "#cba6f7";
  ctx.stroke();

  // 3. Persian Day Number (Centered, bold)
  ctx.fillStyle = isHoliday ? "#f38ba8" : "#ffffff";
  ctx.font = 'bold 36px "Vazirmatn", -apple-system, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Center alignment with optical vertical nudge
  ctx.fillText(dayText, size / 2, size / 2 + 2);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Updates the extension toolbar action icon
 */
async function updateDynamicIcon() {
  try {
    const { dayFa, isHoliday } = getTodayInfo();

    if (typeof OffscreenCanvas !== "undefined") {
      const imageData = generateDynamicIconData(dayFa, isHoliday);
      await browserAPI.action.setIcon({
        imageData: { 64: imageData }
      });
    }
  } catch (err) {
    console.warn("Failed to set dynamic toolbar icon:", err);
  }
}

// 1. Lifecycle: On Installed
browserAPI.runtime.onInstalled.addListener(() => {
  updateDynamicIcon();
  browserAPI.alarms.create("hourlyIconAlarm", {
    periodInMinutes: 60
  });
});

// 2. Lifecycle: On Startup
browserAPI.runtime.onStartup.addListener(() => {
  updateDynamicIcon();
  browserAPI.alarms.create("hourlyIconAlarm", {
    periodInMinutes: 60
  });
});

// 3. Hourly Alarm Trigger
browserAPI.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "hourlyIconAlarm") {
    updateDynamicIcon();
  }
});

// 4. Message Listener (e.g. from popup refresh or open)
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "updateIcon") {
    updateDynamicIcon();
    sendResponse({ success: true });
  }
});
