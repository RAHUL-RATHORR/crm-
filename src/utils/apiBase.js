const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// On localhost, Vite proxy forwards /api calls to Express (localhost:5011).
// In production, API is served from the same origin.
export const API_BASE_URL = isLocalhost ? '' : window.location.origin;
