/* Reclamation University / Chroma Key Protocol
 * Act II — The Reflection Chamber (Element: Water)
 * Protocol of Governed Feeling
 *
 * Production module data. Uniform five-pillar scaffold with Act I (Earth).
 * Shadow Codes = diagnostic naming of permeable patterns.
 * Light Codes = instructional rewrite toward governed current.
 * Consumed by experience layers / protocol engine.
 */

export const REFLECTION_META = {
  roman: "II",
  element: "Water",
  act: "The Reflection Chamber",
  protocol: "The Protocol of Governed Feeling",
  frequency: "Blue / Deep Indigo",
  color: "#50a0e0",
  dim: "#2a6090",
  agent: "Meridian",
  archetype: "The Permeable Vessel → The Governed Current",
  mission: "Feel everything without dissolving",
  userAction: "Reflection → Transmutation → Boundary",
  estimatedTime: "45–75 min (full five pillars) or 8–12 min per pillar",
  thesis:
    "Water with no banks takes the shape of whatever holds it. The same depth of feeling, once given shoreline, becomes directional, consensual, and instructive. Reflection without dissolution. Mercy with a bank.",
  hinge:
    "Every pillar answers one question: Where am I still absorbing what was never mine to carry, and how do I return that voltage to right function?",
  note:
    "Act I mapped the floor and named the fracture. Act II does not rebuild the old floor. It teaches the water that now moves across it how to keep its own channel. Diagnosis remains primary in early pillars; instruction intensifies as the current stabilizes. Do not rush the banks. Premature hardness is just another form of flood.",
};

export const ACT_LEVEL_PAIR = {
  shadow: {
    name: "The Permeable Vessel",
    body: "Water with no banks. The Seeker takes the shape of another’s grief, narrative, or verdict. Absorption becomes identity. Feeling everything becomes proof of nothing.",
  },
  light: {
    name: "The Governed Current",
    body: "The same depth of feeling, now bounded, directional, and consensual. Reflection without dissolution. Mercy with a shoreline.",
  },
};

/* ---------------------------------------------------------------------------
 * Canonical track → pillar mapping.
 *
 * The music is structurally tied to the Shadow/Light curriculum: a song is the
 * emotional field in which one specific pattern becomes encounterable, so the
 * wrong song-to-pillar association produces the wrong diagnostic architecture.
 * This table is the source of truth for that mapping — the `track` field on an
 * individual CodeEntry names which of its pillar's tracks that entry was drawn
 * from, and must always be a member of the pillar's list here. All 27 tracks
 * of the source manifest (Chroma_Key_Act_Two_Reflection_Chamber_Track_Matrix)
 * are accounted for across the five lists below.
 *
 * "The Seeker and the Silent" (Pillar Three) has no row in `public.tracks` —
 * see supabase/migrations/20260823130000_seed_act_two_reflection_chamber_tracks.sql's
 * header: its R2 object key is unconfirmed, so it was deliberately excluded
 * from that seed rather than seeded with a guessed key. It is listed here
 * because the curriculum entry is real and decoupled from playback, but any
 * UI that plays a pillar's tracks must not assume this one has audio yet.
 * ------------------------------------------------------------------------- */
export const PILLAR_TRACK_MAP = Object.freeze({
  "owned-interior": [
    "The Reflection Chamber",
    "The Shadow Magician",
    "Safer Lie",
    "Phantom",
    "The Veil Thins",
  ],
  "forged-witness": [
    "Version of Me",
    "5 Minutes From The Edge",
    "Ashes and Iron (Bloodline and Flame)",
    "Felt That Drift",
    "If He Could Only See",
    "If You Really Listened",
  ],
  "sacred-restraint": [
    "Unsent Messages Season",
    "Before The Verdict and the Door",
    "The Ones We Still Carry",
    "The Seeker and the Silent",
    "H2O",
  ],
  "open-frequency": [
    "Sun Don’t Invoice",
    "Not Alone",
    "The Great Turning",
    "This Ain’t The Limit",
  ],
  "mirror-walker-boundary": [
    "Willful Detonation",
    "Icarus Ain’t Cryin’ This Time",
    "Live For Me",
    "Tearin’ You Apart",
    "Promise",
    "I Own Every Word",
    "Not Your Cross (The Seeker’s Initiation)",
  ],
});

/**
 * Each pillar's macro-theme: the single Shadow Code / Light Code pair the
 * whole pillar's interactive engine currently drives its arc with, drawn from
 * that pillar's most thematically central track (the one its existing mantra
 * or seal already echoes). The pattern names are organizing labels for the
 * psychological material — they are subordinate to the codes, which are the
 * instructional payload.
 *
 * Only Pillar One has a live interactive engine today (PillarExperience.jsx);
 * the other four are populated now so a future portal for that pillar reads
 * the same shape rather than inventing its own.
 */
