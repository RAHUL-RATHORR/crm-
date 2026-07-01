import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { filterMasterItems, findExactMasterItem } from '../utils/itemSuggestions';

const ItemDescriptionInput = ({
  value,
  onChange,
  onSelectMaster,
  masterItems = [],
  placeholder = 'Enter description...',
  required = false,
  className = 'w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm',
}) => {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative">
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
            const currentValue = inputRef.current?.value ?? value;
            const match = findExactMasterItem(masterItems, currentValue);
            if (match) onSelectMaster(match);
            setIsOpen(false);
          }, 150);
        }}
        required={required}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
};

export default ItemDescriptionInput;
