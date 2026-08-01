export const PLATE_USAGE_STORAGE_KEY = 'hariharPlateUsageCounts';

export const PLATE_SIZE_OPTIONS = [
  '560*670',
  '800*1030',
  '820*1030',
  '540*780',
  '608*890',
  '715*915',
];

export const parsePlateSizes = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

export const formatPlateSizes = (value) => parsePlateSizes(value).join(', ');

export const parsePlateUseCounts = (value) => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map((item) => Number(item)).filter((item) => !Number.isNaN(item));
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
};

export const formatPlateUseCounts = (value) => parsePlateUseCounts(value).join(', ');

export const readPlateUsageMap = () => {
  try {
    return JSON.parse(localStorage.getItem(PLATE_USAGE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const writePlateUsageMap = (map) => {
  localStorage.setItem(PLATE_USAGE_STORAGE_KEY, JSON.stringify(map));
};

export const buildPlateUsageMapFromCards = (cards) => {
  const map = {};
  cards.forEach((card) => {
    parsePlateSizes(card.plateSize).forEach((size) => {
      const cardsWithSize = cards.filter((c) => parsePlateSizes(c.plateSize).includes(size));
      const countByDocs = cardsWithSize.length;
      const maxUseCount = cardsWithSize.reduce((max, c) => {
        const sizes = parsePlateSizes(c.plateSize);
        const counts = parsePlateUseCounts(c.plateUseCount);
        const index = sizes.indexOf(size);
        const count = index >= 0 ? counts[index] : Number(c.plateUseCount) || 0;
        return Math.max(max, count);
      }, 0);
      map[size] = Math.max(map[size] || 0, countByDocs, maxUseCount);
    });
  });
  return map;
};

export const mergePlateUsageMaps = (...maps) => {
  const merged = {};
  maps.forEach((map) => {
    Object.entries(map || {}).forEach(([size, count]) => {
      merged[size] = Math.max(merged[size] || 0, Number(count) || 0);
    });
  });
  return merged;
};

export const resolvePlateUseCount = (size, cards, editingCard) => {
  if (!size) return '';

  const normalizedSize = String(size).trim();
  const mergedMap = mergePlateUsageMaps(readPlateUsageMap(), buildPlateUsageMapFromCards(cards));
  writePlateUsageMap(mergedMap);

  const usedCount = mergedMap[normalizedSize] || 0;
  const editingSizes = parsePlateSizes(editingCard?.plateSize);
  const editingCounts = parsePlateUseCounts(editingCard?.plateUseCount);

  if (!editingCard) return usedCount + 1;
  if (editingSizes.includes(normalizedSize)) {
    const index = editingSizes.indexOf(normalizedSize);
    const existingCount = editingCounts[index];
    return Math.max(usedCount, Number(existingCount) || usedCount || 1);
  }
  return usedCount + 1;
};

export const resolvePlateUseCounts = (sizes, cards, editingCard) =>
  parsePlateSizes(sizes)
    .map((size) => resolvePlateUseCount(size, cards, editingCard))
    .join(', ');

export const rememberPlateUsage = (size, count) => {
  parsePlateSizes(size).forEach((entry, index) => {
    const counts = parsePlateUseCounts(count);
    const numericCount = counts[index] ?? Number(count);
    const normalizedSize = String(entry || '').trim();
    if (!normalizedSize || !numericCount) return;

    const map = readPlateUsageMap();
    map[normalizedSize] = Math.max(map[normalizedSize] || 0, numericCount);
    writePlateUsageMap(map);
  });
};

export const syncPlateUsageFromCards = (cards) => {
  const mergedMap = mergePlateUsageMaps(readPlateUsageMap(), buildPlateUsageMapFromCards(cards));
  writePlateUsageMap(mergedMap);
  return mergedMap;
};