export const PILLAR_CANONICAL_CODES = Object.freeze({
  "owned-interior": Object.freeze({
    shadow: Object.freeze({
      pattern: "The Displaced War",
      code: "My pain is an external curse, and God/Fate is to blame for my suffering.",
      body: "The movement of internal pain outward — into circumstance, other people, Fate, God, reality, perceived enemies, external injustice. The event can be real; the injury can be real; the injustice can be real. The code is the additional rule underneath: if the source of all suffering exists outside me, then I have no authority over the internal system responding to it.",
    }),
    light: Object.freeze({
      pattern: "The Owned Interior",
      code: "The real war is within; I must reclaim the light that has always been mine.",
      body: "Not a denial of external reality — a restoration of internal agency. The war is claimed as sovereign territory so that it can finally be worked.",
    }),
  }),
  "forged-witness": Object.freeze({
    shadow: Object.freeze({
      pattern: "The Armored Survivor",
      code: "What protected you can imprison you.",
      body: "Survival strategies wearing the names of virtues — hypervigilance renamed strength, isolation renamed focus, exhaustion renamed grind — kept running long after the siege that installed them ended.",
    }),
    light: Object.freeze({
      pattern: "The Forged Witness",
      code: "Keep the strength. Return the debt.",
      body: "The power forged under pressure is retained; the gratitude owed to whoever forged it is not. Testimony without bitterness.",
    }),
  }),
  "sacred-restraint": Object.freeze({
    shadow: Object.freeze({
      pattern: "Silence as Concealed Fear",
      code: "Silence can become avoidance wearing the mask of wisdom.",
      body: "The unsent message dressed as maturity when it is really avoidance — restraint that has quietly stopped being a choice.",
    }),
    light: Object.freeze({
      pattern: "Sacred Restraint",
      code: "My silence is chosen, not inherited.",
      body: "Timing as care. Words kept where they can bless rather than fracture — restraint exercised out of mastery over timing, not fear.",
    }),
  }),
  "open-frequency": Object.freeze({
    shadow: Object.freeze({
      pattern: "The Ledger",
      code: "Giving with an invoice is still a transaction.",
      body: "Giving as leverage, optics, or debt-creation — light hoarded on the theory that supply is finite.",
    }),
    light: Object.freeze({
      pattern: "Open Frequency",
      code: "I give without requiring repayment.",
      body: "Giving as emission rather than transaction. Ego removed so the field can expand — the sun's economy: total output, zero accounting.",
    }),
  }),
  "mirror-walker-boundary": Object.freeze({
    shadow: Object.freeze({
      pattern: "The Unvented Furnace",
      code: "I am meant to be a landfill for grief, absorbing corrosion.",
      body: "A chamber that accepts every unnamed grief until absorption compounds into mass — designated by others as the one who can survive it, and agreeing.",
    }),
    light: Object.freeze({
      pattern: "The Mirror-Walker’s Boundary",
      code: "Alchemy is not consumption; it is transformation with consent.",
      body: "Bring me your shadow — I will diagram its frame. But I will not carry what you refuse to name.",
    }),
  }),
});

/**
 * The full per-track Shadow Code / Light Code pairing for every pillar. No
 * pillar's tracks all teach the same code — each is a distinct encounter
 * surrounding that pillar's one macro-theme above. Track order matches the
 * source manifest's numbering, not PILLAR_TRACK_MAP's array order.
 */
