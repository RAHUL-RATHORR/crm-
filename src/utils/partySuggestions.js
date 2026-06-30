export const buildPartySuggestions = (jobCards = []) => {
  const map = new Map();

  jobCards.forEach((card) => {
    const name = (card.partyName || card.companyName || '').trim();
    if (!name) return;

    const key = name.toLowerCase();
    const cardDate = new Date(card.jobDate || card.createdAt || 0);
    const existing = map.get(key);

    if (!existing || cardDate > existing.date) {
      map.set(key, {
        partyName: name,
        address: card.address || '',
        contactNo: card.contactNo || '',
        emailId: card.emailId || '',
        gstNo: card.gstNo || '',
        jobNumber: card.jobNumber || '',
        date: cardDate,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.partyName.localeCompare(b.partyName));
};

export const partyNameExists = (partySuggestions, name) => {
  const query = (name || '').trim().toLowerCase();
  if (!query) return false;
  return partySuggestions.some((party) => party.partyName.toLowerCase() === query);
};
