#!/usr/bin/env node
// ============================================================================
// D&D CREEK CRAWL STORY BUILDER SCRIPT (build-story.js)
// Prompts the user (or reads --config JSON) for:
//   1. Story Points (Title, Town Rumor Hook, Missing NPC / Mid-Creek Hook, Post-Dam Twist)
//   2. Challenge Level (Party Level Tier -> Auto-scales DCs, Damage Dice & Boss HP!)
//   3. Starting Challenges (Environmental hazards: deep pools, slip rocks + basic animals)
//   4. Middle Challenges (Barrier/Dam Builders + Break-the-Dam Skill Challenge & Failure Risk)
//   5. Big Boss & Remote Projecting Challenges (4 pre-boss limb/projection challenges + Final Boss)
//
// Outputs a complete 12-Sheet (48-Encounter) campaign JSON ready to load via
// the "📂 Load" button in /home/willie/source/dndCreekMap/index.html, or
// applies it directly to app.js with --apply-default!
// ============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const STORIES_DIR = path.join(PROJECT_ROOT, 'stories');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');

// Challenge Level Scaling Table
const TIER_SCALING = {
  low: {
    label: 'Tier 1 (Levels 1–3 • Novice Adventurers)',
    easyDC: 10,
    stdDC: 12,
    hardDC: 13,
    slipDmg: '1d4',
    trapDmg: '2d4',
    fail1Dmg: '2d6',
    fail2Dmg: '3d6',
    limbAC: 13,
    limbHP: 22,
    limbAtk: '+5',
    limbDmg: '1d8+2',
    builderAC: 12,
    builderHP: 18,
    bossAC: 14,
    bossHP: 85,
    bossWeakHP: 70,
    bossAtk: '+6',
    bossSlamDmg: '2d6+3',
    bossBiteDmg: '2d10+3',
    pillarDmg: '3d10',
    goldReward: '150 gp'
  },
  medium: {
    label: 'Tier 2 (Levels 4–6 • Seasoned Party)',
    easyDC: 11,
    stdDC: 13,
    hardDC: 14,
    slipDmg: '1d6',
    trapDmg: '2d6',
    fail1Dmg: '2d8',
    fail2Dmg: '3d8',
    limbAC: 14,
    limbHP: 35,
    limbAtk: '+6',
    limbDmg: '1d10+3',
    builderAC: 13,
    builderHP: 25,
    bossAC: 15,
    bossHP: 125,
    bossWeakHP: 100,
    bossAtk: '+7',
    bossSlamDmg: '2d6+4',
    bossBiteDmg: '3d8+4',
    pillarDmg: '4d10',
    goldReward: '350 gp'
  },
  high: {
    label: 'Tier 3 (Levels 7–10 • Veteran Heroes)',
    easyDC: 13,
    stdDC: 15,
    hardDC: 16,
    slipDmg: '2d6',
    trapDmg: '3d6',
    fail1Dmg: '3d8',
    fail2Dmg: '5d8',
    limbAC: 16,
    limbHP: 55,
    limbAtk: '+8',
    limbDmg: '2d8+4',
    builderAC: 15,
    builderHP: 42,
    bossAC: 17,
    bossHP: 195,
    bossWeakHP: 160,
    bossAtk: '+9',
    bossSlamDmg: '3d6+5',
    bossBiteDmg: '4d10+5',
    pillarDmg: '6d10',
    goldReward: '850 gp'
  }
};

