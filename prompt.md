# D&D Creek Crawl Map Builder — Prompts & Design Spec (`prompt.md`)

## 1. Original Concept & User Prompts

### Prompt 1 — Core Quest Concept
> "I am playing dnd and I want to build out a quest that is a crawl down a creek / river that works like a dungeon crawl. The current lore is that the creek is dammed up by beavers and that is causing dirty water in town and the town distiller can't work. The reality there is a kraken at the end of the creek the party took too long to get there. I want to print some 8x11 sheets of paper that have a creek map in the form of a dungeon crawl, with a handful of traps, simple water monsters, and general annoying creatures. Make me a map builder"

**Tabletop Format Preferences Selected:**
- **Map Scale & Flow:** 8.5×11" landscape battle maps with forks, pulled out **1 sheet at a time** and laid in front of players (~12 sheets in total).
- **Workflow:** Procedural generator + interactive editor (auto-generates the full "Beavers-to-Kraken" creek crawl, then allows tweaking terrain, traps, and monsters).
- **Visual Style:** Printer-friendly B&W pen-and-ink sketch style with high contrast and cross-hatching to save ink.

---

### Prompt 2 — Dyson Logos Aesthetic & Numbered DM Guide
> "this is good, but not exactly, I want in the style of Dyson, with hashing, it need to be a long body of water with things to see, numbers and a dm guide based on the numbers"

---

### Prompt 3 — Organic Non-Square Watercourses
> "I want less square creeks, look at this map style"
*(Replaced blocky grid tiles with smooth Catmull-Rom / Cubic Bézier vector spline cavern walls, concentric shoreline water ripples, and a Dyson-style perimeter cross-hatching halo mask.)*

---

### Prompt 4 — Separate Player & DM Maps, Story Flexibility, and `Ctrl+Z` Undo
> "Super close, I'm worried my players will know to avoid the numbered circles, lets make a set of player and set of dm maps, player maps just need basic numbers, and DM knows whats going on in the page. Then the app needs more story flexibility. Can I get a ctl-z undo functionality"

---

### Prompt 5 — 5-Stage Escalating Story Arc, Break-the-Dam Skill Challenge & Kraken Long-Range Tentacle Challenges
> "the dragging numbers doesn't seem to work. I want the story to start with basic environmental hazards, deep pools, slip on rock checks, then move to basic animals, then dire beavers, with a dam but no still, I need a hook to keep the party moving, and when they clear the dam there needs to break the dam challenge and if the party does stuff wrong they risk getting hurt by breaking dam, then there needs a hook to keep them going. The kraken has the ability to send single tentacle a long distance, I need a set of Kraken challenges"

---

## 2. Adventure Structure (The 5-Stage Escalation across 12 Sheets / Encounters `#1`–`#48`)

1. **Stage 1 (Sheets 1–2): Pure Environmental Hazards**
   - Dry distillery sluice-gate & missing Water-Warden Bram's bootprints (`#1`).
   - Greasy Green-Algae Ledge slip-on-rock checks (`#2`, `#7`), Sudden 15-ft Deep Plunge Pools (`#3` The Devil's Kettle),Mossy Boulder Stepping-Stones (`#4`), Sucking Clay Mud-Flats (`#5`), Siphon Whirlpool Undertow (`#6`), and Rolling Driftwood Log-Bridge (`#8`).
2. **Stage 2 (Sheets 3–4): Basic Creek Animals & Hook #1 to Keep Moving**
   - Camouflaged Giant Snapping Turtle (`#9`), Stampede of Panicked Giant River Otters & Water Snakes fleeing downstream (`#10`), Giant Creek Bullfrogs & Quippers (`#14`).
   - **Hook #1 (`#11` & `#15`):** Water-Warden Bram's torn oilskin pack, flare pistol, field journal, and mud-mired pack mule ("Old Barnaby") showing that Giant Dire Beavers blocked the confluence ahead and dragged the powder keg & Distillery Master-Valve Key east to Sheet 5.
3. **Stage 3 (Sheets 5–7): Dire Beavers, The Great Dam (No Still), Break-the-Dam Challenge & Hook #2**
   - Twin Dire Beaver Lodges (`#18`) where the beavers bear strange circular purple suction-scars on their flanks.
   - **The Great Beaver Dam (`#22`) & Break-the-Dam Skill Challenge (`#23`):** 3 Successes before 2 Failures to locate the keystone log, rig the powder keg / pry the king-pin, and scramble to high ground. Mistakes cause a **2d8 premature log collapse** or a **3d8 catastrophic 20-ft flash-flood dam burst**!
   - **Hook #2 (`#24` & `#28` — The Post-Dam Twist):** Breaking the dam doesn't bring clean water—it unleashes black cephalopod ink and four slaughtered Giant Beavers crushed by toothed suction cups, proving the beavers built the dam to hold back a horror upstream! Three blasts on Bram's brass horn echo from Sheet 8 as a long-range tentacle drags his raft upstream.
4. **Stage 4 (Sheets 8–11): Kraken Long-Distance Single-Tentacle Challenges**
   - The Kraken projects a single 40-ft hunting tentacle downstream through flooded karst limestone tubes:
     - **Sheet 8 (`#30`):** *Challenge I — The Bridge-Smasher Tentacle* (grabs PCs crossing the log bridge `#31` and drags them toward submerged rock tube `#29`; rescue Bram behind the waterfall at `#32`).
     - **Sheet 9 (`#33`–`#36`):** *Challenge II — Three-Vent "Whack-a-Tentacle" Sinkhole Gauntlet* (tentacle darts between West, Center, and East vents; players can roll boulders from balcony `#35` to plug vents and trap it).
     - **Sheet 10 (`#38`):** *Challenge III — 3-Round Timed Rescue of "Old Iron-Tooth"* (free the Elder Dire Beaver from a constrictor tentacle before the last dam is crushed to recruit him for the boss fight).
     - **Sheet 11 (`#42`):** *Challenge IV — The Tremorsense Ink-Fog Stalker* (stealth & vibration decoy challenge through waist-deep black water).
5. **Stage 5 (Sheet 12): Final Boss — The Kraken of Blackwater Spring (`#45`–`#48`)**
   - **The Juvenile Creek Kraken (`#47`)** wedged over the town's artesian spring vent (weakened to 95 HP if the party defeated at least two long-range tentacles in Stage 4), with cracked ceiling pillars (`#46`) that can be toppled for 4d10 bludgeoning damage.
