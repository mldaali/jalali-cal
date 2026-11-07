/**
 * background.js - Firefox MV3 Background Service Script
 * Manages periodic alarms, dynamic Jalali badge updates, and extension state.
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Convert Latin digits to Persian digits
function toPersianDigits(str) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
}

/**
 * Calculate current Jalali day using native JavaScript Intl API
 * @returns {{ day: number, dayFa: string, isFriday: boolean }}
 */
function getCurrentJalaliInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    day: "numeric"
  });
  const parts = formatter.formatToParts(now);
  const dayPart = parts.find(p => p.type === "day");
  const day = dayPart ? parseInt(dayPart.value, 10) : now.getDate();
  const isFriday = now.getDay() === 5; // Friday is index 5 in JS Date
  
  return {
    day,
    dayFa: toPersianDigits(day),
    isFriday
  };
}

/**
 * Updates the action badge with today's Jalali day
 */
async function updateExtensionBadge() {
  try {
    // Check storage preference
    let showBadge = true;
    if (browserAPI.storage && browserAPI.storage.local) {
      const data = await browserAPI.storage.local.get("showBadge");
      if (typeof data.showBadge === "boolean") {
        showBadge = data.showBadge;
      }
    }

    if (!showBadge) {
      await browserAPI.action.setBadgeText({ text: "" });
      return;
    }

    const { dayFa, isFriday } = getCurrentJalaliInfo();

    // Set badge text (e.g. "۱۶")
    await browserAPI.action.setBadgeText({ text: dayFa });

    // Set badge background color (Crimson for Friday/Holiday, Slate Blue for regular days)
    const color = isFriday ? "#dc2626" : "#2563eb";
    await browserAPI.action.setBadgeBackgroundColor({ color });
  } catch (err) {
    console.error("Failed to update extension badge:", err);
  }
}

// Setup alarms on installation or startup
browserAPI.runtime.onInstalled.addListener(() => {
  updateExtensionBadge();
  browserAPI.alarms.create("jalaliBadgeAlarm", {
    periodInMinutes: 30
  });
});

browserAPI.runtime.onStartup.addListener(() => {
  updateExtensionBadge();
  browserAPI.alarms.create("jalaliBadgeAlarm", {
    periodInMinutes: 30
  });
});

// Alarm trigger
browserAPI.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "jalaliBadgeAlarm") {
    updateExtensionBadge();
  }
});

// Message listener from popup (e.g. when user changes settings)
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "updateBadge") {
    updateExtensionBadge();
    sendResponse({ success: true });
  }
});
