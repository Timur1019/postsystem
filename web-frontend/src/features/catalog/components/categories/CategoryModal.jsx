import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../../../api/category.api';
import { BaseButton, BaseInput, BaseModal } from '../../../../components/ui';

export default function CategoryModal({ category, onClose, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!category;

  const schema = z.object({
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name, description: category.description ?? '' });
    } else {
      reset({ name: '', description: '' });
    }
  }, [category, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? categoryApi.update(category.id, data) : categoryApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEdit ? t('categories.updated') : t('categories.created'));
      onSaved?.();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message
          ?? (isEdit ? t('categories.updateFailed') : t('categories.createFailed'))
      ),
  });

  return (
    <BaseModal
      title={isEdit ? t('categories.modalTitleEdit') : t('categories.modalTitle')}
      onClose={onClose}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="submit"
            form="category-form"
            disabled={isPending}
          >
            {isPending ? t('common.loading') : isEdit ? t('categories.save') : t('categories.create')}
          </BaseButton>
        </>
      )}
    >
      <form
        id="category-form"
        onSubmit={handleSubmit((d) => mutate(d))}
        className="space-y-4"
      >
        <BaseInput
          label={`${t('categories.name')} *`}
          placeholder={t('categories.namePh')}
          error={errors.name?.message}
          {...register('name')}
        />
        <BaseInput
          as="textarea"
          label={t('categories.description')}
          placeholder={t('categories.descPh')}
          rows={3}
          {...register('description')}
        />
      </form>
    </BaseModal>
  );
}
