export const getChallanLineItems = (challan) => {
  if (!challan) return [];

  if (challan.items?.length) {
    return challan.items.map((item) => ({
      description: item.description || challan.jobName || '',
      descriptionNote: item.descriptionNote || '',
      hsn: item.hsn || '',
      qty: item.qty,
      rate: item.rate,
      per: String(item.per ?? '').trim() || 'PCS',
      total: Number(item.total) || Number(item.qty || 0) * Number(item.rate || 0),
      gstPercent: item.gstPercent ?? challan.gstPercent ?? 18,
      jobNumber: item.jobNumber || challan.jobNumber || '',
      challanNo: challan.challanNo || '',
    }));
  }

  return [{
    description: challan.description || challan.jobName || '',
    descriptionNote: '',
    hsn: '',
    qty: challan.qty,
    rate: challan.rate,
    per: 'PCS',
    total: Number(challan.total) || Number(challan.qty || 0) * Number(challan.rate || 0),
    gstPercent: challan.gstPercent ?? 18,
    jobNumber: challan.jobNumber || '',
    challanNo: challan.challanNo || '',
  }];
};

export const computeLineItemsTotals = (items = [], fallbackGstPercent = 18, challans = []) => {
  const subTotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

  if (challans?.length) {
    const savedGrand = challans.reduce((sum, ch) => sum + Number(ch.grandTotal ?? ch.total ?? 0), 0);
    const savedGst = challans.reduce((sum, ch) => sum + Number(ch.gstAmount ?? 0), 0);
    const savedFreight = challans.reduce((sum, ch) => sum + Number(ch.freight ?? 0), 0);
    const itemSubTotal = challans.reduce((sum, ch) => sum + Number(ch.total ?? 0), 0) || subTotal;
    if (savedGrand > 0) {
      return {
        subTotal: itemSubTotal,
        freight: savedFreight,
        gstAmount: savedGst,
        halfGst: savedGst / 2,
        grandTotal: savedGrand,
        roundOff: savedGrand - (itemSubTotal + savedFreight + savedGst),
      };
    }
  }

  const legacySubTotal = items.reduce(
    (sum, item) => sum + (Number(item.total) || Number(item.qty || 0) * Number(item.rate || 0)),
    0
  );

  const gstAmount = items.reduce((sum, item) => {
    const line = Number(item.total) || Number(item.qty || 0) * Number(item.rate || 0);
    const pct = Number(item.gstPercent ?? fallbackGstPercent);
    return sum + (line * pct) / 100;
  }, 0);

  const rawGrandTotal = legacySubTotal + gstAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;

  return {
    subTotal: legacySubTotal,
    freight: 0,
    gstAmount,
    halfGst: gstAmount / 2,
    grandTotal,
    roundOff,
  };
};

export const buildMergedChallanMeta = (challans = []) => {
  if (!challans.length) {
    return { challanLabel: '', jobRefLabel: '', date: null };
  }

  const challanLabel = challans.map((ch) => `#${ch.challanNo}`).join(', ');
  const jobRefLabel = [...new Set(challans.map((ch) => ch.jobNumber).filter(Boolean))].join(', ');
  const latestDate = challans.reduce((latest, ch) => {
    const d = new Date(ch.createdAt || ch.date);
    return !latest || d > latest ? d : latest;
  }, null);

  return { challanLabel, jobRefLabel, date: latestDate };
};
