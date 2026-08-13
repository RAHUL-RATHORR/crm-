export const emptyPaperLine = () => ({
  id: `${Date.now()}-${Math.random()}`,
  paper: '',
  paperGSM: '',
  count: '',
  details: '',
});

const text = (value) => String(value ?? '').trim();

const hasPaperLineContent = (line) =>
  !!(text(line?.paper) || text(line?.paperGSM) || Number(line?.count) > 0 || text(line?.details));

const toPaperLine = (line = {}, fallback = {}) => ({
  paper: text(line.paper || fallback.paper),
  paperGSM: text(line.paperGSM || fallback.paperGSM),
  count: line.count ?? fallback.count ?? '',
  details: text(line.details || fallback.details),
});

export const normalizeCoverPaperLines = (editData) => {
  const saved = (editData?.coverPaperLines || []).filter(hasPaperLineContent);
  if (saved.length) {
    return saved.map((line) => ({
      id: line.id || line._id || `${Date.now()}-${Math.random()}`,
      ...toPaperLine(line, {
        paper: editData?.paper,
        paperGSM: editData?.paperGSM,
        count: editData?.coverPaperCount,
        details: editData?.coverPaperDetails,
      }),
    }));
  }

  if (editData?.paper || editData?.paperGSM || Number(editData?.coverPaperCount) > 0 || editData?.coverPaperDetails) {
    return [{
      id: 'legacy-cover',
      paper: editData.paper || '',
      paperGSM: editData.paperGSM || '',
      count: editData.coverPaperCount ?? '',
      details: editData.coverPaperDetails || editData.paperSize || '',
    }];
  }

  return [emptyPaperLine()];
};

export const normalizeInnerPaperLines = (editData) => {
  const saved = (editData?.innerPaperLines || []).filter(hasPaperLineContent);
  if (saved.length) {
    return saved.map((line) => ({
      id: line.id || line._id || `${Date.now()}-${Math.random()}`,
      ...toPaperLine(line, {
        paper: editData?.innerPaper,
        paperGSM: editData?.innerPaperGSM,
        count: editData?.innerPaperCount,
        details: editData?.innerPaperDetails,
      }),
    }));
  }

  if (editData?.innerPaper || editData?.innerPaperGSM || Number(editData?.innerPaperCount) > 0 || editData?.innerPaperDetails) {
    return [{
      id: 'legacy-inner',
      paper: editData.innerPaper || '',
      paperGSM: editData.innerPaperGSM || '',
      count: editData.innerPaperCount ?? '',
      details: editData.innerPaperDetails || '',
    }];
  }

  return [emptyPaperLine()];
};

export const serializePaperLines = (lines = []) =>
  lines
    .filter(hasPaperLineContent)
    .map(({ paper, paperGSM, count, details }) => ({
      paper: text(paper),
      paperGSM: text(paperGSM),
      count: Number(count) || 0,
      details: text(details),
    }));

export const buildLegacyPaperFields = (coverLines, innerLines) => {
  const cover = serializePaperLines(coverLines);
  const inner = serializePaperLines(innerLines);

  return {
    paper: cover.map((line) => line.paper).filter(Boolean).join(', ') || '',
    paperGSM: cover.map((line) => line.paperGSM).filter(Boolean).join(', ') || '',
    coverPaperCount: cover.reduce((sum, line) => sum + (Number(line.count) || 0), 0),
    coverPaperDetails: cover.map((line) => line.details).filter(Boolean).join('; ') || '',
    innerPaper: inner.map((line) => line.paper).filter(Boolean).join(', ') || '',
    innerPaperGSM: inner.map((line) => line.paperGSM).filter(Boolean).join(', ') || '',
    innerPaperCount: inner.reduce((sum, line) => sum + (Number(line.count) || 0), 0),
    innerPaperDetails: inner.map((line) => line.details).filter(Boolean).join('; ') || '',
  };
};

const collectCoverLines = (card = {}) => {
  const saved = (card.coverPaperLines || []).filter(hasPaperLineContent).map((line) => toPaperLine(line));
  const legacy = toPaperLine({
    paper: card.paper,
    paperGSM: card.paperGSM,
    count: card.coverPaperCount,
    details: card.coverPaperDetails || card.paperSize || card.paperFrom,
  });
  const merged = [...saved];
  if (hasPaperLineContent(legacy) && !saved.some((line) =>
    line.paper === legacy.paper && line.paperGSM === legacy.paperGSM && String(line.count) === String(legacy.count)
  )) {
    merged.push(legacy);
  }
  return merged.filter(hasPaperLineContent);
};

const collectInnerLines = (card = {}) => {
  const saved = (card.innerPaperLines || []).filter(hasPaperLineContent).map((line) => toPaperLine(line));
  const legacy = toPaperLine({
    paper: card.innerPaper,
    paperGSM: card.innerPaperGSM,
    count: card.innerPaperCount,
    details: card.innerPaperDetails,
  });
  const merged = [...saved];
  if (hasPaperLineContent(legacy) && !saved.some((line) =>
    line.paper === legacy.paper && line.paperGSM === legacy.paperGSM && String(line.count) === String(legacy.count)
  )) {
    merged.push(legacy);
  }
  return merged.filter(hasPaperLineContent);
};

