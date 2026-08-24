-- Creates the Act Two ("The Reflection Chamber") visualizer playlist so the
-- Act Two Core Visualizer can query Supabase the same way the Act Three
-- (Reclamation) visualizer queries the 'reclamation-visualizer-preview'
-- playlist. No track rows are created here -- populate
-- public.visualizer_playlist_tracks for this playlist once Act Two audio
-- and cover assets are uploaded to R2, following the pattern in
-- 20260726223254_align_visualizer_playlist_to_r2_media.sql.

insert into public.visualizer_playlists (name, slug, description, is_active)
values (
  'Act Two: The Reflection Chamber',
  'act-two-visualizer-preview',
  'Water-element visualizer playlist for Act II -- The Reflection Chamber.',
  true
)
on conflict (slug) do nothing;
