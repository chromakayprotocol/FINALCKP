import { useEffect, useState } from 'react';
import { getShadowTwinSignedUrl } from '../../../../lib/supabase/shadowTwin';

const REFRESH_MS = 50 * 60 * 1000; // refresh before the 1hr signed URL expires

/**
 * Resolves a private shadow-twins storage path (source or canonical) to a
 * short-lived signed URL, refreshed periodically so a long Chamber session
 * never hits an expired image. Returns null while unset/loading — callers
 * render their own placeholder/loading state for that case.
 */
export function useShadowTwinImageUrl(path) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return undefined;
    }

    let cancelled = false;

    async function refresh() {
      const { url: signedUrl } = await getShadowTwinSignedUrl(path);
      if (!cancelled) setUrl(signedUrl);
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [path]);

  return url;
}
