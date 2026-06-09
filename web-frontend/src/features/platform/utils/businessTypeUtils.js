export const BUSINESS_TYPE_FIELD_TYPES = ['TEXT', 'NUMBER', 'PRICE', 'DATE', 'BOOLEAN', 'LIST'];

export const EMPTY_BUSINESS_FIELD_FORM = {
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

export const EMPTY_BUSINESS_TYPE_FORM = {
  code: '',
  name: '',
  description: '',
  active: true,
  sortOrder: 100,
};

export function parseOptionsText(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [value, label] = line.includes('|') ? line.split('|').map((s) => s.trim()) : [line, line];
      return { value, label, sortOrder: (index + 1) * 10 };
    });
}

export function optionsToText(options = []) {
  return options.map((o) => (o.label === o.value ? o.value : `${o.value}|${o.label}`)).join('\n');
}

export function fieldToForm(field) {
  return {
    fieldKey: field.fieldKey,
    label: field.label,
    fieldType: field.fieldType,
    required: field.required,
    enabled: field.enabled,
    sortOrder: field.sortOrder,
    placeholder: field.placeholder ?? '',
    hint: field.hint ?? '',
    optionsText: optionsToText(field.options),
  };
}
