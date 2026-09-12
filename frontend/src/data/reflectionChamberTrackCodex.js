// The Reflection Chamber's Track Codex — one HUD screen per Act Two track,
// built around PortalAudioPlayer inside the chamber environment
// (public/reclamation-university/Reflection Chamber/track_codex_hall.webp).
//
// This is deliberately NOT a sixth entry in PILLARS
// (reflectionChamberModuleData.js) or a ScreenSequence pillar config — the
// five pillars are interactive Jungian-stage engines; this is a passive
// listen-and-read gallery over the album itself, one screen per track.
//
// Eighteen of the album's tracks are included here: the ones with a
// confirmed R2 audio key seeded into Supabase (see
// supabase/migrations/20260823130000_seed_act_two_reflection_chamber_tracks.sql).
// Track 13, "The Seeker and the Silent", is excluded — its object key is
// still unresolved and it was never seeded, so it has no audio to play.
//
// `chapterLyrics` are the track's own opening/hook lines (from
// Act_Two_The_Reflection_Chamber_Lyrics.pdf), not editorial analysis copy —
// each screen's "The Seeker Observes" panel and floor-lyrics band both read
// from this. `shadowCodeQuote`/`lightCodeQuote` are the first-person
// Shadow/Light Code mantras from the Act II Shadow & Light Codex deep-dive,
// distinct from the short code *names* already stored on
// public.tracks.shadow_code/light_code (e.g. "The Displaced War") — those
// name the pole, these voice it.
//
// Audio, duration, and the short code names come from Supabase
// (getActTwoTracks(), src/lib/supabase/tracks.js) at render time; this file
// only supplies the static editorial copy Supabase doesn't carry yet.

