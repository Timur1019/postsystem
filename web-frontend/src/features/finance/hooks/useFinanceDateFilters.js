import { useState } from 'react';

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useFinanceDateFilters({ withCategory = false, withPaymentMethod = false } = {}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setCategoryId('');
    setPaymentMethod('');
  };

  const queryParams = {
    from: from || undefined,
    to: to || undefined,
    categoryId: withCategory && categoryId ? categoryId : undefined,
    paymentMethod: withPaymentMethod && paymentMethod ? paymentMethod : undefined,
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    categoryId,
    setCategoryId,
    paymentMethod,
    setPaymentMethod,
    resetFilters,
    queryParams,
    defaultMonthRange: { from: monthStartIso(), to: todayIso() },
  };
}
