const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Local dev uses live Hostinger API (local MongoDB Atlas often blocked by IP whitelist).
export const API_BASE_URL = isLocalhost
  ? 'https://hariharprinters.printosync.com'
  : window.location.origin;
