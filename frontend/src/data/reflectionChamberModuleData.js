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
  archetype: "The Permeable Vessel \u2192 The Governed Current",
  mission: "Feel everything without dissolving",
  userAction: "Reflection \u2192 Transmutation \u2192 Boundary",
  estimatedTime: "45\u201375 min (full five pillars) or 8\u201312 min per pillar",
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
    body: "Water with no banks. The Seeker takes the shape of another\u2019s grief, narrative, or verdict. Absorption becomes identity. Feeling everything becomes proof of nothing.",
  },
  light: {
    name: "The Governed Current",
    body: "The same depth of feeling, now bounded, directional, and consensual. Reflection without dissolution. Mercy with a shoreline.",
  },
};

/** @typedef {{ name: string, track?: string, body: string, diagnostic?: string, instructional?: string }} CodeEntry */
/** @typedef {{ id: string, title: string, prompt: string }} Practice */

export const PILLARS = [
  {
    id: "owned-interior",
    index: 1,
    title: "The Owned Interior",
    parallelTo: "Consciousness (Act I)",
    question: "Where have I located the war so I would not have to stand on the battlefield?",
    layer: "The mirror",
    summary:
      "Raw recognition that the mirror is instrument, not prosecutor. The war that was externalized (God, fate, timelines, other people) is claimed as sovereign territory. Only then can it be worked.",
    teaching: [
      "Most Seekers enter the Reflection Chamber still blaming the glass.",
      "Externalizing suffering is a sophisticated form of permeability: the self remains undefined so long as the source of pain is kept outside.",
      "The moment the Seeker says \u201cthe real war is within \u2014 it has always been me,\u201d the current begins to find its first bank.",
      "Diagnosis here is accurate location of the field of action, not self-blame.",
      "Presence in Water is not stillness alone; it is the capacity to feel the full voltage without immediately assigning it outward.",
    ],
    shadow: [
      {
        name: "The Displaced War",
        track: "The Reflection Chamber",
        body: "Locating the source of suffering anywhere but the interior. God is arraigned, fate is cursed, timelines are mourned.",
        diagnostic:
          "List every place you have assigned the cause of your current pain in the last 90 days. Circle the ones that keep the battlefield outside your skin.",
      },
      {
        name: "The Rehearsed Room",
        track: "Before the Verdict and the Door",
        body: "Composure mistaken for resolution. Wanting absolution without disclosure. A room built entirely from sentences prepared in advance.",
        diagnostic:
          "What truth sits heavy like a bruise under your skin and still has no spoken record?",
      },
    ],
    light: [
      {
        name: "The Owned Interior",
        body: "The mirror is instrument. The war is claimed as sovereign territory.",
        instructional:
          "Sit facing a mirror (literal or metaphorical). Speak: \u201cThis pain is a code I am now willing to decode.\u201d Do not explain. Record what arises in the body for three minutes.",
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
    summary:
      "The constructed self under siege. Hypervigilance renamed strength, isolation renamed focus, exhaustion renamed grind. Separating the forged version from the original current.",
    teaching: [
      "Identity in Water is often the set of adaptations that kept the Seeker alive inside the flood.",
      "The nervous system mistakes the siege for home.",
      "Diagnosis requires forensic separation: what was original, what was installed by pressure, what is still useful, what is now costly.",
      "\u201cI am not grateful to them. But I am because of them.\u201d That distinction is the first real bank against bitterness and against permanent armor.",
    ],
    shadow: [
      {
        name: "The Armored Survivor",
        track: "Version of Me",
        body: "Survival strategies wearing the names of virtues. Hypervigilance, isolation, paranoia, exhaustion renamed.",
        diagnostic:
          "List the strategies that still run automatically. For each, write original protective function and current cost.",
      },
      {
        name: "The Borrowed Trigger",
        track: "Willful Detonation",
        body: "Being handed the matches and told the torch belonged to someone else. Grace weaponized; bond dismantled by the one it belonged to.",
        diagnostic:
          "Where have you been installed as the detonator of a bond that was not yours to destroy?",
      },
    ],
    light: [
      {
        name: "The Forged Witness",
        body: "Testimony without bitterness. Pressure credited; aggressor denied the gratitude. Discernment without paranoia; boundaries without resentment.",
        instructional:
          "Write: \u201cI am the version of me that ______ forced into existence. I keep the strength. I return the debt.\u201d Read until the body no longer flinches.",
      },
      {
        name: "The Re-encoded Sovereign",
        body: "Every wound archived as reference fuel. Betrayal\u2019s spark converted into a self-governing core.",
        instructional:
          "Choose one archived wound. Extract the single usable instruction. Write it as a standing order. Seal or destroy the original narrative.",
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
        body: "Restraint that has ceased to be a choice. The unsent message dressed as maturity when it is avoidance.",
        diagnostic:
          "Open the drafts of your life. For each, ask: If I sent this from full safety, would the content change?",
      },
      {
        name: "The Altar of Absence",
        track: "The Ones We Still Carry",
        body: "Constructing shrines from moments memory already broke. Carrying a name like a scar on the pen.",
        diagnostic:
          "Whose name still occupies more real estate than their presence warrants?",
      },
    ],
    light: [
      {
        name: "Sacred Restraint",
        body: "Timing as care. Silence that is full, not empty. Words kept where they can bless rather than fracture.",
        instructional:
          "Write two versions of one unsent truth \u2014 the one that still seeks to change the other, and the one that only frees your field. Keep only the second.",
      },
      {
        name: "The Lightened Carry",
        body: "Presence becomes companion rather than weight. Forward motion with the memory walking beside rather than ahead.",
        instructional:
          "Speak the name once with no story. Relocate it (box, jar, water) as ritual of placement, not deletion.",
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
      "Where is my giving still attached to an invoice \u2014 even a spiritual or emotional one? What do I believe must be true about reciprocity for me to remain whole?",
    layer: "The current itself",
    summary:
      "Beliefs about exchange, worth, and the economics of the heart. The ledger versus the sun\u2019s economy. Giving as emission rather than transaction.",
    teaching: [
      "Generosity with an invoice is still control.",
      "The diagnostic question is not \u201cDo I give?\u201d but \u201cWhat do I secretly require for the giving to feel complete?\u201d",
      "Open frequency expands the field; ledger frequency contracts it.",
      "Departure without vengeance is the ultimate test of whether love was ever conditional on being received in a specific form.",
    ],
    shadow: [
      {
        name: "The Ledger",
        track: "Sun Don\u2019t Invoice",
        body: "Giving as leverage, optics, or debt-creation. Light hoarded on the theory of finite supply.",
        diagnostic:
          "Review the last five significant acts of giving. What subtle receipt were you still waiting for?",
      },
      {
        name: "The Willing Casualty",
        track: "5 Minutes From the Edge",
        body: "Dying repeatedly inside someone else\u2019s unhealed pain and calling it devotion.",
        diagnostic:
          "Where have you treated your own near-destruction as proof of love?",
      },
    ],
    light: [
      {
        name: "Open Frequency",
        body: "Giving as emission. Ego removed so the field can expand. The sun\u2019s economy: total output, zero accounting.",
        instructional:
          "Perform one genuine act of giving with zero documentation, zero announcement, zero internal scorekeeping. Notice only the state of your own field afterward.",
      },
      {
        name: "Departure Without Vengeance",
        body: "Leaving to survive rather than to punish. Love intact after the exit.",
        instructional:
          "Write the exit letter that contains no indictment. Keep only that version.",
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
    title: "The Mirror-Walker\u2019s Boundary",
    parallelTo: "Mental Architecture (Act I)",
    question:
      "Will I continue to absorb every unnamed grief on request, or will I teach the current instead of carrying the flood? What architecture now governs my feeling?",
    layer: "The banks",
    summary:
      "The final governing structure of the Water element. Alchemy redefined as transformation with consent. The membrane that allows depth without dissolution. The condition required to enter the fire of Act III.",
    teaching: [
      "Permeability without membrane eventually fractures the vessel.",
      "The architecture of Act II is not walls that keep feeling out; it is banks that give the current direction and consent.",
      "Diagnosis: locate every place you have agreed to be the unpaid processing plant for others\u2019 unnamed material.",
      "Instruction: the Mirror-Walker diagrams the frame and declines to carry what the other refuses to name.",
    ],
    shadow: [
      {
        name: "The Unvented Furnace",
        track: "Not Your Cross (The Seeker\u2019s Initiation)",
        body: "A chamber that accepts every unnamed grief until absorption compounds into mass. Designated by others as the one who can survive it, and agreeing.",
        diagnostic:
          "List the people or systems for whom you still function as emotional processing plant. Which of those agreements were ever explicit?",
      },
      {
        name: "The Apology Tax",
        track: "I Own Every Word",
        body: "Entering every room already on defense. Paying for existence in preemptive apology.",
        diagnostic:
          "How many sentences this week began with a softener that was not required?",
      },
    ],
    light: [
      {
        name: "The Mirror-Walker\u2019s Boundary",
        body: "Bring me your shadow \u2014 I will diagram its frame. But I will not carry what you refuse to name.",
        instructional:
          "Draft the boundary statement you have never given. Practice it until the voice does not shake. Deliver or keep as standing internal law.",
      },
      {
        name: "Full Exposure",
        body: "Ascension is not escape; it is full visibility. The divine voice relocated from above to within.",
        instructional:
          "Drop one performance of healing. Allow the unpolished current to be seen by one safe witness or by yourself in the mirror.",
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
          "Practice reflecting another\u2019s shadow back to them clearly, without taking it on as your labor.",
      },
    ],
    mantra:
      "Bring me your shadow \u2014 I will diagram its frame. I will not carry what you refuse to name.",
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
    { weeks: "1\u20132", focus: "Pillars 1\u20132 \u2014 Owned Interior + Forged Witness" },
    { weeks: "3\u20134", focus: "Pillars 3\u20134 \u2014 Sacred Restraint + Open Frequency" },
    { weeks: "5\u20136", focus: "Pillar 5 \u2014 Mirror-Walker\u2019s Boundary + full integration review" },
  ],
  dailyMinimum: "One diagnostic prompt or one instructional practice.",
  weeklyMinimum: "Full pillar review + written note of what bank was strengthened.",
};

export const CLOSING = {
  transmission:
    "The Seeker entered Act II as a vessel that absorbs. The Seeker exits as a current that instructs \u2014 carrying the same depth, the same permeability, the same capacity to feel everything, now governed by consent and pointed by will. That is the exact condition required to enter the fire of Act III.",
  welcome:
    "Welcome to the Reflection Chamber. Step gently. What you see may be seeing you, too. The banks are yours to build.",
};

export default {
  REFLECTION_META,
  ACT_LEVEL_PAIR,
  PILLARS,
  EXIT_CRITERIA,
  CADENCE,
  CLOSING,
};
