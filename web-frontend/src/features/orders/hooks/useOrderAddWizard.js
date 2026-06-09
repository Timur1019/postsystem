import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { orderApi } from '../../../services/api';

const emptyForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierId: '',
});

export function useOrderAddWizard({ open, onClose, stores, onCreated }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [step, setStep] = useState('store');
  const [storeId, setStoreId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: couriers = [] } = useQuery({
    queryKey: ['order-couriers'],
    queryFn: () => orderApi.getCouriers().then((r) => r.data),
    enabled: open && step === 'details',
  });

  const createMutation = useMutation({
    mutationFn: (body) => orderApi.create(body),
    onSuccess: (res) => {
      toast.success(t('orders.wizard.createdSuccess', { id: res.data.id }));
      onCreated?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('orders.wizard.createFailed'));
    },
  });

  useEffect(() => {
    if (!open) {
      setStep('store');
      setStoreId('');
      setForm(emptyForm());
    }
  }, [open]);

  const storeName = useMemo(() => {
    const s = stores.find((x) => String(x.id) === String(storeId));
    return s?.name ?? '';
  }, [stores, storeId]);

  const canSubmit =
    storeId &&
    form.clientName.trim() &&
    form.clientPhone.trim() &&
    form.deliveryAddress.trim();

  const handleStoreNext = () => {
    if (!storeId) return;
    setStep('details');
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(t('orders.wizard.validationRequired'));
      return;
    }
    createMutation.mutate({
      storeId: Number(storeId),
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      comment: form.comment.trim() || undefined,
      courierId: form.courierId || undefined,
    });
  };

  return {
    step,
    storeId,
    setStoreId,
    form,
    setForm,
    couriers,
    storeName,
    creatorEmail: user?.email,
    canSubmit: !!canSubmit,
    submitting: createMutation.isPending,
    handleCancel: onClose,
    handleStoreNext,
    handleBack: () => setStep('store'),
    handleSubmit,
  };
}
