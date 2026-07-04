import { useEffect, useRef } from 'react';
import { mergeSavedMasterItem, upsertMasterItemFromLine } from '../utils/masterItemAutoSave';

export function useMasterItemsAutoSave(items, masterItems, setMasterItems, apiBaseUrl, delayMs = 1200) {
  const masterItemsRef = useRef(masterItems);
  const timerRef = useRef(null);

  useEffect(() => {
    masterItemsRef.current = masterItems;
  }, [masterItems]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const rows = Array.isArray(items) ? items : [];
      let latestMasterItems = masterItemsRef.current;

      for (const row of rows) {
        const saved = await upsertMasterItemFromLine(apiBaseUrl, row, latestMasterItems);
        if (saved) {
          latestMasterItems = mergeSavedMasterItem(latestMasterItems, saved);
        }
      }

      if (latestMasterItems !== masterItemsRef.current) {
        masterItemsRef.current = latestMasterItems;
        setMasterItems(latestMasterItems);
      }
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, apiBaseUrl, setMasterItems, delayMs]);
}