export const PILLAR_TRACK_CODES = Object.freeze({
  "owned-interior": Object.freeze([
    Object.freeze({
      track: "The Reflection Chamber",
      shadow: "My pain is an external curse, and God/Fate is to blame for my suffering.",
      light: "The real war is within; I must reclaim the light that has always been mine.",
    }),
    Object.freeze({
      track: "The Shadow Magician",
      shadow: "The shadow is a demon that shatters the self.",
      light: "The shadow is a teacher to face; integration redeems the fracture.",
    }),
    Object.freeze({
      track: "Safer Lie",
      shadow: "Closing the door and shutting out love creates safety and peace.",
      light: "Peace does not come from killing what you swore; truth always breaks the mirror.",
    }),
    Object.freeze({
      track: "Phantom",
      shadow: "The mirror only reflects my broken reality and isolation.",
      light: "The inner mirror holds my healed reflection, a phantom that empowers me.",
    }),
    Object.freeze({
      track: "The Veil Thins",
      shadow: "Ascension is an escape into higher elevation and comfort.",
      light: "Ascension is full exposure; drop the act and walk in truth.",
    }),
  ]),
  "forged-witness": Object.freeze([
    Object.freeze({
      track: "Version of Me",
      shadow: "What protected you can imprison you.",
      light: "Keep the strength. Return the debt.",
    }),
    Object.freeze({
      track: "5 Minutes From The Edge",
      shadow: "Loving someone means dying for them repeatedly to keep them sane.",
      light: "I can walk away to survive without punishing your shame.",
    }),
    Object.freeze({
      track: "Ashes and Iron (Bloodline and Flame)",
      shadow: "My rage is an armor that will heal my broken pride.",
      light: "Only releasing the crusade will grant mercy unrehearsed.",
    }),
    Object.freeze({
      track: "Felt That Drift",
      shadow: "Fear builds cages to maintain Earth’s control.",
      light: "Mastery moves within; the body knows before the mind can look.",
    }),
    Object.freeze({
      track: "If He Could Only See",
      shadow: "Safety means remaining silent and chasing external approval.",
      light: "The truth is louder than the lies they told; real love rises above the fear.",
    }),
    Object.freeze({
      track: "If You Really Listened",
      shadow: "Moving on quietly means I am untouched by the fall.",
      light: "I am not numb; I alchemized a void into my survival.",
    }),
  ]),
  "sacred-restraint": Object.freeze([
    Object.freeze({
      track: "Unsent Messages Season",
      shadow: "Silence can become avoidance wearing the mask of wisdom.",
      light: "My silence is chosen, not inherited.",
    }),
    Object.freeze({
      track: "Before The Verdict and the Door",
      shadow: "Waiting for judgment absolves me of responsibility.",
      light: "Redemption asks for truth, not another hedge; step through the door.",
    }),
    Object.freeze({
      track: "The Ones We Still Carry",
      shadow: "I must beg a silence to shift into sound to heal.",
      light: "I can walk forward, and let your reflection walk with me.",
    }),
    Object.freeze({
      track: "The Seeker and the Silent",
      shadow: "My departure makes me the villain in the absence of an explanation.",
      light: "Not all silence is absence; leaving is sometimes necessary to survive.",
    }),
    Object.freeze({
      track: "H2O",
      shadow: "I must hold onto false projections to survive the flood.",
      light: "Break me down to elemental essence; water heals and reveals truth.",
    }),
  ]),
  "open-frequency": Object.freeze([
    Object.freeze({
      track: "Sun Don’t Invoice",
      shadow: "Giving with an invoice is still a transaction.",
      light: "I give without requiring repayment.",
    }),
    Object.freeze({
      track: "Not Alone",
      shadow: "I must earn love with suffering and chains.",
      light: "You don’t need to prove it, just allow; you are not alone.",
    }),
    Object.freeze({
      track: "The Great Turning",
      shadow: "The crumbling of the world is a punishment.",
      light: "The turning is a preparation; everything we lose, we outgrew.",
    }),
    Object.freeze({
      track: "This Ain’t The Limit",
      shadow: "The ceiling of reality is a glass cage built from fear.",
      light: "The limit is a firewall wrapped in wisdom and mercy.",
    }),
  ]),
  "mirror-walker-boundary": Object.freeze([
    Object.freeze({
      track: "Willful Detonation",
      shadow: "Do not carry a weapon someone else handed you.",
      light: "Return the weapon. Keep your will.",
    }),
    Object.freeze({
      track: "Icarus Ain’t Cryin’ This Time",
      shadow: "I must kneel and accept divine games as a test of love.",
      light: "I draw the line; I am reborn and do not answer to a sky made of stone.",
    }),
    Object.freeze({
      track: "Live For Me",
      shadow: "I must play savior even while you counterfeit the truth and drain my light.",
      light: "I cut the cords not to hate you, but because I love myself more.",
    }),
    Object.freeze({
      track: "Tearin’ You Apart",
      shadow: "Feeling it does not mean it belongs to you.",
      light: "I can feel what is yours without carrying it.",
    }),
    Object.freeze({
      track: "Promise",
      shadow: "Loyalty requires that I bleed to keep you standing.",
      light: "I break the vow to stand by you so I do not turn my own heart into a crime.",
    }),
    Object.freeze({
      track: "I Own Every Word",
      shadow: "I must shrink, walk on defense, and apologize to make others comfortable.",
      light: "I take my power back and stop living underneath bridges to keep the peace.",
    }),
    Object.freeze({
      track: "Not Your Cross (The Seeker’s Initiation)",
      shadow: "I am meant to be a landfill for grief, absorbing corrosion.",
      light: "Alchemy is not consumption; it is transformation with consent.",
    }),
  ]),
});

/**
 * @typedef {{
 *   name: string,
 *   track?: string,
 *   code?: string,
 *   body: string,
 *   diagnostic?: string,
 *   instructional?: string,
 * }} CodeEntry
 *
 * `code`, where present, is the literal Shadow/Light Code phrase — the
 * concise operating principle — as distinct from `body`, which is the
 * descriptive scene/application. Not every entry has one: a pillar's own
 * pattern-level shadow/light poles (not tied to one specific track) carry a
 * paraphrase in `body` only.
 */
/** @typedef {{ id: string, title: string, prompt: string }} Practice */