function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const TRACK_CODEX_ENTRIES = [
  {
    title: 'The Reflection Chamber',
    chapterLyrics: [
      'I walked through a hallway made out of glass,',
      'Every step echoed versions of my past.',
      "Saw the love I lost, the lives I could've led,",
      'The ones who forgave me, the ones I left for dead.',
      'In the mirror, I saw him—eyes like mine,',
      'But softened by timelines where stars realigned.',
      'He held no blame, just the ache of what we knew,',
      'A love untouched by the world we walked through.',
    ],
    shadowCodeQuote: 'This pain is only personal suffering and private grievance.',
    lightCodeQuote: 'This pain is structured data. It must be decoded before the light can be held.',
  },
  {
    title: 'Version of Me',
    chapterLyrics: [
      'You look at me like the universe just handed me the crown',
      "Like the doors swung open easy, like I never nearly drowned",
      "Like the recognition came for free, like I didn't pay in full",
      'Like the version of me you\'re meeting now was always this powerful',
      "But you weren't there at 3am when the shadows moved wrong",
      'When every platform shifted and every ally was gone',
      'When my name was in mouths I never entered',
      'When the narrative got twisted and the truth got splintered',
    ],
    shadowCodeQuote: 'The current version of me was either handed down easily or is only the product of external force.',
    lightCodeQuote: "I am the version of me that coordinated pressure forced into existence. I will not shrink it to fit incomplete external stories.",
  },
  {
    title: 'Before The Verdict and the Door',
    chapterLyrics: [
      'Truth sits heavy like a bruise under skin',
      "Doesn't bleed, just throbs when the lights kick in",
      'He keeps timelines straight, remembers what he said',
      "What he didn't deny, what he left for dead",
      "He's not lost, that excuse's worth it",
      'He stands between the verdict and the door',
      'Hands full of reasons, pockets full of before',
      "Redemption's there, but it charges up front",
    ],
    shadowCodeQuote: 'If I fully expose the truth I will be destroyed. Remaining between the verdict and the door is safer.',
    lightCodeQuote: "Redemption requires the action that puts truth on record. The door does not close itself.",
  },
  {
    title: "Sun Don't Invoice",
    chapterLyrics: [
      'The sun has been shining for four billion years.',
      'Never sent a bill.',
      'Never asked for a receipt.',
      'Never dimmed itself to make the darkness comfortable.',
      "That's not generosity.",
      "That's just what a sun does.",
      "Because the sun don't invoice —",
      "and neither did Nip on the way down.",
    ],
    shadowCodeQuote: 'Giving must be measured, repaid, or performed for optics.',
    lightCodeQuote: 'Giving without invoice multiplies the field. Ego is the only variable that collapses it.',
  },
  {
    title: 'Willful Detonation',
    chapterLyrics: [
      'The code got breached on a fault line left unsealed,',
      "The virus came not for the source — for the Echo's feel.",
      "Proxy scanned the signal, scoping what's weak,",
      'Found soft terrain in the spirit — planted deceit.',
      'This a Willful Detonation — surgical, cold design,',
      'They gave you the trigger and claimed the target was mine.',
      'They wired the foundation — TNT blast,',
      'Then crowned you the martyr to erase what lasts.',
    ],
    shadowCodeQuote: "The betrayal was random chaos or purely the other person's moral failure.",
    lightCodeQuote: 'Engineered sabotage uses open emotional ports. Close the ports, archive the wound as fuel, and reclaim authorship of the story.',
  },
  {
    title: '5 Minutes From The Edge',
    chapterLyrics: [
      'You wore betrayal like a suit that tailored to your hell',
      "You gaslight me till I doubted what was mine to tell",
      'I left to survive, not to punish your shame',
      'For you dragged me through mud just to cover your name',
      "And I can't hate you no matter how much it hurts",
      "You'll always be my soulmate in this life or worse",
    ],
    shadowCodeQuote: 'Exit is weakness or abandonment. Staying is loyalty.',
    lightCodeQuote: 'Exit at the edge is refusal of possession. Survival can be the higher fidelity.',
  },
  {
    title: 'Not Alone',
    chapterLyrics: [
      "You're waiting at the edge of a war you feel coming",
      'Judgment, fate, the storm with your name on its stomach.',
      "You're scared as hell, I know.",
      'You think your past is pulling its knife.',
      "But you're still here,",
      'Which means you still get to choose life.',
      "You're not alone, let me in. Let me bring",
      "Light to your shadow. You don't have to earn love with suffering.",
    ],
    shadowCodeQuote: 'I must carry this alone or prove my worth through continued suffering.',
    lightCodeQuote: 'Worth and presence are baseline conditions. Suffering is not the required currency for love or redemption.',
  },
  {
    title: 'The Shadow Magician',
    chapterLyrics: [
      'I drew a circle, inked it in fire,',
      'Summoned creation from the depth of desire.',
      'But in the glass, a double appeared,',
      'The Shadow Magician — my twin engineered.',
      'I am the Seeker, master of the flame,',
      'Architect of wonder, or author of my chains.',
      'I stand in the mirror, both faces aligned,',
      'The Magician ascends when the halves combine.',
    ],
    shadowCodeQuote: 'Shadow is only demon or enemy that must be defeated or denied.',
    lightCodeQuote: 'Shadow is co-author of creative power. Own both halves or remain half-owned by the unexamined half.',
  },
  {
    title: 'The Great Turning',
    chapterLyrics: [
      'The earth has been speaking.',
      'Not in whispers, in earthquakes.',
      'Not in hints, in the collapse of everything we thought was permanent.',
      'You felt it before you could name it.',
      "That feeling wasn't fear.",
      'That was preparation.',
      'This is The Great Turning.',
      'And you were built for it.',
    ],
    shadowCodeQuote: 'Collapse is only destruction and punishment.',
    lightCodeQuote: 'What is falling was already outgrown. Treat the turning as initiation and move from spectator to participant.',
  },
  {
    title: "Icarus Ain't Cryin' This Time",
    chapterLyrics: [
      'So go ahead, keep your thunder and throne',
      "I ain't beggin' no sky made of stone",
      "If he falls, that's on your hands, not mine",
      'I showed up. I drew the line.',
      "Icarus ain't cryin' this time",
      "He's learnin' how to burn and fly",
    ],
    shadowCodeQuote: 'I must either fall or remain the sacrificial wing.',
    lightCodeQuote: 'Flight is possible without the pre-installed martyrdom script. Calibrated ascent does not require self-destruction.',
  },
  {
    title: 'Safer Lie',
    chapterLyrics: [
      'You called it freedom when you locked the door,',
      "but peace don't come from killing what you swore.",
      'You thought the silence would wash me away',
      'it just taught me how to stay.',
      'Was it worth it? All the power, all the pride?',
      'You traded love for a safer lie.',
      'You tried to vanish the sound of my grace',
      'I found my voice in the empty space.',
    ],
    shadowCodeQuote: 'Control and strategic silence will keep me safe.',
    lightCodeQuote: 'Control and strategic silence produce a shared cage; the only real safety is the capacity to remain open without collapsing.',
  },
  {
    title: 'Ashes and Iron (Bloodline and Flame)',
    chapterLyrics: [
      'He donned his rage like armor, skin to skin',
      'Burning so long the fire moved within',
      'Time showed pity, but not enough to heal his pride',
      'Leaving just a husk, barely alive',
      'It whispered soft but clear as crystal glass',
      'You could have found your peace, but not in this',
      'He drops his guard, looks up, a half-formed sigh',
      'Might have loved you, then. Nevermind.',
    ],
    shadowCodeQuote: 'Unprocessed rage and bloodline fire can be worn indefinitely as protection.',
    lightCodeQuote: 'Rage worn as armor eventually becomes the internal climate that consumes the vessel. Ownership of the fire is required before it can be metabolized.',
  },
  {
    title: 'H2O',
    chapterLyrics: [
      'I enter the chamber where silence breathes',
      'The walls are liquid, they bend and weave',
      'Blue veins of memory flood my skin',
      'Every lie I carry start dissolving within',
      "Water don't lie, it reflects what's near",
      'It shows my shadow and it shows my fear',
      'This chamber is my reckoning seat',
      'And the flood reveals the truth in me. But only by drowning, I rise again.',
    ],
    shadowCodeQuote: 'Truth can be negotiated while remaining dry and defended.',
    lightCodeQuote: 'Some truths require full immersion before false structures dissolve and new channels can form.',
  },
  {
    title: 'Felt That Drift',
    chapterLyrics: [
      'The knowing came when pressure aligned',
      'A sudden coherence in a crowded mind',
      'The world stayed still, yet split in tone',
      'Same sun above, gravity below',
      'Two worlds, one Earth, when the veil ran thin',
      'Fear built cages, mastery moved within',
      'Those who listened crossed the rift',
      'Those who doubted felt the drift.',
    ],
    shadowCodeQuote: 'When the field splits, more information or more fear will resolve it.',
    lightCodeQuote: 'The decisive variable is quality of attention and trust in prior knowing. Energy given to doubt becomes the cage that prevents crossing.',
  },
  {
    title: 'Phantom',
    chapterLyrics: [
      'Every time I craft a line, I ask, would he feel this?',
      'Like, would that version of you lean in or dismiss this?',
      "You ain't here, but I still write with your echo,",
      'a silhouette of you sitting front row with my mental.',
      "He's not a crutch, he's a key, a ghost in the mirror",
      'that empowers me.',
      "He's not my past, he's my inner heart.",
      'A ghost I painted when the world fell apart.',
    ],
    shadowCodeQuote: 'The living imprint of the other must either be erased or it will permanently occupy and run my system.',
    lightCodeQuote: 'Significant relationships continue as internal figures after external separation. Relate to the remaining imprint consciously so it no longer operates the system unsupervised.',
  },
  {
    title: "This Ain't The Limit",
    chapterLyrics: [
      "This ain't the limit — it's the filter,",
      "This ain't the cage — it's the frame,",
      "We're not small, we're rendered partial,",
      "So the infinite won't burn our names.",
      'Limits aren\'t absence, limits are care,',
      'Hands on the child when the stairs appear.',
      'What if the leash is love, not fear?',
      'What if the ceiling is kindness, not glass?',
    ],
    shadowCodeQuote: 'Limits are pure punishment or deficiency.',
    lightCodeQuote: 'Limits are often protective filtration so the infinite does not burn the finite vessel. Treat them as calibrated mercy rather than enemy.',
  },
  {
    title: 'The Veil Thins',
    chapterLyrics: [
      "It ain't chains that bind, it's the script I won't burn",
      "Truth ain't loud, it's the whisper I must unlearn",
      'This code cut me open just to prove I could heal',
      "If I walk in silence, it's 'cause that's what's real",
      "Ascension ain't escape",
      "it's full exposure",
      'Every step upward',
      'peels back the layers of old composure.',
    ],
    shadowCodeQuote: 'Claiming change while watering the old form is sufficient.',
    lightCodeQuote: 'Clarity requires contact with the unfinished material, not better lighting on the same form.',
  },
  {
    title: "Not Your Cross (The Seeker's Initiation)",
    chapterLyrics: [
      'In the blue chamber where memory condenses,',
      'I stand between consequence and confession.',
      'No crown. Only combustion.',
      'So I constructed a furnace behind the sternum,',
      'a chambered kiln where shadow could turn.',
      'I metabolized storms into language and law —',
      'they called it mercy. I called it flaw.',
      'Kingdom of glass, measure the cost. I am the Mirror-walker. I do not get lost.',
    ],
    shadowCodeQuote: 'I am required to absorb every unprocessed fracture others cannot carry.',
    lightCodeQuote: 'Build the internal furnace that converts incoming shadow into signal, then refuse the permanent failsafe role. The ego and the shadow operate cooperatively.',
  },
];

export const TRACK_CODEX_ORDER = TRACK_CODEX_ENTRIES.map((entry) => entry.title);

const entriesByTitle = new Map(
  TRACK_CODEX_ENTRIES.map((entry) => [normalizeTitle(entry.title), entry]),
);

export function getTrackCodexEntry(title) {
  return entriesByTitle.get(normalizeTitle(title)) || null;
}
