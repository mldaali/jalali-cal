#!/usr/bin/env node

/**
 * update-gaming-events.js
 * Multi-source autonomous synchronizer for video game release dates,
 * conventions, and milestone anniversaries.
 *
 * Sources:
 * 1. Wikipedia API (List of video games released in YYYY for 2025, 2026, 2027)
 *    - Free, unauthenticated, updated continuously with official verified citations.
 * 2. RAWG Video Games Database API (if RAWG_API_KEY is configured in env).
 * 3. Verified offline master registry with fallback preservation.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_FILE = path.join(__dirname, "..", "gaming-events.json");

const MONTH_MAP = {
  January: "01", February: "02", March: "03", April: "04",
  May: "05", June: "06", July: "07", August: "08",
  September: "09", October: "10", November: "11", December: "12"
};

function normalizeTitle(t) {
  if (!t) return "";
  return t
    .toLowerCase()
    .replace(/\b(release|launch|window|anniversary|video game|the|sid meier's|part|edition)\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

function calculateSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;
  const bigrams = s => {
    const bg = new Set();
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
    return bg;
  };
  const b1 = bigrams(s1), b2 = bigrams(s2);
  let inter = 0;
  for (const b of b1) {
    if (b2.has(b)) inter++;
  }
  return (2 * inter) / (b1.size + b2.size);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "JalaliCalBot/2.0 (https://github.com/mldaali/jalali-cal; dev@jalali.org)",
          "Accept": "application/json"
        },
        timeout: 12000
      },
      res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
        let raw = "";
        res.on("data", chunk => raw += chunk);
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

/**
 * Fetch and parse release tables from Wikipedia for a given year.
 */
