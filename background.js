/**
 * background.js - High-DPI Dynamic Toolbar Icon Generator
 * Renders crisp, clean, high-contrast calendar tile with Persian day number
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Convert Latin digits to Persian digits
function toPersianDigits(str) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
}

/**
 * Load offline Vazirmatn font into background execution environment
 */
let fontLoaded = false;
async function ensureFontLoaded() {
  if (fontLoaded) return;
  try {
    if (typeof FontFace !== "undefined") {
      const font = new FontFace("Vazirmatn", "url(fonts/Vazirmatn-Bold.woff2)", {
        weight: "700"
      });
      await font.load();
      if (typeof self !== "undefined" && self.fonts) {
        self.fonts.add(font);
      } else if (typeof document !== "undefined" && document.fonts) {
        document.fonts.add(font);
      }
      fontLoaded = true;
    }
  } catch (e) {
    console.warn("Could not load custom font in background, using system fallback:", e);
  }
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
 * Draw rounded rectangle helper
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
 * Renders a pixel-perfect, clean, high-contrast calendar tile icon at specific size
 */
function renderTileIcon(size, dayText, isHoliday) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 1. Clear
  ctx.clearRect(0, 0, size, size);

  // Geometry
  const pad = size === 16 ? 0.5 : (size === 32 ? 1 : 2);
  const w = size - pad * 2;
  const h = size - pad * 2;
  const radius = size === 16 ? 2.5 : (size === 32 ? 5 : 10);
  const headerHeight = Math.round(size * 0.28);

  // 2. Base Calendar Card (Clean high-contrast White #ffffff)
  // Ensures 100% visibility on both dark and light browser toolbars
  ctx.save();
  drawRoundRect(ctx, pad, pad, w, h, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Subtle boundary border for light toolbars
  ctx.lineWidth = size === 16 ? 0.75 : (size === 32 ? 1.2 : 2);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
  ctx.stroke();
  ctx.clip(); // Clip to the rounded calendar boundary

  // 3. Top Header Bar (Crimson Red for holiday/Friday, Indigo for regular days)
  ctx.fillStyle = isHoliday ? "#e11d48" : "#4f46e5";
  ctx.fillRect(pad, pad, w, headerHeight);

  // Header separator line
  ctx.fillStyle = isHoliday ? "#be123c" : "#4338ca";
  ctx.fillRect(pad, pad + headerHeight - (size <= 32 ? 0.75 : 1.5), w, size <= 32 ? 0.75 : 1.5);

  ctx.restore();

  // 4. Day Number Text (Bold, razor-sharp, high-contrast)
  const bodyCenterY = pad + headerHeight + (h - headerHeight) / 2;
  const centerX = size / 2;

  // Font setup with sizes tuned for optical clarity
  let fontSize, fontOffset;
  if (size === 16) {
    fontSize = dayText.length > 1 ? 9.5 : 10.5;
    fontOffset = 0.5;
  } else if (size === 32) {
    fontSize = dayText.length > 1 ? 19 : 21;
    fontOffset = 1.0;
  } else {
    fontSize = dayText.length > 1 ? 38 : 42;
    fontOffset = 2.0;
  }

  // Red text on holiday, deep dark slate #0f172a on regular days for max contrast
  ctx.fillStyle = isHoliday ? "#dc2626" : "#0f172a";
  ctx.font = `bold ${fontSize}px "Vazirmatn", "Tahoma", "Arial", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(dayText, centerX, bodyCenterY + fontOffset);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Updates the extension toolbar action icon with native 16, 32, and 64 resolutions
 */
async function updateDynamicIcon() {
  try {
    await ensureFontLoaded();
    const { dayFa, isHoliday } = getTodayInfo();

    if (typeof OffscreenCanvas !== "undefined") {
      const img16 = renderTileIcon(16, dayFa, isHoliday);
      const img32 = renderTileIcon(32, dayFa, isHoliday);
      const img64 = renderTileIcon(64, dayFa, isHoliday);

      await browserAPI.action.setIcon({
        imageData: {
          16: img16,
          32: img32,
          64: img64
        }
      });
    }
  } catch (err) {
    console.warn("Failed to set dynamic toolbar icon:", err);
  }
}

// 1. Lifecycle: On Installed
browserAPI.runtime.onInstalled.addListener(() => {
  updateDynamicIcon();
  browserAPI.alarms.create("hourlyIconAlarm", { periodInMinutes: 60 });
});

// 2. Lifecycle: On Startup
browserAPI.runtime.onStartup.addListener(() => {
  updateDynamicIcon();
  browserAPI.alarms.create("hourlyIconAlarm", { periodInMinutes: 60 });
});

// 3. Hourly Alarm Trigger
browserAPI.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "hourlyIconAlarm") {
    updateDynamicIcon();
  }
});

// 4. Message Listener (from popup)
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "updateIcon") {
    updateDynamicIcon();
    sendResponse({ success: true });
  }
});
