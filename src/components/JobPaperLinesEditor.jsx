import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { emptyPaperLine } from '../utils/jobPaperLines';

const text = (value) => String(value ?? '').trim();

const JobPaperLinesEditor = ({
  title,
  lines,
  onChange,
  stocks = [],
  getPaperLabel,
  getPaperGsm,
  getPaperDetails,
  formatOption,
}) => {
  const stockLabels = stocks.map((stock) => getPaperLabel(stock)).filter(Boolean);

  const isStockPaper = (paper) => stockLabels.includes(paper);

  const isCustomLine = (line) => {
    const paper = text(line.paper);
    if (!paper || paper === 'Custom') return true;
    return !isStockPaper(paper);
  };

  const selectValueFor = (line) => {
    const paper = text(line.paper);
    if (isStockPaper(paper)) return paper;
    if (paper || text(line.paperGSM) || Number(line.count) > 0 || text(line.details)) {
      return 'Custom';
    }
    return '';
  };

  const customNameFor = (line) => {
    const paper = text(line.paper);
    if (!paper || paper === 'Custom') return '';
    if (isStockPaper(paper)) return '';
    return paper;
  };

  const updateLine = (id, field, value) => {
    onChange(lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  };

  const updateCustomName = (id, value) => {
    onChange(lines.map((line) => {
      if (line.id !== id) return line;
      const name = text(value);
      return { ...line, paper: name || 'Custom' };
    }));
  };

  const selectStock = (id, stock) => {
    onChange(lines.map((line) => {
      if (line.id !== id) return line;
      return {
        ...line,
        paper: getPaperLabel(stock),
        paperGSM: getPaperGsm(stock) || '',
        details: getPaperDetails(stock) || line.details,
      };
    }));
  };

  const addLine = () => onChange([...lines, emptyPaperLine()]);

  const removeLine = (id) => {
    if (lines.length <= 1) {
      onChange([emptyPaperLine()]);
      return;
    }
    onChange(lines.filter((line) => line.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">{title}</h4>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800"
        >
          <Plus size={14} />
          Add Paper
        </button>
      </div>

      <div className="space-y-3">
        {lines.map((line, index) => {
          const selectValue = selectValueFor(line);
          const showCustomFields = isCustomLine(line) || selectValue === 'Custom';

          return (
            <div key={line.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70">
              <div className="lg:col-span-4 flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Paper {index + 1}</label>
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'Custom') {
                      onChange(lines.map((entry) => (
                        entry.id === line.id
                          ? { ...entry, paper: entry.paper && !isStockPaper(entry.paper) ? entry.paper : 'Custom' }
                          : entry
                      )));
                      return;
                    }
                    if (!value) {
                      updateLine(line.id, 'paper', '');
                      return;
                    }
                    const stock = stocks.find((item) => getPaperLabel(item) === value);
                    if (stock) {
                      selectStock(line.id, stock);
                      return;
                    }
                    updateLine(line.id, 'paper', value);
                  }}
                  className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Choose Paper</option>
                  {stocks.map((stock) => (
                    <option key={stock._id} value={getPaperLabel(stock)}>
                      {formatOption(stock)}
                    </option>
                  ))}
                  <option value="Custom">Custom Paper (no stock)</option>
                </select>
              </div>

              {showCustomFields && (
                <div className="lg:col-span-4 flex flex-col sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1">Custom Paper Name</label>
                  <input
                    type="text"
                    value={customNameFor(line)}
                    onChange={(e) => updateCustomName(line.id, e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Type paper name (optional)"
                  />
                </div>
              )}

              <div className="lg:col-span-2 flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">GSM</label>
                <input
                  type="text"
                  value={line.paperGSM}
                  onChange={(e) => updateLine(line.id, 'paperGSM', e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. 350 / 58 GSM"
                />
              </div>

              <div className="lg:col-span-2 flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Count</label>
                <input
                  type="number"
                  min="0"
                  value={line.count}
                  onChange={(e) => updateLine(line.id, 'count', e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="0"
                />
              </div>

              <div className="lg:col-span-3 flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Details</label>
                <input
                  type="text"
                  value={line.details}
                  onChange={(e) => updateLine(line.id, 'details', e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Size, type, note"
                />
              </div>

              <div className="lg:col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                  aria-label="Remove paper line"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 font-medium px-1">
        Stock paper deducts inventory. Custom paper saves on the job card for print only — no stock needed.
      </p>
    </div>
  );
};

export default JobPaperLinesEditor;
