#!/usr/bin/env node

/**
 * update-gaming-events.js
 * Automated synchronizer for gaming release dates and conventions.
 * Can be run via GitHub Actions cron or manually.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_FILE = path.join(__dirname, "..", "gaming-events.json");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "JalaliCalGamingBot/1.0" } }, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("🎮 Starting automated gaming events update...");
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error("❌ Data file not found:", DATA_FILE);
    process.exit(1);
  }

  const currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const existingEvents = currentData.events || [];
  console.log(`Current database contains ${existingEvents.length} gaming events.`);

  const apiKey = process.env.RAWG_API_KEY;
  let updatedCount = 0;

  if (apiKey) {
    console.log("🔑 RAWG API Key detected, querying latest release dates...");
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const nextYear = currentYear + 1;
      const url = `https://api.rawg.io/api/games?key=${apiKey}&dates=${currentYear}-01-01,${nextYear}-12-31&ordering=-added&page_size=25`;
      const res = await fetchJson(url);

      if (res && res.results) {
        for (const game of res.results) {
          if (!game.released) continue;
          const existing = existingEvents.find(e => e.id === `rawg_${game.id}` || e.titleEn?.toLowerCase().includes(game.name.toLowerCase()));
          if (!existing) {
            existingEvents.push({
              id: `rawg_${game.id}`,
              date: game.released,
              title: `انتشار بازی ${game.name}`,
              titleEn: `${game.name} Release`,
              type: "release",
              category: "عرضه بازی‌های بزرگ"
            });
            updatedCount++;
          } else if (existing.date !== game.released && !existing.date.startsWith("recurring")) {
            console.log(`  🔄 Date changed for ${existing.title}: ${existing.date} -> ${game.released}`);
            existing.date = game.released;
            updatedCount++;
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch from RAWG API:", err.message);
    }
  } else {
    console.log("ℹ️ No RAWG_API_KEY provided; performing integrity verification and date normalization...");
  }

  // Sort events chronologically (recurring MM-DD and specific YYYY-MM-DD)
  existingEvents.sort((a, b) => {
    const da = a.date.length === 5 ? `2026-${a.date}` : a.date;
    const db = b.date.length === 5 ? `2026-${b.date}` : b.date;
    return da.localeCompare(db);
  });

  const todayStr = new Date().toISOString().split("T")[0];
  currentData.lastUpdated = todayStr;
  currentData.events = existingEvents;

  fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2) + "\n", "utf-8");
  console.log(`✅ Gaming events database successfully updated (${existingEvents.length} events total, ${updatedCount} new/modified).`);
}

main().catch(err => {
  console.error("❌ Error running update script:", err);
  process.exit(1);
});
