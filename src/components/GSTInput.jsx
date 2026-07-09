import React, { useRef, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

const GSTInput = ({ value = '', onChange, name, placeholder, className = '', required, disabled, ...props }) => {
  const inputRef = useRef(null);

  const valStr = String(value || '');
  const length = valStr.length;
  
  let isValid = false;
  let isInvalid = false;
  
  if (length === 15) {
    isValid = GST_REGEX.test(valStr);
    isInvalid = !isValid;
  } else if (length > 0 && valStr === 'URP') {
    isValid = true;
  } else if (length > 0 && length < 15) {
    isValid = false;
    isInvalid = false;
  }

  useEffect(() => {
    if (inputRef.current) {
      if (length > 0 && length < 15 && valStr !== 'URP') {
        inputRef.current.setCustomValidity('Please enter a valid 15-character GST number.');
      } else if (isInvalid) {
        inputRef.current.setCustomValidity('Invalid GST Number Format');
      } else {
        inputRef.current.setCustomValidity('');
      }
    }
  }, [length, isInvalid, valStr]);

  const handleChange = (e) => {
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    let rawValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (rawValue.length > 15) {
      rawValue = rawValue.slice(0, 15);
    }
    
    if (onChange) {
      onChange({
        target: {
          name: input.name,
          value: rawValue
        }
      });
    }

    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(start, end);
      }
    });
  };

  let borderClass = 'border-gray-200 focus:ring-blue-500 focus:border-blue-500';
  if (isValid && valStr !== 'URP') borderClass = 'border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50/10';
  if (isInvalid) borderClass = 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/10';

  return (
    <div className="relative w-full flex flex-col gap-1">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={valStr}
          onChange={handleChange}
          placeholder={placeholder || "URP if unregistered"}
          required={required}
          disabled={disabled}
          maxLength={15}
          className={`w-full bg-gray-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all pr-20 ${borderClass} ${className}`}
          {...props}
        />
        
        <div className="absolute right-3 flex items-center gap-2 pointer-events-none">
          {length > 0 && (
            <span className={`text-[10px] font-bold ${length === 15 ? (isValid ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
              {length}/15
            </span>
          )}
          {isValid && valStr !== 'URP' && <CheckCircle size={16} className="text-green-500" />}
          {isInvalid && <XCircle size={16} className="text-red-500" />}
        </div>
      </div>
      
      {isInvalid && (
        <span className="text-[10px] sm:text-xs text-red-500 font-medium animate-in fade-in pl-1">
          Invalid GST Number Format
        </span>
      )}
      {isValid && valStr !== 'URP' && (
        <span className="text-[10px] sm:text-xs text-green-500 font-medium animate-in fade-in pl-1">
          GST Format Valid
        </span>
      )}
    </div>
  );
};

export default GSTInput;
