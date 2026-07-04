import { mergePaymentType } from './paymentTypeStorage';

const STORAGE_KEY = 'crm_doc_extras';

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

function storageKeys(id, docNo) {
  const keys = [];
  if (id) keys.push(`id:${id}`);
  if (docNo) keys.push(`no:${docNo}`);
  return keys;
}

export function getStoredDocumentExtras(id, docNo) {
  const map = readMap();
  for (const key of storageKeys(id, docNo)) {
    if (map[key]) return map[key];
  }
  return null;
}

export function setStoredDocumentExtras(id, docNo, extras = {}) {
  const map = readMap();
  const value = {
    vehicleNo: extras.vehicleNo != null ? String(extras.vehicleNo) : '',
    state: extras.state != null ? String(extras.state) : '',
    stateCode: extras.stateCode != null ? String(extras.stateCode) : '',
  };
  storageKeys(id, docNo).forEach((key) => {
    map[key] = value;
  });
  writeMap(map);
}

export function removeStoredDocumentExtras(id, docNo) {
  const map = readMap();
  storageKeys(id, docNo).forEach((key) => {
    delete map[key];
  });
  writeMap(map);
}

/** Prefer API value; fall back to locally stored extras for print/edit. */
export function mergeDocumentExtras(doc) {
  if (!doc) return doc;
  const docNo = doc.invoiceNumber || doc.challanNo || '';
  const stored = getStoredDocumentExtras(doc._id, docNo);
  if (!stored) return doc;

  return {
    ...doc,
    vehicleNo: doc.vehicleNo || stored.vehicleNo || '',
    state: doc.state || stored.state || '',
    stateCode: doc.stateCode || stored.stateCode || '',
  };
}

export function mergeDocumentExtrasList(docs) {
  return Array.isArray(docs) ? docs.map(mergeDocumentExtras) : [];
}

export function mergePrintDoc(base, printDoc) {
  if (!base) return printDoc;
  if (!printDoc) return base;
  return {
    ...base,
    paymentType: base.paymentType || printDoc.paymentType || '',
    vehicleNo: base.vehicleNo || printDoc.vehicleNo || '',
    state: base.state || printDoc.state || '',
    stateCode: base.stateCode || printDoc.stateCode || '',
  };
}

export function mergeDocumentForPrint(doc) {
  return mergeDocumentExtras(mergePaymentType(doc));
}

export function mergeDocumentForPrintList(docs) {
  return Array.isArray(docs) ? docs.map(mergeDocumentForPrint) : [];
}
