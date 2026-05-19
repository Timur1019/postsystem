import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME } from '../config/brand';

/** Поля фискального чека (вкл./выкл. в настройках принтера). */
export const RECEIPT_FIELD_DEFS = [
  { key: 'logo', labelKey: 'tenantSettings.receiptFields.logo' },
  { key: 'companyName', labelKey: 'tenantSettings.receiptFields.companyName' },
  { key: 'companyAddress', labelKey: 'tenantSettings.receiptFields.companyAddress' },
  { key: 'stir', labelKey: 'tenantSettings.receiptFields.stir' },
  { key: 'dateTime', labelKey: 'tenantSettings.receiptFields.dateTime' },
  { key: 'receiptNo', labelKey: 'tenantSettings.receiptFields.receiptNo' },
  { key: 'employee', labelKey: 'tenantSettings.receiptFields.employee' },
  { key: 'shift', labelKey: 'tenantSettings.receiptFields.shift' },
  { key: 'items', labelKey: 'tenantSettings.receiptFields.items' },
  { key: 'itemIkpu', labelKey: 'tenantSettings.receiptFields.itemIkpu' },
  { key: 'itemVatLine', labelKey: 'tenantSettings.receiptFields.itemVatLine' },
  { key: 'discounts', labelKey: 'tenantSettings.receiptFields.discounts' },
  { key: 'grandTotal', labelKey: 'tenantSettings.receiptFields.grandTotal' },
  { key: 'vatTotal', labelKey: 'tenantSettings.receiptFields.vatTotal' },
  { key: 'payment', labelKey: 'tenantSettings.receiptFields.payment' },
  { key: 'fiscalBlock', labelKey: 'tenantSettings.receiptFields.fiscalBlock' },
  { key: 'qrCode', labelKey: 'tenantSettings.receiptFields.qrCode' },
  { key: 'footer', labelKey: 'tenantSettings.receiptFields.footer' },
];

/** Поля формы пользователя (кроме логина — всегда обязателен). */
export const USER_FORM_FIELD_DEFS = [
  { key: 'lastName', labelKey: 'users.lastName' },
  { key: 'firstName', labelKey: 'users.firstName' },
  { key: 'patronymic', labelKey: 'users.patronymic' },
  { key: 'email', labelKey: 'users.email' },
  { key: 'password', labelKey: 'users.password' },
  { key: 'role', labelKey: 'users.role' },
  { key: 'stores', labelKey: 'users.colStores' },
];

function defaultFieldMap(defs) {
  return Object.fromEntries(defs.map((d) => [d.key, true]));
}

export const useTenantDisplayStore = create(
  persist(
    (set, get) => ({
      systemLogoDataUrl: null,
      systemAppName: '',

      receiptLogoDataUrl: null,
      receiptCompanyName: '',
      receiptCompanyAddress: '',
      receiptStir: '',
      receiptFields: defaultFieldMap(RECEIPT_FIELD_DEFS),
      userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS),

      setSystemLogo: (dataUrl) => set({ systemLogoDataUrl: dataUrl || null }),
      clearSystemLogo: () => set({ systemLogoDataUrl: null }),
      setSystemAppName: (name) => set({ systemAppName: String(name ?? '').trim() }),

      setReceiptLogo: (dataUrl) => set({ receiptLogoDataUrl: dataUrl || null }),
      clearReceiptLogo: () => set({ receiptLogoDataUrl: null }),
      setReceiptCompanyName: (v) => set({ receiptCompanyName: String(v ?? '').trim() }),
      setReceiptCompanyAddress: (v) => set({ receiptCompanyAddress: String(v ?? '').trim() }),
      setReceiptStir: (v) => set({ receiptStir: String(v ?? '').trim() }),

      setReceiptField: (key, enabled) =>
        set((s) => ({
          receiptFields: { ...s.receiptFields, [key]: !!enabled },
        })),
      setUserFormField: (key, enabled) =>
        set((s) => ({
          userFormFields: { ...s.userFormFields, [key]: !!enabled },
        })),

      resetReceiptFields: () => set({ receiptFields: defaultFieldMap(RECEIPT_FIELD_DEFS) }),
      resetUserFormFields: () => set({ userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS) }),

      isReceiptFieldOn: (key) => get().receiptFields[key] !== false,
      isUserFormFieldOn: (key) => get().userFormFields[key] !== false,

      displayAppName: () => {
        const custom = get().systemAppName;
        return custom || APP_NAME;
      },
    }),
    {
      name: 'pos-tenant-display',
      version: 1,
      partialize: (s) => ({
        systemLogoDataUrl: s.systemLogoDataUrl,
        systemAppName: s.systemAppName,
        receiptLogoDataUrl: s.receiptLogoDataUrl,
        receiptCompanyName: s.receiptCompanyName,
        receiptCompanyAddress: s.receiptCompanyAddress,
        receiptStir: s.receiptStir,
        receiptFields: s.receiptFields,
        userFormFields: s.userFormFields,
      }),
    }
  )
);
