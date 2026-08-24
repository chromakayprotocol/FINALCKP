const AUTH_ROUTES = new Set(['/login', '/register']);

export function sanitizeRedirectPath(path, fallback = '/experiencemode/sovereign') {
  if (!path || typeof path !== 'string') return fallback;
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;

  const pathname = path.split(/[?#]/)[0] || '/';
  if (AUTH_ROUTES.has(pathname)) return fallback;

  return path;
}

export function locationToRedirectPath(location) {
  if (!location?.pathname) return null;
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

export function getAuthRedirectPath(location, fallback = '/experiencemode/sovereign') {
  const searchParams = new URLSearchParams(location?.search || '');
  const searchRedirect = searchParams.get('redirect');
  if (searchRedirect) return sanitizeRedirectPath(searchRedirect, fallback);

  return sanitizeRedirectPath(locationToRedirectPath(location?.state?.from), fallback);
}

