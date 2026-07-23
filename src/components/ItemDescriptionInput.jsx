import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X } from 'lucide-react';
import { filterMasterItems } from '../utils/itemSuggestions';

const ItemDescriptionInput = ({
  value,
  note = '',
  onChange,
  onNoteChange,
  onSelectMaster,
  masterItems = [],
  placeholder = 'Enter description...',
  required = false,
  className = 'w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm',
}) => {
  const inputRef = useRef(null);
  const noteRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 220 });

  const suggestions = useMemo(
    () => filterMasterItems(masterItems, value),
    [masterItems, value],
  );

  const updateMenuPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
  };

  useLayoutEffect(() => {
    if (!isOpen || suggestions.length === 0) return undefined;

    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, suggestions.length, value]);

  useLayoutEffect(() => {
    if (!isNoteOpen) return undefined;
    const timer = window.setTimeout(() => noteRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isNoteOpen]);

  const handleSelect = (masterItem) => {
    onSelectMaster(masterItem);
    setIsOpen(false);
  };

  const dropdown = isOpen && suggestions.length > 0 && createPortal(
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
      style={{
        position: 'fixed',
        top: menuRect.top,
        left: menuRect.left,
        width: menuRect.width,
        zIndex: 9999,
      }}
    >
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map((item) => (
          <button
            key={item._id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(item)}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-gray-700"
          >
            <span className="font-semibold text-gray-900">{item.name}</span>
            <span className="block text-xs text-gray-400 mt-0.5">
              {item.hsn ? `HSN: ${item.hsn} · ` : ''}
              ₹{Number(item.rate || 0).toLocaleString('en-IN')} / {item.per || 'PCS'} · GST {item.gstPercent ?? 18}%
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );

  const notePopover = isNoteOpen && createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/20"
      onMouseDown={() => setIsNoteOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-4 mt-24"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-gray-800">Item Note</p>
          <button
            type="button"
            onClick={() => setIsNoteOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close note"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">Shown below the item description on print.</p>
        <textarea
          ref={noteRef}
          value={note}
          onChange={(e) => onNoteChange?.(e.target.value)}
          rows={4}
          placeholder="Enter note..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setIsNoteOpen(false)}
          className="mt-3 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="relative flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          updateMenuPosition();
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
          }, 150);
        }}
        required={required}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setIsNoteOpen(true)}
        className={`shrink-0 p-2 rounded-lg border transition-colors ${
          note?.trim()
            ? 'border-blue-300 bg-blue-50 text-blue-600'
            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
        }`}
        title="Add note (prints below description)"
        aria-label="Add item note"
      >
        <Pencil size={14} />
      </button>
      {dropdown}
      {notePopover}
    </div>
  );
};

export default ItemDescriptionInput;
