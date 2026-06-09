import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi } from '../../../api';
import {
  EMPTY_BUSINESS_FIELD_FORM,
  EMPTY_BUSINESS_TYPE_FORM,
  fieldToForm,
  parseOptionsText,
} from '../utils/businessTypeUtils';

export function usePlatformBusinessTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [typeModal, setTypeModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_BUSINESS_FIELD_FORM);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['platform-business-types'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
  });

  const activeTypeId = selectedId ?? types[0]?.id ?? null;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['platform-business-type', activeTypeId],
    queryFn: () => platformBusinessTypeApi.get(activeTypeId).then((r) => r.data),
    enabled: !!activeTypeId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-business-types'] });
    if (activeTypeId) qc.invalidateQueries({ queryKey: ['platform-business-type', activeTypeId] });
    qc.invalidateQueries({ queryKey: ['business-config'] });
  };

  const saveTypeMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? platformBusinessTypeApi.update(payload.id, payload.body)
        : platformBusinessTypeApi.create(payload.body),
    onSuccess: (res) => {
      invalidate();
      setSelectedId(res.data.id);
      setTypeModal(null);
      toast.success(t('platform.businessTypes.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => platformBusinessTypeApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success(t('platform.businessTypes.deleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId, body }) =>
      fieldId
        ? platformBusinessTypeApi.updateField(typeId, fieldId, body)
        : platformBusinessTypeApi.addField(typeId, body),
    onSuccess: () => {
      invalidate();
      setFieldModal(null);
      toast.success(t('platform.businessTypes.fieldSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId }) => platformBusinessTypeApi.deleteField(typeId, fieldId),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.fieldDeleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const fields = useMemo(
    () => [...(detail?.fields ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [detail?.fields]
  );

  const openCreateType = () => {
    setTypeModal({ mode: 'create', form: { ...EMPTY_BUSINESS_TYPE_FORM } });
  };

  const openEditType = () => {
    if (!detail) return;
    setTypeModal({
      mode: 'edit',
      id: detail.id,
      form: {
        name: detail.name,
        description: detail.description ?? '',
        active: detail.active,
        sortOrder: detail.sortOrder,
      },
    });
  };

  const closeTypeModal = () => setTypeModal(null);

  const updateTypeForm = (patch) => {
    setTypeModal((prev) => (prev ? { ...prev, form: { ...prev.form, ...patch } } : prev));
  };

  const saveType = () => {
    if (!typeModal) return;
    saveTypeMutation.mutate({ id: typeModal.id, body: typeModal.form });
  };

  const tryDeleteType = () => {
    if (!detail) return;
    if (window.confirm(t('platform.businessTypes.deleteConfirm', { name: detail.name }))) {
      deleteTypeMutation.mutate(detail.id);
    }
  };

  const openCreateField = () => {
    setFieldForm(EMPTY_BUSINESS_FIELD_FORM);
    setFieldModal({ mode: 'create' });
  };

  const openFieldEdit = (field) => {
    setFieldForm(fieldToForm(field));
    setFieldModal({ mode: 'edit', field });
  };

  const closeFieldModal = () => setFieldModal(null);

  const updateFieldForm = (patch) => {
    setFieldForm((prev) => ({ ...prev, ...patch }));
  };

  const submitField = () => {
    const body = {
      label: fieldForm.label.trim(),
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      enabled: fieldForm.enabled,
      sortOrder: Number(fieldForm.sortOrder) || 100,
      placeholder: fieldForm.placeholder.trim() || null,
      hint: fieldForm.hint.trim() || null,
      options: fieldForm.fieldType === 'LIST' ? parseOptionsText(fieldForm.optionsText) : [],
    };
    if (fieldModal?.mode === 'edit') {
      saveFieldMutation.mutate({ typeId: activeTypeId, fieldId: fieldModal.field.id, body });
      return;
    }
    saveFieldMutation.mutate({
      typeId: activeTypeId,
      body: { ...body, fieldKey: fieldForm.fieldKey.trim().toLowerCase() },
    });
  };

  const tryDeleteField = (field) => {
    if (window.confirm(t('platform.businessTypes.deleteFieldConfirm', { name: field.label }))) {
      deleteFieldMutation.mutate({ typeId: activeTypeId, fieldId: field.id });
    }
  };

  return {
    t,
    types,
    isLoading,
    activeTypeId,
    setSelectedId,
    detail,
    detailLoading,
    fields,
    typeModal,
    openCreateType,
    openEditType,
    closeTypeModal,
    updateTypeForm,
    saveType,
    tryDeleteType,
    saveTypeMutation,
    fieldModal,
    fieldForm,
    openCreateField,
    openFieldEdit,
    closeFieldModal,
    updateFieldForm,
    submitField,
    tryDeleteField,
    saveFieldMutation,
  };
}