// Build the 12-Sheet / 48-Encounter Campaign Data Structure from User Story Inputs
function buildCampaignFromSpec(spec) {
  const tierKey = (spec.challengeTier || 'medium').toLowerCase();
  const s = TIER_SCALING[tierKey] || TIER_SCALING.medium;

  const title = spec.title || 'Curse of the Upper Creek';
  const townHook = spec.townHook || 'The town water supply is choked with foul silt, halting the local distillery. Locals blame dam-building creatures upstream.';
  const hookNPC = spec.hookNPC || 'Bram the Water-Warden';
  const startHazards = spec.startingHazards || 'Algae-slick limestone shelves, sudden 15-ft plunge pools, and sucking clay mud-flats';
  const basicAnimals = spec.basicAnimals || 'Giant Snapping Turtles, panicked Giant River Otters, and Giant Creek Bullfrogs';
  const midBuilders = spec.middleBuilders || 'Giant Dire Beavers';
  const midBarrier = spec.middleBarrier || 'The Great 15-ft Timber & Mud Dam';
  const bigBoss = spec.bigBoss || 'The Juvenile Creek Kraken';
  const bossLimb = spec.bossProjection || 'Long-Range Hunting Tentacle';
  const bossSign = spec.bossClueSign || 'circular purple tentacle sucker-scars and oily black cephalopod ink';

  const campaignMeta = {
    title,
    act1Name: `Stage 1: Natural Hazards (${startHazards.slice(0, 32)})`,
    act2Name: `Stage 2: ${basicAnimals.slice(0, 26)} & ${hookNPC}'s Trail`,
    act3Name: `Stage 3: ${midBuilders} & Break-the-Dam Challenge`,
    act4Name: `Stage 4: ${bigBoss}'s ${bossLimb} Challenges`,
    act5Name: `Stage 5: Final Boss — ${bigBoss}`,
    hook: `${townHook} (${s.label})`,
    twist: `The party arrived late! The ${midBuilders} built ${midBarrier} as a desperate barricade to hold back ${bigBoss} at the creek headwaters. Worse, ${bigBoss} can project a ${bossLimb} far downstream through flooded limestone tubes. Breaking the barrier unleashes ${bossSign}—and ${hookNPC}'s distress call from upstream!`
  };

  // Construct the 12 sheets (48 numbered locations #1-#48)
  const pages = [
    // SHEET 1
    {
      id: 1, act: 1,
      title: `Sheet 1: Slick-Rock Shallows & Deep Plunge Pools`,
      flow: 'W-E',
      exits: { W: 'TOWN INTAKE', E: 'UPSTREAM -> SHEET 2' },
      links: [2],
      graphPos: { x: 150, y: 24 },
      readAloud: `At the mouth of the creek canyon, the town's water intake sits choked with silt. Ahead, a sluggish stream trickles over slick boulders into dark plunge pools. (${startHazards})`,
      pois: [
        {
          num: 1, x: 120, y: 385, type: 'landmark', showOnPlayer: true,
          name: `Clogged Town Sluice & ${hookNPC}'s Tracks`,
          summary: `Mud-choked intake gate & fresh bootprints of ${hookNPC} leading upstream.`,
          details: `Initial Hook: ${townHook}\nTrail: Fresh tracks belonging to **${hookNPC}** lead east up the gorge (DC ${s.easyDC} Survival).`
        },
        {
          num: 2, x: 350, y: 260, type: 'trap', showOnPlayer: false,
          name: `Slick Rock Shelf (Slip-on-Rock Check)`,
          summary: `Tilted, slime-coated stone ledge along the north bank (DC ${s.stdDC} Acrobatics).`,
          details: `Environmental Hazard (${startHazards}): Crossing at normal speed requires a **DC ${s.stdDC} Dexterity (Acrobatics)** check. On a failure, the character takes **${s.slipDmg} bludgeoning damage**, falls Prone, and slides into the Deep Plunge Pool (#3)!`
        },
        {
          num: 3, x: 525, y: 425, type: 'trap', showOnPlayer: false,
          name: `The Sudden 15-ft Deep Plunge Pool`,
          summary: `Deceptive 15-ft underwater drop-off hidden under murky silt (DC ${s.stdDC} Athletics).`,
          details: `Environmental Hazard: What looks like ankle-deep water drops sheerly into a 15-ft flooded pothole (DC ${s.stdDC} Passive Perception). Characters in medium/heavy armor must succeed on a **DC ${s.stdDC} Strength (Athletics)** check to swim up or sink to the bottom.`
        },
        {
          num: 4, x: 765, y: 345, type: 'trap', showOnPlayer: true,
          name: `Mossy Boulder Stepping-Stones`,
          summary: `Wet boulders spanning the eastern canyon narrows (DC ${s.easyDC} Acrobatics/Athletics).`,
          details: `Environmental Challenge: Crossing the fast eddy requires a **DC ${s.easyDC} Acrobatics or Athletics** check. Tying a safety rope after the first crosser grants advantage.`
        }
      ]
    },
    // SHEET 2
    {
      id: 2, act: 1,
      title: `Sheet 2: Whirlpool Gorge & The First Creek Fork`,
      flow: 'W-NE-SE',
      exits: { W: '<- SHEET 1', E: 'NORTH LEDGES -> SHEET 3', S: 'SOUTH SLOUGH -> SHEET 4' },
      links: [3, 4],
      graphPos: { x: 150, y: 78 },
      readAloud: `The creek splits around a limestone bluff: to the east, water cascades down slick rock steps; to the south, a deep pool swirls with drifting brush.`,
      pois: [
        {
          num: 5, x: 235, y: 455, type: 'trap', showOnPlayer: false,
          name: `Sucking Clay Mire-Flat`,
          summary: `Deep vacuum-clay along the south bank (DC ${s.stdDC} STR save or Restrained).`,
          details: `Environmental Hazard: Stepping off the stone path triggers a **DC ${s.stdDC} Strength save** or the character sinks thigh-deep (**Restrained**; action DC ${s.stdDC} Athletics to free).`
        },
        {
          num: 6, x: 465, y: 350, type: 'trap', showOnPlayer: false,
          name: `The Siphon Whirlpool (Deep Pool & Undertow)`,
          summary: `20-ft deep pool with a downward rock-culvert current (DC ${s.stdDC} Athletics).`,
          details: `Environmental Hazard: Swimming within 10 ft of the center requires a **DC ${s.stdDC} Athletics** check or the undertow pulls the swimmer down for **${s.slipDmg} bludgeoning damage** against the submerged rock grate.`
        },
        {
          num: 7, x: 725, y: 210, type: 'trap', showOnPlayer: true,
          name: `North Fork: Waterfall-Slicked Shale Steps (To Sheet 3)`,
          summary: `Wet 10-ft rock staircase requiring DC ${s.stdDC} Athletics/Acrobatics.`,
          details: `Fork Option A (To Sheet 3): Slipping on the wet steps deals **${s.slipDmg} bludgeoning damage** and slides the climber back into pool #6. Fresh piton marks from **${hookNPC}** lead up these steps!`
        },
        {
          num: 8, x: 560, y: 585, type: 'landmark', showOnPlayer: true,
          name: `South Fork: Rolling Driftwood Log-Bridge (To Sheet 4)`,
          summary: `Bark-stripped pine trunk spanning the deep southern channel (DC ${s.easyDC} Acrobatics).`,
          details: `Fork Option B (To Sheet 4): The log rolls when stepped on (**DC ${s.easyDC} Acrobatics** or splash into 10-ft water).`
        }
      ]
    },
    // SHEET 3
    {
      id: 3, act: 2,
      title: `Sheet 3: North Fork — Displaced Wildlife & ${hookNPC}'s Pack`,
      flow: 'W-E',
      exits: { W: '<- SHEET 2 (FORK)', E: 'CONFLUENCE -> SHEET 5' },
      links: [5],
      graphPos: { x: 75, y: 132 },
      readAloud: `The northern gorge teems with agitated creek wildlife (${basicAnimals})—all splashing downstream in panic as if fleeing something up ahead.`,
      pois: [
        {
          num: 9, x: 220, y: 340, type: 'monster', showOnPlayer: false,
          name: `Camouflaged Creek Predator (${basicAnimals.split(',')[0]})`,
          summary: `Basic Animal ambush in the mid-stream shallows!`,
          details: `Basic Animal Encounter: A territorial **${basicAnimals.split(',')[0].trim()}** (AC ${s.builderAC + 1}, HP ${s.builderHP + 10}, Attack ${s.limbAtk} for ${s.trapDmg} slashing/piercing) lunges if anyone steps within 5 ft.`
        },
        {
          num: 10, x: 470, y: 275, type: 'monster', showOnPlayer: false,
          name: `Panicked Stampede of Creek Fauna`,
          summary: `Spooked ${basicAnimals} rushing downstream.`,
          details: `Basic Animal Encounter: A group of **${basicAnimals}** (AC ${s.builderAC}, HP ${s.builderHP}) bolts downstream in terror. A **DC ${s.easyDC} Animal Handling** check calms them, revealing they are fleeing ${midBuilders} and a shaking deep-water shadow ahead!`
        },
        {
          num: 11, x: 540, y: 520, type: 'landmark', showOnPlayer: true,
          name: `HOOK #1A: ${hookNPC}'s Torn Pack & Field Journal`,
          summary: `Abandoned gear & urgent note pulling the party east to Sheet 5!`,
          details: `HOOK TO KEEP MOVING: Snagged on the bank is **${hookNPC}'s** rucksack holding a *Potion of Healing*, 2 flares, and a journal: *"Found ${midBarrier} built by ${midBuilders} just ahead at the confluence! Taking my blasting keg to breach it—follow me east!"* Fresh drag-marks lead straight to Sheet 5.`
        },
        {
          num: 12, x: 780, y: 365, type: 'trap', showOnPlayer: false,
          name: `Slick Chute & Biting Creek Swarm`,
          summary: `Wet rock climb (DC ${s.easyDC} Athletics) harassed by biting midges/stirges.`,
          details: `Hazard: A cloud of biting creek insects (AC 13, HP ${s.builderHP}) attacks while the party scrambles up the slick eastern chute.`
        }
      ]
    },
    // SHEET 4
    {
      id: 4, act: 2,
      title: `Sheet 4: South Fork — Reed Slough & The Mired Supply Mule`,
      flow: 'N-E',
      exits: { N: '<- SHEET 2 (FORK)', E: 'CONFLUENCE -> SHEET 5' },
      links: [5],
      graphPos: { x: 225, y: 132 },
      readAloud: `Cattails choke this southern oxbow where displaced creek creatures lurk in the shallows and freshly worked timber litters the shore.`,
      pois: [
        {
          num: 13, x: 420, y: 180, type: 'trap', showOnPlayer: false,
          name: `Shifting Floating Log-Mat (Slip Check)`,
          summary: `Rolling logs over a 12-ft mud trench (DC ${s.stdDC} Acrobatics).`,
          details: `Environmental Hazard: Running across the floating timber requires a **DC ${s.stdDC} Acrobatics** check or the character slips between two grinding logs for **${s.slipDmg} bludgeoning damage** and plunges into 12-ft water.`
        },
        {
          num: 14, x: 350, y: 450, type: 'monster', showOnPlayer: false,
          name: `Slough Ambush (${basicAnimals})`,
          summary: `Basic creek predators hunting in the reed beds.`,
          details: `Basic Animal Encounter: **3 ${basicAnimals.split(',').pop().trim()}** (AC ${s.builderAC}, HP ${s.builderHP}, Attack ${s.limbAtk} for ${s.slipDmg}+2 + Grappled DC ${s.easyDC}) ambush waders from the reeds.`
        },
        {
          num: 15, x: 595, y: 515, type: 'landmark', showOnPlayer: true,
          name: `HOOK #1B: ${hookNPC}'s Mud-Mired Pack Mule`,
          summary: `Stuck expedition mule—its missing saddlebag & blasting keg were dragged to Sheet 5!`,
          details: `HOOK TO KEEP MOVING: **${hookNPC}'s** pack mule is stuck belly-deep in the mud (one saddlebag holds 50 ft silk rope, a crowbar, and 25 gp). The other saddlebag—holding the town's master sluice-key and blasting powder—was dragged east into Sheet 5 by **${midBuilders}**!`
        },
        {
          num: 16, x: 785, y: 375, type: 'monster', showOnPlayer: true,
          name: `First ${midBuilders} Sentinel`,
          summary: `Advance scout of the ${midBuilders} hauling timber toward Sheet 5.`,
          details: `Foreshadowing Encounter: A single **${midBuilders} Scout** (AC ${s.builderAC}, HP ${s.builderHP}) sounds an alarm and retreats east toward Sheet 5!`
        }
      ]
    },
    // SHEET 5
    {
      id: 5, act: 3,
      title: `Sheet 5: Outer Works of the ${midBuilders}`,
      flow: 'W-N-S-E',
      exits: { W: '<- SHEET 3 / 4', E: 'MAIN DAM -> SHEET 6', S: 'SPILLWAY -> SHEET 7' },
      links: [6, 7],
      graphPos: { x: 150, y: 188 },
      readAloud: `The two channels reunite in a flooded basin fortified by ${midBuilders}. Just upstream to the east rises the massive silhouette of ${midBarrier}!`,
      pois: [
        {
          num: 17, x: 240, y: 360, type: 'trap', showOnPlayer: false,
          name: `Submerged Sharpened Stake-Bed`,
          summary: `Underwater defensive stakes planted by ${midBuilders} (DC ${s.stdDC} DEX).`,
          details: `Hazard: Wading east without probing inflicts **${s.trapDmg} piercing damage** (DC ${s.stdDC} DEX save half).`
        },
        {
          num: 18, x: 465, y: 345, type: 'monster', showOnPlayer: true,
          name: `Fortified Outpost of the ${midBuilders}`,
          summary: `3 ${midBuilders} defending the outer weir—bearing strange wounds from upstream!`,
          details: `Combat Encounter: **3 ${midBuilders}** (AC ${s.builderAC}, HP ${s.builderHP}, Attack ${s.limbAtk} for ${s.trapDmg}+2) defend their outer lodges.\nForeshadowing Clue: Two of them bear fresh **${bossSign}** on their backs—wounds inflicted by something further upstream!`
        },
        {
          num: 19, x: 695, y: 240, type: 'landmark', showOnPlayer: true,
          name: `Main Channel Approach to ${midBarrier} (To Sheet 6)`,
          summary: `Direct approach to the main dam face on Sheet 6.`,
          details: `Path A: Leads directly to the base of **${midBarrier}** on Sheet 6.`
        },
        {
          num: 20, x: 505, y: 585, type: 'landmark', showOnPlayer: true,
          name: `Southern Overflow Ravine (To Sheet 7)`,
          summary: `Flooded side-channel flanking the dam toward Sheet 7.`,
          details: `Path B: Circles around the southern earthen wing of the barrier to Sheet 7.`
        }
      ]
    },
    // SHEET 6
    {
      id: 6, act: 3,
      title: `Sheet 6: ${midBarrier} & Break-the-Dam Challenge`,
      flow: 'W-E',
      exits: { W: '<- SHEET 5', E: 'UPPER CANYON -> SHEET 8' },
      links: [8],
      graphPos: { x: 75, y: 244 },
      readAloud: `${midBarrier} towers fifteen feet high across the gorge, holding back a groaning reservoir of dark water. ${midBuilders} guard the crest—and wedged into the timbers is ${hookNPC}'s waterproof powder keg!`,
      pois: [
        {
          num: 21, x: 245, y: 375, type: 'trap', showOnPlayer: false,
          name: `Tensioned Deadfall Bracing-Log (Trap)`,
          summary: `Disturbing the wrong lower support log whips a timber across the bank (DC ${s.stdDC} DEX).`,
          details: `Hazard: Pulling or cutting the lower bracing without a **DC ${s.stdDC} Investigation** check releases a tensioned log for **${s.fail1Dmg} bludgeoning damage** (DC ${s.stdDC} DEX save half).`
        },
        {
          num: 22, x: 470, y: 335, type: 'monster', showOnPlayer: true,
          name: `Guardians of ${midBarrier}`,
          summary: `Leader & 2 ${midBuilders} defending the crest while glancing terrified upstream!`,
          details: `Combat Encounter: **1 ${midBuilders} Alpha/Leader** (AC ${s.builderAC + 1}, HP ${s.builderHP + 16}) and **2 ${midBuilders}** (AC ${s.builderAC}, HP ${s.builderHP}). Even during combat, they frantically try to plug cracks facing *east*!`
        },
        {
          num: 23, x: 525, y: 495, type: 'trap', showOnPlayer: true,
          name: `SKILL CHALLENGE: Breaking ${midBarrier}!`,
          summary: `3 Successes before 2 Failures (DC ${s.stdDC})—or risk getting crushed by the dam burst!`,
          details: `BREAK-THE-DAM CHALLENGE: Once the defenders are cleared, demolishing ${midBarrier} safely requires **3 Successes before 2 Failures (DC ${s.stdDC})**:\n• **Locate the Keystone Timber:** DC ${s.stdDC} Investigation, Nature, or Carpenter's/Mason's Tools.\n• **Rig ${hookNPC}'s Powder Keg or Pry the King-Pin:** DC ${s.stdDC} Athletics (crowbar/rope) or Sleight of Hand/Alchemist's Supplies.\n• **Scramble to High Ground:** DC ${s.easyDC} Acrobatics or Athletics before the wall gives way.\n⚠️ **IF THE PARTY DOES IT WRONG (Failure Consequences):**\n• **1st Failure (Crushing Log Avalanche):** Timbers collapse onto the dam face! Everyone within 15 ft must make a **DC ${s.stdDC} DEX save** or take **${s.fail1Dmg} bludgeoning damage** and be pinned (DC ${s.easyDC} STR to free).\n• **2nd Failure (Catastrophic Flash-Flood Burst!):** The dam explodes while the party is in the channel! A 20-ft wall of debris slams the gorge: **DC ${s.hardDC} STR save** or take **${s.fail2Dmg} bludgeoning damage**, get swept 40 ft downstream, and suffer 1 level of Exhaustion!`
        },
        {
          num: 24, x: 785, y: 350, type: 'landmark', showOnPlayer: true,
          name: `HOOK #2: The Post-Dam Twist & Distress Horn Upstream!`,
          summary: `Breaking the dam washes out ${bossSign} & ${hookNPC}'s distress call from Sheet 8!`,
          details: `THE TWIST & HOOK TO KEEP GOING: When the dam breaks, the water pouring downstream is **NOT clean**—it is fouled with **${bossSign}**!\n1. **The Reveal:** Washed out from behind the dam are slaughtered ${midBuilders} crushed by **${bigBoss}'s ${bossLimb}**—proving they built ${midBarrier} to *protect the valley from the monster upstream*!\n2. **Why Keep Moving:** The town's water is still poisoned at the source, and echoing from Sheet 8 come three desperate blasts on **${hookNPC}'s signal horn** as a single ${bossLimb} drags their raft toward the headwaters!`
        }
      ]
    },
    // SHEET 7
    {
      id: 7, act: 3,
      title: `Sheet 7: South Spillway — The Flank Breach & Slaughtered Builders`,
      flow: 'N-E',
      exits: { N: '<- SHEET 5', E: 'UPSTREAM -> SHEET 9' },
      links: [9],
      graphPos: { x: 225, y: 244 },
      readAloud: `This southern bypass skirts the earthen wing of ${midBarrier}, where shattered timbers are smeared with ${bossSign}.`,
      pois: [
        {
          num: 25, x: 390, y: 195, type: 'trap', showOnPlayer: true,
          name: `Earthen Wing-Dam (Flank Demolition Site)`,
          summary: `Alternative breach point (2 Successes at DC ${s.stdDC}, or ${s.fail1Dmg} boulder slide on fail).`,
          details: `Alternative Breach: Can be collapsed with **2 DC ${s.stdDC} Athletics/Investigation successes**, but failing a roll drops a rockslide for **${s.fail1Dmg} bludgeoning damage** (DC ${s.stdDC} DEX half).`
        },
        {
          num: 26, x: 315, y: 470, type: 'landmark', showOnPlayer: true,
          name: `Slaughtered ${midBuilders} Barricade`,
          summary: `Dead ${midBuilders} covered in ${bossSign}.`,
          details: `Twist Clue: DC ${s.easyDC} Medicine/Nature confirms these ${midBuilders} were killed by a colossal **${bossLimb}** striking from upstream.`
        },
        {
          num: 27, x: 560, y: 410, type: 'trap', showOnPlayer: false,
          name: `First Strike of the Long-Range ${bossLimb}`,
          summary: `A single probing ${bossLimb} lashes from a submerged vent (${s.limbAtk}, ${s.limbDmg})!`,
          details: `Foreshadowing Hazard: A single **${bossLimb}** lashes once from a sinkhole vent (${s.limbAtk} to hit, ${s.limbDmg}) before slithering east toward Sheet 9!`
        },
        {
          num: 28, x: 780, y: 350, type: 'landmark', showOnPlayer: true,
          name: `HOOK #2B: ${hookNPC}'s Dragged Skiff & Upstream Trail`,
          summary: `Smashed boat & fresh trail leading east into Sheet 9.`,
          details: `Hook to Keep Going: ${hookNPC}'s wrecked boat and a trail of ${bossSign} lead directly east to Sheet 9.`
        }
      ]
    },
    // SHEET 8
    {
      id: 8, act: 4,
      title: `Sheet 8: Boss Challenge I — The Log-Bridge ${bossLimb} Snatch`,
      flow: 'W-NE-SE',
      exits: { W: '<- SHEET 6', E: 'NORTH GORGE -> SHEET 10', S: 'CROSSING -> SHEET 9' },
      links: [9, 10],
      graphPos: { x: 75, y: 300 },
      readAloud: `With the dam drained, deep karst sinkholes gape in the riverbed. Through these flooded rock tubes, ${bigBoss} projects a single long-distance ${bossLimb} half a mile downstream!`,
      pois: [
        {
          num: 29, x: 230, y: 360, type: 'trap', showOnPlayer: false,
          name: `Submerged Karst Tube & Slick Ledge`,
          summary: `Flooded limestone tunnel used by the long-range ${bossLimb} (DC ${s.stdDC} Acrobatics bank).`,
          details: `Hazard: The slime-coated bank requires a **DC ${s.stdDC} Acrobatics** check at full speed; the underwater tube leads back toward Sheet 12.`
        },
        {
          num: 30, x: 485, y: 300, type: 'monster', showOnPlayer: false,
          name: `CHALLENGE #1: The Bridge-Smasher ${bossLimb}`,
          summary: `Single Long-Range ${bossLimb} (AC ${s.limbAC}, ${s.limbHP} HP) grabbing bridge crossers!`,
          details: `LONG-RANGE CHALLENGE #1: As the party crosses the waterfall pool or log bridge (#31), a single **${bossLimb}** (AC ${s.limbAC}, HP ${s.limbHP}, Reach 25 ft) erupts!\n• **Grab & Drag:** Attacks at **${s.limbAtk} for ${s.limbDmg}** + **Grappled (escape DC ${s.stdDC})**, dragging grappled victims 15 ft/round toward the submerged tube (#29).\n• **Counterplay:** Dealing ${s.limbHP} damage (or pinning it with a DC ${s.hardDC} Athletics check) forces it to recoil upstream!`
        },
        {
          num: 31, x: 545, y: 575, type: 'landmark', showOnPlayer: true,
          name: `Mossy Chasm Log-Bridge (South Crossover to Sheet 9)`,
          summary: `Ironwood trunk spanning the gorge (DC ${s.stdDC} DEX save if struck by ${bossLimb}).`,
          details: `Terrain: Allows crossing south to Sheet 9 or continuing east to Sheet 10.`
        },
        {
          num: 32, x: 775, y: 220, type: 'landmark', showOnPlayer: true,
          name: `Waterfall Grotto of Rescued ${hookNPC}`,
          summary: `Dry shelf behind the cascade where wounded ${hookNPC} hands over the Master Key & supplies!`,
          details: `Rescue & Reward: **${hookNPC}** is trapped here clutching the town's Master Sluice-Key! They warn that **${bigBoss}** is wedged directly over the main artesian spring on Sheet 12, and hand the party **2 Potions of Healing** and a **Scroll of Lightning Bolt**.`
        }
      ]
    },
    // SHEET 9
    {
      id: 9, act: 4,
      title: `Sheet 9: Boss Challenge II — Three-Vent Sinkhole Gauntlet`,
      flow: 'W-N-E',
      exits: { W: '<- SHEET 7', N: '<- SHEET 8 (BRIDGE)', E: 'SOUTH TRENCH -> SHEET 11' },
      links: [11],
      graphPos: { x: 225, y: 300 },
      readAloud: `Three circular blue-black sinkholes honeycomb the creek bed here. Bubbles burst from one vent, then another, as a single long-distance ${bossLimb} darts beneath the rock!`,
      pois: [
        {
          num: 33, x: 250, y: 410, type: 'trap', showOnPlayer: false,
          name: `CHALLENGE #2: Three-Vent "Whack-a-Limb" Gauntlet`,
          summary: `The single ${bossLimb} erupts from Vent A (#33), B (#34), or C (#36) each round!`,
          details: `LONG-RANGE CHALLENGE #2: Roll 1d6 each round (1-2: West Vent #33, 3-4: Center Vent #34, 5-6: East Vent #36). A **DC ${s.stdDC} Perception** check spots the bubbles before the **${bossLimb}** (AC ${s.limbAC}, HP ${s.limbHP}) sweeps a 15-ft radius (**DC ${s.stdDC} DEX save** or **${s.trapDmg}+3 damage** and pulled into the water).\n• **Smart Solution:** Roll heavy boulders (**DC ${s.stdDC} Athletics**) into two vents to trap the ${bossLimb} in one hole!`
        },
        {
          num: 34, x: 525, y: 385, type: 'monster', showOnPlayer: false,
          name: `Central Sinkhole Vent & Scavenger Swarm`,
          summary: `Main eruption vent patrolled by 2 Swarms of Quippers.`,
          details: `Minions: **2 Swarms of Quippers** (AC 13, HP ${s.builderHP}) bite anyone knocked into the central pool.`
        },
        {
          num: 35, x: 480, y: 150, type: 'landmark', showOnPlayer: true,
          name: `High Limestone Balcony & Plugging Boulders`,
          summary: `10-ft stone shelf with loose boulders that can be shoved into Vent #34!`,
          details: `Tactical Advantage: Shoving a boulder off this ledge (**DC ${s.easyDC} Athletics**) deals **${s.fail2Dmg} bludgeoning damage** to the ${bossLimb} in #34 and seals that vent!`
        },
        {
          num: 36, x: 760, y: 440, type: 'landmark', showOnPlayer: true,
          name: `Eastern Vent & Sunken Adventurer Cache`,
          summary: `Drowned pack containing Boots of Striding and Springing & 90 gp.`,
          details: `Treasure: Tangled at the rim of the eastern vent is a waterproof pack holding *Boots of Striding and Springing* and 90 gp.`
        }
      ]
    },
    // SHEET 10
    {
      id: 10, act: 4,
      title: `Sheet 10: Boss Challenge III — The Last Builder & Constricted Gorge`,
      flow: 'W-E',
      exits: { W: '<- SHEET 8', E: 'BOSS CAVERN -> SHEET 12' },
      links: [12],
      graphPos: { x: 75, y: 356 },
      readAloud: `Just outside the cavern mouth of the spring stands a final barricade facing upstream—where a lone, battle-scarred Elder of the ${midBuilders} is pinned by a coiling ${bossLimb}!`,
      pois: [
        {
          num: 37, x: 230, y: 360, type: 'landmark', showOnPlayer: true,
          name: `Upstream-Facing Defense Stakes`,
          summary: `Sharpened stakes pointing EAST toward Sheet 12.`,
          details: `Proof: Every stake in this final barricade points *upstream toward ${bigBoss}'s lair*.`
        },
        {
          num: 38, x: 470, y: 335, type: 'monster', showOnPlayer: true,
          name: `CHALLENGE #3: 3-Round Timed Rescue of the Elder Builder`,
          summary: `Free the Elder of the ${midBuilders} from the Constrictor ${bossLimb} within 3 rounds!`,
          details: `LONG-RANGE CHALLENGE #3 (Timed Rescue): A **Constrictor ${bossLimb}** (AC ${s.limbAC}, HP ${s.limbHP + 5}) is crushing the last dam and pinning **"Old Iron-Tooth"** (an Elder of the ${midBuilders}, AC ${s.builderAC + 1}, HP ${s.builderHP + 18}).\n• **3-Round Timer:** If the party deals ${s.limbHP + 5} damage to the ${bossLimb} within 3 rounds, Old Iron-Tooth is saved and **joins the party as an ally for the Boss Fight on Sheet 12**! If they fail, the dam bursts for **${s.fail1Dmg} damage** (DC ${s.stdDC} DEX save).`
        },
        {
          num: 39, x: 545, y: 510, type: 'trap', showOnPlayer: false,
          name: `Pressurized Fouled-Water Geyser`,
          summary: `Rock crack spraying blinding sludge every round on Init 10 (DC ${s.stdDC} CON).`,
          details: `Hazard: 15-ft line spray; **DC ${s.stdDC} CON save** or Blinded until end of next turn.`
        },
        {
          num: 40, x: 785, y: 365, type: 'landmark', showOnPlayer: true,
          name: `North Cavern Archway (To Sheet 12)`,
          summary: `Echoing limestone maw leading into the Boss Sinkhole.`,
          details: `Transition: Enters the northern platform of Sheet 12.`
        }
      ]
    },
    // SHEET 11
    {
      id: 11, act: 4,
      title: `Sheet 11: Boss Challenge IV — The Blind Tremorsense Canyon`,
      flow: 'W-N-E',
      exits: { W: '<- SHEET 9', E: 'BOSS CAVERN -> SHEET 12' },
      links: [12],
      graphPos: { x: 225, y: 356 },
      readAloud: `The southern approach to the spring is filled with waist-deep dark water and blinding mist. Beneath the surface, a long ${bossLimb} hunts purely by water-vibrations!`,
      pois: [
        {
          num: 41, x: 260, y: 400, type: 'trap', showOnPlayer: false,
          name: `Narrow Slippery Wall-Ribbon (Slip-into-Water Check)`,
          summary: `2-ft dry stone ledge along the south wall (DC ${s.stdDC} Acrobatics).`,
          details: `Hazard: Edging along the dry shelf requires a **DC ${s.stdDC} Acrobatics** check; slipping splashes into the water and triggers #42!`
        },
        {
          num: 42, x: 500, y: 380, type: 'monster', showOnPlayer: false,
          name: `CHALLENGE #4: The Tremorsense Stalker ${bossLimb}`,
          summary: `Stealth & Decoy Challenge! The ${bossLimb} strikes anyone who splashes (DC ${s.stdDC} Stealth).`,
          details: `LONG-RANGE CHALLENGE #4: The **Sensor-${bossLimb}** (AC ${s.limbAC}, HP ${s.limbHP}) has Tremorsense 60 ft in water. Any creature moving in the water without a **DC ${s.stdDC} Stealth** check triggers a reaction snatch (**${s.limbAtk} to hit, ${s.limbDmg} + Grappled**).\n• **Decoy Counterplay:** Tossing heavy boulders from #43 into the water tricks the ${bossLimb} into striking the rock, granting advantage on all attacks against it for 1 round!`
        },
        {
          num: 43, x: 500, y: 175, type: 'landmark', showOnPlayer: true,
          name: `Northern Balcony & Decoy Boulders`,
          summary: `Dry rock shelf (DC ${s.easyDC} Athletics climb) with loose stones for vibration decoys.`,
          details: `Tactical Vantage: Perfect for rigging a traverse rope or dropping decoy rocks.`
        },
        {
          num: 44, x: 785, y: 375, type: 'landmark', showOnPlayer: true,
          name: `Southern Cavern Causeway (To Sheet 12)`,
          summary: `Stone steps rising into the southern flank of Sheet 12.`,
          details: `Transition: Enters the southern limestone ledge of Sheet 12.`
        }
      ]
    },
    // SHEET 12
    {
      id: 12, act: 5,
      title: `Sheet 12: BOSS — ${bigBoss} of Blackwater Spring`,
      flow: 'CAVERN',
      exits: { W: '<- SHEET 10 / 11', E: 'ARTESIAN SPRING VENT' },
      links: [],
      graphPos: { x: 150, y: 408 },
      readAloud: `The creek's source is a vast flooded limestone sinkhole. Coiled directly over the town's artesian spring vent is ${bigBoss}—grown monstrous while the party delayed!`,
      pois: [
        {
          num: 45, x: 195, y: 360, type: 'landmark', showOnPlayer: true,
          name: `Shattered Megadam Causeway (Entry Ledges)`,
          summary: `Dry timber & stone platforms overlooking the sinkhole pool.`,
          details: `Entry: Provides half-cover. If **Old Iron-Tooth (#38)** was rescued, they charge in to distract one of the boss's limbs!`
        },
        {
          num: 46, x: 420, y: 195, type: 'trap', showOnPlayer: false,
          name: `Cracked Cavern Ceiling Pillars (Boss Environmental Weapon)`,
          summary: `Collapse the pillars onto ${bigBoss} for ${s.pillarDmg} bludgeoning damage & stun!`,
          details: `Environmental Weapon: Two cracked pillars flank the pool (AC 13, 25 HP, or **DC ${s.hardDC} Athletics** with a crowbar). Toppling one deals **${s.pillarDmg} bludgeoning damage** to ${bigBoss}!`
        },
        {
          num: 47, x: 590, y: 365, type: 'monster', showOnPlayer: true,
          name: `FINAL BOSS: ${bigBoss.toUpperCase()}`,
          summary: `AC ${s.bossAC}, HP ${s.bossHP} (or ${s.bossWeakHP} HP if weakened in Stage 4) + Lair Actions!`,
          details: `FINAL BOSS FIGHT: **${bigBoss}** (AC ${s.bossAC}, HP ${s.bossHP}; reduced to **${s.bossWeakHP} HP** if the party defeated at least two ${bossLimb} challenges on Sheets 8–11!).\n• **Multiattack:** Two *${bossLimb} Slams* (${s.bossAtk} to hit, reach 25 ft, **${s.bossSlamDmg}** + Grappled DC ${s.hardDC}) and one *Crushing Bite* (${s.bossAtk} to hit, **${s.bossBiteDmg}**).\n• **Lair Action (Init 20):** Pulls all creatures in water 15 ft toward the sinkhole (**DC ${s.stdDC} STR save**) OR coats a 20-ft bank in slick slime (**DC ${s.stdDC} Acrobatics** or Prone).`
        },
        {
          num: 48, x: 785, y: 365, type: 'landmark', showOnPlayer: true,
          name: `The Pure Artesian Spring & Sunken Hoard`,
          summary: `Crystal-clear water flushes the creek clean down to town + ${s.goldReward} hoard!`,
          details: `Victory: Slaying ${bigBoss} unblocks the artesian spring, sending pure mountain water roaring back down to the town distillery!\nTreasure Hoard: **${s.goldReward}**, a *Decanter of Endless Water*, *Mariner's Armor +1*, and a *Trident of Fish Command*.`
        }
      ]
    }
  ];

  return {
    seed: spec.seed || ('STORY-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
    presetId: 'custom_generated',
    campaign: campaignMeta,
    activePageId: 1,
    pages
  };
}

// Interactive CLI Prompter
async function promptInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, def) => new Promise(res => {
    rl.question(`${q} [${def}]: `, ans => res(ans.trim() || def));
  });

  console.log('\n============================================================');
  console.log(' ✒️  D&D DYSON CREEK CRAWL — INTERACTIVE STORY BUILDER');
  console.log('============================================================\n');

  const title = await ask('1. Quest / Story Title', 'The Distiller’s Creek Crawl');
  const challengeTier = await ask('2. Challenge Level (low = Lv 1-3, medium = Lv 4-6, high = Lv 7-10)', 'medium');
  const townHook = await ask('3. Town Hook (Why is the party going up the creek?)', 'Dirty creek water has halted the town distillery; locals blame beaver dams.');
  const hookNPC = await ask('4. Missing NPC / Trail Hook (Who went ahead to keep the party moving?)', 'Bram the Distillery Water-Warden');
  const startingHazards = await ask('5. Starting Challenges (Sheets 1-2 Environmental Hazards)', 'Algae-slick limestone ledges, sudden 15-ft deep plunge pools, and sucking clay flats');
  const basicAnimals = await ask('6. Basic Creek Animals (Sheets 3-4 Wildlife)', 'Giant Snapping Turtles, panicked Giant River Otters, and Giant Bullfrogs');
  const middleBuilders = await ask('7. Middle Dam Builders (Sheets 5-7 Creature Group)', 'Giant Dire Beavers');
  const middleBarrier = await ask('8. Middle Barrier to Break (Sheet 6 Dam/Wall)', 'The Great 15-ft Timber & Mud Beaver Dam');
  const bigBoss = await ask('9. Final Big Boss at the Creek Source (Sheet 12)', 'The Juvenile Creek Kraken');
  const bossProjection = await ask('10. Boss Long-Range Projection (Sheets 8-11 Challenges)', 'Long-Range Hunting Tentacle');
  const bossClueSign = await ask('11. Boss Clue Sign (What washes out when the dam breaks?)', 'circular purple tentacle sucker-scars and oily black cephalopod ink');

  rl.close();
  return {
    title,
    challengeTier,
    townHook,
    hookNPC,
    startingHazards,
    basicAnimals,
    middleBuilders,
    middleBarrier,
    bigBoss,
    bossProjection,
    bossClueSign
  };
}

