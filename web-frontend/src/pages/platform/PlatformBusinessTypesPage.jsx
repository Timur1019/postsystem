import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Layers, Plus, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { platformBusinessTypeApi } from '../../services/api';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

const FIELD_TYPES = ['TEXT', 'NUMBER', 'PRICE', 'DATE', 'BOOLEAN', 'LIST'];

const emptyFieldForm = {
  fieldKey: '',
  label: '',
  fieldType: 'TEXT',
  required: false,
  enabled: true,
  sortOrder: 100,
  placeholder: '',
  hint: '',
  optionsText: '',
};

function parseOptionsText(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [value, label] = line.includes('|') ? line.split('|').map((s) => s.trim()) : [line, line];
      return { value, label, sortOrder: (index + 1) * 10 };
    });
}

function optionsToText(options = []) {
  return options.map((o) => (o.label === o.value ? o.value : `${o.value}|${o.label}`)).join('\n');
}

export default function PlatformBusinessTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [typeModal, setTypeModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);

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

  const openFieldEdit = (field) => {
    setFieldForm({
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      enabled: field.enabled,
      sortOrder: field.sortOrder,
      placeholder: field.placeholder ?? '',
      hint: field.hint ?? '',
      optionsText: optionsToText(field.options),
    });
    setFieldModal({ mode: 'edit', field });
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('platform.businessTypes.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('platform.businessTypes.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setTypeModal({ mode: 'create', form: { code: '', name: '', description: '', active: true, sortOrder: 100 } })}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          <Plus size={16} />
          {t('platform.businessTypes.addType')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
            {t('platform.businessTypes.typesList')}
          </div>
          <div className="max-h-[520px] overflow-y-auto p-2">
            {isLoading ? (
              <p className="px-2 py-4 text-sm text-slate-500">{t('common.loading')}</p>
            ) : types.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedId(type.id)}
                className={`mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeTypeId === type.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Layers size={16} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block font-medium">{type.name}</span>
                  <span className={`text-xs ${activeTypeId === type.id ? 'text-emerald-50' : 'text-slate-500'}`}>
                    {type.code} · {type.fieldsCount}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {!detail ? (
            <p className="p-6 text-sm text-slate-500">{t('platform.businessTypes.selectType')}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{detail.name}</h2>
                  <p className="text-sm text-slate-500">{detail.code}</p>
                  {detail.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{detail.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTypeModal({
                      mode: 'edit',
                      id: detail.id,
                      form: {
                        name: detail.name,
                        description: detail.description ?? '',
                        active: detail.active,
                        sortOrder: detail.sortOrder,
                      },
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-600"
                  >
                    {t('common.edit')}
                  </button>
                  {detail.code !== 'UNIVERSAL' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t('platform.businessTypes.deleteConfirm', { name: detail.name }))) {
                          deleteTypeMutation.mutate(detail.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-300"
                    >
                      <Trash2 size={14} />
                      {t('common.delete')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('platform.businessTypes.fieldsTitle')}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFieldForm(emptyFieldForm);
                    setFieldModal({ mode: 'create' });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  <Plus size={14} />
                  {t('platform.businessTypes.addField')}
                </button>
              </div>

              <div className="overflow-x-auto px-2 pb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2">{t('platform.businessTypes.colLabel')}</th>
                      <th className="px-2 py-2">{t('platform.businessTypes.colKey')}</th>
                      <th className="px-2 py-2">{t('platform.businessTypes.colType')}</th>
                      <th className="px-2 py-2">{t('platform.businessTypes.colRequired')}</th>
                      <th className="px-2 py-2">{t('platform.businessTypes.colEnabled')}</th>
                      <th className="px-2 py-2 text-right">{t('categories.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {detailLoading ? (
                      <tr><td colSpan={6} className="px-2 py-6 text-center text-slate-500">{t('common.loading')}</td></tr>
                    ) : fields.length === 0 ? (
                      <tr><td colSpan={6} className="px-2 py-6 text-center text-slate-500">{t('platform.businessTypes.noFields')}</td></tr>
                    ) : fields.map((field) => (
                      <tr key={field.id}>
                        <td className="px-2 py-2 font-medium">{field.label}</td>
                        <td className="px-2 py-2 font-mono text-xs text-slate-500">{field.fieldKey}</td>
                        <td className="px-2 py-2">{field.fieldType}</td>
                        <td className="px-2 py-2">{field.required ? t('common.yes') : t('common.no')}</td>
                        <td className="px-2 py-2">{field.enabled ? t('common.yes') : t('common.no')}</td>
                        <td className="px-2 py-2 text-right">
                          <button type="button" onClick={() => openFieldEdit(field)} className="mr-2 text-xs text-emerald-600">{t('common.edit')}</button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t('platform.businessTypes.deleteFieldConfirm', { name: field.label }))) {
                                deleteFieldMutation.mutate({ typeId: activeTypeId, fieldId: field.id });
                              }
                            }}
                            className="text-xs text-red-600"
                          >
                            {t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {typeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">{typeModal.mode === 'create' ? t('platform.businessTypes.addType') : t('common.edit')}</h2>
            <div className="space-y-3">
              {typeModal.mode === 'create' ? (
                <input
                  className={inputCls}
                  placeholder={t('platform.businessTypes.codePh')}
                  value={typeModal.form.code}
                  onChange={(e) => setTypeModal({ ...typeModal, form: { ...typeModal.form, code: e.target.value.toUpperCase() } })}
                />
              ) : null}
              <input
                className={inputCls}
                placeholder={t('platform.businessTypes.namePh')}
                value={typeModal.form.name}
                onChange={(e) => setTypeModal({ ...typeModal, form: { ...typeModal.form, name: e.target.value } })}
              />
              <textarea
                className={inputCls}
                rows={3}
                placeholder={t('platform.businessTypes.descriptionPh')}
                value={typeModal.form.description}
                onChange={(e) => setTypeModal({ ...typeModal, form: { ...typeModal.form, description: e.target.value } })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={typeModal.form.active}
                  onChange={(e) => setTypeModal({ ...typeModal, form: { ...typeModal.form, active: e.target.checked } })}
                />
                {t('platform.businessTypes.active')}
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setTypeModal(null)} className="rounded-lg px-4 py-2 text-sm">{t('common.cancel')}</button>
              <button
                type="button"
                onClick={() => saveTypeMutation.mutate({
                  id: typeModal.id,
                  body: typeModal.form,
                })}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <Save size={14} />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fieldModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">
              {fieldModal.mode === 'create' ? t('platform.businessTypes.addField') : t('common.edit')}
            </h2>
            <div className="space-y-3">
              {fieldModal.mode === 'create' ? (
                <input
                  className={inputCls}
                  placeholder={t('platform.businessTypes.fieldKeyPh')}
                  value={fieldForm.fieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })}
                />
              ) : null}
              <input className={inputCls} placeholder={t('platform.businessTypes.fieldLabelPh')} value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} />
              <select className={inputCls} value={fieldForm.fieldType} onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}>
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={fieldForm.required} onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} />{t('platform.businessTypes.required')}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={fieldForm.enabled} onChange={(e) => setFieldForm({ ...fieldForm, enabled: e.target.checked })} />{fieldForm.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}{t('platform.businessTypes.enabled')}</label>
              </div>
              <input className={inputCls} type="number" placeholder={t('platform.businessTypes.sortPh')} value={fieldForm.sortOrder} onChange={(e) => setFieldForm({ ...fieldForm, sortOrder: e.target.value })} />
              <input className={inputCls} placeholder={t('platform.businessTypes.placeholderPh')} value={fieldForm.placeholder} onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })} />
              {fieldForm.fieldType === 'LIST' ? (
                <textarea
                  className={inputCls}
                  rows={4}
                  placeholder={t('platform.businessTypes.optionsPh')}
                  value={fieldForm.optionsText}
                  onChange={(e) => setFieldForm({ ...fieldForm, optionsText: e.target.value })}
                />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setFieldModal(null)} className="rounded-lg px-4 py-2 text-sm">{t('common.cancel')}</button>
              <button type="button" onClick={submitField} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">{t('common.save')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
