export const getBillToDetails = (jobCard, partyFallback = {}) => ({
  partyName: partyFallback.partyName || jobCard?.partyName || '',
  address: jobCard?.address || partyFallback.partyName || '',
  contactNo: jobCard?.contactNo || '',
  gstNo: jobCard?.gstNo || partyFallback.partyGstin || 'URP',
  emailId: jobCard?.emailId || '',
});

export const getShipToDetails = (jobCard, partyFallback = {}) => {
  const billTo = getBillToDetails(jobCard, partyFallback);

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
