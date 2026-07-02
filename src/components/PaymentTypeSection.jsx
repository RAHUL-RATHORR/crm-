import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentTypeSection = ({ value, onChange, paymentTypes = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
      <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
        Payment Type
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
              Payment Type
            </label>
            <select
              name="paymentType"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold text-gray-800 outline-none cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {loading ? 'Loading payment types...' : 'Select payment type'}
              </option>
              {paymentTypes.map((pt) => (
                <option key={pt._id} value={pt.name}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && paymentTypes.length === 0 && (
          <p className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No payment types yet. Go to
            {' '}
            <button
              type="button"
              onClick={() => navigate('/payment-type')}
              className="text-amber-900 underline font-bold"
            >
              Payments
            </button>
            {' '}
            and add types (e.g. Cash, UPI, Credit).
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentTypeSection;
