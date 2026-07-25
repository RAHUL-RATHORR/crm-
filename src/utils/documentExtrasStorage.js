import { mergePaymentType } from './paymentTypeStorage';
import { mergeItemNotes } from './itemNoteStorage';

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
    freight: extras.freight != null ? Number(extras.freight) || 0 : 0,
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
    freight: Number(doc.freight) > 0 ? Number(doc.freight) : (Number(stored.freight) || Number(doc.freight) || 0),
  };
}

export function mergeDocumentExtrasList(docs) {
  return Array.isArray(docs) ? docs.map(mergeDocumentExtras) : [];
}

export function mergePrintDoc(base, printDoc) {
  if (!base) return printDoc;
  if (!printDoc) return base;

  const mergedItems = (base.items || printDoc.items || []).map((item, index) => {
    const printItem = printDoc.items?.[index];
    return {
      ...item,
      descriptionNote: printItem?.descriptionNote || item.descriptionNote || '',
      hsn: printItem?.hsn || item.hsn || '',
      per: printItem?.per || item.per || '',
    };
  });

  return {
    ...base,
    paymentType: base.paymentType || printDoc.paymentType || '',
    vehicleNo: base.vehicleNo || printDoc.vehicleNo || '',
    state: base.state || printDoc.state || '',
    stateCode: base.stateCode || printDoc.stateCode || '',
    freight: Number(base.freight) > 0 ? Number(base.freight) : (Number(printDoc.freight) || Number(base.freight) || 0),
    items: mergedItems.length ? mergedItems : (base.items || printDoc.items),
  };
}

export function mergeDocumentForPrint(doc) {
  return mergeItemNotes(mergeDocumentExtras(mergePaymentType(doc)));
}

export function mergeDocumentForPrintList(docs) {
  return Array.isArray(docs) ? docs.map(mergeDocumentForPrint) : [];
}
