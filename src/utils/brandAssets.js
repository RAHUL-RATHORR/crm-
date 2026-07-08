export const BRAND_COLORS = {
  navy: '#0F2744',
  orange: '#F97316',
  teal: '#2EC4B6',
};

export const BRAND_LOGO_URL = '/logo.png';
export const BRAND_FAVICON_URL = '/logo.png';

export const DEFAULT_SITE_SETTINGS = {
  siteTitle: 'Harihar Printers',
  logo: BRAND_LOGO_URL,
  whiteLogo: null,
  favicon: BRAND_FAVICON_URL,
};

export const getSiteSettings = () => {
  const saved = localStorage.getItem('siteSettings');
  if (!saved) return { ...DEFAULT_SITE_SETTINGS };

  const parsed = JSON.parse(saved);
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...parsed,
    logo: parsed.logo || DEFAULT_SITE_SETTINGS.logo,
    favicon: parsed.favicon || DEFAULT_SITE_SETTINGS.favicon,
  };
};

export const isDefaultBrandTitle = (title) =>
  !title || title === 'TRICKWRICK' || title === 'Harihar Printers';
