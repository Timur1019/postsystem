import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../../../api/category.api';
import { BaseButton, BaseModal } from '../../../../components/ui';

export default function CategoryDeleteModal({ category, onClose }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => categoryApi.delete(category.id),
    onSuccess: () => {
      toast.success(t('categories.deleted'));
      qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message ?? t('categories.deleteFailed'));
    },
  });

  return (
    <BaseModal
      title={t('categories.deleteTitle')}
      onClose={onClose}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton variant="danger" disabled={isPending} onClick={() => mutate()}>
            {t('categories.rowDelete')}
          </BaseButton>
        </>
      )}
    >
      <p className="text-sm text-slate-700 dark:text-slate-200">
        {t('categories.deleteHint', { name: category.name })}
      </p>
    </BaseModal>
  );
}