export const PILLARS = [
  {
    id: "owned-interior",
    index: 1,
    title: "The Owned Interior",
    parallelTo: "Consciousness (Act I)",
    question: "Where have I located the war so I would not have to stand on the battlefield?",
    layer: "The mirror",
    tracks: PILLAR_TRACK_MAP["owned-interior"],
    trackCodes: PILLAR_TRACK_CODES["owned-interior"],
    canonicalCodes: PILLAR_CANONICAL_CODES["owned-interior"],
    summary:
      "Raw recognition that the mirror is instrument, not prosecutor. The war that was externalized (God, fate, timelines, other people) is claimed as sovereign territory. Only then can it be worked.",
    teaching: [
      "Most Seekers enter the Reflection Chamber still blaming the glass.",
      "Externalizing suffering is a sophisticated form of permeability: the self remains undefined so long as the source of pain is kept outside.",
      "The moment the Seeker says “the real war is within — it has always been me,” the current begins to find its first bank.",
      "Diagnosis here is accurate location of the field of action, not self-blame.",
      "Presence in Water is not stillness alone; it is the capacity to feel the full voltage without immediately assigning it outward.",
    ],
    shadow: [
      {
        name: "The Displaced War",
        track: "The Reflection Chamber",
        code: "My pain is an external curse, and God/Fate is to blame for my suffering.",
        body: "Locating the source of suffering anywhere but the interior. God is arraigned, fate is cursed, timelines are mourned. The Seeker enters the chamber and faces their alternate timelines; the dysfunction is projecting blame outward.",
        diagnostic:
          "List every place you have assigned the cause of your current pain in the last 90 days. Circle the ones that keep the battlefield outside your skin.",
      },
      {
        name: "Control Mistaken for Peace",
        track: "Safer Lie",
        code: "Closing the door and shutting out love creates safety and peace.",
        body: "The song addresses a counterpart who traded love for control. Building a throne on top of defeat and retreat is merely choosing a safer lie.",
        diagnostic:
          "Where have you closed a door and called it peace? Name what you actually shut out.",
      },
    ],
    light: [
      {
        name: "The Owned Interior",
        code: "The real war is within; I must reclaim the light that has always been mine.",
        body: "The mirror is instrument. The war is claimed as sovereign territory. The correction is the realization that “it's always been me,” setting the stage for self-liberation.",
        instructional:
          "Sit facing a mirror (literal or metaphorical). Speak: “This pain is a code I am now willing to decode.” Do not explain. Record what arises in the body for three minutes.",
      },
      {
        name: "The Unbent Door",
        body: "Truth is the only accepted currency. The door requires that you arrive as you actually are.",
        instructional:
          "Write the one action that would finally put you on record. Keep the page open for seven days without performing it yet.",
      },
    ],
    practices: [
      {
        id: "witness-feeling",
        title: "Name the witness of feeling",
        prompt:
          "Notice the difference between the one who feels and the story about the feeling. Write what remains when the commentary stops.",
      },
      {
        id: "locate-war",
        title: "Locate the displaced war",
        prompt:
          "When blame arises this week, pause and name: Is this voltage still being assigned outside my skin?",
      },
      {
        id: "unowned-voltage",
        title: "Stay with unowned voltage",
        prompt:
          "Choose one sensation of unfinished feeling. Stay with it for a measured interval before assigning it to anyone or anything.",
      },
    ],
    mantra: "The real war is within. I stop outsourcing the battlefield.",
    seal: "I stand on the ground I used to flee. The mirror is mine to use.",
  },
  {
    id: "forged-witness",
    index: 2,
    title: "The Forged Witness",
    parallelTo: "Identity (Act I)",
    question:
      "What did the pressure force me to become, and can I credit the shaping without handing the aggressor the gratitude?",
    layer: "The version that survived",
    tracks: PILLAR_TRACK_MAP["forged-witness"],
    trackCodes: PILLAR_TRACK_CODES["forged-witness"],
    canonicalCodes: PILLAR_CANONICAL_CODES["forged-witness"],
    summary:
      "The constructed self under siege. Hypervigilance renamed strength, isolation renamed focus, exhaustion renamed grind. Separating the forged version from the original current.",
    teaching: [
      "Identity in Water is often the set of adaptations that kept the Seeker alive inside the flood.",
      "The nervous system mistakes the siege for home.",
      "Diagnosis requires forensic separation: what was original, what was installed by pressure, what is still useful, what is now costly.",
      "“I am not grateful to them. But I am because of them.” That distinction is the first real bank against bitterness and against permanent armor.",
    ],
    shadow: [
      {
        name: "The Armored Survivor",
        track: "Version of Me",
        code: "What protected you can imprison you.",
        body: "Identifying the Armored Survivor archetype, this track traces how the Seeker mistook hypervigilance for strength and survived gaslighting.",
        diagnostic:
          "List the strategies that still run automatically. For each, write original protective function and current cost.",
      },
      {
        name: "The Willing Casualty",
        track: "5 Minutes From The Edge",
        code: "Loving someone means dying for them repeatedly to keep them sane.",
        body: "The Seeker realizes they were absorbing betrayal to mend their partner — dying repeatedly inside someone else's unhealed pain and calling it devotion.",
        diagnostic:
          "Where have you treated your own near-destruction as proof of love?",
      },
      {
        name: "The Holy Crusade",
        track: "Ashes and Iron (Bloodline and Flame)",
        code: "My rage is an armor that will heal my broken pride.",
        body: "The track shows a man wearing his ruins and fighting a ghostly form. He learns that forging an army from broken oaths only drags his own coffin.",
        diagnostic:
          "Where is rage still doing the work that grief was supposed to do?",
      },
      {
        name: "The Outsourced Knowing",
        track: "Felt That Drift",
        code: "Fear builds cages to maintain Earth’s control.",
        body: "Highlights the 2026 split between those who clung to logic and fear and those who trusted instinct and the drift.",
        diagnostic:
          "Where have you deferred to outside authority on something your body already knew?",
      },
      {
        name: "The Rescue Petition",
        track: "If He Could Only See",
        code: "Safety means remaining silent and chasing external approval.",
        body: "The Seeker watches someone they love wear masks given by manipulators, hoping the subject shatters the illusion to reclaim their forged identity.",
        diagnostic:
          "Whose approval are you still arranging your voice around?",
      },
      {
        name: "The Monument",
        track: "If You Really Listened",
        code: "Moving on quietly means I am untouched by the fall.",
        body: "The Seeker corrects the public perception of their healing, clarifying that they chose not to weaponize their cries, but instead carved a monument out of grief.",
        diagnostic:
          "What did you transform in silence that no one ever saw you carry?",
      },
    ],
    light: [
      {
        name: "The Forged Witness",
        track: "Version of Me",
        code: "Keep the strength. Return the debt.",
        body: "Testimony without bitterness. Pressure credited; aggressor denied the gratitude. Discernment without paranoia; boundaries without resentment.",
        instructional:
          "Write: “I am the version of me that ______ forced into existence. I keep the strength. I return the debt.” Read until the body no longer flinches.",
      },
      {
        name: "Departure Without Vengeance",
        track: "5 Minutes From The Edge",
        code: "I can walk away to survive without punishing your shame.",
        body: "The code shifts the Seeker from a willing casualty to a forged survivor.",
        instructional:
          "Write the walk-away that is not punishment: what you are leaving to protect, not what you are leaving to prove.",
      },
      {
        name: "The Dropped Guard",
        track: "Ashes and Iron (Bloodline and Flame)",
        code: "Only releasing the crusade will grant mercy unrehearsed.",
        body: "He drops his guard, looks up — might have loved you, then.",
        instructional:
          "Name one oath you are still avenging. Write what dropping the guard would cost — and what it would finally let in.",
      },
      {
        name: "The Guarded Gate",
        track: "Felt That Drift",
        code: "Mastery moves within; the body knows before the mind can look.",
        body: "Fear built cages — mastery moved within.",
        instructional:
          "Before consulting anyone else this week, pause and name what you already sense to be true. Act from that first.",
      },
      {
        name: "Intercession Without Control",
        track: "If He Could Only See",
        code: "The truth is louder than the lies they told; real love rises above the fear.",
        body: "Give him strength to break — and find his way.",
        instructional:
          "Hold the person you are watching in mind without trying to fix, rescue, or convince them. Notice what love looks like without control.",
      },
      {
        name: "Unwitnessed Alchemy",
        track: "If You Really Listened",
        code: "I am not numb; I alchemized a void into my survival.",
        body: "I just alchemized what was meant to be a void.",
        instructional:
          "Write the monument you built out of what almost destroyed you — in your own words, witnessed by no one but you.",
      },
    ],
    practices: [
      {
        id: "armor-inventory",
        title: "Inventory the handed armor",
        prompt:
          "List five survival adaptations still active. Mark which still protect and which now imprison.",
      },
      {
        id: "strength-debt",
        title: "Keep strength, return debt",
        prompt:
          "Complete: I keep ______. I return ______. Speak it until the body registers the distinction.",
      },
      {
        id: "claim-forged",
        title: "Claim the forged version",
        prompt:
          "Write one paragraph claiming the version pressure made, without loyalty to its makers.",
      },
    ],
    mantra:
      "I am not grateful to them. But I am because of them. That distinction is everything.",
    seal: "I keep the strength. I return the debt. My nervous system is no longer rented.",
  },
  {
    id: "sacred-restraint",
    index: 3,
    title: "Sacred Restraint & Reflection",
    parallelTo: "Perception (Act I)",
    question:
      "Is my silence a choice that protects life, or a hiding place that protects the old wound? How do I perceive and respond to feeling without becoming it?",
    layer: "The surface of the water",
    tracks: PILLAR_TRACK_MAP["sacred-restraint"],
    trackCodes: PILLAR_TRACK_CODES["sacred-restraint"],
    canonicalCodes: PILLAR_CANONICAL_CODES["sacred-restraint"],
    summary:
      "How the Seeker takes in and responds to emotional data. Restraint that is chosen versus restraint that is fear. Perception of the other that either dissolves the self or remains distinct.",
    teaching: [
      "Water perceives by contact. Without banks, contact becomes fusion.",
      "Not every unsent message is wisdom; some are fear in a calmer coat.",
      "Sacred restraint keeps words where they can bless. Concealed fear keeps them where they continue to govern from the dark.",
      "Diagnosis is in the fruit: one leaves the field quieter; the other leaves unfinished voltage.",
    ],
    shadow: [
      {
        name: "Silence as Concealed Fear",
        track: "Unsent Messages Season",
        code: "Silence can become avoidance wearing the mask of wisdom.",
        body: "The Seeker writes messages they never send, learning that some truths look better when wrapped up. Restraint that has ceased to be a choice.",
        diagnostic:
          "Open the drafts of your life. For each, ask: If I sent this from full safety, would the content change?",
      },
      {
        name: "The Rehearsed Room",
        track: "Before The Verdict and the Door",
        code: "Waiting for judgment absolves me of responsibility.",
        body: "A man stands frozen, mistaking composure for maturity, waiting to be punished or forgiven — a room built entirely from sentences prepared in advance.",
        diagnostic:
          "What truth sits heavy like a bruise under your skin and still has no spoken record?",
      },
      {
        name: "The Altar of Absence",
        track: "The Ones We Still Carry",
        code: "I must beg a silence to shift into sound to heal.",
        body: "Constructing shrines from moments memory already broke. Carrying a name like a scar on the pen.",
        diagnostic:
          "Whose name still occupies more real estate than their presence warrants?",
      },
      {
        name: "The Haunted Cage",
        track: "The Seeker and the Silent",
        code: "My departure makes me the villain in the absence of an explanation.",
        body: "The Seeker left because the home became a haunted cage. No row exists yet for this track in the tracks table — the curriculum entry is authored ahead of the audio.",
        diagnostic:
          "Where do you still owe an explanation for leaving somewhere that required one to stay?",
      },
      {
        name: "The Held Breath",
        track: "H2O",
        code: "I must hold onto false projections to survive the flood.",
        body: "The literal elemental climax of the act. Water does not fight or judge; it exposes the shadow and cleanses the marrow.",
        diagnostic:
          "What are you still holding your breath against, afraid that letting go would mean drowning?",
      },
    ],
    light: [
      {
        name: "Sacred Restraint",
        track: "Unsent Messages Season",
        code: "My silence is chosen, not inherited.",
        body: "Timing as care. Silence that is full, not empty. Words kept where they can bless rather than fracture.",
        instructional:
          "Write two versions of one unsent truth — the one that still seeks to change the other, and the one that only frees your field. Keep only the second.",
      },
      {
        name: "The Unbent Door",
        track: "Before The Verdict and the Door",
        code: "Redemption asks for truth, not another hedge; step through the door.",
        body: "Redemption's real, but it doesn't feel good. It cost you the lie.",
        instructional:
          "Name the door you are waiting to be let through. Walk through it without waiting for permission.",
      },
      {
        name: "The Lightened Carry",
        track: "The Ones We Still Carry",
        code: "I can walk forward, and let your reflection walk with me.",
        body: "Presence becomes companion rather than weight. Forward motion with the memory walking beside rather than ahead.",
        instructional:
          "Speak the name once with no story. Relocate it (box, jar, water) as ritual of placement, not deletion.",
      },
      {
        name: "The Necessary Silence",
        track: "The Seeker and the Silent",
        code: "Not all silence is absence; leaving is sometimes necessary to survive.",
        body: "The Seeker left because the home became a haunted cage. In the aftermath, silence can carry the truth better than words.",
        instructional:
          "Write the explanation you never gave — not to send, but to release yourself from needing to.",
      },
      {
        name: "The Willing Drowning",
        track: "H2O",
        code: "Break me down to elemental essence; water heals and reveals truth.",
        body: "Only by drowning, I rise again.",
        instructional:
          "Let one false projection break down completely this week. Write only what remains after — not what you tried to save.",
      },
    ],
    practices: [
      {
        id: "fusion-vs-contact",
        title: "Distinguish fusion from contact",
        prompt:
          "In one interaction this week, notice: Did I take their shape, or remain distinct while feeling?",
      },
      {
        id: "silence-fruit",
        title: "Test silence by its fruit",
        prompt:
          "After a period of restraint, check: quieter field or unfinished voltage? Adjust accordingly.",
      },
      {
        id: "perceive-without-shape",
        title: "Perceive without taking shape",
        prompt:
          "Practice one conversation where you fully feel the other without becoming their emotional state.",
      },
    ],
    mantra:
      "I do not mistake restraint for absence. I keep my words where they can bless me.",
    seal: "My silence is chosen. My carry is lightened by design.",
  },
  {
    id: "open-frequency",
    index: 4,
    title: "Open Frequency",
    parallelTo: "Belief Systems (Act I)",
    question:
      "Where is my giving still attached to an invoice — even a spiritual or emotional one? What do I believe must be true about reciprocity for me to remain whole?",
    layer: "The current itself",
    tracks: PILLAR_TRACK_MAP["open-frequency"],
    trackCodes: PILLAR_TRACK_CODES["open-frequency"],
    canonicalCodes: PILLAR_CANONICAL_CODES["open-frequency"],
    summary:
      "Beliefs about exchange, worth, and the economics of the heart. The ledger versus the sun’s economy. Giving as emission rather than transaction.",
    teaching: [
      "Generosity with an invoice is still control.",
      "The diagnostic question is not “Do I give?” but “What do I secretly require for the giving to feel complete?”",
      "Open frequency expands the field; ledger frequency contracts it.",
      "Departure without vengeance is the ultimate test of whether love was ever conditional on being received in a specific form.",
    ],
    shadow: [
      {
        name: "The Ledger",
        track: "Sun Don’t Invoice",
        code: "Giving with an invoice is still a transaction.",
        body: "Citing Nipsey Hussle, Taylor Swift, and Kobe Bryant, this track establishes ego-less generosity: “ego's what turns giving sour.” Giving as leverage, optics, or debt-creation.",
        diagnostic:
          "Review the last five significant acts of giving. What subtle receipt were you still waiting for?",
      },
      {
        name: "Suffering as Currency",
        track: "Not Alone",
        code: "I must earn love with suffering and chains.",
        body: "The Seeker offers unconditional presence to a counterpart drowning in a river of their own making, overwriting the belief that redemption requires bleeding.",
        diagnostic:
          "Where do you believe love must be earned through suffering rather than simply received?",
      },
      {
        name: "The Mourned Ruin",
        track: "The Great Turning",
        code: "The crumbling of the world is a punishment.",
        body: "Recognizing the macroscopic shift of 2026, the pain was pointing the Seeker somewhere — the old world making way for the new.",
        diagnostic:
          "What collapse are you still grieving as punishment rather than clearing?",
      },
      {
        name: "The Cage Reading",
        track: "This Ain’t The Limit",
        code: "The ceiling of reality is a glass cage built from fear.",
        body: "Three dimensions and time are not limits to trap us, but grace deployed to keep eternity from overloading the soul.",
        diagnostic:
          "What limit have you been reading as a cage that might actually be a mercy?",
      },
    ],
    light: [
      {
        name: "Open Frequency",
        track: "Sun Don’t Invoice",
        code: "I give without requiring repayment.",
        body: "Giving as emission. Ego removed so the field can expand. The sun's economy: total output, zero accounting.",
        instructional:
          "Perform one genuine act of giving with zero documentation, zero announcement, zero internal scorekeeping. Notice only the state of your own field afterward.",
      },
      {
        name: "Witness Without Rescue",
        track: "Not Alone",
        code: "You don’t need to prove it, just allow; you are not alone.",
        body: "No fixing. No forcing. Just breathing slow.",
        instructional:
          "Offer your presence to someone without trying to fix, save, or prove anything. Just stay.",
      },
      {
        name: "The Cleared Ground",
        track: "The Great Turning",
        code: "The turning is a preparation; everything we lose, we outgrew.",
        body: "You thought the pain was punishment — it was pointing you somewhere.",
        instructional:
          "Name one thing that fell apart this year. Write what it was actually making room for.",
      },
      {
        name: "The Merciful Frame",
        track: "This Ain’t The Limit",
        code: "The limit is a firewall wrapped in wisdom and mercy.",
        body: "What if the leash is love, not fear?",
        instructional:
          "Name one boundary of your life you have resented. Write what it might be protecting you from.",
      },
    ],
    practices: [
      {
        id: "detect-invoice",
        title: "Detect the hidden invoice",
        prompt:
          "After any act of giving, ask: What was I still waiting to receive? Name it without judgment.",
      },
      {
        id: "emission-practice",
        title: "Practice emission without receipt",
        prompt:
          "One anonymous or untracked gift this week. Record only the quality of your field after.",
      },
      {
        id: "love-without-proximity",
        title: "Test love without proximity",
        prompt:
          "Where can love remain true after proximity is released? Write the sentence that proves it.",
      },
    ],
    mantra: "I was not built to hoard the light. I was engineered to be.",
    seal: "My giving has no invoice. My exit has no revenge.",
  },
  {
    id: "mirror-walker-boundary",
    index: 5,
    title: "The Mirror-Walker’s Boundary",
    parallelTo: "Mental Architecture (Act I)",
    question:
      "Will I continue to absorb every unnamed grief on request, or will I teach the current instead of carrying the flood? What architecture now governs my feeling?",
    layer: "The banks",
    tracks: PILLAR_TRACK_MAP["mirror-walker-boundary"],
    trackCodes: PILLAR_TRACK_CODES["mirror-walker-boundary"],
    canonicalCodes: PILLAR_CANONICAL_CODES["mirror-walker-boundary"],
    summary:
      "The final governing structure of the Water element. Alchemy redefined as transformation with consent. The membrane that allows depth without dissolution. The condition required to enter the fire of Act III.",
    teaching: [
      "Permeability without membrane eventually fractures the vessel.",
      "The architecture of Act II is not walls that keep feeling out; it is banks that give the current direction and consent.",
      "Diagnosis: locate every place you have agreed to be the unpaid processing plant for others’ unnamed material.",
      "Instruction: the Mirror-Walker diagrams the frame and declines to carry what the other refuses to name.",
    ],
    shadow: [
      {
        name: "The Borrowed Trigger",
        track: "Willful Detonation",
        code: "Do not carry a weapon someone else handed you.",
        body: "The “Siren Cipher” proxy infected the counterpart, turning their pain into a knife — the Seeker was handed the matches and told the torch belonged to someone else.",
        diagnostic:
          "Where have you been installed as the detonator of a bond that was not yours to destroy?",
      },
      {
        name: "The Bargaining Altar",
        track: "Icarus Ain’t Cryin’ This Time",
        code: "I must kneel and accept divine games as a test of love.",
        body: "Open rebellion and boundary-setting with Fate/God — refusing to be a pawn in a cosmic game.",
        diagnostic:
          "Where are you still bargaining with something larger than you, hoping compliance will be rewarded?",
      },
      {
        name: "The Endless Lifeline",
        track: "Live For Me",
        code: "I must play savior even while you counterfeit the truth and drain my light.",
        body: "The Seeker realizes they cannot “swim for two in a tide I didn't sow” against a counterpart trying to pass projections as truth.",
        diagnostic:
          "Where are you still playing savior for someone who is counterfeiting the truth to keep you there?",
      },
      {
        name: "The Karma Transfer",
        track: "Tearin’ You Apart",
        code: "Feeling it does not mean it belongs to you.",
        body: "The Seeker sees their counterpart trapped in the Trickster's cage, drinking to survive — able to feel their pain, but not obligated to carry it.",
        diagnostic:
          "Whose karma have you been carrying as though it were your own to resolve?",
      },
      {
        name: "The Weaponized Vow",
        track: "Promise",
        code: "Loyalty requires that I bleed to keep you standing.",
        body: "The Seeker is forced to break a sacred vow because the other party weaponized their devotion.",
        diagnostic:
          "What vow are you still keeping that has been turned into a weapon against you?",
      },
      {
        name: "The Apology Tax",
        track: "I Own Every Word",
        code: "I must shrink, walk on defense, and apologize to make others comfortable.",
        body: "Entering every room already on defense. Paying for existence in preemptive apology.",
        diagnostic:
          "How many sentences this week began with a softener that was not required?",
      },
      {
        name: "The Unvented Furnace",
        track: "Not Your Cross (The Seeker’s Initiation)",
        code: "I am meant to be a landfill for grief, absorbing corrosion.",
        body: "A chamber that accepts every unnamed grief until absorption compounds into mass. Designated by others as the one who can survive it, and agreeing.",
        diagnostic:
          "List the people or systems for whom you still function as emotional processing plant. Which of those agreements were ever explicit?",
      },
    ],
    light: [
      {
        name: "The Re-encoded Sovereign",
        track: "Willful Detonation",
        code: "Return the weapon. Keep your will.",
        body: "The Seeker recognizes the “Clean-Kill Logic” and nullifies the code, turning betrayal into a sovereign boundary.",
        instructional:
          "Name the weapon you were handed. Return it — in words, in writing, or by simply refusing to use it again.",
      },
      {
        name: "The Unkneeling Flame",
        track: "Icarus Ain’t Cryin’ This Time",
        code: "I draw the line; I am reborn and do not answer to a sky made of stone.",
        body: "I ain't beggin' no sky made of stone. I showed up. I drew the line.",
        instructional:
          "Write the line you are done kneeling at. Say it once, out loud, without asking permission.",
      },
      {
        name: "Self-Chosen Survival",
        track: "Live For Me",
        code: "I cut the cords not to hate you, but because I love myself more.",
        body: "Cutting cords, not to hate you, but 'cause I love me more.",
        instructional:
          "Name one cord you are ready to cut — not from hate, but because you choose yourself. Cut it in writing first.",
      },
      {
        name: "Presence Without Ownership",
        track: "Tearin’ You Apart",
        code: "I can feel what is yours without carrying it.",
        body: "I can't take your karma, it's yours to bear — but I'll stand with you.",
        instructional:
          "Practice feeling someone's pain fully for one minute, then consciously hand it back to them. Notice what stays with you and what doesn't.",
      },
      {
        name: "The Kept and the Released",
        track: "Promise",
        code: "I break the vow to stand by you so I do not turn my own heart into a crime.",
        body: "Loyalty can't carry all the ruins you made.",
        instructional:
          "Name the promise that now costs you your own heart. Write the version of loyalty that keeps you both alive.",
      },
      {
        name: "Accountability Without Shrinking",
        track: "I Own Every Word",
        code: "I take my power back and stop living underneath bridges to keep the peace.",
        body: "I'm not asking permission to feel like that. I own every word.",
        instructional:
          "Say one true sentence this week with no softener, no apology, no bridge underneath it. Notice what doesn't collapse.",
      },
      {
        name: "The Mirror-Walker’s Boundary",
        track: "Not Your Cross (The Seeker’s Initiation)",
        code: "Alchemy is not consumption; it is transformation with consent.",
        body: "Bring me your shadow — I will diagram its frame. But I will not carry what you refuse to name.",
        instructional:
          "Draft the boundary statement you have never given. Practice it until the voice does not shake. Deliver or keep as standing internal law.",
      },
    ],
    practices: [
      {
        id: "map-absorption",
        title: "Map the architecture of absorption",
        prompt:
          "Draw or list every channel through which you still absorb unnamed material. Mark which you will close or re-bank.",
      },
      {
        id: "install-bank",
        title: "Install the final bank",
        prompt:
          "Write your standing boundary law in one sentence. Speak it daily for seven days.",
      },
      {
        id: "diagram-without-carry",
        title: "Diagram without carrying",
        prompt:
          "Practice reflecting another’s shadow back to them clearly, without taking it on as your labor.",
      },
    ],
    mantra:
      "Bring me your shadow — I will diagram its frame. I will not carry what you refuse to name.",
    seal: "My membrane is intact. My current is governed. I am ready for the fire.",
  },
];

