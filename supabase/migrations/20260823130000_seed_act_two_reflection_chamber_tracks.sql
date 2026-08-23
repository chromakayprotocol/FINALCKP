-- Seed the Act Two "Reflection Chamber" album into public.tracks and wire it
-- into the 'act-two-visualizer-preview' playlist created by
-- 20260823120000_create_act_two_visualizer_playlist.sql.
--
-- Source: Chroma_Key_Act_Two_Reflection_Chamber_Track_Matrix (27-track manifest).
-- Track 13, "The Seeker and the Silent", is deliberately excluded: its R2 object
-- key is marked "NEEDS EXACT KEY" (unconfirmed) in the source manifest, and
-- public.tracks.r2_audio_key is NOT NULL, so it cannot be seeded safely yet.
-- Add it in a follow-up migration once the object key is confirmed.
--
-- Object keys are stored bucket-relative (matching the convention already used
-- for Act Three in 20260726223304_align_full_visualizer_album.sql, e.g.
-- 'act_three/media/tracks/...'), verbatim from the source manifest's "R2 Object
-- Key" column -- including a few filename/title mismatches the manifest itself
-- flags and intentionally preserves (e.g. track 4's object key says "Between"
-- where the canonical title says "Before"; track 15's object key says
-- "Bloodlines" where the canonical title says "Bloodline").
--
-- light_code / shadow_code are new, additive columns holding each track's short
-- code name (e.g. "The Owned Interior") for the visualizer's Light/Shadow code
-- display. The longer prose definitions from the source manifest are not stored
-- here -- there is no UI surface for them yet.
--
-- Each track also gets a single public.track_lyrics row carrying its
-- "Transmutation Line" as an always-visible line (start_ms 0 through the
-- track's full duration), so the visualizer's Lyrical Transmission panel shows
-- real content instead of "No lyrics are assigned to this track."

alter table public.tracks
  add column if not exists light_code text,
  add column if not exists shadow_code text;

comment on column public.tracks.light_code is
  'Short code name for the track''s light/integration pole (e.g. "The Owned Interior"). Displayed in the visualizer''s Light code field.';
comment on column public.tracks.shadow_code is
  'Short code name for the track''s shadow/distortion pole (e.g. "The Displaced War"). Displayed in the visualizer''s Shadow code field.';

with act_two_seed (track_num, title, duration_ms, r2_key, light_code, shadow_code, transmutation_line) as (
  values
    (1, 'The Reflection Chamber', 289000, 'act_two/media/tracks/01 - Musiq Matrix - The Reflection Chamber.mp3', 'The Owned Interior', 'The Displaced War', 'The real war''s within - it''s always been me.'),
    (2, 'Unsent Messages Season', 292000, 'act_two/media/tracks/02 - Unsent_Messages_Season.mp3', 'Sacred Restraint', 'Silence as Concealed Fear', 'I don''t mistake restraint for absence.'),
    (3, 'Version of Me', 410000, 'act_two/media/tracks/03 - Musiq Matrix - Version of Me.mp3', 'The Forged Witness', 'The Armored Survivor', 'I am not grateful to them. But I am because of them.'),
    (4, 'Before The Verdict and the Door', 305000, 'act_two/media/tracks/04 - Musiq Matrix - Between The Verdict and the Door.mp3', 'The Unbent Door', 'The Rehearsed Room', 'Redemption''s real, but it doesn''t feel good. It cost you the lie.'),
    (5, 'Sun Don''t Invoice', 344000, 'act_two/media/tracks/05 - Musiq Matrix - Sun Dont Invoice.mp3', 'Open Frequency', 'The Ledger', 'You weren''t built to hoard the light - you were engineered to be.'),
    (6, 'The Ones We Still Carry', 189000, 'act_two/media/tracks/06 - Musiq Matrix - The Ones We Still Carry.mp3', 'The Lightened Carry', 'The Altar of Absence', 'Now I walk forward, and you walk with me.'),
    (7, 'Willful Detonation', 238000, 'act_two/media/tracks/07- Musiq Matrix - Willful Detonation.mp3', 'The Re-Encoded Sovereign', 'The Borrowed Trigger', 'Pain''s the program - rewrite the lore.'),
    (8, '5 Minutes From The Edge', 266000, 'act_two/media/tracks/08_Five_Minutes_from_the_Edge.mp3', 'Departure Without Vengeance', 'The Willing Casualty', 'I left to survive, not to punish your shame.'),
    (9, 'Not Alone', 322000, 'act_two/media/tracks/09 - Musiq Matrix - Not Alone.mp3', 'Witness Without Rescue', 'Suffering as Currency', 'No fixing. No forcing. Just breathing slow.'),
    (10, 'The Shadow Magician', 215000, 'act_two/media/tracks/10 - Musiq Matrix - The Shadow Magician.mp3', 'The Combined Halves', 'The Fear-Forged World', 'The Magician ascends when the halves combine.'),
    (11, 'The Great Turning', 321000, 'act_two/media/tracks/11 - Musiq Matrix - The Great Turning.mp3', 'The Cleared Ground', 'The Mourned Ruin', 'You thought the pain was punishment - it was pointing you somewhere.'),
    (12, 'Icarus Ain''t Cryin'' This Time', 240000, 'act_two/media/tracks/12 - Musiq Matrix - Icarus Ain''t Cryin.mp3', 'The Unkneeling Flame', 'The Bargaining Altar', 'I ain''t beggin'' no sky made of stone. I showed up. I drew the line.'),
    (14, 'Safer Lie', 138000, 'act_two/media/tracks/14 - Musiq Matrix-Safer_Lie.mp3', 'Voice Found in the Empty Space', 'Control Mistaken for Peace', 'You tried to vanish the sound of my grace - I found my voice in the empty space.'),
    (15, 'Ashes and Iron (Bloodline and Flame)', 216000, 'act_two/media/tracks/15 - Musiq Matrix - Ashes and Iron (Bloodlines and Flame).mp3', 'The Dropped Guard', 'The Holy Crusade', 'He drops his guard, looks up - might have loved you, then.'),
    (16, 'H2O', 246000, 'act_two/media/tracks/16 - Musiq Matrix - H20.mp3', 'The Willing Drowning', 'The Held Breath', 'Only by drowning, I rise again.'),
    (17, 'Live For Me', 275000, 'act_two/media/tracks/17- Musiq Matrix - Live For Me.mp3', 'Self-Chosen Survival', 'The Endless Lifeline', 'Cutting cords, not to hate you, but ''cause I love me more.'),
    (18, 'Tearin'' You Apart', 222000, 'act_two/media/tracks/18 - Musiq Matrix - Tearin You Apart.mp3', 'Presence Without Ownership', 'The Karma Transfer', 'I can''t take your karma, it''s yours to bear - but I''ll stand with you.'),
    (19, 'Felt That Drift', 255000, 'act_two/media/tracks/19 - Musiq Matrix - Felt That Drift.mp3', 'The Guarded Gate', 'The Outsourced Knowing', 'Fear built cages - mastery moved within.'),
    (20, 'Phantom', 229000, 'act_two/media/tracks/20 - Musiq Matrix - Phantom.mp3', 'The Conscious Archetype', 'The Idealized Ghost', 'He''s not my past, he''s my inner heart.'),
    (21, 'If He Could Only See', 312000, 'act_two/media/tracks/21 - Musiq Matrix - If He Could Only See.mp3', 'Intercession Without Control', 'The Rescue Petition', 'Give him strength to break - and find his way.'),
    (22, 'If You Really Listened', 257000, 'act_two/media/tracks/22-Musiq Matix - Want_the_Same_for_Me.mp3', 'Unwitnessed Alchemy', 'The Monument', 'I just alchemized what was meant to be a void.'),
    (23, 'Promise', 214000, 'act_two/media/tracks/23 - Musiq Matrix - Promise.mp3', 'The Kept and the Released', 'The Weaponized Vow', 'Loyalty can''t carry all the ruins you made.'),
    (24, 'This Ain''t The Limit', 247000, 'act_two/media/tracks/24 - Musiq Matrix -This_Ain''t_The_Limit.mp3', 'The Merciful Frame', 'The Cage Reading', 'What if the leash is love, not fear?'),
    (25, 'I Own Every Word', 222000, 'act_two/media/tracks/25 - Musiq Matrix -  I Own Every Word.mp3', 'Accountability Without Shrinking', 'The Apology Tax', 'I''m not asking permission to feel like that. I own every word.'),
    (26, 'The Veil Thins', 184000, 'act_two/media/tracks/26 - Musiq Matrix - The Veil Thins.mp3', 'Full Exposure', 'The Better Lighting', 'Ascension ain''t escape - it''s full exposure.'),
    (27, 'Not Your Cross (The Seeker''s Initiation)', 329000, 'act_two/media/tracks/27 - Not_Your_Cross_(The_Seeker''s_Initiation).mp3', 'The Mirror-Walker''s Boundary', 'The Unvented Furnace', 'Bring me your shadow - I''ll diagram its frame. But I will not carry what you refuse to name.')
)
insert into public.tracks (title, artist, album, duration_ms, queue_index, r2_audio_key, light_code, shadow_code)
select
  seed.title,
  'Musiq Matrix',
  'The Reflection Chamber',
  seed.duration_ms,
  seed.track_num,
  seed.r2_key,
  seed.light_code,
  seed.shadow_code
from act_two_seed as seed
where not exists (
  select 1 from public.tracks as existing where existing.title = seed.title
);

-- Reset this playlist's track links so the migration is safe to re-run.
delete from public.visualizer_playlist_tracks
where playlist_id = (
  select id from public.visualizer_playlists where slug = 'act-two-visualizer-preview'
);

with act_two_seed (track_num, title) as (
  values
    (1, 'The Reflection Chamber'), (2, 'Unsent Messages Season'), (3, 'Version of Me'),
    (4, 'Before The Verdict and the Door'), (5, 'Sun Don''t Invoice'), (6, 'The Ones We Still Carry'),
    (7, 'Willful Detonation'), (8, '5 Minutes From The Edge'), (9, 'Not Alone'),
    (10, 'The Shadow Magician'), (11, 'The Great Turning'), (12, 'Icarus Ain''t Cryin'' This Time'),
    (14, 'Safer Lie'), (15, 'Ashes and Iron (Bloodline and Flame)'), (16, 'H2O'),
    (17, 'Live For Me'), (18, 'Tearin'' You Apart'), (19, 'Felt That Drift'),
    (20, 'Phantom'), (21, 'If He Could Only See'), (22, 'If You Really Listened'),
    (23, 'Promise'), (24, 'This Ain''t The Limit'), (25, 'I Own Every Word'),
    (26, 'The Veil Thins'), (27, 'Not Your Cross (The Seeker''s Initiation)')
)
insert into public.visualizer_playlist_tracks (playlist_id, track_id, position)
select playlist.id, tracks.id, seed.track_num
from act_two_seed as seed
join public.tracks as tracks on tracks.title = seed.title
cross join (
  select id from public.visualizer_playlists where slug = 'act-two-visualizer-preview'
) as playlist
order by seed.track_num;

with act_two_seed (title, transmutation_line) as (
  values
    ('The Reflection Chamber', 'The real war''s within - it''s always been me.'),
    ('Unsent Messages Season', 'I don''t mistake restraint for absence.'),
    ('Version of Me', 'I am not grateful to them. But I am because of them.'),
    ('Before The Verdict and the Door', 'Redemption''s real, but it doesn''t feel good. It cost you the lie.'),
    ('Sun Don''t Invoice', 'You weren''t built to hoard the light - you were engineered to be.'),
    ('The Ones We Still Carry', 'Now I walk forward, and you walk with me.'),
    ('Willful Detonation', 'Pain''s the program - rewrite the lore.'),
    ('5 Minutes From The Edge', 'I left to survive, not to punish your shame.'),
    ('Not Alone', 'No fixing. No forcing. Just breathing slow.'),
    ('The Shadow Magician', 'The Magician ascends when the halves combine.'),
    ('The Great Turning', 'You thought the pain was punishment - it was pointing you somewhere.'),
    ('Icarus Ain''t Cryin'' This Time', 'I ain''t beggin'' no sky made of stone. I showed up. I drew the line.'),
    ('Safer Lie', 'You tried to vanish the sound of my grace - I found my voice in the empty space.'),
    ('Ashes and Iron (Bloodline and Flame)', 'He drops his guard, looks up - might have loved you, then.'),
    ('H2O', 'Only by drowning, I rise again.'),
    ('Live For Me', 'Cutting cords, not to hate you, but ''cause I love me more.'),
    ('Tearin'' You Apart', 'I can''t take your karma, it''s yours to bear - but I''ll stand with you.'),
    ('Felt That Drift', 'Fear built cages - mastery moved within.'),
    ('Phantom', 'He''s not my past, he''s my inner heart.'),
    ('If He Could Only See', 'Give him strength to break - and find his way.'),
    ('If You Really Listened', 'I just alchemized what was meant to be a void.'),
    ('Promise', 'Loyalty can''t carry all the ruins you made.'),
    ('This Ain''t The Limit', 'What if the leash is love, not fear?'),
    ('I Own Every Word', 'I''m not asking permission to feel like that. I own every word.'),
    ('The Veil Thins', 'Ascension ain''t escape - it''s full exposure.'),
    ('Not Your Cross (The Seeker''s Initiation)', 'Bring me your shadow - I''ll diagram its frame. But I will not carry what you refuse to name.')
)
insert into public.track_lyrics (track_id, line_order, line_text, start_ms, end_ms)
select tracks.id, 0, seed.transmutation_line, 0, greatest(tracks.duration_ms, 1)
from act_two_seed as seed
join public.tracks as tracks on tracks.title = seed.title
where not exists (
  select 1 from public.track_lyrics as existing
  where existing.track_id = tracks.id and existing.line_order = 0
);
