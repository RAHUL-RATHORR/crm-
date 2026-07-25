const STORAGE_KEY = 'crm_doc_item_notes';

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function docKeys(docId, docNo) {
  const keys = [];
  if (docId) keys.push(`id:${docId}`);
  if (docNo) keys.push(`no:${docNo}`);
  return keys;
}

export function setStoredItemNotes(docId, docNo, items = []) {
  const map = readMap();
  const notes = (items || []).map((item, index) => ({
    index,
    description: (item.description || '').trim(),
    note: (item.descriptionNote || '').trim(),
    per: (item.per || '').trim(),
    hsn: (item.hsn || '').trim(),
  }));

  docKeys(docId, docNo).forEach((key) => {
    map[key] = notes;
  });
  writeMap(map);
}

export function getStoredItemNotes(docId, docNo) {
  const map = readMap();
  for (const key of docKeys(docId, docNo)) {
    if (Array.isArray(map[key])) return map[key];
  }
  return [];
}

export function removeStoredItemNotes(docId, docNo) {
  const map = readMap();
  docKeys(docId, docNo).forEach((key) => {
    delete map[key];
  });
  writeMap(map);
}

export function mergeItemNotes(doc) {
  if (!doc?.items?.length) return doc;
  const docNo = doc.invoiceNumber || doc.challanNo || doc.quoteNumber || '';
  const stored = getStoredItemNotes(doc._id, docNo);
  if (!stored.length) return doc;

  return {
    ...doc,
    items: doc.items.map((item, index) => {
      if ((item.descriptionNote || '').trim()) return item;
      const byIndex = stored.find((entry) => entry.index === index);
      const byDesc = stored.find(
        (entry) => entry.description?.toLowerCase() === (item.description || '').trim().toLowerCase(),
      );
      const note = byIndex?.note || byDesc?.note || '';
      const per = byIndex?.per || byDesc?.per || '';
      const hsn = byIndex?.hsn || byDesc?.hsn || '';
      if (!note && !per && !hsn) return item;
      return {
        ...item,
        ...(note ? { descriptionNote: note } : {}),
        ...(per ? { per } : {}),
        ...(hsn ? { hsn } : {}),
      };
    }),
  };
}

export function mergeItemNotesList(docs) {
  return Array.isArray(docs) ? docs.map(mergeItemNotes) : [];
}

export function mapLineItemsForSave(items = []) {
  return items.map((item) => ({
    description: item.description || '',
    descriptionNote: item.descriptionNote || '',
    hsn: item.hsn || '',
    qty: Number(item.qty) || 0,
    rate: Number(item.rate) || 0,
    per: String(item.per ?? '').trim() || 'PCS',
    total: Number(item.total) || 0,
    gstPercent: Number(item.gstPercent) || 18,
    gstAmount: Number(item.gstAmount) || 0,
    ...(item.jobNumber ? { jobNumber: item.jobNumber } : {}),
    ...(item.jobCardId ? { jobCardId: item.jobCardId } : {}),
  }));
}
