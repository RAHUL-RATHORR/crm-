import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';

const ItemDetailsGuide = ({ masterItemsCount = 0 }) => {
  const navigate = useNavigate();
  const hasItems = masterItemsCount > 0;

  return (
    <div className={`mx-4 sm:mx-6 mt-4 p-4 rounded-xl border text-sm ${hasItems ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <p className="font-bold flex items-center gap-2">
            <Package size={16} />
            How Item List works with Item Details
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[13px] leading-relaxed opacity-90">
            <li>First add products in <strong>Item List</strong> (name, HSN, rate, per, GST).</li>
            <li>Then here in <strong>Item Details</strong>, type in Description to pick an item — HSN, rate, per and GST fill automatically.</li>
          </ol>
          {hasItems ? (
            <p className="text-[13px] font-semibold text-emerald-700">
              {masterItemsCount} item{masterItemsCount === 1 ? '' : 's'} ready in Item List. Start typing in Description to select.
            </p>
          ) : (
            <p className="text-[13px] font-semibold">
              No items in Item List yet. Add items first, then come back to fill Item Details.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/item-list')}
          className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            hasItems
              ? 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {hasItems ? 'Manage Item List' : 'Go to Item List'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ItemDetailsGuide;
