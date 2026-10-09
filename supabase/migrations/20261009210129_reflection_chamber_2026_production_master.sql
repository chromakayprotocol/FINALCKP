-- Act II · The Reflection Chamber — 2026 Production Master
-- Canonicalizes the 20-artifact curriculum and five-stage architecture.
-- Idempotent against the already-migrated production database.

begin;

create table if not exists public.act_two_sonic_artifacts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete restrict,
  chamber_order integer not null,
  sonic_artifact_name text not null,
  artifact_snapshot text not null,
  artifact_stage text not null,
  shadow_code text not null,
  light_code text not null,
  behavioral_test text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists act_two_sonic_artifacts_track_id_key
  on public.act_two_sonic_artifacts(track_id);

create unique index if not exists act_two_sonic_artifacts_chamber_order_key
  on public.act_two_sonic_artifacts(chamber_order);

alter table public.act_two_sonic_artifacts enable row level security;

drop policy if exists "Public can read Act II sonic artifacts"
  on public.act_two_sonic_artifacts;

create policy "Public can read Act II sonic artifacts"
  on public.act_two_sonic_artifacts
  for select
  to anon, authenticated
  using (true);

grant select on public.act_two_sonic_artifacts to anon, authenticated;

create table if not exists public.act_two_stages (
  stage_number smallint primary key,
  stage_name text not null,
  core_question text not null,
  stage_intent text not null,
  gate_question text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint act_two_stages_stage_number_check
    check (stage_number between 1 and 5)
);

alter table public.act_two_stages enable row level security;

drop policy if exists "Public can read Act II stages"
  on public.act_two_stages;

create policy "Public can read Act II stages"
  on public.act_two_stages
  for select
  to anon, authenticated
  using (true);

grant select on public.act_two_stages to anon, authenticated;

alter table public.act_two_sonic_artifacts
  add column if not exists stage_number smallint,
  add column if not exists what_you_bring text,
  add column if not exists shadow_code_quote text,
  add column if not exists light_code_quote text,
  add column if not exists make_the_turn text,
  add column if not exists life_domains text[],
  add column if not exists where_this_shows_up text,
  add column if not exists jungian_lens text,
  add column if not exists reflection_title text,
  add column if not exists reflection_prompt text,
  add column if not exists movement_criteria text,
  add column if not exists handoff text,
  add column if not exists source_edition text default '2026';

insert into public.act_two_stages (
  stage_number,
  stage_name,
  core_question,
  stage_intent,
  gate_question,
  updated_at
)
select
  stage_number,
  stage_name,
  core_question,
  stage_intent,
  gate_question,
  now()
from jsonb_to_recordset($reflection_stages$
[
  {
    "stage_name": "Unconscious Projection",
    "stage_intent": "Precision before explanation.",
    "stage_number": 1,
    "core_question": "What am I seeing—and what am I supplying?",
    "gate_question": "Can you distinguish what happened from what you supplied while allowing that your perception may still be substantially accurate?"
  },
  {
    "stage_name": "Recognition & Confrontation",
    "stage_intent": "Test the story against evidence, contradiction, adaptation, influence, and consequence.",
    "stage_number": 2,
    "core_question": "What is actually true?",
    "gate_question": "Can your account survive evidence, contradiction, and uncertainty without forcing a single totalizing explanation?"
  },
  {
    "stage_name": "Acceptance & Ownership",
    "stage_intent": "Place responsibility accurately without turning ownership into confession.",
    "stage_number": 3,
    "core_question": "What is mine?",
    "gate_question": "Can you place responsibility accurately and act from that placement?"
  },
  {
    "stage_name": "Integration & Assimilation",
    "stage_intent": "Turn insight into conduct that survives ordinary life.",
    "stage_number": 4,
    "core_question": "How do I live differently?",
    "gate_question": "Can you demonstrate the insight in behavior when nobody is grading the performance?"
  },
  {
    "stage_name": "Transmutation & Wholeness",
    "stage_intent": "Direct recovered energy into authorship, governance, contribution, and differentiated compassion.",
    "stage_number": 5,
    "core_question": "What becomes possible now?",
    "gate_question": "Can you direct your life without making suffering, an enemy, or another person’s rescue its organizing principle?"
  }
]
$reflection_stages$::jsonb) as x(
  stage_number smallint,
  stage_name text,
  core_question text,
  stage_intent text,
  gate_question text
)
on conflict (stage_number) do update set
  stage_name = excluded.stage_name,
  core_question = excluded.core_question,
  stage_intent = excluded.stage_intent,
  gate_question = excluded.gate_question,
  updated_at = now();

alter table public.act_two_sonic_artifacts
  drop constraint if exists act_two_sonic_artifacts_chamber_order_check;

-- Move pre-existing order values aside so the authoritative reorder cannot
-- collide with the UNIQUE(chamber_order) invariant while rows are updated.
update public.act_two_sonic_artifacts
set chamber_order = chamber_order + 100,
    updated_at = now()
where chamber_order between 1 and 100;