export const getCoverPaperLinesForPrint = (card = {}) => collectCoverLines(card);
export const getInnerPaperLinesForPrint = (card = {}) => collectInnerLines(card);

export const formatPaperLinesForPrint = (lines = []) => {
  const formatted = (Array.isArray(lines) ? lines : [])
    .filter(hasPaperLineContent)
    .map((line) => {
      const parts = [];
      if (text(line.paper)) parts.push(text(line.paper));
      if (text(line.paperGSM)) parts.push(`${text(line.paperGSM)} GSM`);
      const count = Number(line.count);
      if (count > 0) parts.push(`${count} sheets`);
      if (text(line.details)) parts.push(text(line.details));
      return parts.join(' · ');
    })
    .filter(Boolean);

  return formatted.length ? formatted.join('; ') : '-';
};

export const formatCoverCountGsm = (card = {}) => {
  const lines = collectCoverLines(card);
  const count = lines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.coverPaperCount)
    || 0;
  const gsm = lines.map((line) => text(line.paperGSM)).filter(Boolean).join(', ')
    || text(card.paperGSM)
    || '-';
  return `${count} (${gsm})`;
};

export const formatInnerCountGsm = (card = {}) => {
  const lines = collectInnerLines(card);
  const count = lines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.innerPaperCount)
    || 0;
  const gsm = lines.map((line) => text(line.paperGSM)).filter(Boolean).join(', ')
    || text(card.innerPaperGSM)
    || '-';
  return `${count} (${gsm})`;
};

export const formatCoverDetails = (card = {}) =>
  text(card.coverPaperDetails)
  || collectCoverLines(card).map((line) => text(line.details)).filter(Boolean).join('; ')
  || text(card.paperSize)
  || '-';

export const formatInnerDetails = (card = {}) =>
  text(card.innerPaperDetails)
  || collectInnerLines(card).map((line) => text(line.details)).filter(Boolean).join('; ')
  || '-';

const displayPaperName = (value) => {
  const name = text(value);
  if (!name || name === 'Custom') return '';
  return name;
};

export const formatCoverPaperName = (card = {}) =>
  collectCoverLines(card).map((line) => displayPaperName(line.paper)).filter(Boolean).join(', ')
  || displayPaperName(card.paper)
  || '-';

export const formatInnerPaperName = (card = {}) =>
  collectInnerLines(card).map((line) => displayPaperName(line.paper)).filter(Boolean).join(', ')
  || displayPaperName(card.innerPaper)
  || '-';

/** Always-visible Paper & Stock rows for job card print (old + new cards). */
export const buildPaperStockPrintRows = (card = {}) => {
  const coverLines = collectCoverLines(card);
  const innerLines = collectInnerLines(card);

  const coverName = coverLines.map((line) => displayPaperName(line.paper)).filter(Boolean).join(', ')
    || displayPaperName(card.paper)
    || '-';
  const coverGsm = coverLines.map((line) => text(line.paperGSM)).filter(Boolean).join(', ')
    || text(card.paperGSM)
    || '-';
  const coverCount = coverLines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.coverPaperCount)
    || 0;
  const coverDetails = text(card.coverPaperDetails)
    || coverLines.map((line) => text(line.details)).filter(Boolean).join('; ')
    || text(card.paperSize)
    || text(card.paperFrom)
    || '-';

  const innerName = innerLines.map((line) => displayPaperName(line.paper)).filter(Boolean).join(', ')
    || displayPaperName(card.innerPaper)
    || '-';
  const innerGsm = innerLines.map((line) => text(line.paperGSM)).filter(Boolean).join(', ')
    || text(card.innerPaperGSM)
    || '-';
  const innerCount = innerLines.reduce((sum, line) => sum + (Number(line.count) || 0), 0)
    || Number(card.innerPaperCount)
    || 0;
  const innerDetails = text(card.innerPaperDetails)
    || innerLines.map((line) => text(line.details)).filter(Boolean).join('; ')
    || '-';

  const coverExtra = coverLines.length > 1
    ? formatPaperLinesForPrint(coverLines)
    : '';
  const innerExtra = innerLines.length > 1
    ? formatPaperLinesForPrint(innerLines)
    : '';

  const rows = [
    ['Cover Paper', coverName],
    ['Cover Count / GSM', `${coverCount} (${coverGsm})`],
    ['Cover Details', coverDetails],
    ['Inner Paper', innerName],
    ['Inner Count / GSM', `${innerCount} (${innerGsm})`],
    ['Inner Details', innerDetails],
  ];

  if (coverExtra && coverExtra !== '-') {
    rows.splice(3, 0, ['Cover Papers', coverExtra]);
  }
  if (innerExtra && innerExtra !== '-') {
    rows.push(['Inner Papers', innerExtra]);
  }

  return rows;
};

