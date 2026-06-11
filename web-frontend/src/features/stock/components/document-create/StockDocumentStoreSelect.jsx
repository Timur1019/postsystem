import { BaseSelect } from '../../../../components/ui';

export default function StockDocumentStoreSelect({
  label,
  value,
  onChange,
  stores,
  needsStorePick,
  emptyLabel,
  required,
}) {
  return (
    <BaseSelect
      label={label}
      required={required ?? needsStorePick}
      value={value}
      onChange={onChange}
      placeholder={emptyLabel}
      options={[
        { value: '', label: emptyLabel },
        ...stores.map((s) => ({ value: String(s.id), label: s.name })),
      ]}
    />
  );
}
