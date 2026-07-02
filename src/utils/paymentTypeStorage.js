const STORAGE_KEY = 'crm_doc_payment_types';

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

export function getStoredPaymentType(id, docNo) {
  const map = readMap();
  if (id && map[`id:${id}`]) return map[`id:${id}`];
  if (docNo && map[`no:${docNo}`]) return map[`no:${docNo}`];
  return '';
}

export function setStoredPaymentType(id, docNo, paymentType) {
  const map = readMap();
  const value = paymentType != null ? String(paymentType) : '';
  if (id) map[`id:${id}`] = value;
  if (docNo) map[`no:${docNo}`] = value;
  writeMap(map);
}

export function removeStoredPaymentType(id, docNo) {
  const map = readMap();
  if (id) delete map[`id:${id}`];
  if (docNo) delete map[`no:${docNo}`];
  writeMap(map);
}

/** Prefer API value; fall back to locally stored payment type for print/edit. */
export function mergePaymentType(doc) {
  if (!doc) return doc;
  const docNo = doc.invoiceNumber || doc.challanNo || '';
  const stored = getStoredPaymentType(doc._id, docNo);
  const paymentType = doc.paymentType || stored || '';
  if (paymentType === (doc.paymentType || '')) {
    return paymentType ? { ...doc, paymentType } : doc;
  }
  return { ...doc, paymentType };
}

export function mergePaymentTypeList(docs) {
  return Array.isArray(docs) ? docs.map(mergePaymentType) : [];
}
