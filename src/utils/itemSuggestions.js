export function filterMasterItems(masterItems = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return masterItems.slice(0, 8);
  return masterItems.filter((item) => (
    item.name?.toLowerCase().includes(q)
    || item.hsn?.toLowerCase().includes(q)
  )).slice(0, 8);
}

export function findExactMasterItem(masterItems = [], description = '') {
  const q = description.trim().toLowerCase();
  if (!q) return null;
  return masterItems.find((item) => item.name?.trim().toLowerCase() === q) || null;
}

export function masterItemToLineFields(masterItem, { includeHsn = true, currentQty = 0, existingNote = '' } = {}) {
  const qty = Number(currentQty) > 0 ? Number(currentQty) : 1;
  const fields = {
    description: masterItem.name || '',
    descriptionNote: (existingNote || '').trim() || masterItem.note || '',
    qty,
    rate: Number(masterItem.rate) || 0,
    per: masterItem.per || 'PCS',
    gstPercent: Number(masterItem.gstPercent ?? 18),
  };
  if (includeHsn) fields.hsn = masterItem.hsn || '';
  return fields;
}

/** Description shown on print (main line only). */
export function getItemPrintDescription(item) {
  return (item?.description || '').trim();
}

export function getItemPrintNote(item) {
  return (item?.descriptionNote || '').trim();
}
