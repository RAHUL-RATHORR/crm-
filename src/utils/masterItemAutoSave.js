export function lineItemToMasterPayload(item) {
  const name = (item?.description || '').trim();
  if (!name || name.length < 2) return null;

  return {
    name,
    hsn: (item.hsn || '').trim(),
    rate: Number(item.rate) || 0,
    per: (item.per || 'PCS').trim() || 'PCS',
    gstPercent: Number(item.gstPercent) || 18,
    note: (item.descriptionNote || '').trim(),
  };
}

export function findMasterItemByName(masterItems = [], name = '') {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return masterItems.find((item) => item.name?.trim().toLowerCase() === key) || null;
}

export async function upsertMasterItemFromLine(apiBaseUrl, item, masterItems = []) {
  const payload = lineItemToMasterPayload(item);
  if (!payload) return null;

  const existing = findMasterItemByName(masterItems, payload.name);
  const url = existing?._id
    ? `${apiBaseUrl}/api/items/${existing._id}`
    : `${apiBaseUrl}/api/items`;
  const method = existing?._id ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function mergeSavedMasterItem(masterItems = [], savedItem) {
  if (!savedItem?._id) return masterItems;
  const byId = masterItems.findIndex((item) => item._id === savedItem._id);
  if (byId >= 0) {
    const next = [...masterItems];
    next[byId] = savedItem;
    return next;
  }
  const byName = masterItems.findIndex(
    (item) => item.name?.trim().toLowerCase() === savedItem.name?.trim().toLowerCase(),
  );
  if (byName >= 0) {
    const next = [...masterItems];
    next[byName] = savedItem;
    return next;
  }
  return [savedItem, ...masterItems];
}