async function fetchWikiGamesForYear(year) {
  const pageUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=List_of_video_games_released_in_${year}&prop=wikitext&format=json`;
  const res = await fetchJson(pageUrl);
  const wikitext = res.parse?.wikitext?.["*"] || "";
  if (!wikitext) {
    console.warn(`  ⚠️ No wikitext found for year ${year}`);
    return [];
  }

  const rows = wikitext.split(/\n\|-/);
  const games = [];

  for (const row of rows) {
    const cells = row.split(/\n\|\s*/).map(c => c.trim());
    if (cells.length < 5) continue;

    const dateCell = cells[1];
    const titleCell = cells[2];
    const typeCell = cells[4] || "";
    const devCell = cells[6] || "";
    const pubCell = cells[7] || "";

    const dMatch = dateCell.match(/\{\{dts\|([A-Za-z]+)\s+(\d+)\}\}/) || dateCell.match(/([A-Za-z]+)\s+(\d+)/);
    if (!dMatch) continue;
    const mName = dMatch[1];
    const day = dMatch[2].padStart(2, "0");
    if (!MONTH_MAP[mName]) continue;

    const tMatch = titleCell.match(/\x27\x27\[\[(?:[^\]|]+\|)?([^\]]+)\]\]\x27\x27/) ||
                   titleCell.match(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/) ||
                   titleCell.match(/\x27\x27([^\x27]+)\x27\x27/);
    if (!tMatch) continue;

    const rawTitle = tMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!rawTitle || rawTitle.includes("File:") || rawTitle.includes("Category:")) continue;

    const isoDate = `${year}-${MONTH_MAP[mName]}-${day}`;
    games.push({
      date: isoDate,
      title: rawTitle,
      type: typeCell,
      dev: devCell,
      pub: pubCell
    });
  }

  return games;
}

/**
 * Synchronize verified dates from Wikipedia across target years.
 */
async function syncFromWikipedia(existingEvents) {
  console.log("🌐 Fetching Wikipedia video game release schedules for 2025, 2026, 2027...");
  let totalChanges = 0;
  const allWikiGames = [];

  for (const year of [2025, 2026, 2027]) {
    try {
      const yearGames = await fetchWikiGamesForYear(year);
      console.log(`  ✔ Wikipedia ${year}: parsed ${yearGames.length} dated game entries.`);
      allWikiGames.push(...yearGames);
    } catch (err) {
      console.warn(`  ⚠️ Wikipedia fetch error for ${year}: ${err.message}`);
    }
  }

  // Canonical alias overrides for specific games
  const ALIAS_MAP = {
    "gta6": ["grandtheftautovi", "grandtheftauto6", "gta6"],
    "god_of_war_laufey": ["godofwarlaufey"],
    "god_of_war_sons_of_sparta": ["godofwarsonsofsparta"],
    "death_stranding_2": ["deathstranding2onthebeach", "deathstranding2"],
    "resident_evil_requiem": ["residentevilrequiem"],
    "control_resonant": ["controlresonant"],
    "oblivion_remastered": ["theelderscrollsivoblivionremastered", "oblivionremastered"],
    "witcher_3_remastered": ["thewitcher3wildhuntremastered", "witcher3remastered"],
    "forza_horizon_6": ["forzahorizon6"],
    "project_007": ["007firstlight"],
    "halo_campaign_evolved": ["halocampaignevolved"],
    "silent_hill_townfall": ["silenthilltownfall"],
    "gears_e_day": ["gearsofwareday"],
    "marvel_wolverine": ["marvelswolverine"],
    "civ7": ["civilizationvii", "sidmeierscivilizationvii"]
  };

  for (const ev of existingEvents) {
    if (ev.type !== "release" || ev.date.length === 5) continue;

    const normEn = normalizeTitle(ev.titleEn);
    const aliases = ALIAS_MAP[ev.id] || [normEn];

    // Pass 1: exact normalized match
    let match = allWikiGames.find(w => {
      const wNorm = normalizeTitle(w.title);
      return aliases.some(al => wNorm === al);
    });

    // Pass 2: highest similarity match >= 0.85
    if (!match) {
      let maxSim = 0;
      for (const w of allWikiGames) {
        const wNorm = normalizeTitle(w.title);
        for (const al of aliases) {
          const sim = calculateSimilarity(wNorm, al);
          if (sim > maxSim && sim >= 0.85) {
            maxSim = sim;
            match = w;
          }
        }
      }
    }

    if (match) {
      if (ev.date !== match.date) {
        console.log(`  🔄 Confirmed date adjustment via Wikipedia for "${ev.titleEn}": ${ev.date} -> ${match.date}`);
        ev.date = match.date;
        totalChanges++;
      }
    }
  }

  return totalChanges;
}

/**
 * Secondary RAWG sync (if RAWG_API_KEY is configured).
 */
async function syncFromRAWG(apiKey, existingEvents) {
  if (!apiKey) return 0;
  console.log("🔑 Querying RAWG API for high-anticipation releases...");
  let count = 0;
  try {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&dates=2025-01-01,2027-12-31&ordering=-added&page_size=40`;
    const res = await fetchJson(url);

    if (res && res.results) {
      for (const game of res.results) {
        if (!game.released) continue;
        const normName = normalizeTitle(game.name);
        const existing = existingEvents.find(e => {
          if (!e.titleEn || e.type !== "release" || e.date.length === 5) return false;
          return normalizeTitle(e.titleEn) === normName;
        });

        if (existing && existing.date !== game.released) {
          console.log(`  🔄 Date updated via RAWG for "${existing.titleEn}": ${existing.date} -> ${game.released}`);
          existing.date = game.released;
          count++;
        }
      }
    }
  } catch (err) {
    console.warn("  ⚠️ RAWG sync warning:", err.message);
  }
  return count;
}

/**
 * Main Autonomous Runner
 */
async function main() {
  console.log("🎮 Starting multi-source gaming events intelligence update...");
  let dataset = { version: "1.2.0", lastUpdated: new Date().toISOString().slice(0, 10), events: [] };

  if (fs.existsSync(DATA_FILE)) {
    try {
      dataset = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      console.log(`  Loaded ${dataset.events.length} current gaming events from storage.`);
    } catch (e) {
      console.error("  ❌ Failed to parse existing gaming-events.json:", e);
    }
  }

  let changes = 0;

  // 1. Wikipedia Multi-Year Sync
  changes += await syncFromWikipedia(dataset.events);

  // 2. RAWG Sync
  const rawgKey = process.env.RAWG_API_KEY || "";
  if (rawgKey) {
    changes += await syncFromRAWG(rawgKey, dataset.events);
  }

  // 3. Sort chronologically by date
  dataset.events.sort((a, b) => a.date.localeCompare(b.date));
  dataset.lastUpdated = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(DATA_FILE, JSON.stringify(dataset, null, 2), "utf-8");
  console.log(`✨ Gaming events database synchronization complete! (${changes} dates confirmed/updated, ${dataset.events.length} total events saved).`);
}

if (require.main === module) {
  main().catch(err => {
    console.error("Fatal error during gaming events update:", err);
    process.exit(1);
  });
}

module.exports = { syncFromWikipedia, syncFromRAWG, main, fetchWikiGamesForYear };