with master as (
  select *
  from jsonb_to_recordset($reflection_artifacts$
[
  {
    "handoff": "The calibrated mirror makes the next move possible: if experience and interpretation can be separated, then the Seeker can examine the internal version of a person that survives after direct contact ends.",
    "light_code": "I can honor what happened and still separate what I observed, what I inferred, what I felt, and what I chose.",
    "shadow_code": "If I feel it strongly, my interpretation must be the whole event.",
    "track_title": "The Reflection Chamber",
    "jungian_lens": "Projection; affect and complexes; the distinction between ego narrative and material that has not yet been consciously examined. Jungian projection is relevant here, but not as a claim that external reality is unreal.",
    "life_domains": [
      "Relationships",
      "Professional",
      "Mental & Emotional Well-being",
      "Digital Life"
    ],
    "stage_number": 1,
    "chamber_order": 1,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 1 · Unconscious Projection",
    "source_edition": "2026",
    "what_you_bring": "You arrive with one charged story and one requirement: enough willingness to examine it without surrendering your own perception.",
    "behavioral_test": "Choose one charged event. Write four short sections: WHAT HAPPENED / WHAT I MADE IT MEAN / WHAT I FELT / WHAT I DID. Put a question mark beside anything you cannot verify.",
    "light_code_quote": "“The mirror won’t lie—but it will teach.”",
    "reflection_title": "Separate the event from the story",
    "artifact_snapshot": "Every descent begins with a mirror, but the first lesson is not to trust or distrust what it shows. It is to learn how to look. A charged experience can contain several truths at once: something happened, you interpreted it, your body responded, and you made a choice. The Reflection Chamber opens by slowing those layers down. Nothing is dismissed. Nothing is automatically promoted to fact. Before the Seeker can integrate a shadow, they have to know what they are actually looking at.",
    "movement_criteria": "You can separate observation from inference without assuming that uncertainty means you were wrong.",
    "reflection_prompt": "Choose one charged event. Write four short sections: WHAT HAPPENED / WHAT I MADE IT MEAN / WHAT I FELT / WHAT I DID. Put a question mark beside anything you cannot verify.",
    "shadow_code_quote": "“These mirrors don’t break me, they help me begin—to reclaim the light that’s always been within.”",
    "sonic_artifact_name": "The Reflection Chamber",
    "where_this_shows_up": "A conflict with a partner, a tense meeting, a family exchange, or a screenshot can all become larger than the observable event once interpretation accelerates. In 2026, permanent message histories and instant commentary make it easy to treat a record as if it contains the whole context. This track teaches the Seeker to use records as evidence without confusing them with omniscience."
  },
  {
    "handoff": "Once the Seeker can distinguish person from inner figure, the Chamber can expose a subtler construction: the verdict we imagine another person is holding over us.",
    "light_code": "I can reclaim the qualities I placed inside the Phantom without pretending the Phantom proves another person’s present reality.",
    "shadow_code": "The version of you I carry inside me is evidence of who you really are—or who you will become.",
    "track_title": "Phantom",
    "jungian_lens": "Projection and idealization; inner figures; active imagination as a disciplined encounter with psychic material—not proof that the imagined figure exists externally.",
    "life_domains": [
      "Relationships",
      "Grief & Loss",
      "Creative Life",
      "Digital Life"
    ],
    "stage_number": 1,
    "chamber_order": 2,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 1 · Unconscious Projection",
    "source_edition": "2026",
    "what_you_bring": "You have already separated an event from the meaning added to it. Carry one unresolved inference from the first mirror into this track.",
    "behavioral_test": "Write two columns: WHAT I ACTUALLY KNEW ABOUT THEM / WHAT THE INNER VERSION REPRESENTS TO ME. Circle one quality in the second column and practice it once without contacting or referencing them.",
    "light_code_quote": "“It ain’t about you, it’s what you became / In the world I built to survive the pain.”",
    "reflection_title": "Separate the person from the figure you carry",
    "artifact_snapshot": "The mirror has been calibrated. Now someone appears in it who is not fully there. Phantom lives in the strange afterlife of a relationship: the person is absent, but an inner version of them still comments, comforts, accuses, inspires, or waits. The artifact does not ask the Seeker to destroy that figure. It asks a more useful question: what has this figure been carrying for you? Once the function becomes visible, qualities assigned to the Phantom can begin returning to their rightful owner.",
    "movement_criteria": "You can separate observation from inference without assuming that uncertainty means you were wrong.",
    "reflection_prompt": "Write two columns: WHAT I ACTUALLY KNEW ABOUT THEM / WHAT THE INNER VERSION REPRESENTS TO ME. Circle one quality in the second column and practice it once without contacting or referencing them.",
    "shadow_code_quote": "“Not the real you, but the healed you.”",
    "sonic_artifact_name": "Phantom",
    "where_this_shows_up": "Archived chats, photo memories, playlists, social profiles, and AI-generated simulations can keep an absent person psychologically present long after contact ends. The contemporary problem is not that memory exists; it is that technology can make the inner figure feel continuously external. The work is to know when you are relating to a person, a memory, or a figure your own psyche is sustaining."
  },
  {
    "handoff": "When the imagined verdict is exposed, silence itself becomes available for examination. Is withholding chosen restraint, fear, timing, dignity, or avoidance?",
    "light_code": "I can separate what was spoken, what was observable, and what I supplied—and then choose my next action without waiting for an imagined court to adjourn.",
    "shadow_code": "Silence, composure, distance, or absence tell me exactly what judgment another person has reached about me.",
    "track_title": "Before The Verdict and the Door",
    "jungian_lens": "Projection; complex activation; shadow as the material activated by judgment and shame. The curriculum does not claim that another person’s actual judgment is unknowable forever—only that inference must not masquerade as evidence.",
    "life_domains": [
      "Relationships",
      "Professional",
      "Family",
      "Mental & Emotional Well-being"
    ],
    "stage_number": 1,
    "chamber_order": 3,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 1 · Unconscious Projection",
    "source_edition": "2026",
    "what_you_bring": "You can now distinguish an external person from the figure that continues inside you. That makes it possible to examine the judgment you have assigned to that figure.",
    "behavioral_test": "Write the judgment you believe another person holds about you. Sort the evidence beneath it into SAID / OBSERVED / INFERRED. Finish: 'The decision I can make without knowing their private verdict is…'",
    "light_code_quote": "“Redemption breathes but it doesn’t beg / It asks for truth, not another hedge.”",
    "reflection_title": "Test the verdict",
    "artifact_snapshot": "Once the Seeker can tell a person from the version carried inside, the Chamber reveals a more subtle prison: the judgment we imagine that person holds. Before the Verdict and the Door is built from anticipation. Silence becomes a sentence. Distance becomes a decision. Composure becomes proof. The danger is not that every imagined verdict is false. The danger is living under a ruling that has never been separated into what was said, what was observed, and what the mind supplied.",
    "movement_criteria": "You can separate observation from inference without assuming that uncertainty means you were wrong.",
    "reflection_prompt": "Write the judgment you believe another person holds about you. Sort the evidence beneath it into SAID / OBSERVED / INFERRED. Finish: 'The decision I can make without knowing their private verdict is…'",
    "shadow_code_quote": "“He stands between the verdict and the door.”",
    "sonic_artifact_name": "Before The Verdict and the Door",
    "where_this_shows_up": "A short message from a manager, a relative who stops replying, a partner who goes quiet, or an audience that does not react can produce a verdict before anyone has actually delivered one. Ambiguous communication is common; mind-reading is tempting. This track trains the difference between missing information and negative information."
  },
  {
    "handoff": "Stage 1 is earned when the Seeker can tolerate ambiguity without filling every gap. Stage 2 now asks a harder question: what survives contact with evidence?",
    "light_code": "I can choose speech, release, or restraint deliberately—and name what my choice is protecting.",
    "shadow_code": "If I call my silence a boundary, it automatically becomes healthy.",
    "track_title": "Unsent Messages Season",
    "jungian_lens": "Shadow and Persona: the socially acceptable explanation can conceal a less flattering motive. Holding the tension of opposites is central: silence can protect and avoid at the same time.",
    "life_domains": [
      "Relationships",
      "Family",
      "Professional",
      "Digital Life"
    ],
    "stage_number": 1,
    "chamber_order": 4,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 1 · Unconscious Projection",
    "source_edition": "2026",
    "what_you_bring": "You have practiced leaving an informational gap open instead of forcing it closed. Now you must decide whether silence itself is serving clarity or hiding from it.",
    "behavioral_test": "Write the message privately. Then choose SEND / RELEASE / DELAY. If you delay, set a date. Add one sentence explaining what the choice protects and what it costs.",
    "light_code_quote": "“I don’t mistake restraint for absence.”",
    "reflection_title": "Choose what happens to the unsent message",
    "artifact_snapshot": "Stage One ends at the cursor. After learning to separate event from inference, the Seeker has to decide what to do with a truth that could be spoken. Unsent Messages Season refuses to romanticize silence. Sometimes restraint is wisdom. Sometimes it is fear with excellent branding. Sometimes speaking is repair; sometimes it is another attempt to force an ending. The stage closes when the Seeker can choose speech, release, or delay because of what the situation requires—not because silence or disclosure automatically feels virtuous.",
    "movement_criteria": "You can separate observation from inference without assuming that uncertainty means you were wrong.",
    "reflection_prompt": "Write the message privately. Then choose SEND / RELEASE / DELAY. If you delay, set a date. Add one sentence explaining what the choice protects and what it costs.",
    "shadow_code_quote": "“Maybe it’s fear in a calm disguise / Maybe it’s wisdom learning when to hide.”",
    "sonic_artifact_name": "Unsent Messages Season",
    "where_this_shows_up": "Draft folders, muted chats, blocked numbers, delayed replies, and carefully worded exits are ordinary parts of modern communication. The useful question is not whether silence is healthy in general. It is what this particular silence is doing: protecting safety, creating space, avoiding discomfort, preserving dignity, or attempting to control the other person's response."
  },
  {
    "handoff": "Once adaptation is visible, the Seeker can examine how narratives of outside influence interact with personal agency.",
    "light_code": "I keep the capacity that protected me and retire the posture that now misreads the present.",
    "shadow_code": "Because a strategy once kept me alive, questioning it betrays the version of me that survived.",
    "track_title": "Version of Me",
    "jungian_lens": "Complexes and adaptation; Shadow as disowned vulnerability beneath a competence Persona; differentiation between protective function and present-day necessity.",
    "life_domains": [
      "Health",
      "Mental & Emotional Well-being",
      "Professional",
      "Relationships"
    ],
    "stage_number": 2,
    "chamber_order": 5,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 2 · Recognition & Confrontation",
    "source_edition": "2026",
    "what_you_bring": "Stage One earned a basic discipline: observation is not interpretation, and uncertainty does not have to be solved immediately. Stage Two uses that discipline to examine what repeated pressure trained you to do.",
    "behavioral_test": "Name one survival behavior. Complete: IT PROTECTED ME BY / IT STILL HELPS WHEN / IT COSTS ME WHEN / WHAT I WILL TRY INSTEAD. Test the alternative once in a low-risk situation.",
    "light_code_quote": "“It’s learning to read rooms without reading into them / It’s discernment without paranoia.”",
    "reflection_title": "Keep the strength; update the strategy",
    "artifact_snapshot": "The Seeker has learned to question the story without automatically questioning reality. Stage Two turns that skill inward: what did repeated pressure train you to become? Version of Me honors survival before it interrogates it. Hypervigilance may have noticed real danger. Isolation may have reduced real exposure. Control may have restored real stability. But a strategy can be intelligent in one season and expensive in the next. The task is to keep the strength without forcing the present to keep reenacting the emergency.",
    "movement_criteria": "Your account can survive contradictory evidence and unresolved motives without collapsing into total blame or total self-blame.",
    "reflection_prompt": "Name one survival behavior. Complete: IT PROTECTED ME BY / IT STILL HELPS WHEN / IT COSTS ME WHEN / WHAT I WILL TRY INSTEAD. Test the alternative once in a low-risk situation.",
    "shadow_code_quote": "“I was surviving. I told myself I was thriving. There’s a difference.”",
    "sonic_artifact_name": "Version of Me",
    "where_this_shows_up": "Always-on work, reputation monitoring, safety concerns, unstable relationships, and chronic digital stimulation can reward constant scanning. A nervous system that learned to stay ready may be responding to a current threat, a past threat, or both. The Seeker tests the present rather than assuming either 'I'm paranoid' or 'I'm definitely in danger.'"
  },
  {
    "handoff": "After auditing influence, the Chamber turns to a more intimate distortion: rescue identity—the belief that love requires carrying another person past your own edge.",
    "light_code": "I can investigate influence without erasing agency, and investigate agency without erasing manipulation.",
    "shadow_code": "If someone influenced the outcome, the entire chain of choice belongs to them—or if I cannot prove every motive, nothing harmful happened.",
    "track_title": "Willful Detonation",
    "jungian_lens": "Projection and complexes; shadow contagion as a metaphor should not be confused with a formal Jungian mechanism. Jung’s concern with unconscious influence is useful, but motive attribution still requires epistemic restraint.",
    "life_domains": [
      "Relationships",
      "Social & Community",
      "Professional",
      "Digital Life"
    ],
    "stage_number": 2,
    "chamber_order": 6,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 2 · Recognition & Confrontation",
    "source_edition": "2026",
    "what_you_bring": "You have identified a survival strategy and tested whether it still fits the present. Now the same evidence discipline is applied to influence, manipulation, and agency.",
    "behavioral_test": "For one disputed story, write CLAIM / SOURCE / EVIDENCE FOR / EVIDENCE AGAINST / OTHER PLAUSIBLE EXPLANATIONS / CHOICE THAT REMAINED MINE. Do not fill a box with motive unless you have evidence for motive.",
    "light_code_quote": "“Catalyst = Pain. Reclaim the Name. End Protocol.”",
    "reflection_title": "Trace influence without erasing agency",
    "artifact_snapshot": "Now that survival adaptations are visible, the Chamber can examine influence without surrendering agency. Willful Detonation tells its story with certainty: someone planted the lie, rerouted fear, handed over the weapon. The lyrics are allowed that point of view. The Seeker's work is harder. What evidence supports influence? What evidence supports intent? What choices still belonged to each person? A tested account does not become weaker when causality is distributed accurately. It becomes harder to manipulate—including by our own need for a clean villain.",
    "movement_criteria": "Your account can survive contradictory evidence and unresolved motives without collapsing into total blame or total self-blame.",
    "reflection_prompt": "For one disputed story, write CLAIM / SOURCE / EVIDENCE FOR / EVIDENCE AGAINST / OTHER PLAUSIBLE EXPLANATIONS / CHOICE THAT REMAINED MINE. Do not fill a box with motive unless you have evidence for motive.",
    "shadow_code_quote": "“You were handed the matches, told the torch was mine.”",
    "sonic_artifact_name": "Willful Detonation",
    "where_this_shows_up": "Group chats, recommendation feeds, influencer authority, selective screenshots, workplace alliances, and repeated retellings can all shape perception. Influence is real without automatically proving conspiracy or removing personal choice. The task is to trace what entered the story, from where, with what evidence, and what decisions followed."
  },
  {
    "handoff": "Once rescue is confronted, silence and departure can be revisited without automatically reading them as abandonment or virtue.",
    "light_code": "I can leave to survive without turning the boundary into punishment, revenge, or proof that I never cared.",
    "shadow_code": "If I stop carrying you, I have abandoned you; if I love you, I must survive your crisis for you.",
    "track_title": "5 Minutes From The Edge",
    "jungian_lens": "Shadow of the helper Persona; inflation around indispensability; complexes organized around abandonment and rescue.",
    "life_domains": [
      "Relationships",
      "Family",
      "Health",
      "Community"
    ],
    "stage_number": 2,
    "chamber_order": 7,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 2 · Recognition & Confrontation",
    "source_edition": "2026",
    "what_you_bring": "You have learned to distribute causality instead of giving one person total explanatory power. That prepares you to distribute responsibility inside care itself.",
    "behavioral_test": "Write WHAT I CAN OFFER / WHAT IS NOT MINE TO CARRY / WHAT I WILL DO IF I REACH MY LIMIT. Make the final line an action you control, not a demand for someone else to change.",
    "light_code_quote": "“I left to survive, not to punish your shame.”",
    "reflection_title": "Define the edge of your responsibility",
    "artifact_snapshot": "After influence comes the edge. 5 Minutes From the Edge asks what happens when love becomes measured by endurance: how much can you absorb, repair, excuse, survive, or carry before leaving starts to feel like betrayal? The artifact does not teach indifference. It separates care from self-erasure. The Seeker has already learned that responsibility can be shared; now they learn that another person's share cannot be completed on their behalf simply because the relationship matters.",
    "movement_criteria": "Your account can survive contradictory evidence and unresolved motives without collapsing into total blame or total self-blame.",
    "reflection_prompt": "Write WHAT I CAN OFFER / WHAT IS NOT MINE TO CARRY / WHAT I WILL DO IF I REACH MY LIMIT. Make the final line an action you control, not a demand for someone else to change.",
    "shadow_code_quote": "“I died for you more times than I can count.”",
    "sonic_artifact_name": "5 Minutes From the Edge",
    "where_this_shows_up": "Caregiving, crisis support, friendship, parenting, and partnership can blur the line between support and overfunctioning. Burnout is not proof that care was wrong; it can be evidence that responsibility was distributed badly. This track asks what you can offer sustainably and what another adult, professional, system, or community must carry instead."
  },
  {
    "handoff": "Stage 2 closes with a story that can survive contradiction. Stage 3 now asks for accurate ownership: not everything, not nothing—mine.",
    "light_code": "I can own my departure, its impact, and my uncertainty about another person’s interior world at the same time.",
    "shadow_code": "If I can explain why I left, I can also explain exactly why the other person reacted as they did.",
    "track_title": "The Seeker and the Silent",
    "jungian_lens": "Holding the tension of opposites; projection; shadow of certainty. Individuation requires tolerating psychic contradiction without prematurely resolving it.",
    "life_domains": [
      "Relationships",
      "Grief & Loss",
      "Family",
      "Mental & Emotional Well-being"
    ],
    "stage_number": 2,
    "chamber_order": 8,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 2 · Recognition & Confrontation",
    "source_edition": "2026",
    "what_you_bring": "You have named the edge of what you can carry. Now the Chamber tests whether you can hold love, departure, impact, and uncertainty without manufacturing a villain to stabilize the story.",
    "behavioral_test": "Write three paragraphs: WHAT I KNOW / WHAT I BELIEVE / WHAT I CANNOT KNOW. End with: 'What I can own without solving the rest is…'",
    "light_code_quote": "“Let the stillness say what words can’t prove.”",
    "reflection_title": "Tell the story without pretending to know everything",
    "artifact_snapshot": "The stage closes in contradiction. The Seeker and the Silent contains love and departure, fear and tenderness, memory and accusation. It also contains interpretations of why the Phantom Reaper behaved as they did. The Chamber does not flatten those tensions into a verdict. The Seeker practices a mature form of recognition: I can know why I left, acknowledge the impact of leaving, remain uncertain about another person's private motives, and still refuse to rewrite what I experienced. A story that can survive contradiction is finally strong enough for ownership.",
    "movement_criteria": "Your account can survive contradictory evidence and unresolved motives without collapsing into total blame or total self-blame.",
    "reflection_prompt": "Write three paragraphs: WHAT I KNOW / WHAT I BELIEVE / WHAT I CANNOT KNOW. End with: 'What I can own without solving the rest is…'",
    "shadow_code_quote": "“I didn’t leave because I stopped loving you / I left because I was afraid I would die if I stayed.”",
    "sonic_artifact_name": "The Seeker and the Silent",
    "where_this_shows_up": "No-contact decisions, breakups, estrangement, and abrupt departures often produce competing narratives. Therapeutic language can make those narratives sound more certain than the evidence allows. The Seeker practices telling the truth of their own experience without diagnosing the absent person in order to make the story coherent."
  },
  {
    "handoff": "Power owned ethically exposes what often hides underneath crusade: rage that has become identity.",
    "light_code": "I can own my capacity for creation and destruction and bind that capacity to deliberate ethics.",
    "shadow_code": "Power becomes safe only when I deny the part of me capable of misuse.",
    "track_title": "The Shadow Magician",
    "jungian_lens": "Shadow integration; active imagination; inflation. The lyric’s line attributed to Jung is artistic language, not a verbatim Jung citation. Active imagination is used here as disciplined engagement with inner material.",
    "life_domains": [
      "Professional",
      "Creative Life",
      "Relationships",
      "Spiritual"
    ],
    "stage_number": 3,
    "chamber_order": 9,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 3 · Acceptance & Ownership",
    "source_edition": "2026",
    "what_you_bring": "You enter Stage Three with a story that has survived contradiction. Ownership can now begin without requiring either innocence or self-condemnation.",
    "behavioral_test": "Name a capacity you sometimes minimize or fear in yourself. Write: I CAN USE THIS FOR / I WILL NOT USE THIS FOR / IF I MISUSE IT, I WILL REPAIR BY. Then use the capacity once in a low-stakes, ethical way.",
    "light_code_quote": "“The Shadow’s no demon, but a teacher to face.”",
    "reflection_title": "Put one disowned capacity under conscious ethics",
    "artifact_snapshot": "Stage Three begins after innocence stops being the price of self-respect. The Shadow Magician turns the mirror toward capacity itself: language can create and wound; charisma can invite and manipulate; imagination can free and imprison. The point is not to become suspicious of power. It is to stop pretending power only exists in other people. What you can consciously own, you can consciously govern. What you must deny will keep finding less accountable ways to act.",
    "movement_criteria": "You can state what is yours, what belongs elsewhere, what is shared, and what remains unknown—and make a decision from that placement.",
    "reflection_prompt": "Name a capacity you sometimes minimize or fear in yourself. Write: I CAN USE THIS FOR / I WILL NOT USE THIS FOR / IF I MISUSE IT, I WILL REPAIR BY. Then use the capacity once in a low-stakes, ethical way.",
    "shadow_code_quote": "“Architect of wonder, or author of my chains.”",
    "sonic_artifact_name": "The Shadow Magician",
    "where_this_shows_up": "Influence now scales quickly: a post, a prompt, a platform, a team, a community, or a personal brand can amplify one person's language far beyond the room where it began. Power is not only institutional. The relevant question is how the Seeker uses persuasion, attention, authority, sexuality, ambition, refusal, and creativity when those capacities are actually theirs."
  },
  {
    "handoff": "Once the armor loosens, the Seeker can descend beneath identity and image into elemental experience: what remains when the defended story is washed away?",
    "light_code": "I can keep the information inside my anger while releasing the identity that requires perpetual battle.",
    "shadow_code": "Because my anger has a legitimate origin, every expression of it is legitimate.",
    "track_title": "Ashes and Iron (Bloodline and Flame)",
    "jungian_lens": "Complex possession; Shadow identification; the danger of ego inflation around moral certainty.",
    "life_domains": [
      "Relationships",
      "Professional",
      "Social & Community",
      "Mental & Emotional Well-being"
    ],
    "stage_number": 3,
    "chamber_order": 10,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 3 · Acceptance & Ownership",
    "source_edition": "2026",
    "what_you_bring": "You have admitted that power exists inside you as capacity, not only outside you as threat. Now the Chamber asks how anger uses that power.",
    "behavioral_test": "Choose one recurring anger. Write WHAT HAPPENED / WHAT THE ANGER PROTECTS / WHAT THE ANGER HELPS ME DO / WHAT IT NOW COSTS / ANOTHER WAY TO PROTECT THE SAME VALUE. If the threat is still active, name the concrete protection still required.",
    "light_code_quote": "“In truth stood awaiting mercy unrehearsed.”",
    "reflection_title": "Find what the anger is protecting",
    "artifact_snapshot": "Once power is admitted, anger can be examined without being shamed. Ashes and Iron asks whether rage is still carrying information—or whether it has become the armor required to preserve an identity. Some anger is proportionate. Some battles are current. Some violations deserve a firm response. The question is not 'Should I be angry?' It is 'What is this anger doing now?' Ownership means protecting what matters without giving the wound permanent command of the whole personality.",
    "movement_criteria": "You can state what is yours, what belongs elsewhere, what is shared, and what remains unknown—and make a decision from that placement.",
    "reflection_prompt": "Choose one recurring anger. Write WHAT HAPPENED / WHAT THE ANGER PROTECTS / WHAT THE ANGER HELPS ME DO / WHAT IT NOW COSTS / ANOTHER WAY TO PROTECT THE SAME VALUE. If the threat is still active, name the concrete protection still required.",
    "shadow_code_quote": "“He donned his rage like armor.”",
    "sonic_artifact_name": "Ashes and Iron (Bloodline and Flame)",
    "where_this_shows_up": "Public outrage can reward escalation, but the same pattern appears privately in recurring arguments, workplace feuds, family conflict, and the need to keep proving an old injury. Anger can still be justified while its current expression becomes costly. The Seeker separates the boundary worth keeping from the battle that may no longer be required."
  },
  {
    "handoff": "After dissolution, memory remains. Stage 3 must now decide how to carry what mattered without letting memory become command.",
    "light_code": "I can let an image dissolve without erasing the event; what remains can be described as experience, adaptation, need, and choice.",
    "shadow_code": "If the story I built around the experience dissolves, I will lose the truth of what happened.",
    "track_title": "H2O",
    "jungian_lens": "Shadow and Persona; symbolic alchemy as a Jungian mode of psychological transformation. Water is treated symbolically, not as a scientific or supernatural mechanism.",
    "life_domains": [
      "Identity",
      "Relationships",
      "Spiritual",
      "Creative Life"
    ],
    "stage_number": 3,
    "chamber_order": 11,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 3 · Acceptance & Ownership",
    "source_edition": "2026",
    "what_you_bring": "You have identified what anger protects and what it costs. With the armor named, you can approach the experience underneath it more directly.",
    "behavioral_test": "Rewrite one charged story under four headings: EXPERIENCE / HOW I ADAPTED / WHAT I NEEDED / WHAT I CHOOSE NOW. Keep 'I was harmed' if that is supported; remove only the identity claims that are doing more work than the evidence.",
    "light_code_quote": "“Wash away the false projection.”",
    "reflection_title": "Describe the experience without making it your entire identity",
    "artifact_snapshot": "With the armor loosened, the Chamber reaches water. H2O is not an instruction to erase the story; it is an invitation to discover what survives when the defended image softens. Beneath 'the strong one,' 'the betrayed one,' 'the rescuer,' or 'the problem' are simpler materials: an experience, an adaptation, a need, a choice. Water becomes the governing metaphor because it reflects without holding a fixed shape. The Seeker is learning the same skill.",
    "movement_criteria": "You can state what is yours, what belongs elsewhere, what is shared, and what remains unknown—and make a decision from that placement.",
    "reflection_prompt": "Rewrite one charged story under four headings: EXPERIENCE / HOW I ADAPTED / WHAT I NEEDED / WHAT I CHOOSE NOW. Keep 'I was harmed' if that is supported; remove only the identity claims that are doing more work than the evidence.",
    "shadow_code_quote": "“Water don’t lie, it reflects what’s near / It shows my shadow and it shows my fear.”",
    "sonic_artifact_name": "H2O",
    "where_this_shows_up": "Profiles, wellness narratives, recovery stories, and personal brands make identity easy to package. A useful identity can become a courtroom in which every new fact has to prove the same verdict about who you are. This track loosens the package without denying the history inside it."
  },
  {
    "handoff": "Stage 3 is earned when responsibility and memory are accurately placed. Stage 4 begins by asking whether insight can survive ordinary limits and real behavior.",
    "light_code": "I can keep the meaning and release the command. Memory may remain without holding executive authority over my future.",
    "shadow_code": "If someone still appears in my inner life, I must either reunite with them or erase them to prove I have moved on.",
    "track_title": "The Ones We Still Carry",
    "jungian_lens": "Complexes and symbolic residues; mourning as a process of changing relationship to an inner image rather than proving total psychic erasure.",
    "life_domains": [
      "Grief & Loss",
      "Relationships",
      "Creative Life",
      "Family"
    ],
    "stage_number": 3,
    "chamber_order": 12,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 3 · Acceptance & Ownership",
    "source_edition": "2026",
    "what_you_bring": "You have separated experience from the identity built around it. What remains is memory—and the question of how much authority memory should have.",
    "behavioral_test": "Complete: WHAT I WANT TO KEEP / WHAT I NO LONGER NEED TO REHEARSE / WHAT THIS PERSON OR PERIOD TAUGHT ME / WHAT DOES NOT GET TO GOVERN MY NEXT DECISION.",
    "light_code_quote": "“There will come a day when your name won’t rise / When the beat drops clean and you’re not in disguise.”",
    "reflection_title": "Decide what the memory is allowed to keep",
    "artifact_snapshot": "After the story has been stripped down, memory remains. The Ones We Still Carry gives the Chamber permission to stop treating remembrance as failure. Some people remain in the nervous system, the creative vocabulary, the music, the standards, the scars. Integration does not require reunion, and it does not require erasure. Stage Three closes when the Seeker can keep what was meaningful without giving memory executive authority over the present.",
    "movement_criteria": "You can state what is yours, what belongs elsewhere, what is shared, and what remains unknown—and make a decision from that placement.",
    "reflection_prompt": "Complete: WHAT I WANT TO KEEP / WHAT I NO LONGER NEED TO REHEARSE / WHAT THIS PERSON OR PERIOD TAUGHT ME / WHAT DOES NOT GET TO GOVERN MY NEXT DECISION.",
    "shadow_code_quote": "“You still walk with me, but lighter these days.”",
    "sonic_artifact_name": "The Ones We Still Carry",
    "where_this_shows_up": "People remain through habits, language, music, standards, grief, and memory. Digital archives make that continuity more visible, but the underlying human problem is old. Moving forward does not require pretending the relationship meant nothing. It requires deciding what the memory is allowed to influence now."
  },
  {
    "handoff": "Once limits are classified, the body becomes useful as another source of information—but information still requires interpretation.",
    "light_code": "I can classify a limit before I react to it: protect, negotiate, challenge, accept, or leave.",
    "shadow_code": "Every limit is either oppression to defeat or fear to transcend.",
    "track_title": "This Ain't The Limit",
    "jungian_lens": "Individuation and acceptance of finitude; ego limits; the Self is not equivalent to omnipotence.",
    "life_domains": [
      "Financial",
      "Health",
      "Professional",
      "Relationships"
    ],
    "stage_number": 4,
    "chamber_order": 13,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 4 · Integration & Assimilation",
    "source_edition": "2026",
    "what_you_bring": "Stage Three placed responsibility more accurately. Stage Four begins with the practical consequence: if this is what is true, how do you actually live differently inside real constraints?",
    "behavioral_test": "Choose one current constraint. Mark it CHANGEABLE / NEGOTIABLE / TEMPORARY / CURRENTLY FIXED. Write one action appropriate to the category instead of using the same response for every kind of limit.",
    "light_code_quote": "“Limits aren’t absence, limits are care.”",
    "reflection_title": "Classify one real limit",
    "artifact_snapshot": "Ownership has been placed. Stage Four asks whether insight can survive an ordinary Tuesday. This Ain't The Limit begins with constraint: time, money, energy, health, access, responsibility, consequence. Modern culture often sells every limit as either oppression or personal failure. The Chamber takes a more useful position. Some limits should be challenged. Some should be negotiated. Some are real enough that fighting them wastes the very energy needed to build around them. Integration begins when reality becomes material for design.",
    "movement_criteria": "The insight appears in repeatable behavior, not only in language about growth.",
    "reflection_prompt": "Choose one current constraint. Mark it CHANGEABLE / NEGOTIABLE / TEMPORARY / CURRENTLY FIXED. Write one action appropriate to the category instead of using the same response for every kind of limit.",
    "shadow_code_quote": "“This ain’t the cage—it’s the frame.”",
    "sonic_artifact_name": "This Ain’t The Limit",
    "where_this_shows_up": "Budgets, disability, caregiving, time, legal obligations, job markets, energy, and other people's boundaries are real constraints. 'No limits' language can turn reality into a personal failure. Integration asks a practical question: which constraint can be changed, which can be negotiated, and which must be designed around today?"
  },
  {
    "handoff": "Discernment becomes more trustworthy when it no longer needs a polished identity to defend it. The next track strips performance from healing itself.",
    "light_code": "I can treat bodily activation as meaningful data without turning sensation into omniscience.",
    "shadow_code": "If my body alarms, it proves my interpretation of the situation.",
    "track_title": "Felt That Drift",
    "jungian_lens": "Complex activation and somatic affect; Jungian psychology recognizes affective complexes, but the curriculum does not convert bodily sensation into external proof.",
    "life_domains": [
      "Health",
      "Mental & Emotional Well-being",
      "Relationships",
      "Professional"
    ],
    "stage_number": 4,
    "chamber_order": 14,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 4 · Integration & Assimilation",
    "source_edition": "2026",
    "what_you_bring": "You have practiced responding to reality instead of fighting every limit. That creates enough stability to listen to the body without turning sensation into prophecy.",
    "behavioral_test": "Record SENSATION / FIRST INTERPRETATION / EVIDENCE / OTHER PLAUSIBLE CAUSES / LOW-RISK NEXT STEP. After the next step, record what new information appeared.",
    "light_code_quote": "“So he sealed his gates with disciplined care / Not from hatred, but precision and prayer.”",
    "reflection_title": "Test a body signal",
    "artifact_snapshot": "Once limits are respected, the body can be heard more clearly. Felt That Drift restores sensation to its proper role: signal, not sentence. A tight chest may mean danger, memory, attraction, exhaustion, sensory overload, or uncertainty. The body deserves attention without being forced to testify to facts it cannot know. The Seeker now combines embodied awareness with the reality-testing learned earlier in the Chamber. Discernment becomes neither numbness nor intuition worship, but a conversation between signal and evidence.",
    "movement_criteria": "The insight appears in repeatable behavior, not only in language about growth.",
    "reflection_prompt": "Record SENSATION / FIRST INTERPRETATION / EVIDENCE / OTHER PLAUSIBLE CAUSES / LOW-RISK NEXT STEP. After the next step, record what new information appeared.",
    "shadow_code_quote": "“The body knows before the mind can look.”",
    "sonic_artifact_name": "Felt That Drift",
    "where_this_shows_up": "Wearables, wellness culture, trauma education, and nervous-system language have made body awareness more accessible. They can also tempt people to treat every sensation as a verdict. This track keeps the gain—listening to the body—while adding the missing discipline: test the interpretation before acting as if it is fact."
  },
  {
    "handoff": "Once the healing Persona loosens, generosity can be examined without the need to look generous—or to secretly collect payment.",
    "light_code": "I can replace the performance of integration with one plain truth and one behavior that makes it visible.",
    "shadow_code": "If I can narrate my growth beautifully, I have integrated it.",
    "track_title": "The Veil Thins",
    "jungian_lens": "Persona; Shadow; individuation as movement toward greater wholeness rather than a superior social mask.",
    "life_domains": [
      "Identity",
      "Spiritual",
      "Mental & Emotional Well-being",
      "Digital Life"
    ],
    "stage_number": 4,
    "chamber_order": 15,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 4 · Integration & Assimilation",
    "source_edition": "2026",
    "what_you_bring": "You can now combine body signal with evidence. The next test is whether your language about growth matches your actual behavior.",
    "behavioral_test": "Write one polished sentence you use about your growth. Rewrite it without therapy, spiritual, branding, or status language. Then name one behavior that would make the plain sentence demonstrably true.",
    "light_code_quote": "“Drop the act. Strip the script.”",
    "reflection_title": "Remove the performance layer",
    "artifact_snapshot": "The Seeker can now test both story and sensation, which makes a subtler performance visible: the identity of being healed. The Veil Thins challenges the polished language that can grow around growth itself. 'Aligned.' 'Protecting my peace.' 'High value.' 'Unbothered.' Any of these can describe something real; any can also become lighting that makes the same old ghost look improved. Integration asks for congruence. What remains true when the caption, diagnosis, spiritual language, and personal brand are removed?",
    "movement_criteria": "The insight appears in repeatable behavior, not only in language about growth.",
    "reflection_prompt": "Write one polished sentence you use about your growth. Rewrite it without therapy, spiritual, branding, or status language. Then name one behavior that would make the plain sentence demonstrably true.",
    "shadow_code_quote": "“Ascension ain’t escape—it’s full exposure.”",
    "sonic_artifact_name": "The Veil Thins",
    "where_this_shows_up": "Therapy vocabulary, spiritual language, and self-development content can genuinely help people name experience. They can also become a performance layer. The test is not whether a phrase is fashionable; it is whether the behavior underneath it has changed. Plain language is used here as a reality check."
  },
  {
    "handoff": "Stage 4 is earned when insight appears as repeatable conduct. Stage 5 asks what the Seeker authors when survival, proof, and hidden contracts stop consuming the available energy.",
    "light_code": "I can give without hidden debt and negotiate reciprocity openly when reciprocity matters.",
    "shadow_code": "If I give freely, I should never have needs—or if I gave something, the other person now owes me what I hoped for.",
    "track_title": "Sun Don't Invoice",
    "jungian_lens": "Shadow of altruistic Persona; projection of unspoken expectations; individuation through conscious relationship rather than covert exchange.",
    "life_domains": [
      "Financial",
      "Relationships",
      "Professional",
      "Community"
    ],
    "stage_number": 4,
    "chamber_order": 16,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 4 · Integration & Assimilation",
    "source_edition": "2026",
    "what_you_bring": "You have stripped one growth story down to plain behavior. Now the Chamber applies the same honesty to giving, receiving, expectation, and resentment.",
    "behavioral_test": "Choose one situation where giving produced resentment. Mark it GIFT / REQUEST / AGREEMENT / SACRIFICE / UNCLEAR. Write what was explicitly agreed, what was assumed, and whether you will ASK / RENEGOTIATE / STOP / RELEASE.",
    "light_code_quote": "“The giving is the power—ego’s what turns giving sour.”",
    "reflection_title": "Name the exchange accurately",
    "artifact_snapshot": "Stage Four closes with exchange. Sun Don't Invoice sounds like a celebration of generosity, but its most useful question is about the ledger beneath giving. Resentment may reveal an unstated expectation; it may also reveal exploitation or a broken agreement. The Seeker has enough precision now to tell the difference. Mature generosity is not endless giving. It is knowing whether something is a gift, a request, an agreement, a sacrifice, or a transaction—and refusing to disguise one as another.",
    "movement_criteria": "The insight appears in repeatable behavior, not only in language about growth.",
    "reflection_prompt": "Choose one situation where giving produced resentment. Mark it GIFT / REQUEST / AGREEMENT / SACRIFICE / UNCLEAR. Write what was explicitly agreed, what was assumed, and whether you will ASK / RENEGOTIATE / STOP / RELEASE.",
    "shadow_code_quote": "“Sun don’t invoice.”",
    "sonic_artifact_name": "Sun Don’t Invoice",
    "where_this_shows_up": "Money, favors, mentorship, caregiving, gifts, networking, and unpaid labor all involve exchange. Resentment may come from a hidden expectation, but it can also come from an explicit agreement being broken. The Seeker identifies which kind of exchange actually occurred before deciding whether to ask, renegotiate, stop, or give freely."
  },
  {
    "handoff": "A voice that can stand without permission is finally capable of drawing a boundary that is not a plea, threat, or martyr performance.",
    "light_code": "I can own what I know, what I choose, and what I am building without requiring universal agreement about every explanation of the past.",
    "shadow_code": "My future voice must keep prosecuting the past in order to prove that I survived it.",
    "track_title": "I Own Every Word",
    "jungian_lens": "Individuation and authorship; Persona versus authentic voice; Shadow ownership without compulsory confession.",
    "life_domains": [
      "Identity",
      "Professional",
      "Creative Life",
      "Relationships"
    ],
    "stage_number": 5,
    "chamber_order": 17,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 5 · Transmutation & Wholeness",
    "source_edition": "2026",
    "what_you_bring": "Stage Four converted insight into conduct. You enter the final stage with something more valuable than a new self-description: evidence that you can behave differently.",
    "behavioral_test": "Write two versions of your next chapter: one addressed to the people you want to prove wrong, and one with no opponent in the room. Keep the second. Name one action that advances it this week.",
    "light_code_quote": "“I forgive what I can, I remember the rest / I’m done carrying weight that was never my mess.”",
    "reflection_title": "Write from authorship instead of rebuttal",
    "artifact_snapshot": "The final stage begins with authorship. I Own Every Word arrives after the Seeker has learned to distinguish reality from inference, responsibility from blame, and integration from performance. Now the question is voice. How much of your life is still being narrated as a rebuttal to people who misunderstood you? Reclaiming authorship does not mean pretending nobody harmed you. It means refusing to make the opposition the permanent audience for your becoming.",
    "movement_criteria": "Your next action is organized by chosen values rather than by suffering, opposition, rescue, or the need to prove the past.",
    "reflection_prompt": "Write two versions of your next chapter: one addressed to the people you want to prove wrong, and one with no opponent in the room. Keep the second. Name one action that advances it this week.",
    "shadow_code_quote": "“I finally stopped asking if I’m allowed to stand.”",
    "sonic_artifact_name": "I Own Every Word",
    "where_this_shows_up": "Online visibility and permanent records make it easy to build a life around rebuttal: proving the critics wrong, explaining the past, or making success legible to an imagined audience. This track asks whether the Seeker's next chapter has a positive direction of its own—or is still being written as a response to opposition."
  },
  {
    "handoff": "Once sacrifice stops organizing the future, loss can be faced without needing to call it punishment—or prematurely call it a blessing.",
    "light_code": "I can care deeply and still draw a line that does not require my destruction.",
    "shadow_code": "If I stop sacrificing, I have failed love, faith, loyalty, or destiny.",
    "track_title": "Icarus Ain't Cryin' This Time",
    "jungian_lens": "Inflation, martyr Persona, individuation through differentiated responsibility. The Icarus image is mythic material, not a Jungian classification.",
    "life_domains": [
      "Relationships",
      "Family",
      "Health",
      "Professional"
    ],
    "stage_number": 5,
    "chamber_order": 18,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 5 · Transmutation & Wholeness",
    "source_edition": "2026",
    "what_you_bring": "You have begun writing toward a future that is not organized as a rebuttal. Now that future needs boundaries strong enough to protect it.",
    "behavioral_test": "Write: WHEN X HAPPENS / I WILL Y / BECAUSE I AM PROTECTING Z. Add an early warning sign and a repair path if repair is appropriate. Every action must remain under your control.",
    "light_code_quote": "“I showed up. I drew the line.”",
    "reflection_title": "Turn a boundary into governance",
    "artifact_snapshot": "Once the voice belongs to the Seeker again, sacrifice loses some of its glamour. Icarus Ain't Cryin' This Time confronts the belief that devotion is proven by how much pain can be endured. The track's defiance matters because Stage Five is about governance: values need structures, not just intensity. A boundary becomes real when the Seeker knows what they will do if it is crossed. The line is no longer a speech. It is a decision.",
    "movement_criteria": "Your next action is organized by chosen values rather than by suffering, opposition, rescue, or the need to prove the past.",
    "reflection_prompt": "Write: WHEN X HAPPENS / I WILL Y / BECAUSE I AM PROTECTING Z. Add an early warning sign and a repair path if repair is appropriate. Every action must remain under your control.",
    "shadow_code_quote": "“I built altars with my bones and blood.”",
    "sonic_artifact_name": "Icarus Ain’t Cryin’ This Time",
    "where_this_shows_up": "Burnout culture and loyalty culture often reward endurance long after endurance stops being useful. A boundary is not a slogan or announcement. It is a rule for your own participation. The Seeker turns a value into an enforceable decision that does not require the other person to agree with it."
  },
  {
    "handoff": "The Seeker can now meet the final test: compassion after transformation. Can the heart remain open without becoming a landfill for what others refuse to carry?",
    "light_code": "I can name what was lost, preserve what remains true, and build from what is now possible without forcing the loss to justify itself.",
    "shadow_code": "If something collapsed, it must have been destined, deserved, obsolete, or secretly good.",
    "track_title": "The Great Turning",
    "jungian_lens": "Death-rebirth symbolism; individuation; holding opposites. Nostradamus, Cayce, prophecy, and “living prophecy” remain lyrical/mythic claims unless separately verified.",
    "life_domains": [
      "Financial",
      "Professional",
      "Community",
      "Spiritual"
    ],
    "stage_number": 5,
    "chamber_order": 19,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 5 · Transmutation & Wholeness",
    "source_edition": "2026",
    "what_you_bring": "You have turned a boundary into an action under your control. With governance in place, you can face what has ended without rushing to make the ending meaningful.",
    "behavioral_test": "Write four sections: LOST / STILL TRUE / NOW POSSIBLE / WHAT I REFUSE TO PRETEND WAS GOOD. Choose one next action from NOW POSSIBLE that does not require the loss to have been 'meant to happen.'",
    "light_code_quote": "“This ain’t the end of everything, it’s the end of what was broken.”",
    "reflection_title": "Build direction without rewriting the loss",
    "artifact_snapshot": "A governed life can finally face collapse without immediately turning it into punishment or prophecy. The Great Turning reaches for enormous meaning: history, destiny, collective change, the end of an old world. The Chamber keeps the scale but removes the obligation to believe the mythology literally. Some losses become openings. Some remain losses. Transmutation means building direction from what is true now without forcing grief to prove that everything happened for a reason.",
    "movement_criteria": "Your next action is organized by chosen values rather than by suffering, opposition, rescue, or the need to prove the past.",
    "reflection_prompt": "Write four sections: LOST / STILL TRUE / NOW POSSIBLE / WHAT I REFUSE TO PRETEND WAS GOOD. Choose one next action from NOW POSSIBLE that does not require the loss to have been 'meant to happen.'",
    "shadow_code_quote": "“Everything we’re losing, we outgrew.”",
    "sonic_artifact_name": "The Great Turning",
    "where_this_shows_up": "Layoffs, technological disruption, climate anxiety, institutional distrust, relocation, and personal loss can make large-scale meaning attractive. Meaning can help, but it should not falsify what was lost. The Seeker builds from present facts while leaving room for grief, uncertainty, and beliefs that remain symbolic rather than proven."
  },
  {
    "handoff": "There is no next track. The handoff is to life outside the Chamber: the Seeker leaves with a method for seeing clearly, owning accurately, acting deliberately, and remaining compassionate without disappearing inside another person’s pain.",
    "light_code": "I can support what is mine to support, reflect what I can honestly see, and return what I cannot ethically or realistically carry.",
    "shadow_code": "If I can feel your pain, I am responsible for carrying, fixing, or metabolizing it for you.",
    "track_title": "Not Your Cross (The Seeker's Initiation)",
    "jungian_lens": "Individuation and differentiated relationship; Shadow of the rescuer; the transcendent function as a way of holding tension rather than collapsing into either absorption or indifference. Mirror-Walker is CKP terminology.",
    "life_domains": [
      "Relationships",
      "Family",
      "Community",
      "Health"
    ],
    "stage_number": 5,
    "chamber_order": 20,
    "make_the_turn": "The Light Code only matters if it changes a decision. Use the reflection below to move from recognition into behavior.",
    "artifact_stage": "Stage 5 · Transmutation & Wholeness",
    "source_edition": "2026",
    "what_you_bring": "You arrive with calibrated perception, tested narratives, placed responsibility, practiced behavior, authorship, and governance. The final question is whether compassion can remain open without becoming self-erasure.",
    "behavioral_test": "Write three columns: SUPPORT / REFLECT / RETURN. Then complete: 'When I encounter charge, I will separate ___, test ___, own ___, choose ___, and refuse to carry ___.' Keep this as your final Chamber record.",
    "light_code_quote": "“Alchemy is not consumption. It is transformation with consent.”",
    "reflection_title": "Complete the Chamber with a rule for compassionate responsibility",
    "artifact_snapshot": "The final chamber returns to relationship, but the Seeker is no longer standing where they began. They can see charge without worshipping it, test a story without erasing themselves, own what is theirs without absorbing what is not, and build behavior from what they have learned. Not Your Cross is therefore not an exit into detachment. It is an initiation into structured compassion. The Mirror-Walker does not become cold. The mirror simply stops swallowing everything it reflects.",
    "movement_criteria": "Your next action is organized by chosen values rather than by suffering, opposition, rescue, or the need to prove the past.",
    "reflection_prompt": "Write three columns: SUPPORT / REFLECT / RETURN. Then complete: 'When I encounter charge, I will separate ___, test ___, own ___, choose ___, and refuse to carry ___.' Keep this as your final Chamber record.",
    "shadow_code_quote": "“I was never meant to be landfill for grief.”",
    "sonic_artifact_name": "Not Your Cross (The Seeker’s Initiation)",
    "where_this_shows_up": "Always-on messaging, caregiving, mutual aid, crisis support, and emotionally demanding relationships can make availability feel synonymous with compassion. The final skill is differentiated care: remain human, offer what is truly yours to offer, and return responsibility that cannot ethically be carried for someone else."
  }
]
$reflection_artifacts$::jsonb) as x(
    track_title text,
    chamber_order integer,
    sonic_artifact_name text,
    artifact_snapshot text,
    artifact_stage text,
    shadow_code text,
    light_code text,
    behavioral_test text,
    stage_number smallint,
    what_you_bring text,
    shadow_code_quote text,
    light_code_quote text,
    make_the_turn text,
    life_domains text[],
    where_this_shows_up text,
    jungian_lens text,
    reflection_title text,
    reflection_prompt text,
    movement_criteria text,
    handoff text,
    source_edition text
  )
)
insert into public.act_two_sonic_artifacts (
  track_id,
  chamber_order,
  sonic_artifact_name,
  artifact_snapshot,
  artifact_stage,
  shadow_code,
  light_code,
  behavioral_test,
  stage_number,
  what_you_bring,
  shadow_code_quote,
  light_code_quote,
  make_the_turn,
  life_domains,
  where_this_shows_up,
  jungian_lens,
  reflection_title,
  reflection_prompt,
  movement_criteria,
  handoff,
  source_edition,
  updated_at
)
select
  t.id,
  m.chamber_order,
  m.sonic_artifact_name,
  m.artifact_snapshot,
  m.artifact_stage,
  m.shadow_code,
  m.light_code,
  m.behavioral_test,
  m.stage_number,
  m.what_you_bring,
  m.shadow_code_quote,
  m.light_code_quote,
  m.make_the_turn,
  m.life_domains,
  m.where_this_shows_up,
  m.jungian_lens,
  m.reflection_title,
  m.reflection_prompt,
  m.movement_criteria,
  m.handoff,
  m.source_edition,
  now()
