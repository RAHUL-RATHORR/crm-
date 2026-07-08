const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Local dev uses Render backend; production uses same domain (Hostinger / single-server deploy).
export const API_BASE_URL = isLocalhost
  ? 'https://crm-qpw8.onrender.com'
  : window.location.origin;
