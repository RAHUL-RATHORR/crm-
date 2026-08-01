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

export const formatPaperLinesForPrint = (lines = []) => {
  const entries = Array.isArray(lines) && lines.length
    ? lines
    : [];

  if (!entries.length) return '-';

  return entries
    .filter((line) => line.paper)
    .map((line) => {
      const count = Number(line.count) || 0;
      const gsm = line.paperGSM ? ` (${line.paperGSM} GSM)` : '';
      const details = line.details ? ` · ${line.details}` : '';
      const countText = count > 0 ? ` · ${count} sheets` : '';
      return `${line.paper}${gsm}${countText}${details}`;
    })
    .join('; ') || '-';
};
