---
name: creek-story-builder
description: >-
  Builds new 12-sheet (48-encounter) D&D Creek Crawl stories on the Dyson-style
  creek map in /home/willie/source/dndCreekMap. Use this skill whenever the user
  wants to create a new story, reskin the creek crawl, or generate new encounters,
  hooks, starting hazards, middle challenges, or a final boss for the creek map.
---

# Creek Crawl Story Builder Skill (`creek-story-builder`)

This skill guides you (or the user via the interactive CLI script) in generating a complete, 12-sheet (**48 numbered encounters**, `#1`–`#48`) D&D 5e Creek Crawl story that loads directly into the Dyson-Style Creek Map Builder (`/home/willie/source/dndCreekMap`).

## Step 1: Prompt the User for Core Story Inputs

Before generating the story, ask the user for the following 5 inputs (using `ask_question` or plain text if any are missing):

1. **Challenge Level / Party Tier:**
   - What level is the party? (e.g., *Tier 1: Levels 1–3*, *Tier 2: Levels 4–6*, *Tier 3: Levels 7–10*)
   - Use this to scale Save DCs, Trap Damage, Skill Challenge DCs, and Monster HP/CR:
     - **Levels 1–3 (Easy/Low):** Trap/Slip Save DC 11–12, Hazard Damage `1d4` to `2d6`, Boss HP ~75–95.
     - **Levels 4–6 (Medium/Standard):** Trap/Slip Save DC 12–14, Hazard Damage `1d6` to `3d8`, Boss HP ~115–145.
     - **Levels 7–10 (Hard/High):** Trap/Slip Save DC 14–16, Hazard Damage `2d8` to `4d10`, Boss HP ~180–240.
2. **Story Points (The Town Rumor vs. The Ugly Reality + Hooks):**
   - **Initial Town Hook:** Why is the party heading up the creek? What does the town *think* is causing the water problem?
   - **Hook #1 (Mid-Creek Push on Sheets 3–4):** What discovery or missing NPC trail pushes them past the initial animals to the main barrier?
   - **Hook #2 (Post-Barrier Twist on Sheets 6–7):** When they clear the middle barrier/dam, what shocking evidence washes out that proves the barrier was actually *holding back* the Big Boss?
3. **Starting Challenges (Sheets 1–2 — Environmental & Natural Hazards):**
   - What natural creek hazards test the party first? (e.g., *deep plunge pools, algae-slick rock checks, sucking clay flats, whirlpool undertows, log-bridges*) + what basic local animals appear on Sheets 3–4?
4. **Middle Challenges (Sheets 5–7 — The Barrier Defenders & Demolition Skill Challenge):**
   - Who or what built the mid-creek barrier/dam (e.g., *Giant Dire Beavers, River Gnomes, Bullywug Engineers, Ice Elementals*), and what is the **Break-the-Barrier Skill Challenge** (including the painful consequences if the party fails rolls)?
5. **The Big Boss & Pre-Boss Long-Range Challenges (Sheets 8–12):**
   - Who is the **Big Boss** lairing at the creek source on Sheet 12 (e.g., *Juvenile Creek Kraken, Black-Pudding Hydra, River Hag Coven, Young Black Dragon*)?
   - What **remote or projecting power** does the Big Boss send down the creek on Sheets 8–11 for the 4 pre-boss challenges (e.g., *long-distance hunting tentacles through karst tubes, acidic ooze pseudopods, animated strangler-roots, flash-freeze geysers*)?

---

## Step 2: Run the Generator Script (or Build the Campaign JSON)

You have an executable helper script at:
- [build-story.js](./scripts/build-story.js)

### Option A — Interactive CLI Mode (for the user in a terminal)
The user can run:
```bash
node /home/willie/source/dndCreekMap/.agents/skills/creek-story-builder/scripts/build-story.js
```
This interactively prompts for the 5 story inputs and outputs a ready-to-load campaign `.json` file (and optionally injects it into `app.js`).

### Option B — Agent Non-Interactive Mode (via `--config`)
When you (the agent) have gathered the user's answers, create a temporary JSON config or pass flags to [build-story.js](./scripts/build-story.js):

```bash
node /home/willie/source/dndCreekMap/.agents/skills/creek-story-builder/scripts/build-story.js \
  --config /path/to/story-spec.json \
  --out /home/willie/source/dndCreekMap/stories/my-new-story.json \
  --apply-default
```

- Adding `--apply-default` updates `/home/willie/source/dndCreekMap/app.js` so the web app opens with the new story by default (or adds it to the **Story Template / Preset** dropdown in `index.html` and `app.js`).

---

## Step 3: Anti-Metagaming Rules for the 48 Encounters (`#1`–`#48`)

When crafting or customizing the 48 encounters across the 12 sheets (4 encounters per sheet), always follow the **Dual-Edition Player vs. DM Map convention**:
- Set `"showOnPlayer": false` for **all hidden traps, slip-on-rock checks, sudden deep pools, and monster/boss ambushes** so no numbered circle appears on the printed Player Map.
- Set `"showOnPlayer": true` **only** for obvious physical landmarks, major dams/bridges, or visible story hooks (`#1`, `#4`, `#8`, `#11`, `#15`, `#18`, `#22`, `#23`, `#24`, `#31`, `#32`, `#35`, `#37`, `#38`, `#40`, `#43`, `#44`, `#45`, `#47`, `#48`).

## Step 4: Verification

After generating or updating a story:
1. Run `node --check /home/willie/source/dndCreekMap/app.js` to verify valid JavaScript syntax.
2. Tell the user where the `.json` story file was saved (in `/home/willie/source/dndCreekMap/stories/`) and remind them they can either load it via the **📂 Load** button in [index.html](file:///home/willie/source/dndCreekMap/index.html) or select it from the **Story Template / Preset** dropdown.
