// ============================================================================
// DYSON-STYLE CREEK CRAWL BUILDER — Player & DM Dual-Edition Map Studio
// • Butter-Smooth Live SVG Dragging for Numbered Markers (#1–#48)
// • 5-Stage Escalating Story Arc:
//     Stage 1 (Sheets 1-2): Environmental Hazards (Deep Pools, Slip-on-Rock Checks, Undertows)
//     Stage 2 (Sheets 3-4): Basic Creek Animals & Hook #1 to Keep Moving Upstream
//     Stage 3 (Sheets 5-7): Dire Beavers, The Great Dam (No Still), Break-the-Dam Skill Challenge & Post-Dam Hook #2
//     Stage 4 (Sheets 8-11): Kraken Long-Distance Single-Tentacle Challenges
//     Stage 5 (Sheet 12): The Juvenile Creek Kraken Boss in Blackwater Spring
// • Full Ctrl+Z / Ctrl+Y Undo & Redo History Stack
// ============================================================================

const COLS = 10;    // 10 inches wide on 8.5x11" landscape sheet
const ROWS = 8;     // 8 inches tall
const CELL_PX = 90; // 90px per inch on screen (900x720 SVG coordinate space)
const W = COLS * CELL_PX; // 900
const H = ROWS * CELL_PX; // 720

