const EDITABLE_EXPENSE_SOURCES = new Set(['MANUAL', 'SALARY']);
const EDITABLE_INCOME_SOURCES = new Set(['MANUAL']);

export function isEditableExpense(row) {
  return EDITABLE_EXPENSE_SOURCES.has(row?.sourceType);
}

export function isEditableIncome(row) {
  return EDITABLE_INCOME_SOURCES.has(row?.sourceType);
}

export function isSelectableCategory(row) {
  return !row?.system;
}

export function isSelectableAccount(row) {
  return row?.active !== false;
}
