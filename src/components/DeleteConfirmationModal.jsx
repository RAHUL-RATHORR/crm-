import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{title || "Are you sure?"}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 mb-8">
            {message || "Are you sure you want to move to trash?"}
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-8 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-md shadow-red-100 transition-all duration-200 active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