// Seeded PRNG (Mulberry32)
function createRNG(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// ============================================================================
// CAMPAIGN STORY TEMPLATES / PRESETS
// ============================================================================
const STORY_PRESETS = {
  beavers_to_kraken: {
    title: "The Distiller's Creek Crawl",
    act1Name: 'Stage 1: Creek Hazards (Deep Pools & Slick Rocks)',
    act2Name: 'Stage 2: Creek Wildlife & The Upstream Hook',
    act3Name: 'Stage 3: Dire Beavers & Break-the-Dam Challenge',
    act4Name: 'Stage 4: Kraken Long-Distance Tentacle Challenges',
    act5Name: 'Stage 5: The Kraken of Blackwater Spring (Boss)',
    hook: "The town distillery in Oakhaven has ground to a halt because the creek has dropped to a foul, muddy trickle. The Town Distiller hires the party (150 gp + a cask of Single-Malt Reserve) to hike up the creek canyon, find the beaver dam blocking the water, and break it open—plus look for his missing Water-warden.",
    twist: "The party took too long to get here! The Dire Beavers built their massive dam not to ruin the town's water, but as a desperate barricade against a Juvenile Kraken that laired in Blackwater Spring at the end of the creek. Worse, the Kraken can send a single hunting tentacle miles downstream through submerged limestone tubes. When the party breaks the beaver dam, instead of clean water, black ink and slaughtered beaver carcasses flood down from upstream—along with the missing Water-warden's trail!"
  },
  fey_logging_hag: {
    title: 'Curse of Bitterwater Creek',
    act1Name: 'Stage 1: Mossy Ledges & Sinkhole Pools',
    act2Name: 'Stage 2: Agitated Beasts & Missing Scout Hook',
    act3Name: 'Stage 3: Thorn-Beavers & Dam Breach Challenge',
    act4Name: 'Stage 4: Strangler-Root & Tentacle Gauntlet',
    act5Name: 'Stage 5: Auntie Marrow’s Sinkhole (Boss)',
    hook: 'The town brewer’s water has turned bitter and muddy. Locals blame giant beavers damming the gorge.',
    twist: 'Breaking the beaver dam reveals the beavers were holding back black root-sludge from a River Hag’s coven at the headwaters!'
  },
  alchemist_sludge: {
    title: 'The Blackwater Run-Off Crawl',
    act1Name: 'Stage 1: Slick Shale Rapids & Drop-Offs',
    act2Name: 'Stage 2: Frenzied Fauna & Upstream Clue',
    act3Name: 'Stage 3: Iron-Hide Beavers & Dam Collapse',
    act4Name: 'Stage 4: Long-Reach Pseudopod Challenges',
    act5Name: 'Stage 5: The Ooze-Kraken of the Spring',
    hook: 'Silt and beaver dams are starving the town distillery of clean mountain water.',
    twist: 'Once the party demolishes the beaver dam, they realize it was the only barrier keeping an abyssal Ooze-Kraken bottled up at the source!'
  },
  smuggler_creek: {
    title: 'Iron-Gorge Creek Crawl',
    act1Name: 'Stage 1: Flash-Eddies & Slippery Boulders',
    act2Name: 'Stage 2: River Predators & Trail Upstream',
    act3Name: 'Stage 3: Dire Beaver Fortress & Dam Demolition',
    act4Name: 'Stage 4: Hunting Tentacle Ambush Gauntlet',
    act5Name: 'Stage 5: The Deep-Spring Kraken',
    hook: 'Town leaders hire the party to clear the beaver dams choking the valley creek.',
    twist: 'Clearing the dam unleashes a flood of dark ink from the spring monster that grew huge while the party procrastinated!'
  },
  custom_blank: {
    title: 'Custom Creek Crawl',
    act1Name: 'Stage 1: Environmental Hazards',
    act2Name: 'Stage 2: Basic Animals & First Hook',
    act3Name: 'Stage 3: Dire Beavers & Dam Challenge',
    act4Name: 'Stage 4: Kraken Tentacle Challenges',
    act5Name: 'Stage 5: Final Boss Lair',
    hook: 'Enter your town hook and initial rumor here...',
    twist: 'Enter the true secret awaiting at the source of the creek...'
  }
};

// Random Encounter Generator Pool for "🎲 Random #" button
const RANDOM_CREEK_POIS = [
  { type: 'trap', showOnPlayer: false, name: 'Algae-Slick Stepping Stones', summary: 'Slip-on-rock hazard (DC 12 Acrobatics or fall Prone into current).', details: 'Hazard: Crossing at normal speed requires a DC 12 DEX (Acrobatics) check. On a failure, the character slips on wet river-moss, takes 1d4 bludgeoning damage on the rock, and washes 15 ft downstream into a deep pool.' },
  { type: 'trap', showOnPlayer: false, name: 'Sudden 15-ft Plunge Pool', summary: 'Hidden underwater drop-off with cold undertow (DC 12 Athletics).', details: 'Hazard: The ankle-deep gravel bar drops sheerly into a 15-ft-deep swirling sinkhole. Medium/Small creatures in heavy armor sink unless they succeed on a DC 12 STR (Athletics) check.' },
  { type: 'monster', showOnPlayer: false, name: 'Agitated Giant River Otter Pack', summary: '3 Giant Otters fleeing downstream in panic.', details: 'Basic Animals: 3 Giant Otters (AC 12, 16 HP, Bite +4 for 1d6+2) burst from the reeds. They are spooked by something upstream (DC 11 Animal Handling calms them).' },
  { type: 'monster', showOnPlayer: false, name: 'Giant Dire Beaver Sentinel', summary: 'Territorial Dire Beaver (AC 13, 22 HP) guarding felled timber.', details: 'Encounter: A horse-sized Dire Beaver slaps its tail in warning and charges anyone approaching the dam logs.' },
  { type: 'trap', showOnPlayer: false, name: 'Kraken Long-Range Feeder Tentacle', summary: 'Single 40-ft hunting tentacle erupting from a submerged limestone vent!', details: 'Kraken Challenge: The Kraken miles upstream extends a single 40-ft tentacle through a flooded rock tube! +6 to hit, reach 20 ft, 1d10+3 bludgeoning + Grappled (escape DC 13). Dealing 20 damage to the tentacle forces it to retract.' },
  { type: 'landmark', showOnPlayer: true, name: 'Distillery Water-Warden’s Trail Marker', summary: 'Blazed alder tree & dropped brass spyglass pointing upstream.', details: 'Hook to Keep Moving: Fresh boot tracks and a blaze mark carved by Bram (the missing Distillery Water-Warden) lead further upstream.' }
];

// ============================================================================
// 12-SHEET CREEK CRAWL MASTER KEY (#1 to #48)
// Designed around the exact 5-Stage Escalation requested by the DM!
// ============================================================================
const SHEET_BLUEPRINTS = [
  // --------------------------------------------------------------------------
  // STAGE 1 (SHEETS 1–2): PURE ENVIRONMENTAL HAZARDS (Deep Pools, Slip on Rocks)
  // --------------------------------------------------------------------------
  {
    id: 1,
    act: 1,
    title: 'Sheet 1: Slick-Rock Shallows & Plunge Pools',
    flow: 'W-E',
    exits: { W: 'TOWN DISTILLERY', E: 'UPSTREAM -> SHEET 2' },
    links: [2],
    graphPos: { x: 150, y: 24 },
    readAloud: 'Just upstream from the town distillery’s dry intake sluice, the creek narrows between mossy limestone walls. Instead of a healthy flow, only a sluggish, muddy ribbon trickles over algae-greased boulders into dark, stagnant plunge pools.',
    pois: [
      {
        num: 1, x: 120, y: 385, type: 'landmark', showOnPlayer: true,
        name: 'Dry Distillery Sluice-Gate & Warden’s Bootprints',
        summary: 'Mud-choked wooden water-gate & fresh tracks of the missing Water-Warden.',
        details: 'Sight: The distillery’s main wooden sluice-gate sits bone-dry above a trickle of brown mud. The town distiller promised 150 gp if you hike upstream, find the beaver dam choking the flow, and break it.\nInitial Hook: Pressed into the wet clay beside the gate are the hobnailed bootprints of **Bram, the Distillery Water-Warden**, who headed upstream two days ago with a sack of blasting powder and never returned (DC 10 Survival follows his trail east).'
      },
      {
        num: 2, x: 350, y: 260, type: 'trap', showOnPlayer: false,
        name: 'Greasy Green-Algae Ledge (Slip-on-Rock Check)',
        summary: 'Slick shelf of wet river-shale along the north bank (DC 12 Acrobatics).',
        details: 'Environmental Hazard: The dry bank pinches out, forcing characters to scramble across a tilted shelf of green-slimed limestone.\nCheck: **DC 12 Dexterity (Acrobatics)** (or move at half-speed while crawling). On a failure, the character’s boots shoot out from under them: they take **1d4 bludgeoning damage** on the rock edge, fall Prone, and slide into the Sudden Plunge Pool (#3)!'
      },
      {
        num: 3, x: 525, y: 425, type: 'trap', showOnPlayer: false,
        name: 'The Devil’s Kettle (Sudden 15-ft Deep Pool)',
        summary: 'Deceptively dark 15-ft drop-off hidden under opaque brown silt.',
        details: 'Environmental Hazard: What looks like knee-deep brown water abruptly drops into a vertical 15-ft limestone pothole scoured by winter floods (DC 13 Passive Perception notices the lack of ripples).\nCheck: Anyone stepping in or sliding from #2 plunges over their head! Creatures wearing medium/heavy armor or carrying heavy gear must make a **DC 12 Strength (Athletics)** check to swim up or sink to the bottom (holding breath rules). At the bottom lies a drowned deer skeleton and a pouch with 12 gp.'
      },
      {
        num: 4, x: 765, y: 345, type: 'trap', showOnPlayer: true,
        name: 'Mossy Boulder Stepping-Stones',
        summary: 'Row of wet granite boulders spanning the eastern narrows.',
        details: 'Environmental Challenge: Five round, wet boulders cross the creek where both banks become sheer cliff walls.\nCheck: Crossing requires a **DC 11 Dexterity (Acrobatics)** check or a **DC 11 Strength (Athletics)** jump (10-ft gap on the final stone). Tying a safety rope after the first person crosses grants advantage to everyone else.'
      }
    ]
  },
  {
    id: 2,
    act: 1,
    title: 'Sheet 2: Cold-Water Gorge & Creek Fork',
    flow: 'W-NE-SE',
    exits: { W: '<- SHEET 1', E: 'NORTH LEDGES -> SHEET 3', S: 'SOUTH SLOUGH -> SHEET 4' },
    links: [3, 4],
    graphPos: { x: 150, y: 78 },
    readAloud: 'The canyon splits around a jagged stone spire. To the east, water trickles down slick terraced ledges; to the south, the creek pools in a deep, reed-bordered bend where floating driftwood spins in a slow whirlpool.',
    pois: [
      {
        num: 5, x: 235, y: 455, type: 'trap', showOnPlayer: false,
        name: 'Sucking Clay Mud-Flat (Mire Hazard)',
        summary: 'Ankle-snapping river clay along the southern bend (DC 12 STR save).',
        details: 'Environmental Hazard: Because the water level dropped so fast, the exposed southern mud flat has formed a thin dry crust over 4 feet of vacuum-sucking grey clay.\nCheck: Stepping off the rocks triggers a **DC 12 Strength save** or the character’s legs sink to the thighs (**Restrained**). Pulling oneself out takes an action and a DC 12 Athletics check (or DC 10 if an ally pulls with a pole/rope).'
      },
      {
        num: 6, x: 465, y: 350, type: 'trap', showOnPlayer: false,
        name: 'The Siphon Whirlpool (Deep Pool & Undertow)',
        summary: '20-ft deep pool with a submerged rock culvert creating a downward pull.',
        details: 'Environmental Hazard: The center of the fork is a 20-ft-deep pool where water drains through a submerged rock crack. Any creature swimming within 10 ft of the center feels a freezing undertow: **DC 13 Strength (Athletics)** check or be pulled 10 ft down against the rock grate (1d6 bludgeoning damage and pinned until a DC 12 STR check frees them).'
      },
      {
        num: 7, x: 725, y: 210, type: 'trap', showOnPlayer: true,
        name: 'North Fork: Wet Shale Staircase (Slip Hazard)',
        summary: 'Steep, waterfall-slicked limestone steps leading east to Sheet 3.',
        details: 'Fork Choice (East to Sheet 3): Climbing the wet 10-ft shale ledges requires a **DC 12 Athletics or Acrobatics** check. Slipping sends the climber sliding 15 ft back down into the Siphon Pool (#6) for 1d6 bludgeoning damage.\nClue on the Ledge: Scratched into the shale are fresh iron piton marks from Bram the Water-Warden!'
      },
      {
        num: 8, x: 560, y: 585, type: 'landmark', showOnPlayer: true,
        name: 'South Fork: Driftwood Log-Bridge (Balance Check)',
        summary: 'Rolling, bark-stripped pine trunk spanning the southern channel (To Sheet 4).',
        details: 'Fork Choice (South to Sheet 4): A single wet pine trunk bridges the deep southern channel. When stepped on, the log rolls in its mud sockets! **DC 11 Dexterity (Acrobatics)** check to keep balance or splash into 10-ft deep water.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // STAGE 2 (SHEETS 3–4): BASIC ANIMALS & HOOK #1 TO KEEP THE PARTY MOVING
  // --------------------------------------------------------------------------
  {
    id: 3,
    act: 2,
    title: 'Sheet 3: North Fork — snapping Turtles & Heron Pools',
    flow: 'W-E',
    exits: { W: '<- SHEET 2 (FORK)', E: 'CONFLUENCE -> SHEET 5' },
    links: [5],
    graphPos: { x: 75, y: 132 },
    readAloud: 'The northern channel is eerily crowded with displaced creek wildlife. Great blue herons, river snakes, and otters splash frantically in the shallow pools—all of them fleeing downstream as if something upstream terrified them.',
    pois: [
      {
        num: 9, x: 220, y: 340, type: 'monster', showOnPlayer: false,
        name: 'Moss-Backed Giant Snapping Turtle',
        summary: 'Basic Animal: Camouflaged Giant Snapping Turtle mistaken for a stepping stone!',
        details: 'Basic Animal Encounter: What looks like a flat, moss-covered boulder in mid-stream (DC 13 Nature or Perception to spot the breathing nostrils) is an irritable **Giant Snapping Turtle** (AC 15, 32 HP, Speed 15 ft / Swim 30 ft; Bite +5 to hit, 2d6+3 slashing).\nBehavior: It only attacks if someone steps on its shell or wades within 5 ft. It fights until reduced to 10 HP, then retreats into its shell.'
      },
      {
        num: 10, x: 470, y: 275, type: 'monster', showOnPlayer: false,
        name: 'Stampede of Panicked Giant River Otters',
        summary: 'Basic Animals: 3 Giant River Otters & a Swarm of Water Moccasins fleeing downstream.',
        details: 'Basic Animal Encounter: **3 Giant River Otters** (AC 12, 16 HP, Bite +4 for 1d6+2) and a **Swarm of Poisonous Water Snakes** (AC 14, 22 HP, Bite +5 for 1d6 piercing + 2d4 poison DC 11 CON half) come boiling down the creek in blind panic!\nClue: A **DC 11 Animal Handling** check or *Speak with Animals* calms the otters—they chitter that "Giant chisel-teeth (Dire Beavers) blocked the whole canyon ahead, and something even bigger in the deep dark water is making the earth shake!"'
      },
      {
        num: 11, x: 540, y: 520, type: 'landmark', showOnPlayer: true,
        name: 'HOOK #1A: The Water-Warden’s Torn Pack & Flare Pistol',
        summary: 'Bram’s snagged leather rucksack & blood-trail leading east toward Sheet 5!',
        details: 'HOOK TO KEEP MOVING: Snagged on a willow root is a waterproof oilskin pack belonging to **Bram, the Distillery Water-Warden**, alongside a freshly chewed alder branch the thickness of a man’s thigh.\nInside the Pack: A brass signal-flare pistol (2 flares), a *Potion of Healing*, and Bram’s field notebook: *"Found the source of the drought just ahead at the confluence! Giant Dire Beavers built a 15-foot dam wall across the canyon. Going to climb the north bluff with my powder keg to blow the dam—if I’m not back by sundown, send help!"* Fresh drag-marks and beaver tracks lead directly east to Sheet 5!'
      },
      {
        num: 12, x: 780, y: 365, type: 'trap', showOnPlayer: false,
        name: 'Slick Waterfall Chute & Biting Midge Cloud',
        summary: '6-ft wet rock chute (DC 11 Acrobatics) + 1 Swarm of Creek Midges.',
        details: 'Encounter: To reach Sheet 5, the party must climb a 6-ft slick rock chute (DC 11 Athletics/Acrobatics) while harassed by a **Swarm of Biting Midges/Stirges** (AC 13, 18 HP) clouding the air.'
      }
    ]
  },
  {
    id: 4,
    act: 2,
    title: 'Sheet 4: South Fork — Bullfrog Slough & Beaver Sign',
    flow: 'N-E',
    exits: { N: '<- SHEET 2 (FORK)', E: 'CONFLUENCE -> SHEET 5' },
    links: [5],
    graphPos: { x: 225, y: 132 },
    readAloud: 'Lily pads and cattails choke this sun-dappled southern bend. Deep, resonant croaks vibrate from the mud banks, and along the shore dozens of young willow trees have been neatly sheared off by enormous rodent incisors.',
    pois: [
      {
        num: 13, x: 420, y: 180, type: 'trap', showOnPlayer: false,
        name: 'Floating Log-Jam & Submerged Snag (Slip Check)',
        summary: 'Shifting mat of peeled logs hiding a 12-ft deep mud hole.',
        details: 'Environmental Hazard: Dozens of freshly debarked willow logs float across the bend. Trying to run across them requires a **DC 12 Dexterity (Acrobatics)** check; failure plunges the character between two rolling logs (1d6 bludgeoning damage and immersed in 12 ft of murky water).'
      },
      {
        num: 14, x: 350, y: 450, type: 'monster', showOnPlayer: false,
        name: 'Ambush of the Giant Creek Bullfrogs',
        summary: 'Basic Animals: 3 Giant Frogs & 1 Swarm of Quippers hunting in the shallows.',
        details: 'Basic Animal Encounter: **3 Giant Bullfrogs** (AC 11, 18 HP, Bite +3 to hit, 1d6+1 piercing + Grappled escape DC 11, can Swallow Small creatures) lash out with 15-ft sticky tongues from the cattails to pull waders into the deep pool where **1 Swarm of Quippers** (AC 13, 22 HP) circles.'
      },
      {
        num: 15, x: 595, y: 515, type: 'landmark', showOnPlayer: true,
        name: 'HOOK #1B: The Distiller’s Stolen Payroll Mule',
        summary: 'Mud-mired pack mule carrying half the expedition supplies & a trail upstream!',
        details: 'HOOK TO KEEP MOVING: Stuck belly-deep in the southern mud bank is **"Old Barnaby,"** the Distillery Water-Warden’s pack mule! One of its saddlebags is still strapped on (containing 50 ft of silk rope, a crowbar, 2 flasks of Alchemist’s Fire, and 25 gp).\nWhy Keep Going: The other saddlebag—holding the town distillery’s **brass master-valve key** and Bram’s blasting-powder keg—was dragged upstream by giant beaver-tracks and bootprints heading east into Sheet 5!'
      },
      {
        num: 16, x: 785, y: 375, type: 'monster', showOnPlayer: true,
        name: 'First Dire Beaver Timber-Drag',
        summary: '1 Giant Dire Beaver hauling a whole pine tree toward Sheet 5.',
        details: 'Foreshadowing Encounter: A single **Giant Dire Beaver** (AC 13, 22 HP) is furiously dragging a felled pine trunk east toward the main dam. When it spots the party, it slaps its tail twice like a thunderclap and retreats east onto Sheet 5!'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // STAGE 3 (SHEETS 5–7): DIRE BEAVERS, THE GREAT DAM, BREAK-THE-DAM CHALLENGE & HOOK #2
  // --------------------------------------------------------------------------
  {
    id: 5,
    act: 3,
    title: 'Sheet 5: Dire Beaver Outworks & Lodge Pools',
    flow: 'W-N-S-E',
    exits: { W: '<- SHEET 3 / 4', E: 'MAIN DAM -> SHEET 6', S: 'OVERFLOW -> SHEET 7' },
    links: [6, 7],
    graphPos: { x: 150, y: 188 },
    readAloud: 'The north and south forks merge in a flooded basin completely transformed by Dire Beavers. Dozens of felled oak stumps stud the muddy banks, and two massive dome-shaped stick lodges rise from a breast-high outer weir. Just upstream to the east looms the shadow of a colossal main dam!',
    pois: [
      {
        num: 17, x: 240, y: 360, type: 'trap', showOnPlayer: false,
        name: 'Sharpened Willow Stake-Bed & Mud Trench',
        summary: 'Underwater beaver abatis guarding the lodge approach (DC 12 Perception).',
        details: 'Beaver Defense Hazard: The Dire Beavers planted rows of diagonal, chisel-sharpened branches underwater in front of their outer weir. Wading east at full speed without probing inflicts **2d4 piercing damage** (DC 12 DEX save half) and slows movement to half speed.'
      },
      {
        num: 18, x: 465, y: 345, type: 'monster', showOnPlayer: true,
        name: 'The Twin Dire Beaver Lodges',
        summary: '3 Giant Dire Beavers fiercely defending their stick-and-mud domes.',
        details: 'Combat Encounter: **3 Giant Dire Beavers** (AC 13, 22 HP, Chisel Bite +4 for 1d8+2 piercing; Tail Slap 10-ft splash DC 12 CON save or Deafened & pushed 5 ft) burst from underwater lodge tunnels to drive the party back!\nClue on the Beavers: Two of the Dire Beavers have deep, circular purple sucker-scars torn across their flanks—wounds inflicted by something huge from *upstream*!'
      },
      {
        num: 19, x: 695, y: 240, type: 'landmark', showOnPlayer: true,
        name: 'North Approach to the Great Beaver Dam (To Sheet 6)',
        summary: 'Dry timber catwalk & jammed logs leading directly to the Main Dam.',
        details: 'Path to Sheet 6: Climbing the outer weir leads directly to the base of the 15-ft-tall **Great Beaver Dam** on Sheet 6, where tens of thousands of gallons of water are backed up.'
      },
      {
        num: 20, x: 505, y: 585, type: 'landmark', showOnPlayer: true,
        name: 'South Overflow Channel (To Sheet 7)',
        summary: 'Flooded side-ravine bypassing the main dam face.',
        details: 'Path to Sheet 7: A muddy side-stream circles south around the flank of the dam toward the flooded spillway basin on Sheet 7.'
      }
    ]
  },
  {
    id: 6,
    act: 3,
    title: 'Sheet 6: The Great Beaver Dam & Break-the-Dam Challenge',
    flow: 'W-E',
    exits: { W: '<- SHEET 5', E: 'FLOODED BASIN -> SHEET 8' },
    links: [8],
    graphPos: { x: 75, y: 244 },
    readAloud: 'A towering, fifteen-foot-tall barrier of interwoven oak trunks, boulders, and packed river clay blocks the entire canyon! Behind it, a vast lake of dark water groans under immense hydrostatic pressure. Two massive Dire Beavers patrol the crest—and wedged halfway up the timber face is the missing Water-Warden’s waterproof powder keg!',
    pois: [
      {
        num: 21, x: 245, y: 375, type: 'trap', showOnPlayer: false,
        name: 'Spring-Loaded Bent Sapling Deadfall (Beaver Trap)',
        summary: 'Tensioned ash trunk snaps loose if cut or stepped on wrong (DC 13 DEX).',
        details: 'Hazard at the Dam Base: The Dire Beavers wedged green ash saplings under immense tension to lock the lower logs. Pulling the wrong log without a **DC 12 Investigation or Carpenter’s/Mason’s Tools** check causes a sapling to whip out: **DC 13 DEX save** or take **2d8 bludgeoning damage** and be knocked Prone in the mud.'
      },
      {
        num: 22, x: 470, y: 335, type: 'monster', showOnPlayer: true,
        name: 'The Dam-Matriarch & Dire Beaver Guard',
        summary: '1 Giant Dire Beaver Matriarch (38 HP) & 2 Dire Beavers defending the dam.',
        details: 'Combat Encounter: Before the party can safely demolish the dam, they must deal with the **Dire Beaver Matriarch** (AC 14, 38 HP, Bite +5 for 1d10+3) and **2 Giant Dire Beavers** (AC 13, 22 HP).\nStrange Behavior: Even while fighting, the beavers keep glancing in terror toward the dark water *east* of the dam, frantically packing mud into any crack!'
      },
      {
        num: 23, x: 525, y: 495, type: 'trap', showOnPlayer: true,
        name: 'SKILL CHALLENGE: Breaking the Great Beaver Dam!',
        summary: '3 Successes before 2 Failures to breach the dam without getting crushed!',
        details: 'BREAK-THE-DAM CHALLENGE (Run once the beavers are cleared): The dam is 15 ft tall and holds back a roaring wall of water. To break it safely, the party needs **3 Successes before 2 Failures**:\n• **Spot the Keystone Log:** DC 13 Investigation or Nature (or Carpenter’s Tools) to identify the central king-pin trunk.\n• **Rig the Powder Keg or Pry the King-Pin:** DC 13 Athletics (crowbar/rope from the high bank) or DC 12 Sleight of Hand/Alchemist’s Supplies to fuse Bram’s wedged powder keg.\n• **Scramble to High Ground:** DC 12 Acrobatics or Athletics to reach the north/south rock shelves before the wall gives way.\n⚠️ **IF THEY DO IT WRONG (Consequences of Failure):**\n• **1st Mistake (Premature Log Shift):** A ton of wet oak logs rolls down the dam face! Everyone on or within 10 ft of the dam must make a **DC 13 DEX save** or take **2d8 bludgeoning damage** and be pinned (DC 12 STR to free).\n• **2nd Mistake (Catastrophic Flash-Flood Burst!):** The dam explodes while PCs are still in the channel! A 20-ft-tall wall of timber and water slams everyone in the creek bed: **DC 14 STR save** or take **3d8 bludgeoning damage**, get swept 40 ft downstream, and risk 1 level of Exhaustion from near-drowning!'
      },
      {
        num: 24, x: 785, y: 350, type: 'landmark', showOnPlayer: true,
        name: 'HOOK #2: What Washes Out When the Dam Breaks!',
        summary: 'Black ink, slaughtered beavers with sucker-scars, & Bram’s horn upstream!',
        details: 'THE TWIST & HOOK TO KEEP GOING: When the dam finally bursts and the reservoir drains, the water rushing down toward town is **NOT clean**—it is thick with oily black cephalopod ink and foul slime!\n1. **The Grisly Reveal:** Rolling out of the drained mud behind the dam are four dead Giant Beavers crushed by saucer-sized, toothed **tentacle suction-cups**—proving the beavers built this dam to *wall off a monster upstream*!\n2. **The Urgent Hook:** The distillery water is still poisoned by whatever is sitting in Blackwater Spring. Worse, echoing from upstream (Sheet 8) comes the sound of **three blasts on a brass warden’s horn**—Bram the Water-Warden is still alive upstream, and a massive single tentacle just dragged his raft toward the headwaters!'
      }
    ]
  },
  {
    id: 7,
    act: 3,
    title: 'Sheet 7: South Spillway — The Flank Breach & Sucker-Scars',
    flow: 'N-E',
    exits: { N: '<- SHEET 5', E: 'UPSTREAM -> SHEET 9' },
    links: [9],
    graphPos: { x: 225, y: 244 },
    readAloud: 'This southern bypass channel skirts the earthen wing of the Great Beaver Dam. Half-built auxiliary weirs litter the gorge—but something tore through them from the east, leaving splintered logs coated in rubbery black slime.',
    pois: [
      {
        num: 25, x: 390, y: 195, type: 'trap', showOnPlayer: true,
        name: 'Earthen Wing-Dam (Alternative Break-the-Dam Site)',
        summary: 'Weaker southern dam wall—easier to breach, but unstable footing!',
        details: 'Alternative Dam Breach: If the party came south instead of Sheet 6, they can break the southern wing-dam here (requires **2 Successes at DC 12 Athletics/Investigation**). However, standing in the southern trench when it blows inflicts **3d6 bludgeoning damage** (DC 13 DEX save half) from tumbling boulders.'
      },
      {
        num: 26, x: 315, y: 470, type: 'landmark', showOnPlayer: true,
        name: 'The Crushed Beaver Barricade (The Twist Reveal)',
        summary: '3 dead Dire Beavers covered in giant tentacle suction-scars.',
        details: 'Sight: Three Giant Dire Beavers lie dead beside an upstream-facing stake wall. DC 10 Medicine/Nature reveals their ribs were crushed by an enormous tentacle with serrated suckers.'
      },
      {
        num: 27, x: 560, y: 410, type: 'trap', showOnPlayer: false,
        name: 'First Tremor of the Long-Range Tentacle',
        summary: 'Submerged mud-vent erupts with a single probing tentacle tip!',
        details: 'Foreshadowing Hazard: As the dam water drains, a 15-ft whip-like tentacle tip shoots out of a submerged limestone sinkhole, lashes once at the nearest PC (+5 to hit, 1d8+3 bludgeoning), and slithers rapidly upstream toward Sheet 9!'
      },
      {
        num: 28, x: 780, y: 350, type: 'landmark', showOnPlayer: true,
        name: 'HOOK #2B: Bram’s Dragged Boat & Brass Valve-Key Trail',
        summary: 'Smashed skiff & wet tentacle-slime trail leading east into Sheet 9.',
        details: 'HOOK TO KEEP GOING: Even with the beaver dam broken, black ink continues to pour from the headwaters, ruining the town’s water—and here on the bank lies Bram’s smashed rowboat with a fresh trail of tentacle-slime and his dropped brass lantern leading east to Sheet 9!'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // STAGE 4 (SHEETS 8–11): KRAKEN LONG-DISTANCE SINGLE-TENTACLE CHALLENGES
  // --------------------------------------------------------------------------
  {
    id: 8,
    act: 4,
    title: 'Sheet 8: Kraken Challenge I — The Log-Bridge Tentacle Snatch',
    flow: 'W-NE-SE',
    exits: { W: '<- SHEET 6', E: 'NORTH GORGE -> SHEET 10', S: 'CROSSING -> SHEET 9' },
    links: [9, 10],
    graphPos: { x: 75, y: 300 },
    readAloud: 'With the beaver dam drained, the exposed upper creek canyon reveals dark, bottomless limestone sinkholes in the riverbed. Ribbons of black ink swirl through the waterfalls—and from a submerged rock tube, a single forty-foot tentacle as thick as a mast glides silently beneath the surface!',
    pois: [
      {
        num: 29, x: 230, y: 360, type: 'trap', showOnPlayer: false,
        name: 'Submerged Sinkhole Tube & Ink-Slick Ledge',
        summary: 'Underwater limestone tunnel allowing the Kraken to reach half a mile downstream!',
        details: 'Lore & Hazard: The Kraken at Blackwater Spring (Sheet 12) uses flooded karst limestone tubes to project a **single long-distance hunting tentacle** far down the creek! The ink-coated rocks along the bank require a **DC 12 Acrobatics** check when moving faster than half speed.'
      },
      {
        num: 30, x: 485, y: 300, type: 'monster', showOnPlayer: false,
        name: 'KRAKEN CHALLENGE #1: The Bridge-Smasher Tentacle',
        summary: 'Single Long-Range Kraken Tentacle ambushing party members mid-crossing!',
        details: 'KRAKEN TENTACLE CHALLENGE #1: As the party crosses the waterfall pool or log bridge (#31), a **Single Long-Range Kraken Tentacle** (AC 14, 30 HP, Speed 0 / Reach 25 ft, Immune to psychic/stun) erupts from the plunge pool!\n• **Tactic (Grab & Drag to the Tube):** On Initiative count 15 and 5, the Tentacle makes a **Sucker-Whip Slam** (+6 to hit, reach 25 ft, 1d10+3 bludgeoning + **Grappled** escape DC 13). At the start of its turn, it drags a Grappled victim **15 ft toward the submerged sinkhole tube (#29)** to drown them!\n• **How to Beat the Challenge:** Severing or driving off the tentacle (dealing 30 damage, or 15 slashing/lightning damage in a single hit, or pinning it with a piton/spear at DC 14 Athletics) causes it to shriek through the water and whip back upstream!'
      },
      {
        num: 31, x: 545, y: 575, type: 'landmark', showOnPlayer: true,
        name: 'Mossy Chasm Log-Bridge (South Crossover to Sheet 9)',
        summary: 'Fallen ironwood trunk spanning the gorge (AC 12, 20 HP if struck by tentacle).',
        details: 'Tactical Terrain: Players can cross south to Sheet 9 here or continue east to Sheet 10. If the Kraken Tentacle misses a PC on the bridge, it slams the log itself, forcing everyone on the log to make a **DC 12 DEX save** or hang by their hands over the 15-ft waterfall!'
      },
      {
        num: 32, x: 775, y: 220, type: 'landmark', showOnPlayer: true,
        name: 'Grotto of the Rescued Water-Warden (Bram)',
        summary: 'Undercut waterfall shelf where Bram is trapped by the tentacle!',
        details: 'Roleplay & Reward: Huddled on a high dry shelf behind the upper cascade is **Bram, the Distillery Water-Warden** (wounded leg, clutching the Distillery Master-Valve Key). He warns: *"That thing in the spring sent one arm all the way down here and dragged my mule under! It’s blocking the main spring vent—if we don’t kill the beast at the source, the town’s water will stay poisoned forever!"* He gives the party **3 flasks of Alchemist’s Fire** and a **Scroll of Lightning Bolt**.'
      }
    ]
  },
  {
    id: 9,
    act: 4,
    title: 'Sheet 9: Kraken Challenge II — Whack-a-Tentacle Sinkhole Maze',
    flow: 'W-N-E',
    exits: { W: '<- SHEET 7', N: '<- SHEET 8 (BRIDGE)', E: 'SOUTH TRENCH -> SHEET 11' },
    links: [11],
    graphPos: { x: 225, y: 300 },
    readAloud: 'The southern creek bed is honeycomb-riddled with three circular blue-black sinkholes connected beneath the rock. Bubbles burst from one hole, then another, as a single colossal tentacle darts between the vents like a hunting moray eel!',
    pois: [
      {
        num: 33, x: 250, y: 410, type: 'trap', showOnPlayer: false,
        name: 'KRAKEN CHALLENGE #2: The Three-Vent Sinkhole Gauntlet',
        summary: 'A single long-range tentacle pops out of Vent A, B, or C each round!',
        details: 'KRAKEN TENTACLE CHALLENGE #2 (Dynamic Puzzle/Combat): Three underwater karst vents (West #33, Center #34, East #36) connect to the same long-distance Kraken tentacle (AC 14, 35 HP).\n• **Whack-a-Tentacle Mechanic:** At the start of each round, roll 1d6 (1-2: West Vent, 3-4: Center Vent, 5-6: East Vent)—ripples give a **DC 12 Perception** tell right before the tentacle erupts from that vent with a **20-ft Sweeping Lash** (all creatures within 15 ft make a **DC 13 DEX save** or take 2d6+3 bludgeoning and are pulled 10 ft into the water).\n• **Smart Counterplay:** Players can ready attacks for the bubbling vent, OR roll heavy creek boulders into two of the vents (**DC 13 Athletics**) to trap the tentacle in a single hole so it cannot retreat!'
      },
      {
        num: 34, x: 525, y: 385, type: 'monster', showOnPlayer: false,
        name: 'Central Sinkhole Vent & Scavenger Quippers',
        summary: 'Main eruption hole surrounded by 2 Swarms of Blood-Frenzied Quippers.',
        details: 'Hazard & Minions: **2 Swarms of Quippers** (AC 13, 22 HP) lurk in the central pool, biting anyone knocked into the water by the sweeping tentacle.'
      },
      {
        num: 35, x: 480, y: 150, type: 'landmark', showOnPlayer: true,
        name: 'High Limestone Balcony (From Sheet 8 Bridge)',
        summary: '10-ft-high stone ledge with loose boulders perfect for plugging vents!',
        details: 'Environmental Advantage: Three large limestone boulders sit perched on this northern shelf. Shoving one down (**DC 12 Athletics**) deals **3d8 bludgeoning damage** to the tentacle in the Central Vent (#34) and seals that vent permanently!'
      },
      {
        num: 36, x: 760, y: 440, type: 'landmark', showOnPlayer: true,
        name: 'Eastern Vent & Sunken Merchant Strongbox',
        summary: 'Previous victim’s gear tangled around the eastern sinkhole rim.',
        details: 'Treasure: Wedged in the rock teeth of the eastern vent is a drowned ranger’s pack containing *Boots of Striding and Springing* (immune to mud slow!), 90 gp, and a *Potion of Greater Healing* (4d4+4).'
      }
    ]
  },
  {
    id: 10,
    act: 4,
    title: 'Sheet 10: Kraken Challenge III — The Last Beaver & The Constricted Gorge',
    flow: 'W-E',
    exits: { W: '<- SHEET 8', E: 'KRAKEN SINKHOLE -> SHEET 12' },
    links: [12],
    graphPos: { x: 75, y: 356 },
    readAloud: 'Just ahead lies the cavern mouth of Blackwater Spring! Across this narrow canyon throat stands a final, half-smashed barricade of oak trunks. Atop the logs, one huge, battle-scarred Elder Dire Beaver is pinned down by a forty-foot Kraken tentacle wrapping around the entire dam like a boa constrictor!',
    pois: [
      {
        num: 37, x: 230, y: 360, type: 'landmark', showOnPlayer: true,
        name: 'Upstream-Pointing Beaver Spike Barricade',
        summary: 'Sharpened oak trunks pointing EAST toward the Kraken’s lair.',
        details: 'Visual Proof: Every sharpened stake in this final beaver barricade points *upstream toward Sheet 12*—the beavers’ last line of defense against the Kraken.'
      },
      {
        num: 38, x: 470, y: 335, type: 'monster', showOnPlayer: true,
        name: 'KRAKEN CHALLENGE #3: Saving "Old Iron-Tooth" from the Constrictor Tentacle',
        summary: '3-Round Timed Rescue! Free the Elder Dire Beaver before the tentacle crushes the dam.',
        details: 'KRAKEN TENTACLE CHALLENGE #3 (Timed Rescue & Ally Recruitment): A colossal **Long-Range Constrictor Tentacle** (AC 14, 40 HP) has coiled around the last dam and pinned **Old Iron-Tooth, the Elder Dire Beaver** (AC 14, 42 HP).\n• **The 3-Round Countdown:** Each round on Initiative 20, the tentacle squeezes for **2d8 bludgeoning damage** against Iron-Tooth and the dam logs. If the party does not deal 40 damage to the tentacle (or sever its grip with a DC 15 Athletics / 20 slashing damage in 1 turn) within 3 rounds, the dam collapses in a flash wave (**DC 13 DEX save** or 3d6 bludgeoning) and Iron-Tooth is dragged toward Sheet 12!\n• **Reward for Saving Iron-Tooth:** If rescued and calmed (DC 10 Animal Handling or any healing), **Old Iron-Tooth joins the party** for the Boss Fight on Sheet 12 (Bite +5 for 2d6+3, double damage vs tentacles)!'
      },
      {
        num: 39, x: 545, y: 510, type: 'trap', showOnPlayer: false,
        name: 'Pressurized Ink-Geyser Vent',
        summary: 'Cracked rock fissure spraying blinding black water (DC 12 CON).',
        details: 'Hazard: The Kraken’s bulk upstream pressurizes this fissure; every round on Initiative 10, a 15-ft line of inky water sprays south (DC 12 CON save or Blinded until end of next turn).'
      },
      {
        num: 40, x: 785, y: 365, type: 'landmark', showOnPlayer: true,
        name: 'Cavern Maw of Blackwater Spring (To Sheet 12)',
        summary: 'Yawning limestone archway where the retreating tentacle slithers home.',
        details: 'Transition to Boss: Leads directly onto the northern entry ledge of Sheet 12.'
      }
    ]
  },
  {
    id: 11,
    act: 4,
    title: 'Sheet 11: Kraken Challenge IV — The Blind Ink-Fog Canyon',
    flow: 'W-N-E',
    exits: { W: '<- SHEET 9', E: 'KRAKEN SINKHOLE -> SHEET 12' },
    links: [12],
    graphPos: { x: 225, y: 356 },
    readAloud: 'The southern approach to Blackwater Spring is a steep-walled gorge filled with waist-deep black water and a knee-high fog of stinging cephalopod ink. Beneath the opaque surface, a long hunting tentacle uses vibrations in the water to stalk anyone who splashes!',
    pois: [
      {
        num: 41, x: 260, y: 400, type: 'trap', showOnPlayer: false,
        name: 'Undercut Slippery Ledge (Slip-into-the-Water Check)',
        summary: 'Narrow dry rock ribbon along the south wall (DC 12 Acrobatics).',
        details: 'Environmental Hazard: Staying out of the water requires edging along a wet 2-ft limestone shelf (**DC 12 Acrobatics**). Slipping drops the character into the waist-deep water, immediately alerting the Tremorsense Tentacle at #42!'
      },
      {
        num: 42, x: 500, y: 380, type: 'monster', showOnPlayer: false,
        name: 'KRAKEN CHALLENGE #4: The Tremorsense Stalker Tentacle',
        summary: 'Stealth vs. Vibration Challenge! The tentacle strikes anyone moving in the water.',
        details: 'KRAKEN TENTACLE CHALLENGE #4 (Stealth & Decoy Challenge): The Kraken extends a **45-ft Sensor-Tentacle** (AC 14, 35 HP) into this ink-darkened channel. Because the water is black, the tentacle hunts purely by **water-vibration (Tremorsense 60 ft in water)**!\n• **How It Works:** Any character who moves through the water without succeeding on a **DC 12 Dexterity (Stealth)** check triggers an immediate reaction **Under-Water Snatch** (+6 to hit, 1d10+3 bludgeoning + Grappled & pulled prone underwater).\n• **Clever Solutions:** Players can (a) stay high on the slick rock ledges (#41/#43), (b) toss heavy boulders or whiskey barrels into the water as **decoys** to make the tentacle strike the wrong spot (granting advantage on all attacks against it for 1 round!), or (c) electrify the water with lightning magic!'
      },
      {
        num: 43, x: 500, y: 175, type: 'landmark', showOnPlayer: true,
        name: 'Overhanging Stalactite Shelf & Decoy Boulders',
        summary: 'Dry northern rock balcony stocked with loose rocks & a rope anchor.',
        details: 'Tactical Spot: Climbing to this shelf (DC 11 Athletics) lets a character tie a traverse rope across the gorge or drop heavy decoy stones into the water below.'
      },
      {
        num: 44, x: 785, y: 375, type: 'landmark', showOnPlayer: true,
        name: 'Southern Cavern Causeway (To Sheet 12)',
        summary: 'Natural stone steps rising into the southern flank of the Boss Cavern.',
        details: 'Transition to Boss: Leads directly onto the southern limestone ledges of Sheet 12.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // STAGE 5 (SHEET 12): FINAL BOSS — THE KRAKEN OF BLACKWATER SPRING
  // --------------------------------------------------------------------------
  {
    id: 12,
    act: 5,
    title: 'Sheet 12: BOSS — The Kraken of Blackwater Spring',
    flow: 'CAVERN',
    exits: { W: '<- SHEET 10 / 11', E: 'UNDERDARK SPRING FISSURE' },
    links: [],
    graphPos: { x: 150, y: 408 },
    readAloud: 'The creek’s source is a vast, echoed limestone sinkhole cavern. Because the party took so long to reach the headwaters, the aberration that crawled up from the flooded Underdark fissure has grown colossal—a Juvenile Kraken wedged directly over the town’s artesian spring vent, surrounded by shattered beaver timber and swirling black ink!',
    pois: [
      {
        num: 45, x: 195, y: 360, type: 'landmark', showOnPlayer: true,
        name: 'Shattered Megadam Causeway (Entry Ledges)',
        summary: 'Remnants of the primeval beaver dam forming dry fighting platforms.',
        details: 'Tactical Entry: Parties arriving from Sheet 10 enter on the northern timber platform; parties from Sheet 11 enter on the southern limestone ledge. If **Old Iron-Tooth (#38)** was rescued, he charges in alongside the party and automatically grapples/distracts one of the Kraken’s tentacles!'
      },
      {
        num: 46, x: 420, y: 195, type: 'trap', showOnPlayer: false,
        name: 'Cracked Limestone Ceiling Pillars (Boss Environmental Weapon)',
        summary: 'Topple the cavern pillars onto the Kraken for 4d10 damage & stun!',
        details: 'Tactical Interaction: Two cracked limestone pillars flank the north and south cavern walls (AC 13, 25 HP, or DC 14 Athletics with a crowbar / Old Iron-Tooth chewing the base). Collapsing a pillar drops tons of rock into the sinkhole, dealing **4d10 bludgeoning damage** to the Kraken and stunning one of its tentacles for 1 round!'
      },
      {
        num: 47, x: 590, y: 365, type: 'monster', showOnPlayer: true,
        name: 'THE JUVENILE CREEK KRAKEN (FINAL BOSS)',
        summary: 'Huge Aberration/Monstrosity (115 HP) + Long-Reach Tentacles.',
        details: 'FINAL BOSS ENCOUNTER: **The Creek Kraken** (AC 15, 115 HP; starts at **95 HP** if the party severed/defeated at least two of its long-range tentacles on Sheets 8–11!).\n• **Tactics:** Uses *Multiattack* (two 25-ft *Tentacle Slams* +7 to hit, 2d6+4 bludgeoning + Grappled DC 14, and one *Crushing Bite* +7 for 3d8+4 or *Fling* 20 ft onto the slick rocks).\n• **Lair Action (Initiative 20):** Either (a) **Tidal Undertow** pulls all creatures in the water 15 ft toward the deep sinkhole (DC 13 STR save), or (b) **Slick Ink-Wave** coats a 20-ft bank section in grease (DC 13 Acrobatics or fall Prone).'
      },
      {
        num: 48, x: 785, y: 365, type: 'landmark', showOnPlayer: true,
        name: 'The Pure Artesian Spring & Sunken Hoard',
        summary: 'Crystal-clear spring vent & the drowned treasure of Blackwater Gorge.',
        details: 'Victory & Resolution: Slaying the Kraken causes its carcass to sink back down the Underdark fissure, releasing a roaring geyser of crystal-clear mountain spring water! Within an hour, clean water flushes the entire creek canyon down to Oakhaven—the Town Distiller’s vats flow once more, and the surviving Dire Beavers peacefully return to their side-ponds!\nSunken Hoard at the Spring Rim: 450 gp, a *Decanter of Endless Water* (which can also pour aged single-malt!), a *Mariner’s Scale Mail +1*, and a *Trident of Fish Command*.'
      }
    ]
  }
];

// ============================================================================
// APPLICATION STATE & CTRL+Z UNDO/REDO STACK
// ============================================================================
let appState = {
  seed: 'DYSON-KRAKEN',
  presetId: 'beavers_to_kraken',
  campaign: { ...STORY_PRESETS.beavers_to_kraken },
  activePageId: 1,
  activeView: 'editor',         // 'editor' | 'compare' | 'overview' | 'dm-guide'
  mapEdition: 'player',         // 'player' | 'dm'
  playerNumStyle: 'landmarks_only', // 'landmarks_only' | 'sheet_only' | 'all_subtle'
  showGrid: true,
  toolMode: 'move_poi',
  selectedPoiNum: 1,
  pages: []
};

const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 45;

function cloneCampaignSnapshot() {
  return JSON.stringify({
    seed: appState.seed,
    presetId: appState.presetId,
    campaign: appState.campaign,
    activePageId: appState.activePageId,
    pages: appState.pages
  });
}

function pushUndoState() {
  const snap = cloneCampaignSnapshot();
  if (undoStack.length > 0 && undoStack[undoStack.length - 1] === snap) return;
  undoStack.push(snap);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function performUndo() {
  if (undoStack.length === 0) return;
  redoStack.push(cloneCampaignSnapshot());
  const prevSnap = JSON.parse(undoStack.pop());
  restoreSnapshot(prevSnap);
  updateUndoRedoButtons();
}

function performRedo() {
  if (redoStack.length === 0) return;
  undoStack.push(cloneCampaignSnapshot());
  const nextSnap = JSON.parse(redoStack.pop());
  restoreSnapshot(nextSnap);
  updateUndoRedoButtons();
}

function restoreSnapshot(snap) {
  appState.seed = snap.seed;
  appState.presetId = snap.presetId;
  appState.campaign = snap.campaign;
  appState.pages = snap.pages;
  appState.activePageId = snap.activePageId;
  refreshAllViews();
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = undoStack.length === 0;
  if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

// ============================================================================
// TRUE ORGANIC VECTOR SPLINE GENERATOR (No Blocky Grid Cells!)
// ============================================================================
function pointsToClosedSmoothPath(pts, tension = 0.22) {
  if (!pts || pts.length < 3) return '';
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += `C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} `;
  }
  return d + 'Z';
}

function buildRibbonPolygon(samples, rng, wobbleAmt = 14) {
  const topEdge = [];
  const botEdge = [];
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const wob1 = (rng() - 0.5) * wobbleAmt * 2;
    const wob2 = (rng() - 0.5) * wobbleAmt * 2;
    topEdge.push({
      x: s.x + s.nx * (s.wTop + wob1),
      y: s.y + s.ny * (s.wTop + wob1)
    });
    botEdge.push({
      x: s.x - s.nx * (s.wBot + wob2),
      y: s.y - s.ny * (s.wBot + wob2)
    });
  }
  const poly = [...topEdge, ...botEdge.reverse()];
  return pointsToClosedSmoothPath(poly, 0.21);
}

function sampleSplineBranch(ctrlPts, numSamples = 26) {
  const samples = [];
  const n = ctrlPts.length;
  for (let i = 0; i <= numSamples; i++) {
    const tGlobal = (i / numSamples) * (n - 1);
    const idx = Math.min(n - 2, Math.floor(tGlobal));
    const t = tGlobal - idx;

    const p0 = ctrlPts[Math.max(0, idx - 1)];
    const p1 = ctrlPts[idx];
    const p2 = ctrlPts[idx + 1];
    const p3 = ctrlPts[Math.min(n - 1, idx + 2)];

    const t2 = t * t;
    const t3 = t2 * t;
    const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
    const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    const tx = 0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
    const ty = 0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;

    const wBank = p1.wBank + (p2.wBank - p1.wBank) * t;
    const wWater = p1.wWater + (p2.wWater - p1.wWater) * t;

    samples.push({ x, y, tx: tx / len, ty: ty / len, nx, ny, wBank, wWater });
  }
  return samples;
}

function buildOrganicBlobPath(cx, cy, rx, ry, numPts, rng, irregularity = 0.22) {
  const pts = [];
  for (let i = 0; i < numPts; i++) {
    const ang = (i / numPts) * Math.PI * 2;
    const radScale = 1 + (rng() - 0.5) * 2 * irregularity;
    pts.push({
      x: cx + Math.cos(ang) * rx * radScale,
      y: cy + Math.sin(ang) * ry * radScale
    });
  }
  return pointsToClosedSmoothPath(pts, 0.24);
}

function generateAllPages(seedStr) {
  appState.seed = seedStr;
  appState.pages = SHEET_BLUEPRINTS.map(bp => {
    const page = {
      id: bp.id,
      act: bp.act,
      title: bp.title,
      flow: bp.flow,
      exits: { ...bp.exits },
      links: [...bp.links],
      graphPos: { ...bp.graphPos },
      readAloud: bp.readAloud,
      pois: bp.pois.map(p => ({ ...p })),
      bankPaths: [],
      waterPaths: [],
      deepPaths: [],
      islandPaths: [],
      flowLines: [],
      dams: [],
      boulders: [],
      stumps: []
    };
    carveDysonCreekGeometry(page, `${seedStr}-SHEET-${bp.id}`);
    return page;
  });
}

function carveDysonCreekGeometry(page, pageSeed) {
  const rng = createRNG(pageSeed);
  const bankPaths = [];
  const waterPaths = [];
  const deepPaths = [];
  const islandPaths = [];
  const flowLines = [];
  const dams = [];
  const boulders = [];
  const stumps = [];

  function addCreekBranch(ctrlPts, numSamples = 24) {
    const samples = sampleSplineBranch(ctrlPts, numSamples);

    const bankSamples = samples.map((s, idx) => {
      const alcoveTop = (idx % 6 === 2) ? 38 + rng() * 35 : 0;
      const alcoveBot = (idx % 7 === 4) ? 38 + rng() * 35 : 0;
      return {
        ...s,
        wTop: s.wBank + alcoveTop,
        wBot: s.wBank + alcoveBot
      };
    });
    bankPaths.push(buildRibbonPolygon(bankSamples, rng, 18));

    const waterSamples = samples.map(s => ({
      ...s,
      wTop: s.wWater,
      wBot: s.wWater
    }));
    waterPaths.push(buildRibbonPolygon(waterSamples, rng, 9));

    // Include deep pools on Stage 1 (Plunge Pools) as well as upper creek!
    const deepSamples = samples.slice(5, samples.length - 5).map(s => ({
      ...s,
      wTop: s.wWater * 0.46,
      wBot: s.wWater * 0.46
    }));
    if (deepSamples.length > 4) {
      deepPaths.push(buildRibbonPolygon(deepSamples, rng, 5));
    }

    for (let offset of [-0.52, -0.22, 0.1, 0.45]) {
      let d = '';
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const px = s.x + s.nx * (s.wWater * offset) + (rng() - 0.5) * 4;
        const py = s.y + s.ny * (s.wWater * offset) + (rng() - 0.5) * 4;
        d += (i === 0 ? `M ${px.toFixed(1)},${py.toFixed(1)} ` : `L ${px.toFixed(1)},${py.toFixed(1)} `);
      }
      flowLines.push(d);
    }

    return samples;
  }

  const m1 = (rng() - 0.5) * 90;
  const m2 = (rng() - 0.5) * 90;

  if (page.flow === 'W-E') {
    addCreekBranch([
      { x: -30, y: 360, wBank: 185, wWater: 98 },
      { x: 230, y: 340 + m1, wBank: 205, wWater: 110 },
      { x: 460, y: 375 - m1 * 0.7, wBank: 225, wWater: 122 },
      { x: 690, y: 335 + m2, wBank: 195, wWater: 105 },
      { x: 930, y: 360, wBank: 185, wWater: 98 }
    ]);
  } else if (page.flow === 'W-NE-SE') {
    addCreekBranch([
      { x: -30, y: 360, wBank: 195, wWater: 105 },
      { x: 250, y: 365 + m1 * 0.5, wBank: 220, wWater: 120 },
      { x: 450, y: 340, wBank: 235, wWater: 130 },
      { x: 685, y: 225, wBank: 170, wWater: 92 },
      { x: 930, y: 195, wBank: 165, wWater: 88 }
    ]);
    addCreekBranch([
      { x: 410, y: 340, wBank: 180, wWater: 95 },
      { x: 525, y: 500, wBank: 175, wWater: 92 },
      { x: 565, y: 750, wBank: 170, wWater: 90 }
    ], 14);
  } else if (page.flow === 'W-N-E') {
    addCreekBranch([
      { x: -30, y: 400, wBank: 185, wWater: 100 },
      { x: 260, y: 390 + m1 * 0.5, wBank: 205, wWater: 112 },
      { x: 485, y: 375, wBank: 220, wWater: 120 },
      { x: 710, y: 385 + m2 * 0.5, wBank: 195, wWater: 105 },
      { x: 930, y: 375, wBank: 185, wWater: 100 }
    ]);
    addCreekBranch([
      { x: 485, y: 385, wBank: 165, wWater: 85 },
      { x: 470, y: 185, wBank: 160, wWater: 82 },
      { x: 485, y: -30, wBank: 155, wWater: 80 }
    ], 14);
  } else if (page.flow === 'N-E') {
    addCreekBranch([
      { x: 420, y: -30, wBank: 180, wWater: 96 },
      { x: 410 + m1 * 0.4, y: 230, wBank: 210, wWater: 112 },
      { x: 465, y: 420, wBank: 230, wWater: 125 },
      { x: 690, y: 395 + m2 * 0.4, wBank: 195, wWater: 105 },
      { x: 930, y: 375, wBank: 185, wWater: 98 }
    ]);
  } else if (page.flow === 'W-N-S-E') {
    addCreekBranch([
      { x: -30, y: 360, wBank: 185, wWater: 100 },
      { x: 250, y: 350, wBank: 210, wWater: 115 },
      { x: 465, y: 360, wBank: 250, wWater: 140 },
      { x: 695, y: 295, wBank: 190, wWater: 100 },
      { x: 930, y: 265, wBank: 180, wWater: 95 }
    ]);
    addCreekBranch([
      { x: 465, y: 350, wBank: 175, wWater: 92 },
      { x: 500, y: 535, wBank: 170, wWater: 88 },
      { x: 515, y: 750, wBank: 165, wWater: 85 }
    ], 14);
  } else if (page.flow === 'CAVERN') {
    addCreekBranch([
      { x: -30, y: 360, wBank: 175, wWater: 95 },
      { x: 220, y: 360, wBank: 205, wWater: 110 },
      { x: 480, y: 365, wBank: 260, wWater: 160 }
    ], 14);
    bankPaths.push(buildOrganicBlobPath(565, 360, 325, 290, 24, rng, 0.16));
    waterPaths.push(buildOrganicBlobPath(580, 365, 240, 210, 22, rng, 0.14));
    deepPaths.push(buildOrganicBlobPath(595, 365, 155, 135, 18, rng, 0.12));
  }

  const grottoSpots = [
    { x: 335, y: 190, rx: 85, ry: 68 },
    { x: 560, y: 525, rx: 95, ry: 72 }
  ];
  grottoSpots.forEach(g => {
    bankPaths.push(buildOrganicBlobPath(g.x + (rng() - 0.5) * 40, g.y + (rng() - 0.5) * 20, g.rx, g.ry, 14, rng, 0.2));
  });

  if (page.id === 12) {
    islandPaths.push(buildOrganicBlobPath(420, 200, 42, 34, 12, rng, 0.18));
    islandPaths.push(buildOrganicBlobPath(430, 525, 45, 36, 12, rng, 0.18));
  } else {
    const ix = 320 + rng() * 260;
    const iy = (rng() < 0.5) ? 205 + rng() * 35 : 505 - rng() * 35;
    islandPaths.push(buildOrganicBlobPath(ix, iy, 36 + rng() * 14, 26 + rng() * 12, 12, rng, 0.2));
  }

  // Only put Beaver Dams on Stage 3+ sheets (Sheets 5, 6, 7, 10, 12) — NO dam on Sheets 1-4!
  if ([5, 6, 7, 10, 12].includes(page.id)) {
    const damX = page.id === 6 ? 495 : (page.id === 7 ? 395 : (page.id === 12 ? 205 : 465));
    dams.push({
      x1: damX - 15,
      y1: 205,
      x2: damX + 15,
      y2: 515,
      breached: page.id === 12
    });
  }

  for (let i = 0; i < 12; i++) {
    const px = 110 + rng() * 680;
    const py = (i % 2 === 0) ? (165 + rng() * 80) : (480 + rng() * 80);
    if (i % 3 !== 0 || page.id <= 2) {
      boulders.push({ x: px, y: py, rad: 10 + rng() * 11 });
    } else {
      stumps.push({ x: px, y: py });
    }
  }

  page.bankPaths = bankPaths;
  page.waterPaths = waterPaths;
  page.deepPaths = deepPaths;
  page.islandPaths = islandPaths;
  page.flowLines = flowLines;
  page.dams = dams;
  page.boulders = boulders;
  page.stumps = stumps;
}

// ============================================================================
// AUTHENTIC DYSON LOGOS SVG RENDERER (Supports 'player' vs 'dm' Edition!)
// ============================================================================
function buildDysonSVGDefs(page, uid) {
  const rng = createRNG(`DYSON-HATCH-${uid}`);
  let hatchLines = '';
  const cell = 32;
  for (let gy = 0; gy < 160; gy += cell) {
    for (let gx = 0; gx < 160; gx += cell) {
      const cx = gx + cell / 2;
      const cy = gy + cell / 2;
      const baseAngles = [25, 115, -35, 65, 155, -70];
      const angDeg = baseAngles[((gx / cell) * 3 + (gy / cell) * 5) % baseAngles.length] + (rng() - 0.5) * 14;
      const rad = (angDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nx = -sin;
      const ny = cos;

      for (let s = -2; s <= 2; s++) {
        const offset = s * 5.4 + (rng() - 0.5) * 0.8;
        const len = 14 + (rng() - 0.5) * 3;
        const x1 = cx + nx * offset - cos * len;
        const y1 = cy + ny * offset - sin * len;
        const x2 = cx + nx * offset + cos * len;
        const y2 = cy + ny * offset + sin * len;
        const mx = (x1 + x2) / 2 + nx * (rng() - 0.5) * 1.6;
        const my = (y1 + y2) / 2 + ny * (rng() - 0.5) * 1.6;
        hatchLines += `<path d="M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="#111" stroke-width="1.25" fill="none" stroke-linecap="round"/>`;
      }
    }
  }

  const allBankPathsMarkup = (page.bankPaths || []).map(d => `<path d="${d}" />`).join('');
  const allWaterPathsMarkup = (page.waterPaths || []).map(d => `<path d="${d}" />`).join('');
  const allIslandPathsMarkup = (page.islandPaths || []).map(d => `<path d="${d}" />`).join('');

  return `
    <defs>
      <pattern id="dyson-hatch-${uid}" width="160" height="160" patternUnits="userSpaceOnUse">
        <rect width="160" height="160" fill="#ffffff"/>
        ${hatchLines}
      </pattern>

      <pattern id="dyson-stipple-${uid}" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect width="50" height="50" fill="#ffffff"/>
        <circle cx="8" cy="10" r="1.15" fill="#111"/>
        <circle cx="14" cy="15" r="0.85" fill="#333"/>
        <circle cx="35" cy="9" r="1.2" fill="#111"/>
        <circle cx="24" cy="24" r="1.0" fill="#222"/>
        <circle cx="42" cy="28" r="1.3" fill="#111"/>
        <circle cx="11" cy="37" r="1.1" fill="#111"/>
        <circle cx="29" cy="41" r="0.9" fill="#333"/>
        <circle cx="38" cy="44" r="1.15" fill="#111"/>
      </pattern>

      <pattern id="dyson-grid-${uid}" width="${CELL_PX}" height="${CELL_PX}" patternUnits="userSpaceOnUse">
        <path d="M ${CELL_PX} 0 L 0 0 0 ${CELL_PX}" fill="none" stroke="#333" stroke-width="0.75" stroke-dasharray="4,4"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#000" stroke-width="1.4"/>
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#000" stroke-width="1.4"/>
      </pattern>

      <pattern id="dyson-deep-${uid}" width="40" height="14" patternUnits="userSpaceOnUse">
        <rect width="40" height="14" fill="#ffffff"/>
        <path d="M 0,4 Q 10,1 20,4 T 40,4" stroke="#000" stroke-width="1.5" fill="none"/>
        <path d="M 0,10 Q 10,7 20,10 T 40,10" stroke="#000" stroke-width="1.1" stroke-dasharray="6,3" fill="none"/>
      </pattern>

      <mask id="dyson-halo-mask-${uid}">
        <rect width="${W}" height="${H}" fill="black"/>
        <g fill="none" stroke="white" stroke-width="96" stroke-linejoin="round" stroke-linecap="round">
          ${allBankPathsMarkup}
        </g>
        <g fill="black" stroke="none">
          ${allBankPathsMarkup}
        </g>
        <g fill="white" stroke="white" stroke-width="36" stroke-linejoin="round">
          ${allIslandPathsMarkup}
        </g>
      </mask>

      <clipPath id="clip-cavern-${uid}">
        ${allBankPathsMarkup}
      </clipPath>

      <clipPath id="clip-water-${uid}">
        ${allWaterPathsMarkup}
      </clipPath>
    </defs>
  `;
}

function renderBeaverDamSVG(dam, uid) {
  const rng = createRNG(`DAM-${uid}-${dam.x1}`);
  let logs = '';
  const dist = Math.hypot(dam.x2 - dam.x1, dam.y2 - dam.y1);
  const count = Math.floor(dist / 8);

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    if (dam.breached && t > 0.35 && t < 0.65) continue;

    const cx = dam.x1 + (dam.x2 - dam.x1) * t + (rng() - 0.5) * 16;
    const cy = dam.y1 + (dam.y2 - dam.y1) * t + (rng() - 0.5) * 9;
    const len = 22 + rng() * 20;
    const ang = (rng() - 0.5) * 65;
    const rad = (ang * Math.PI) / 180;
    const lx1 = cx - Math.cos(rad) * len;
    const ly1 = cy - Math.sin(rad) * len;
    const lx2 = cx + Math.cos(rad) * len;
    const ly2 = cy + Math.sin(rad) * len;

    logs += `
      <line x1="${lx1.toFixed(1)}" y1="${ly1.toFixed(1)}" x2="${lx2.toFixed(1)}" y2="${ly2.toFixed(1)}" stroke="#000" stroke-width="8.5" stroke-linecap="round"/>
      <line x1="${lx1.toFixed(1)}" y1="${ly1.toFixed(1)}" x2="${lx2.toFixed(1)}" y2="${ly2.toFixed(1)}" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="${lx1.toFixed(1)}" y1="${ly1.toFixed(1)}" x2="${lx2.toFixed(1)}" y2="${ly2.toFixed(1)}" stroke="#000" stroke-width="1.1" stroke-dasharray="6,4" stroke-linecap="round"/>
    `;
  }
  return `<g class="dyson-dam">${logs}</g>`;
}

// Render either the PLAYER EDITION or DM EDITION of a sheet
function buildDysonMapSVG(page, uid, options = {}) {
  const edition = options.edition || appState.mapEdition; // 'player' | 'dm'
  const showGrid = options.showGrid !== undefined ? options.showGrid : appState.showGrid;
  const playerNumStyle = options.playerNumStyle || appState.playerNumStyle;

  const bankPathsMarkup = (page.bankPaths || []).map(d => `<path d="${d}" />`).join('');
  const waterPathsMarkup = (page.waterPaths || []).map(d => `<path d="${d}" />`).join('');
  const deepPathsMarkup = (page.deepPaths || []).map(d => `<path d="${d}" />`).join('');
  const islandPathsMarkup = (page.islandPaths || []).map(d => `<path d="${d}" />`).join('');
  const flowLinesMarkup = (page.flowLines || []).map(d =>
    `<path d="${d}" fill="none" stroke="#111" stroke-width="1.25" stroke-dasharray="14,8,5,8" stroke-linecap="round"/>`
  ).join('');

  let detailsMarkup = '';
  (page.dams || []).forEach(d => {
    detailsMarkup += renderBeaverDamSVG(d, uid);
  });

  (page.boulders || []).forEach(b => {
    detailsMarkup += `
      <g class="dyson-boulder">
        <ellipse cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" rx="${(b.rad * 1.15).toFixed(1)}" ry="${(b.rad * 0.88).toFixed(1)}" fill="#fff" stroke="#000" stroke-width="2.6"/>
        <path d="M ${(b.x - b.rad * 0.5).toFixed(1)},${(b.y + b.rad * 0.3).toFixed(1)} L ${(b.x + b.rad * 0.3).toFixed(1)},${(b.y - b.rad * 0.5).toFixed(1)}" stroke="#000" stroke-width="1.2"/>
        <path d="M ${(b.x - b.rad * 0.1).toFixed(1)},${(b.y + b.rad * 0.5).toFixed(1)} L ${(b.x + b.rad * 0.6).toFixed(1)},${(b.y - b.rad * 0.1).toFixed(1)}" stroke="#000" stroke-width="1.2"/>
      </g>
    `;
  });

  (page.stumps || []).forEach(s => {
    detailsMarkup += `
      <g class="dyson-stump" transform="translate(${s.x.toFixed(1)}, ${s.y.toFixed(1)})">
        <circle cx="0" cy="0" r="9.5" fill="#fff" stroke="#000" stroke-width="2.4"/>
        <circle cx="0" cy="0" r="4.5" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="-9" y1="0" x2="-14" y2="3" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="9" y1="0" x2="14" y2="3" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="0" y1="9" x2="2" y2="14" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
      </g>
    `;
  });

  if (page.id === 12 && edition === 'dm') {
    const kx = 590, ky = 365;
    detailsMarkup += `
      <g class="dyson-kraken-illustration" pointer-events="none">
        <circle cx="${kx}" cy="${ky}" r="74" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="8,5"/>
        <path d="M ${kx - 25},${ky - 20} C ${kx - 90},${ky - 95} ${kx - 130},${ky - 30} ${kx - 155},${ky - 65}" stroke="#000" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M ${kx - 25},${ky - 20} C ${kx - 90},${ky - 95} ${kx - 130},${ky - 30} ${kx - 155},${ky - 65}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M ${kx - 25},${ky + 20} C ${kx - 95},${ky + 90} ${kx - 135},${ky + 30} ${kx - 160},${ky + 70}" stroke="#000" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M ${kx - 25},${ky + 20} C ${kx - 95},${ky + 90} ${kx - 135},${ky + 30} ${kx - 160},${ky + 70}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
    `;
  }

  // Exit Banners
  let exitsMarkup = '';
  if (page.exits?.W) {
    exitsMarkup += `
      <g transform="translate(16, 360) rotate(-90)">
        <rect x="-85" y="-12" width="170" height="22" rx="3" fill="#fff" stroke="#000" stroke-width="2.2"/>
        <text x="0" y="4" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="11" fill="#000">&larr; ${page.exits.W}</text>
      </g>
    `;
  }
  if (page.exits?.E) {
    exitsMarkup += `
      <g transform="translate(884, 360) rotate(90)">
        <rect x="-85" y="-12" width="170" height="22" rx="3" fill="#fff" stroke="#000" stroke-width="2.2"/>
        <text x="0" y="4" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="11" fill="#000">${page.exits.E} &rarr;</text>
      </g>
    `;
  }
  if (page.exits?.N) {
    exitsMarkup += `
      <g transform="translate(450, 16)">
        <rect x="-90" y="-11" width="180" height="22" rx="3" fill="#fff" stroke="#000" stroke-width="2.2"/>
        <text x="0" y="4" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="11" fill="#000">&uarr; ${page.exits.N}</text>
      </g>
    `;
  }
  if (page.exits?.S) {
    exitsMarkup += `
      <g transform="translate(450, 704)">
        <rect x="-90" y="-11" width="180" height="22" rx="3" fill="#fff" stroke="#000" stroke-width="2.2"/>
        <text x="0" y="4" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="11" fill="#000">&darr; ${page.exits.S}</text>
      </g>
    `;
  }

  // ==========================================================================
  // PLAYER EDITION vs DM EDITION NUMBERING LOGIC (Using <g transform="translate(x,y)"> for smooth dragging!)
  // ==========================================================================
  let poisMarkup = '';

  if (edition === 'player') {
    poisMarkup += `
      <g transform="translate(56, 46)" pointer-events="none">
        <rect x="-38" y="-22" width="76" height="44" rx="4" fill="#fff" stroke="#000" stroke-width="3"/>
        <rect x="-34" y="-18" width="68" height="36" rx="2" fill="none" stroke="#000" stroke-width="1"/>
        <text x="0" y="-4" text-anchor="middle" font-family="monospace" font-weight="800" font-size="9" fill="#000">AREA MAP</text>
        <text x="0" y="13" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="18" fill="#000">#${page.id}</text>
      </g>
    `;

    if (playerNumStyle !== 'sheet_only') {
      (page.pois || []).forEach(poi => {
        if (playerNumStyle === 'landmarks_only' && !poi.showOnPlayer) {
          return;
        }
        // Included an invisible hit-circle so dragging works effortlessly even on plain un-circled player numbers!
        poisMarkup += `
          <g class="dyson-poi-marker" data-poi-num="${poi.num}" transform="translate(${poi.x}, ${poi.y})" style="cursor: grab;">
            <circle cx="0" cy="0" r="24" fill="transparent" />
            <text x="0" y="6" text-anchor="middle"
                  font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="20"
                  stroke="#ffffff" stroke-width="7" stroke-linejoin="round" fill="#000000">${poi.num}</text>
            <text x="0" y="6" text-anchor="middle"
                  font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="20"
                  fill="#000000">${poi.num}</text>
          </g>
        `;
      });
    }
  } else {
    // DM EDITION: Shows ALL numbers (#1-#48), dashed Trap Trigger Zones, Monster Ambush Badges, and Short Titles!
    (page.pois || []).forEach(poi => {
      const isSelected = poi.num === appState.selectedPoiNum;
      const isTrap = poi.type === 'trap';
      const isMonster = poi.type === 'monster';
      const shortTag = poi.name.length > 24 ? poi.name.slice(0, 23) + '…' : poi.name;
      const tagPrefix = isTrap ? '🪤 ' : (isMonster ? '👹 ' : '🏛️ ');
      const hiddenBadge = !poi.showOnPlayer ? ' [HIDDEN]' : '';

      const radiusZone = (isTrap || isMonster)
        ? `<circle cx="0" cy="0" r="48" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="${isTrap ? '6,4' : '3,4'}" pointer-events="none"/>`
        : '';

      poisMarkup += `
        <g class="dyson-poi-marker ${isSelected ? 'selected' : ''}" data-poi-num="${poi.num}" transform="translate(${poi.x}, ${poi.y})" style="cursor: grab;">
          ${radiusZone}
          <circle cx="0" cy="0" r="21" fill="${!poi.showOnPlayer ? '#000000' : '#ffffff'}" stroke="#000000" stroke-width="3"/>
          <circle cx="0" cy="0" r="17" fill="none" stroke="${!poi.showOnPlayer ? '#ffffff' : '#000000'}" stroke-width="1.1"/>
          <text x="0" y="6" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="17" fill="${!poi.showOnPlayer ? '#ffffff' : '#000000'}">${poi.num}</text>
          <!-- DM Callout Tag -->
          <rect x="24" y="-13" width="${Math.min(235, (shortTag.length + hiddenBadge.length) * 6.4 + 22)}" height="24" rx="3" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
          <text x="29" y="3" font-family="monospace" font-weight="800" font-size="10.2" fill="#000000">${tagPrefix}${shortTag}${hiddenBadge}</text>
        </g>
      `;
    });
  }

  return `
    <svg class="map-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${buildDysonSVGDefs(page, uid)}

      <!-- 1. Pure White Paper Background -->
      <rect width="${W}" height="${H}" fill="#ffffff"/>

      <!-- 2. Organic Dyson Cross-Hatching Collar around Cavern Perimeter & Rock Pillars -->
      <rect width="${W}" height="${H}" fill="url(#dyson-hatch-${uid})" mask="url(#dyson-halo-mask-${uid})"/>

      <!-- 3. Playable Cavern Floor -->
      <g clip-path="url(#clip-cavern-${uid})">
        <rect width="${W}" height="${H}" fill="url(#dyson-stipple-${uid})"/>
        ${showGrid ? `<rect width="${W}" height="${H}" fill="url(#dyson-grid-${uid})"/>` : ''}
      </g>

      <!-- 4. Heavy Inked Cavern Wall Perimeter -->
      <g fill="none" stroke="#000000" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round">
        ${bankPathsMarkup}
      </g>
      <g fill="none" stroke="#000000" stroke-width="1.2" stroke-dasharray="14,10" stroke-linejoin="round" clip-path="url(#clip-cavern-${uid})">
        ${bankPathsMarkup}
      </g>

      <!-- 5. Organic Flowing Creek Channel -->
      <g fill="#ffffff" stroke="#000000" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
        ${waterPathsMarkup}
      </g>
      <g clip-path="url(#clip-water-${uid})">
        <g fill="none" stroke="#000000" stroke-width="12" stroke-linejoin="round">
          ${waterPathsMarkup}
        </g>
        <g fill="none" stroke="#ffffff" stroke-width="9" stroke-linejoin="round">
          ${waterPathsMarkup}
        </g>
        <g fill="none" stroke="#000000" stroke-width="24" stroke-dasharray="22,8" stroke-linejoin="round">
          ${waterPathsMarkup}
        </g>
        <g fill="none" stroke="#ffffff" stroke-width="21.5" stroke-linejoin="round">
          ${waterPathsMarkup}
        </g>
        ${showGrid ? `<rect width="${W}" height="${H}" fill="url(#dyson-grid-${uid})" opacity="0.45"/>` : ''}
        <g fill="url(#dyson-deep-${uid})" stroke="#000000" stroke-width="1.8" stroke-dasharray="10,5">
          ${deepPathsMarkup}
        </g>
        ${flowLinesMarkup}
      </g>
      <g fill="none" stroke="#000000" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
        ${waterPathsMarkup}
      </g>

      <!-- 6. Solid Rock Pillars / Islands -->
      <g fill="url(#dyson-hatch-${uid})" stroke="#000000" stroke-width="5" stroke-linejoin="round">
        ${islandPathsMarkup}
      </g>

      <!-- 7. Hand-Drawn Props -->
      <g class="layer-details">${detailsMarkup}</g>

      <!-- 8. Exits & Edition-Specific Number Markers -->
      <g class="layer-exits">${exitsMarkup}</g>
      <g class="layer-pois">${poisMarkup}</g>
    </svg>
  `;
}

// ============================================================================
// UI RENDERING & BUTTER-SMOOTH NUMBER DRAGGING
// ============================================================================
function getActivePage() {
  return appState.pages.find(p => p.id === appState.activePageId) || appState.pages[0];
}

function getActName(actNum) {
  if (actNum === 1) return appState.campaign.act1Name || 'Stage 1: Natural Hazards';
  if (actNum === 2) return appState.campaign.act2Name || 'Stage 2: Basic Animals & Hook';
  if (actNum === 3) return appState.campaign.act3Name || 'Stage 3: Dire Beavers & Dam Challenge';
  if (actNum === 4) return appState.campaign.act4Name || 'Stage 4: Kraken Tentacle Challenges';
  return appState.campaign.act5Name || 'Stage 5: The Kraken of Blackwater Spring';
}

function autoLayoutFlowchartNodes() {
  const total = appState.pages.length;
  appState.pages.forEach((p, idx) => {
    if (!p.graphPos) {
      p.graphPos = { x: 150, y: 24 + idx * 35 };
    }
  });
  document.getElementById('sheet-count-badge').textContent = String(total);
}

function renderFlowchart() {
  autoLayoutFlowchartNodes();
  const container = document.getElementById('flowchart-container');
  let edgesSvg = '';
  let nodesSvg = '';
  const nodeMap = {};
  appState.pages.forEach(p => { nodeMap[p.id] = p; });

  appState.pages.forEach(p => {
    (p.links || []).forEach(targetId => {
      const target = nodeMap[targetId];
      if (!target) return;
      edgesSvg += `<line class="flow-edge" x1="${p.graphPos.x}" y1="${p.graphPos.y + 14}" x2="${target.graphPos.x}" y2="${target.graphPos.y - 14}" />`;
    });
  });

  const maxY = Math.max(432, ...appState.pages.map(p => p.graphPos.y + 30));

  appState.pages.forEach(p => {
    const isActive = p.id === appState.activePageId;
    const nums = p.pois.map(poi => `#${poi.num}`).join(', ');
    nodesSvg += `
      <g class="flow-node ${isActive ? 'active' : ''}" data-page-id="${p.id}" transform="translate(${p.graphPos.x - 65}, ${p.graphPos.y - 14})">
        <rect width="130" height="28" />
        <text x="65" y="12" text-anchor="middle">SHEET ${p.id} (${nums || '—'})</text>
        <text x="65" y="23" text-anchor="middle" font-weight="400" font-size="8.2">${p.title.replace(/^Sheet \d+:\s*/, '').slice(0, 21)}</text>
      </g>
    `;
  });

  container.innerHTML = `
    <svg class="flowchart-svg" viewBox="0 0 300 ${maxY}" xmlns="http://www.w3.org/2000/svg">
      ${edgesSvg}
      ${nodesSvg}
    </svg>
  `;

  container.querySelectorAll('.flow-node').forEach(node => {
    node.addEventListener('click', () => {
      const id = parseInt(node.getAttribute('data-page-id'), 10);
      selectPage(id);
    });
  });
}

function buildDMQuickKeyFooter(page) {
  if (appState.mapEdition !== 'dm') {
    return `
      <div class="sheet-footer">
        <span>PLAYER TABLE MAP &bull; [Cross-Hatching]=Cavern Wall &bull; [Dots]=Mud/Bank &bull; [Contours]=Flowing Creek &bull; [Timber]=Dam</span>
        <span>${appState.campaign.title.toUpperCase()} &bull; AREA SHEET #${page.id}</span>
      </div>
    `;
  }
  const items = page.pois.map(p =>
    `<div class="dm-quick-item"><strong>#${p.num} ${p.name}${!p.showOnPlayer ? ' (HIDDEN)' : ''}:</strong> ${p.summary}</div>`
  ).join('');
  return `
    <div class="dm-sheet-quick-key">
      ${items || '<div>No numbered encounters on this sheet.</div>'}
    </div>
  `;
}

function renderActiveSheet() {
  const page = getActivePage();
  const container = document.getElementById('active-sheet-container');
  const total = appState.pages.length;
  const isDM = appState.mapEdition === 'dm';
  const editionBadge = isDM ? '👁️ DM KEY MAP (ALL TRAPS & SECRETS)' : '🛡️ PLAYER TABLE MAP (SAFE — NO TRAP CIRCLES)';

  container.innerHTML = `
    <div class="battle-sheet compact-margins">
      <div class="sheet-header">
        <div class="sheet-title-group">
          <span class="sheet-page-badge">SHEET ${page.id} OF ${total}</span>
          <span class="sheet-title">${page.title.replace(/^Sheet \d+:\s*/, '')}</span>
          <span class="sheet-act-label">(${getActName(page.act)})</span>
        </div>
        <div class="sheet-meta">${editionBadge} &bull; 1" = 5 FT</div>
      </div>

      <div class="grid-frame" id="interactive-grid-frame">
        ${buildDysonMapSVG(page, `edit-${page.id}`, { edition: appState.mapEdition })}
      </div>

      ${buildDMQuickKeyFooter(page)}
    </div>
  `;

  attachMapInteractivity();
  updateSidebarInspector(page);
}

function renderCompareView() {
  const page = getActivePage();
  const container = document.getElementById('compare-container');
  const hiddenCount = page.pois.filter(p => !p.showOnPlayer).length;
  const visibleCount = page.pois.length - hiddenCount;

  container.innerHTML = `
    <div class="compare-panel">
      <div class="compare-panel-header">
        <span>🛡️ PLAYER MAP — ${page.title}</span>
        <span class="compare-badge-player">Hides ${hiddenCount} Trap/Ambush Circles (${visibleCount} Obvious Landmarks Shown)</span>
      </div>
      <div class="overview-thumb">
        ${buildDysonMapSVG(page, `cmp-player-${page.id}`, { edition: 'player' })}
      </div>
      <p style="font-size:0.78rem; margin-top:6px; color:#222;">
        <strong>What Players See:</strong> Clean Dyson map with Area <strong>#${page.id}</strong> badge and un-circled landmark numbers. Hidden traps, slip checks, deep pools, and tentacle ambushes have <em>zero</em> markers on the paper so players can't metagame!
      </p>
    </div>

    <div class="compare-panel">
      <div class="compare-panel-header">
        <span>👁️ DM REFERENCE MAP — ${page.title}</span>
        <span class="compare-badge-dm">Shows All ${page.pois.length} Locations + Trap Radiuses &amp; Quick Key</span>
      </div>
      <div class="overview-thumb">
        ${buildDysonMapSVG(page, `cmp-dm-${page.id}`, { edition: 'dm' })}
      </div>
      <div style="font-size:0.76rem; margin-top:6px; border-top:1px solid #000; padding-top:4px;">
        ${page.pois.map(p => `<div><strong>#${p.num} ${p.name} ${!p.showOnPlayer ? '[HIDDEN ON PLAYER MAP]' : '[VISIBLE]'}:</strong> ${p.summary}</div>`).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// FIXED BUTTER-SMOOTH NUMBER DRAGGING (Updates SVG transform directly!)
// ============================================================================
let activeDragContext = null;

function attachMapInteractivity() {
  const frame = document.getElementById('interactive-grid-frame');
  if (!frame) return;
  const svg = frame.querySelector('svg');
  const page = getActivePage();

  function getSVGCoords(evt) {
    const rect = svg.getBoundingClientRect();
    const x = Math.max(25, Math.min(W - 25, ((evt.clientX - rect.left) / rect.width) * W));
    const y = Math.max(25, Math.min(H - 25, ((evt.clientY - rect.top) / rect.height) * H));
    return { x: Math.round(x), y: Math.round(y) };
  }

  // Always allow dragging any numbered marker regardless of active tool!
  svg.querySelectorAll('.dyson-poi-marker').forEach(markerEl => {
    markerEl.addEventListener('mousedown', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const num = parseInt(markerEl.getAttribute('data-poi-num'), 10);
      const poiObj = page.pois.find(p => p.num === num);
      if (!poiObj) return;

      pushUndoState();
      appState.selectedPoiNum = num;
      markerEl.style.cursor = 'grabbing';

      activeDragContext = {
        svg,
        markerEl,
        poiObj
      };
    });
  });

  // Clicking on the canvas to sculpt caverns, rock pillars, dams, boulders, or stumps
  svg.addEventListener('mousedown', (evt) => {
    if (appState.toolMode === 'move_poi') return;
    if (evt.target.closest('.dyson-poi-marker')) return;

    const { x, y } = getSVGCoords(evt);
    const clickRng = createRNG(`CLICK-${x}-${y}-${Date.now()}`);

    pushUndoState();
    if (appState.toolMode === 'widen_creek') {
      page.bankPaths.push(buildOrganicBlobPath(x, y, 85, 70, 14, clickRng, 0.22));
      page.waterPaths.push(buildOrganicBlobPath(x, y, 52, 42, 12, clickRng, 0.18));
      renderActiveSheet();
    } else if (appState.toolMode === 'narrow_creek') {
      page.islandPaths.push(buildOrganicBlobPath(x, y, 42, 34, 12, clickRng, 0.2));
      renderActiveSheet();
    } else if (appState.toolMode === 'stamp_dam') {
      page.dams.push({ x1: x - 10, y1: Math.max(80, y - 130), x2: x + 10, y2: Math.min(H - 80, y + 130), breached: false });
      renderActiveSheet();
    } else if (appState.toolMode === 'stamp_rock') {
      page.boulders.push({ x, y, rad: 15 });
      renderActiveSheet();
    } else if (appState.toolMode === 'stamp_stump') {
      page.stumps.push({ x, y });
      renderActiveSheet();
    }
  });
}

// Global window mousemove / mouseup for lag-free marker dragging without DOM destruction mid-drag
window.addEventListener('mousemove', (evt) => {
  if (!activeDragContext) return;
  const { svg, markerEl, poiObj } = activeDragContext;
  const rect = svg.getBoundingClientRect();
  const x = Math.round(Math.max(25, Math.min(W - 25, ((evt.clientX - rect.left) / rect.width) * W)));
  const y = Math.round(Math.max(25, Math.min(H - 25, ((evt.clientY - rect.top) / rect.height) * H)));

  poiObj.x = x;
  poiObj.y = y;
  // Directly update the SVG group's transform attribute at 60fps!
  markerEl.setAttribute('transform', `translate(${x}, ${y})`);
});

window.addEventListener('mouseup', () => {
  if (!activeDragContext) return;
  activeDragContext.markerEl.style.cursor = 'grab';
  activeDragContext = null;
  if (appState.activeView === 'compare') renderCompareView();
  if (appState.activeView === 'overview') renderOverviewGrid();
});

function updateSidebarInspector(page) {
  document.getElementById('header-campaign-title').textContent = appState.campaign.title;
  document.getElementById('page-title').value = page.title;
  document.getElementById('page-act').value = String(page.act);
  document.getElementById('page-flow').value = page.flow;
  document.getElementById('page-read-aloud').value = page.readAloud || '';
  document.getElementById('page-links-input').value = (page.links || []).join(', ');
  document.getElementById('page-exit-e-input').value = page.exits?.E || '';
  document.getElementById('current-page-indicator').textContent = `Sheet ${page.id} / ${appState.pages.length}`;

  const poiContainer = document.getElementById('poi-list-editor');
  const typeBadges = {
    landmark: '🏛️ Landmark / Hook (Obvious)',
    trap: '🪤 Hazard / Slip / Pool / Challenge',
    monster: '👹 Creature / Tentacle Encounter'
  };

  poiContainer.innerHTML = page.pois.map((poi, idx) => `
    <div class="poi-edit-card">
      <div class="poi-edit-header">
        <span class="poi-num-circle" style="${!poi.showOnPlayer ? 'background:#000;color:#fff;border-color:#fff;' : ''}" title="${!poi.showOnPlayer ? 'Hidden on Player Map (DM Only)' : 'Shown on Player Map'}">#${poi.num}</span>
        <select class="poi-type-select" data-idx="${idx}">
          <option value="landmark" ${poi.type === 'landmark' ? 'selected' : ''}>${typeBadges.landmark}</option>
          <option value="trap" ${poi.type === 'trap' ? 'selected' : ''}>${typeBadges.trap}</option>
          <option value="monster" ${poi.type === 'monster' ? 'selected' : ''}>${typeBadges.monster}</option>
        </select>
        <button class="btn-del-poi" data-idx="${idx}" title="Delete this numbered encounter">&times;</button>
      </div>
      <div class="poi-player-vis-row">
        <label title="Uncheck for hazards, deep pools, slip checks & tentacle ambushes so players don't see a numbered circle on their map!">
          <input type="checkbox" class="poi-show-player-chk" data-idx="${idx}" ${poi.showOnPlayer ? 'checked' : ''} />
          <span>Show #${poi.num} on Player Map</span>
        </label>
        <span>${poi.showOnPlayer ? '👁️ Player Visible' : '🔒 DM Secret'}</span>
      </div>
      <input type="text" class="poi-name-input" data-idx="${idx}" value="${poi.name.replace(/"/g, '&quot;')}" placeholder="Location Title" />
      <input type="text" class="poi-summary-input" data-idx="${idx}" value="${poi.summary.replace(/"/g, '&quot;')}" placeholder="One-line DM summary" />
      <textarea class="poi-details-input" data-idx="${idx}" rows="3" placeholder="Mechanics, DCs, monsters & treasure">${poi.details}</textarea>
    </div>
  `).join('');

  poiContainer.querySelectorAll('.poi-type-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      pushUndoState();
      const idx = parseInt(sel.getAttribute('data-idx'), 10);
      const newType = e.target.value;
      page.pois[idx].type = newType;
      if (newType === 'trap') page.pois[idx].showOnPlayer = false;
      renderActiveSheet();
    });
  });

  poiContainer.querySelectorAll('.poi-show-player-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      pushUndoState();
      const idx = parseInt(chk.getAttribute('data-idx'), 10);
      page.pois[idx].showOnPlayer = e.target.checked;
      renderActiveSheet();
      if (appState.activeView === 'compare') renderCompareView();
    });
  });

  poiContainer.querySelectorAll('.poi-name-input').forEach(inp => {
    inp.addEventListener('change', () => pushUndoState());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      page.pois[idx].name = e.target.value;
      if (appState.mapEdition === 'dm') renderActiveSheet();
    });
  });

  poiContainer.querySelectorAll('.poi-summary-input').forEach(inp => {
    inp.addEventListener('change', () => pushUndoState());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      page.pois[idx].summary = e.target.value;
    });
  });

  poiContainer.querySelectorAll('.poi-details-input').forEach(inp => {
    inp.addEventListener('change', () => pushUndoState());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      page.pois[idx].details = e.target.value;
    });
  });

  poiContainer.querySelectorAll('.btn-del-poi').forEach(btn => {
    btn.addEventListener('click', () => {
      pushUndoState();
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      page.pois.splice(idx, 1);
      refreshAllViews();
    });
  });
}

