export const getBillToDetails = (jobCard, partyFallback = {}) => ({
  partyName: partyFallback.partyName || jobCard?.partyName || '',
  address: jobCard?.address || partyFallback.partyAddress || partyFallback.address || '',
  contactNo: jobCard?.contactNo || partyFallback.partyContact || partyFallback.contactNo || '',
  gstNo: jobCard?.gstNo || partyFallback.partyGst || partyFallback.partyGstin || 'URP',
  emailId: jobCard?.emailId || partyFallback.partyEmail || partyFallback.emailId || '',
});

export const getShipToDetails = (jobCard, partyFallback = {}) => {
  const billTo = getBillToDetails(jobCard, partyFallback);

  // Challan/invoice saved ship choice — when off, Shipped to matches Billed to.
  if ('useShipAddress' in partyFallback) {
    if (!partyFallback.useShipAddress) {
      return billTo;
    }
    return {
      partyName: (partyFallback.shipPartyName || '').trim() || billTo.partyName,
      address: (partyFallback.shipAddress || '').trim() || billTo.address,
      contactNo: (partyFallback.shipContactNo || '').trim() || billTo.contactNo,
      gstNo: (partyFallback.shipGstNo || '').trim() || billTo.gstNo,
      emailId: (partyFallback.shipEmailId || '').trim() || billTo.emailId,
      state: (partyFallback.shipState || '').trim() || (partyFallback.state || '').trim(),
      stateCode: (partyFallback.shipStateCode || '').trim() || (partyFallback.stateCode || '').trim(),
    };
  }

  if (!jobCard?.useShipAddress) {
    return billTo;
  }

  return {
    partyName: jobCard.shipPartyName || billTo.partyName,
    address: jobCard.shipAddress || billTo.address,
    contactNo: jobCard.shipContactNo || billTo.contactNo,
    gstNo: jobCard.shipGstNo || billTo.gstNo,
    emailId: jobCard.shipEmailId || billTo.emailId,
  };
};
