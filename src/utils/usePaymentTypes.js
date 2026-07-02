import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './apiBase';

/** Payment types saved under navbar → Payments (same API as PaymentTypeManagement). */
export function usePaymentTypes() {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    return fetch(`${API_BASE_URL}/api/payment-type`)
      .then((res) => res.json())
      .then((data) => setPaymentTypes(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching payment types:', err);
        setPaymentTypes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { paymentTypes, loading, reload };
}