// Optionally update app.js default STORY_PRESETS & SHEET_BLUEPRINTS
function applyStoryToAppJS(campaignData) {
  if (!fs.existsSync(APP_JS_PATH)) return false;
  let code = fs.readFileSync(APP_JS_PATH, 'utf8');

  const blueprintRegex = /const SHEET_BLUEPRINTS = \[[\s\S]*?\n\];/;
  if (!blueprintRegex.test(code)) return false;

  const replacement = `const SHEET_BLUEPRINTS = ${JSON.stringify(campaignData.pages, null, 2)};`;
  code = code.replace(blueprintRegex, replacement);

  // Also update default preset hook/twist/title
  const presetRegex = /beavers_to_kraken:\s*\{[\s\S]*?\n  \},/;
  const presetReplacement = `beavers_to_kraken: ${JSON.stringify(campaignData.campaign, null, 4).replace(/\n/g, '\n  ')},`;
  if (presetRegex.test(code)) {
    code = code.replace(presetRegex, presetReplacement);
  }

  fs.writeFileSync(APP_JS_PATH, code, 'utf8');
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  let configPath = null;
  let outPath = null;
  let applyDefault = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) configPath = args[++i];
    else if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
    else if (args[i] === '--apply-default') applyDefault = true;
  }

  let spec;
  if (configPath) {
    spec = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));
  } else {
    spec = await promptInteractive();
  }

  const campaignData = buildCampaignFromSpec(spec);

  if (!fs.existsSync(STORIES_DIR)) {
    fs.mkdirSync(STORIES_DIR, { recursive: true });
  }

  const slug = (spec.title || 'custom-story')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const finalOut = outPath ? path.resolve(outPath) : path.join(STORIES_DIR, `${slug}.json`);

  fs.writeFileSync(finalOut, JSON.stringify(campaignData, null, 2), 'utf8');
  console.log(`\n✅ Saved 12-Sheet (48-Encounter) Creek Crawl Story JSON to:\n   ${finalOut}`);

  if (applyDefault) {
    const applied = applyStoryToAppJS(campaignData);
    if (applied) {
      console.log(`✅ Updated ${APP_JS_PATH} with the new story as the default crawl!`);
    }
  } else {
    console.log(`💡 Tip: Open index.html and click "📂 Load" to load ${path.basename(finalOut)}, or run with --apply-default to make it the default in app.js!\n`);
  }
}

main().catch(err => {
  console.error('Error building story:', err);
  process.exit(1);
});