function renderOverviewGrid() {
  const container = document.getElementById('overview-grid');
  container.innerHTML = appState.pages.map(page => {
    const nums = page.pois.map(p => `#${p.num}${!p.showOnPlayer ? '*' : ''}`).join(', ');
    return `
      <div class="overview-card" data-page-id="${page.id}">
        <div class="overview-card-header">
          <span>${page.title}</span>
          <span>${appState.mapEdition === 'dm' ? '👁️ DM View' : '🛡️ Player View'}</span>
        </div>
        <div class="overview-thumb">
          ${buildDysonMapSVG(page, `thumb-${page.id}`, { edition: appState.mapEdition })}
        </div>
        <div class="overview-card-footer">
          <span><strong>Key:</strong> ${nums} (*=Hidden on Player Map)</span>
          <span>Click to Edit &rarr;</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.overview-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.getAttribute('data-page-id'), 10);
      selectPage(id);
      switchView('editor');
    });
  });
}

// ============================================================================
// NUMBERED DM GUIDE (#1 to #48) BUILDER
// ============================================================================
function buildDMGuideHTML() {
  const typeLabels = {
    landmark: 'LANDMARK / STORY HOOK',
    trap: 'HAZARD / SKILL CHALLENGE',
    monster: 'CREATURE / TENTACLE CHALLENGE'
  };

  const sheetSections = appState.pages.map(page => {
    const poiEntries = page.pois.map(poi => `
      <div class="dm-numbered-item">
        <div class="dm-num-title">
          <span class="dm-circle-badge" style="${!poi.showOnPlayer ? 'background:#000;color:#fff;' : ''}">${poi.num}</span>
          <strong>${poi.name}</strong>
          <span class="dm-type-tag">[${typeLabels[poi.type] || 'LOCATION'} &bull; ${poi.showOnPlayer ? 'ON PLAYER MAP' : 'HIDDEN FROM PLAYERS'}]</span>
          &mdash; <em>${poi.summary}</em>
        </div>
        <div class="dm-num-body">${poi.details.replace(/\n/g, '<br/>')}</div>
      </div>
    `).join('');

    return `
      <div class="dm-page-entry">
        <div class="dm-page-entry-header">
          <span>${page.title.toUpperCase()} (${getActName(page.act)})</span>
          <span>Links to Sheet(s): ${(page.links || []).join(', ') || 'END'}</span>
        </div>
        <div class="read-aloud-box">"${page.readAloud}"</div>
        <div class="dm-poi-list">${poiEntries}</div>
      </div>
    `;
  }).join('');

  return `
    <h1>${appState.campaign.title.toUpperCase()} — NUMBERED DM GUIDE</h1>
    <div class="dm-lore-box">
      <h3>📖 5-Stage Escalating Creek Crawl Structure</h3>
      <p><strong>The Town Hook:</strong> ${appState.campaign.hook}</p>
      <p><strong>The Plot Twist Reality:</strong> ${appState.campaign.twist}</p>
      <ul style="padding-left:20px; font-size:0.88rem; margin-top:6px;">
        <li><strong>Stage 1 (Sheets 1–2 — Environmental Hazards):</strong> Algae-slick rock checks (#2, #7), sudden 15-ft plunge pools (#3), sucking clay flats (#5), and whirlpool undertows (#6).</li>
        <li><strong>Stage 2 (Sheets 3–4 — Basic Animals &amp; Upstream Hook #1):</strong> Giant Snapping Turtle (#9), panicked Giant River Otters &amp; Water Snakes (#10), Giant Bullfrogs (#14), and <strong>Bram the Water-Warden’s Torn Pack / Mule (#11 &amp; #15)</strong> pulling the party to the confluence.</li>
        <li><strong>Stage 3 (Sheets 5–7 — Dire Beavers, Break-the-Dam Challenge &amp; Hook #2):</strong> Dire Beaver lodges (#18), the <strong>Great Beaver Dam &amp; Break-the-Dam Skill Challenge (#23)</strong> (where failed rolls risk 2d8–3d8 crushing logs and flash-flood damage!), and the <strong>Post-Dam Reveal (#24)</strong> where black Kraken ink and sucker-scarred beaver carcasses wash out as Bram’s horn blows upstream!</li>
        <li><strong>Stage 4 (Sheets 8–11 — Kraken Long-Distance Single-Tentacle Challenges):</strong> Four distinct challenges against a single 40-ft hunting tentacle projected through flooded karst tubes (#30 Bridge-Smasher, #33 Whack-a-Tentacle 3-Vent Gauntlet, #38 Timed Rescue of Old Iron-Tooth the Elder Beaver, and #42 Tremorsense Ink-Fog Stalker).</li>
        <li><strong>Stage 5 (Sheet 12 — Final Boss):</strong> <strong>The Juvenile Creek Kraken (#47)</strong> in Blackwater Spring.</li>
      </ul>
    </div>

    <h2>🔢 Master Numbered Encounter Key (#1 – #48)</h2>
    ${sheetSections}

    <h2>👹 Creek Wildlife, Dire Beavers &amp; Kraken Statblocks (5e Compatible)</h2>
    <div class="statblock-grid">
      <div class="statblock">
        <h4>Basic Creek Animals (#9, #10, #14)</h4>
        <div class="sb-meta">Giant Snapping Turtle &bull; Giant River Otter &bull; Giant Bullfrog</div>
        <p><strong>Giant Snapping Turtle (CR 1):</strong> AC 15, HP 32, Swim 30 ft. <em>Bite:</em> +5 to hit, 2d6+3 slashing.</p>
        <p><strong>Giant River Otter (CR 1/4):</strong> AC 12, HP 16, Swim 40 ft. <em>Bite:</em> +4 to hit, 1d6+2 piercing.</p>
        <p><strong>Giant Bullfrog (CR 1/4):</strong> AC 11, HP 18. <em>Sticky Tongue (15 ft):</em> +3 to hit, pulls target 10 ft into water + Grappled (DC 11).</p>
      </div>

      <div class="statblock">
        <h4>Giant Dire Beaver &amp; Old Iron-Tooth (#16, #18, #22, #38)</h4>
        <div class="sb-meta">Medium Beast, Unaligned &bull; AC 13 (Matriarch/Iron-Tooth AC 14) &bull; HP 22 (Iron-Tooth 42 HP) &bull; Swim 40 ft.</div>
        <p><strong>Hold Breath:</strong> 15 minutes. <strong>Siege Chewer:</strong> Deals double damage to timber, dams, and Kraken tentacles.</p>
        <p><strong>Chisel Bite:</strong> <em>Melee:</em> +4 to hit (+5 for Iron-Tooth), 1d8+2 piercing. <strong>Tail Slap (Recharge 5-6):</strong> 10-ft splash wave; creatures within 10 ft make DC 12 CON save or are Deafened &amp; pushed 5 ft.</p>
      </div>

      <div class="statblock">
        <h4>Kraken Long-Range Hunting Tentacle (#30, #33, #38, #42)</h4>
        <div class="sb-meta">Large Limb (Projected from Sheet 12 via Karst Tubes) &bull; AC 14 &bull; HP 30–40 &bull; Reach 25 ft.</div>
        <p><strong>Sucker-Whip Slam:</strong> +6 to hit, reach 25 ft., 1d10+3 bludgeoning, and target is <strong>Grappled</strong> (escape DC 13). While Grappled, the tentacle drags the target 15 ft per round toward its submerged sinkhole vent.</p>
        <p><strong>Sever/Retract:</strong> Taking 30+ total damage (or 15+ slashing/lightning damage in a single hit) causes the tentacle to recoil back upstream, weakening the Boss Kraken on Sheet 12!</p>
      </div>

      <div class="statblock">
        <h4>THE JUVENILE CREEK KRAKEN (BOSS — #47 on Sheet 12)</h4>
        <div class="sb-meta">Huge Aberration/Monstrosity &bull; AC 15 (Natural) &bull; HP 115 (or 95 HP if weakened in Stage 4) &bull; Swim 50 ft.</div>
        <p><strong>Multiattack:</strong> Makes two <em>Tentacle Slam</em> attacks and uses <em>Crushing Bite</em> or <em>Fling</em>.</p>
        <p><strong>Tentacle Slam:</strong> +7 to hit, reach 25 ft., 2d6+4 bludgeoning, and target is Grappled (escape DC 14).</p>
        <p><strong>Crushing Bite:</strong> +7 to hit (against Grappled target), 3d8+4 piercing.</p>
        <p><strong>Blinding Ink-Wave (Recharge 5–6):</strong> Fills a 20-ft radius with black sludge; DC 13 CON save or 2d6 poison and Blinded until end of next turn.</p>
      </div>
    </div>
  `;
}

function renderDMGuide() {
  document.getElementById('dm-guide-preview').innerHTML = buildDMGuideHTML();
}

function refreshAllViews() {
  renderFlowchart();
  renderActiveSheet();
  if (appState.activeView === 'compare') renderCompareView();
  if (appState.activeView === 'overview') renderOverviewGrid();
  if (appState.activeView === 'dm-guide') renderDMGuide();
}

function selectPage(pageId) {
  appState.activePageId = pageId;
  const page = getActivePage();
  if (page && page.pois.length > 0) {
    appState.selectedPoiNum = page.pois[0].num;
  }
  refreshAllViews();
}

function setMapEdition(edition) {
  appState.mapEdition = edition;
  document.getElementById('btn-mode-player').classList.toggle('active', edition === 'player');
  document.getElementById('btn-mode-dm').classList.toggle('active', edition === 'dm');
  refreshAllViews();
}

function switchView(viewName) {
  appState.activeView = viewName;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewName);
  });
  document.getElementById('view-editor').classList.toggle('active', viewName === 'editor');
  document.getElementById('view-compare').classList.toggle('active', viewName === 'compare');
  document.getElementById('view-overview').classList.toggle('active', viewName === 'overview');
  document.getElementById('view-dm-guide').classList.toggle('active', viewName === 'dm-guide');
  refreshAllViews();
}

// ============================================================================
// PRINTING PIPELINE (Separate Player Maps, DM Maps, or DM Guide Book!)
// ============================================================================
function buildPrintSheetHTML(page, edition) {
  const isDM = edition === 'dm';
  const footerMarkup = isDM
    ? `<div class="print-sheet-footer">
         <span>${page.pois.map(p => `#${p.num} ${p.name}${!p.showOnPlayer ? '(H)' : ''}`).join(' • ')}</span>
         <span>DM REFERENCE MAP</span>
       </div>`
    : `<div class="print-sheet-footer">
         <span>[Cross-Hatched Collar]=Cavern Wall &bull; [Dots]=Mud/Bank &bull; [Concentric Contours]=Creek Water &bull; [Timber]=Dam</span>
         <span>${appState.campaign.title.toUpperCase()} &bull; AREA MAP #${page.id}</span>
       </div>`;

  return `
    <div class="print-battle-sheet">
      <div class="print-sheet-header">
        <div><strong>${isDM ? '[DM KEY] ' : ''}${page.title.toUpperCase()}</strong> &mdash; <em>${getActName(page.act)}</em></div>
        <div>AREA #${page.id} &bull; 1 SQUARE = 5 FT (1 INCH) &bull; FLOW: &larr; WEST</div>
      </div>
      <div class="print-grid-frame">
        ${buildDysonMapSVG(page, `print-${edition}-${page.id}`, { edition })}
      </div>
      ${footerMarkup}
    </div>
  `;
}

function triggerPrint(mode) {
  const printContainer = document.getElementById('print-container');
  if (mode === 'current') {
    printContainer.innerHTML = buildPrintSheetHTML(getActivePage(), appState.mapEdition);
  } else if (mode === 'player-maps') {
    printContainer.innerHTML = appState.pages.map(p => buildPrintSheetHTML(p, 'player')).join('');
  } else if (mode === 'dm-maps') {
    printContainer.innerHTML = appState.pages.map(p => buildPrintSheetHTML(p, 'dm')).join('');
  } else if (mode === 'dm-guide') {
    printContainer.innerHTML = `<div class="dm-guide-print">${buildDMGuideHTML()}</div>`;
  }
  setTimeout(() => {
    window.print();
  }, 80);
}

// ============================================================================
// INITIALIZATION & EVENT LISTENERS
// ============================================================================
function initApp() {
  generateAllPages(appState.seed);
  refreshAllViews();
  updateUndoRedoButtons();

  // Global Keyboard Shortcuts: Ctrl+Z (Undo) & Ctrl+Y / Ctrl+Shift+Z (Redo)
  window.addEventListener('keydown', (e) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        performRedo();
      } else if (!isInput || undoStack.length > 0) {
        e.preventDefault();
        performUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      performRedo();
    }
  });

  document.getElementById('btn-undo').addEventListener('click', performUndo);
  document.getElementById('btn-redo').addEventListener('click', performRedo);

  // Edition Switcher (Player Map vs DM Map)
  document.getElementById('btn-mode-player').addEventListener('click', () => setMapEdition('player'));
  document.getElementById('btn-mode-dm').addEventListener('click', () => setMapEdition('dm'));

  // Player Numbers Visibility Selector
  document.getElementById('player-num-style').addEventListener('change', (e) => {
    appState.playerNumStyle = e.target.value;
    refreshAllViews();
  });

  document.getElementById('chk-show-grid').addEventListener('change', (e) => {
    appState.showGrid = e.target.checked;
    refreshAllViews();
  });

  // Story Preset Selector
  document.getElementById('story-preset-select').addEventListener('change', (e) => {
    const presetKey = e.target.value;
    const preset = STORY_PRESETS[presetKey];
    if (!preset) return;
    pushUndoState();
    appState.presetId = presetKey;
    appState.campaign = { ...preset };
    syncStoryDrawerInputs();
    refreshAllViews();
  });

  function syncStoryDrawerInputs() {
    document.getElementById('camp-title-input').value = appState.campaign.title;
    document.getElementById('camp-act1-input').value = appState.campaign.act1Name;
    document.getElementById('camp-act2-input').value = appState.campaign.act2Name;
    document.getElementById('camp-act3-input').value = appState.campaign.act3Name;
    document.getElementById('camp-hook-input').value = appState.campaign.hook;
    document.getElementById('camp-twist-input').value = appState.campaign.twist;
  }

  document.getElementById('btn-toggle-story-modal').addEventListener('click', () => {
    const drawer = document.getElementById('story-drawer');
    syncStoryDrawerInputs();
    drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btn-close-story-drawer').addEventListener('click', () => {
    document.getElementById('story-drawer').style.display = 'none';
  });

  ['camp-title-input', 'camp-act1-input', 'camp-act2-input', 'camp-act3-input', 'camp-hook-input', 'camp-twist-input'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('change', () => pushUndoState());
    el.addEventListener('input', () => {
      appState.campaign.title = document.getElementById('camp-title-input').value;
      appState.campaign.act1Name = document.getElementById('camp-act1-input').value;
      appState.campaign.act2Name = document.getElementById('camp-act2-input').value;
      appState.campaign.act3Name = document.getElementById('camp-act3-input').value;
      appState.campaign.hook = document.getElementById('camp-hook-input').value;
      appState.campaign.twist = document.getElementById('camp-twist-input').value;
      refreshAllViews();
    });
  });

  // Generate New Crawl
  document.getElementById('btn-generate').addEventListener('click', () => {
    pushUndoState();
    const inputEl = document.getElementById('seed-input');
    const newSeed = inputEl.value.trim() || ('DYSON-' + Math.floor(Math.random() * 9999));
    const finalSeed = newSeed === appState.seed
      ? 'DYSON-' + Math.random().toString(36).substring(2, 7).toUpperCase()
      : newSeed;
    inputEl.value = finalSeed;
    generateAllPages(finalSeed);
    selectPage(1);
  });

  // Add / Delete Sheet in Flowchart
  document.getElementById('btn-add-sheet').addEventListener('click', () => {
    pushUndoState();
    const nextId = appState.pages.length ? Math.max(...appState.pages.map(p => p.id)) + 1 : 1;
    const prevPage = getActivePage();
    const allNums = appState.pages.flatMap(p => p.pois.map(x => x.num));
    const nextPoiNum = allNums.length ? Math.max(...allNums) + 1 : 1;

    const newPage = {
      id: nextId,
      act: prevPage ? prevPage.act : 2,
      title: `Sheet ${nextId}: New Creek Reach`,
      flow: 'W-E',
      exits: { W: `<- SHEET ${prevPage ? prevPage.id : 1}`, E: 'UPSTREAM ->' },
      links: [],
      graphPos: { x: 150, y: (prevPage?.graphPos?.y || 380) + 45 },
      readAloud: 'The canyon walls narrow as the murky current swirls around mossy limestone boulders.',
      pois: [
        {
          num: nextPoiNum,
          x: 320,
          y: 350,
          type: 'landmark',
          showOnPlayer: true,
          name: 'Mossy Limestone Ledge',
          summary: 'Slick rock shelf jutting from the bank.',
          details: 'Describe what players discover at this landmark.'
        },
        {
          num: nextPoiNum + 1,
          x: 620,
          y: 365,
          type: 'trap',
          showOnPlayer: false,
          name: 'Hidden Deep Plunge Pool',
          summary: 'Sudden 15-ft underwater drop-off (DC 12 Athletics).',
          details: 'Hidden from the Player Map so players do not avoid this spot!'
        }
      ],
      bankPaths: [], waterPaths: [], deepPaths: [], islandPaths: [], flowLines: [], dams: [], boulders: [], stumps: []
    };
    carveDysonCreekGeometry(newPage, `${appState.seed}-NEW-${nextId}`);
    if (prevPage && !prevPage.links.includes(nextId)) {
      prevPage.links.push(nextId);
    }
    appState.pages.push(newPage);
    selectPage(nextId);
  });

  document.getElementById('btn-del-sheet').addEventListener('click', () => {
    if (appState.pages.length <= 1) {
      alert('Cannot delete the only remaining sheet.');
      return;
    }
    pushUndoState();
    const delId = appState.activePageId;
    appState.pages = appState.pages.filter(p => p.id !== delId);
    appState.pages.forEach(p => {
      p.links = (p.links || []).filter(id => id !== delId);
    });
    selectPage(appState.pages[0].id);
  });

  // View Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view'));
    });
  });

  // Prev / Next Sheet
  document.getElementById('btn-prev-page').addEventListener('click', () => {
    const idx = appState.pages.findIndex(p => p.id === appState.activePageId);
    const prevIdx = idx > 0 ? idx - 1 : appState.pages.length - 1;
    selectPage(appState.pages[prevIdx].id);
  });
  document.getElementById('btn-next-page').addEventListener('click', () => {
    const idx = appState.pages.findIndex(p => p.id === appState.activePageId);
    const nextIdx = idx < appState.pages.length - 1 ? idx + 1 : 0;
    selectPage(appState.pages[nextIdx].id);
  });

  // Interaction Mode Palette
  document.querySelectorAll('#tool-mode-palette .tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tool-mode-palette .tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.toolMode = btn.getAttribute('data-mode');
    });
  });

  // Sheet Config Inputs
  document.getElementById('page-title').addEventListener('change', () => pushUndoState());
  document.getElementById('page-title').addEventListener('input', (e) => {
    const page = getActivePage();
    page.title = e.target.value;
    renderActiveSheet();
    renderFlowchart();
  });

  document.getElementById('page-act').addEventListener('change', (e) => {
    pushUndoState();
    const page = getActivePage();
    page.act = parseInt(e.target.value, 10);
    refreshAllViews();
  });

  document.getElementById('page-flow').addEventListener('change', (e) => {
    pushUndoState();
    const page = getActivePage();
    page.flow = e.target.value;
    carveDysonCreekGeometry(page, `${appState.seed}-FLOW-${Date.now()}`);
    refreshAllViews();
  });

  document.getElementById('page-read-aloud').addEventListener('change', () => pushUndoState());
  document.getElementById('page-read-aloud').addEventListener('input', (e) => {
    getActivePage().readAloud = e.target.value;
  });

  document.getElementById('page-links-input').addEventListener('change', (e) => {
    pushUndoState();
    const page = getActivePage();
    page.links = e.target.value
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    renderFlowchart();
  });

  document.getElementById('page-exit-e-input').addEventListener('change', () => pushUndoState());
  document.getElementById('page-exit-e-input').addEventListener('input', (e) => {
    const page = getActivePage();
    if (!page.exits) page.exits = {};
    page.exits.E = e.target.value;
    renderActiveSheet();
  });

  document.getElementById('btn-reroll-creek').addEventListener('click', () => {
    pushUndoState();
    const page = getActivePage();
    carveDysonCreekGeometry(page, `${appState.seed}-REROLL-${Math.random()}`);
    refreshAllViews();
  });

  document.getElementById('btn-clear-props').addEventListener('click', () => {
    pushUndoState();
    const page = getActivePage();
    page.dams = [];
    page.boulders = [];
    page.stumps = [];
    refreshAllViews();
  });

  // Add new numbered location (#)
  document.getElementById('btn-add-poi').addEventListener('click', () => {
    pushUndoState();
    const page = getActivePage();
    const allNums = appState.pages.flatMap(p => p.pois.map(x => x.num));
    const nextNum = allNums.length ? Math.max(...allNums) + 1 : 1;
    page.pois.push({
      num: nextNum,
      x: 450,
      y: 360,
      type: 'landmark',
      showOnPlayer: true,
      name: `New Creek Discovery #${nextNum}`,
      summary: 'Custom creek landmark or encounter.',
      details: 'Describe what the players see, trap DCs, or monsters here.'
    });
    appState.selectedPoiNum = nextNum;
    refreshAllViews();
  });

  // Roll Random Encounter (#)
  document.getElementById('btn-roll-poi').addEventListener('click', () => {
    pushUndoState();
    const page = getActivePage();
    const allNums = appState.pages.flatMap(p => p.pois.map(x => x.num));
    const nextNum = allNums.length ? Math.max(...allNums) + 1 : 1;
    const template = RANDOM_CREEK_POIS[Math.floor(Math.random() * RANDOM_CREEK_POIS.length)];
    page.pois.push({
      num: nextNum,
      x: 220 + Math.floor(Math.random() * 460),
      y: 230 + Math.floor(Math.random() * 260),
      type: template.type,
      showOnPlayer: template.showOnPlayer,
      name: template.name,
      summary: template.summary,
      details: template.details
    });
    appState.selectedPoiNum = nextNum;
    refreshAllViews();
  });

  // Print Buttons
  document.getElementById('btn-print-current').addEventListener('click', () => triggerPrint('current'));
  document.getElementById('btn-print-player-maps').addEventListener('click', () => triggerPrint('player-maps'));
  document.getElementById('btn-print-dm-maps').addEventListener('click', () => triggerPrint('dm-maps'));
  document.getElementById('btn-print-dm-guide').addEventListener('click', () => triggerPrint('dm-guide'));

  // Save / Load JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dyson-creek-crawl-${appState.seed.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-import-json').addEventListener('click', () => {
    document.getElementById('file-import').click();
  });

  document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result);
        if (loaded && Array.isArray(loaded.pages)) {
          pushUndoState();
          appState.seed = loaded.seed || 'CUSTOM';
          appState.campaign = loaded.campaign || { ...STORY_PRESETS.beavers_to_kraken };
          appState.pages = loaded.pages;
          appState.activePageId = appState.pages[0]?.id || 1;
          document.getElementById('seed-input').value = appState.seed;
          refreshAllViews();
        }
      } catch (err) {
        alert('Invalid campaign JSON file.');
      }
    };
    reader.readAsText(file);
  });
}

window.addEventListener('DOMContentLoaded', initApp);