export const EXIT_CRITERIA = [
  "Can distinguish absorption from empathy.",
  "At least three major permeable patterns have been named and given a bank.",
  "Giving no longer requires an invoice.",
  "Exit from a bond can occur without self-erasure or vengeance.",
  "The final boundary statement can be spoken without collapse or grandiosity.",
];

export const CADENCE = {
  order: "Complete diagnostic prompts in each pillar before instructional practices. Move sequentially. Track the body; if a practice produces collapse rather than clarification, return to the previous pillar and strengthen it.",
  suggested: [
    { weeks: "1–2", focus: "Pillars 1–2 — Owned Interior + Forged Witness" },
    { weeks: "3–4", focus: "Pillars 3–4 — Sacred Restraint + Open Frequency" },
    { weeks: "5–6", focus: "Pillar 5 — Mirror-Walker’s Boundary + full integration review" },
  ],
  dailyMinimum: "One diagnostic prompt or one instructional practice.",
  weeklyMinimum: "Full pillar review + written note of what bank was strengthened.",
};

export const CLOSING = {
  transmission:
    "The Seeker entered Act II as a vessel that absorbs. The Seeker exits as a current that instructs — carrying the same depth, the same permeability, the same capacity to feel everything, now governed by consent and pointed by will. That is the exact condition required to enter the fire of Act III.",
  welcome:
    "Welcome to the Reflection Chamber. Step gently. What you see may be seeing you, too. The banks are yours to build.",
};

export default {
  REFLECTION_META,
  ACT_LEVEL_PAIR,
  PILLAR_TRACK_MAP,
  PILLAR_CANONICAL_CODES,
  PILLAR_TRACK_CODES,
  PILLARS,
  EXIT_CRITERIA,
  CADENCE,
  CLOSING,
};