from master m
join public.tracks t on t.title = m.track_title
on conflict (track_id) do update set
  chamber_order = excluded.chamber_order,
  sonic_artifact_name = excluded.sonic_artifact_name,
  artifact_snapshot = excluded.artifact_snapshot,
  artifact_stage = excluded.artifact_stage,
  shadow_code = excluded.shadow_code,
  light_code = excluded.light_code,
  behavioral_test = excluded.behavioral_test,
  stage_number = excluded.stage_number,
  what_you_bring = excluded.what_you_bring,
  shadow_code_quote = excluded.shadow_code_quote,
  light_code_quote = excluded.light_code_quote,
  make_the_turn = excluded.make_the_turn,
  life_domains = excluded.life_domains,
  where_this_shows_up = excluded.where_this_shows_up,
  jungian_lens = excluded.jungian_lens,
  reflection_title = excluded.reflection_title,
  reflection_prompt = excluded.reflection_prompt,
  movement_criteria = excluded.movement_criteria,
  handoff = excluded.handoff,
  source_edition = excluded.source_edition,
  updated_at = now();

do $$
declare
  v_total integer;
  v_complete integer;
begin
  select count(*) into v_total
  from public.act_two_sonic_artifacts;

  select count(*) into v_complete
  from public.act_two_sonic_artifacts
  where chamber_order between 1 and 20
    and stage_number between 1 and 5
    and what_you_bring is not null
    and shadow_code_quote is not null
    and light_code_quote is not null
    and make_the_turn is not null
    and life_domains is not null
    and where_this_shows_up is not null
    and jungian_lens is not null
    and reflection_title is not null
    and reflection_prompt is not null
    and movement_criteria is not null
    and handoff is not null
    and source_edition = '2026';

  if v_total <> 20 or v_complete <> 20 then
    raise exception
      'Reflection Chamber production master incomplete: total %, complete %',
      v_total, v_complete;
  end if;
end $$;

alter table public.act_two_sonic_artifacts
  alter column stage_number set not null,
  alter column what_you_bring set not null,
  alter column shadow_code_quote set not null,
  alter column light_code_quote set not null,
  alter column make_the_turn set not null,
  alter column life_domains set not null,
  alter column where_this_shows_up set not null,
  alter column jungian_lens set not null,
  alter column reflection_title set not null,
  alter column reflection_prompt set not null,
  alter column movement_criteria set not null,
  alter column handoff set not null,
  alter column source_edition set not null;

alter table public.act_two_sonic_artifacts
  add constraint act_two_sonic_artifacts_chamber_order_check
  check (chamber_order between 1 and 20);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'act_two_sonic_artifacts_stage_number_fkey'
      and conrelid = 'public.act_two_sonic_artifacts'::regclass
  ) then
    alter table public.act_two_sonic_artifacts
      add constraint act_two_sonic_artifacts_stage_number_fkey
      foreign key (stage_number)
      references public.act_two_stages(stage_number)
      on update cascade
      on delete restrict;
  end if;
end $$;

create index if not exists act_two_sonic_artifacts_stage_number_idx
  on public.act_two_sonic_artifacts(stage_number, chamber_order);

commit;
