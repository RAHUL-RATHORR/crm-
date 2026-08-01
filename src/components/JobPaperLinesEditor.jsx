import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { emptyPaperLine } from '../utils/jobPaperLines';

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
  const updateLine = (id, field, value) => {
    onChange(lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
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
        {lines.map((line, index) => (
          <div key={line.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="lg:col-span-4 flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1">Paper {index + 1}</label>
              <select
                value={line.paper}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'Custom') {
                    updateLine(line.id, 'paper', 'Custom');
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
                <option value="Custom">Custom Paper</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1">GSM</label>
              <input
                type="text"
                value={line.paperGSM}
                onChange={(e) => updateLine(line.id, 'paperGSM', e.target.value)}
                className="h-10 border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. 350"
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
        ))}
      </div>
    </div>
  );
};

export default JobPaperLinesEditor;
