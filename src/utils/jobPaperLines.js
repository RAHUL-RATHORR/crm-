export const emptyPaperLine = () => ({
  id: `${Date.now()}-${Math.random()}`,
  paper: '',
  paperGSM: '',
  count: '',
  details: '',
});

export const normalizeCoverPaperLines = (editData) => {
  if (editData?.coverPaperLines?.length) {
    return editData.coverPaperLines.map((line) => ({
      id: line.id || `${Date.now()}-${Math.random()}`,
      paper: line.paper || '',
      paperGSM: line.paperGSM || '',
      count: line.count ?? '',
      details: line.details || '',
    }));
  }

  if (editData?.paper) {
    return [{
      id: 'legacy-cover',
      paper: editData.paper,
      paperGSM: editData.paperGSM || '',
      count: editData.coverPaperCount ?? '',
      details: editData.coverPaperDetails || '',
    }];
  }

  return [emptyPaperLine()];
};

export const normalizeInnerPaperLines = (editData) => {
  if (editData?.innerPaperLines?.length) {
    return editData.innerPaperLines.map((line) => ({
      id: line.id || `${Date.now()}-${Math.random()}`,
      paper: line.paper || '',
      paperGSM: line.paperGSM || '',
      count: line.count ?? '',
      details: line.details || '',
    }));
  }

  if (editData?.innerPaper) {
    return [{
      id: 'legacy-inner',
      paper: editData.innerPaper,
      paperGSM: editData.innerPaperGSM || '',
      count: editData.innerPaperCount ?? '',
      details: editData.innerPaperDetails || '',
    }];
  }

  return [emptyPaperLine()];
};

export const serializePaperLines = (lines = []) =>
  lines
    .filter((line) => line.paper)
    .map(({ paper, paperGSM, count, details }) => ({
      paper,
      paperGSM: paperGSM || '',
      count: Number(count) || 0,
      details: details || '',
    }));

export const buildLegacyPaperFields = (coverLines, innerLines) => {
  const cover = serializePaperLines(coverLines);
  const inner = serializePaperLines(innerLines);

  return {
    paper: cover[0]?.paper || '',
    paperGSM: cover[0]?.paperGSM || '',
    coverPaperCount: cover.reduce((sum, line) => sum + (Number(line.count) || 0), 0),
    coverPaperDetails: cover.map((line) => line.details).filter(Boolean).join('; ') || cover[0]?.details || '',
    innerPaper: inner[0]?.paper || '',
    innerPaperGSM: inner[0]?.paperGSM || '',
    innerPaperCount: inner.reduce((sum, line) => sum + (Number(line.count) || 0), 0),
    innerPaperDetails: inner.map((line) => line.details).filter(Boolean).join('; ') || inner[0]?.details || '',
  };
};

const hasPaperLineContent = (line) =>
  !!(line?.paper || line?.paperGSM || Number(line?.count) > 0 || line?.details);

export const getCoverPaperLinesForPrint = (card = {}) => {
  const saved = (card.coverPaperLines || []).filter(hasPaperLineContent);
  if (saved.length) return saved;
  return [{
    paper: card.paper || '',
    paperGSM: card.paperGSM || '',
    count: card.coverPaperCount,
    details: card.coverPaperDetails || '',
  }];
};

export const getInnerPaperLinesForPrint = (card = {}) => {
  const saved = (card.innerPaperLines || []).filter(hasPaperLineContent);
  if (saved.length) return saved;
  return [{
    paper: card.innerPaper || '',
    paperGSM: card.innerPaperGSM || '',
    count: card.innerPaperCount,
    details: card.innerPaperDetails || '',
  }];
};

export const formatPaperLinesForPrint = (lines = []) => {
  const formatted = (Array.isArray(lines) ? lines : [])
    .filter(hasPaperLineContent)
    .map((line) => {
      const parts = [];
      if (line.paper) parts.push(line.paper);
      if (line.paperGSM) parts.push(`${line.paperGSM} GSM`);
      const count = Number(line.count);
      if (count > 0) parts.push(`${count} sheets`);
      if (line.details) parts.push(line.details);
      return parts.join(' · ');
    })
    .filter(Boolean);

  return formatted.length ? formatted.join('; ') : '-';
};

export const formatCoverCountGsm = (card = {}) => {
  const lines = getCoverPaperLinesForPrint(card);
  const count = lines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.coverPaperCount) || 0;
  const gsm = lines.map((line) => line.paperGSM).filter(Boolean).join(', ')
    || card.paperGSM
    || '-';
  return `${count} (${gsm})`;
};

export const formatInnerCountGsm = (card = {}) => {
  const lines = getInnerPaperLinesForPrint(card);
  const count = lines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.innerPaperCount) || 0;
  const gsm = lines.map((line) => line.paperGSM).filter(Boolean).join(', ')
    || card.innerPaperGSM
    || '-';
  return `${count} (${gsm})`;
};
