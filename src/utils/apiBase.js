const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Local dev uses live Hostinger API so local UI matches production data.
export const API_BASE_URL = isLocalhost
  ? 'https://hariharprinters.printosync.com'
  : window.location.origin;
