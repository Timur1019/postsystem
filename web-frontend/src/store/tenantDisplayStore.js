import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME } from '../config/brand';
import {
  syncReceiptDisplayCssVars,
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';

export {
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';

export const SYSTEM_LOGO_SIZE_DEFAULT_PX = 32;
export const SYSTEM_LOGO_SIZE_MIN_PX = 20;
export const SYSTEM_LOGO_SIZE_MAX_PX = 96;

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
      systemLogoSizePx: SYSTEM_LOGO_SIZE_DEFAULT_PX,
      systemAppName: '',

      receiptLogoDataUrl: null,
      receiptLogoMaxHeightMm: RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
      receiptCompanyName: '',
      receiptCompanyAddress: '',
      receiptStir: '',
      receiptFields: defaultFieldMap(RECEIPT_FIELD_DEFS),
      userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS),

      setSystemLogo: (dataUrl) => set({ systemLogoDataUrl: dataUrl || null }),
      clearSystemLogo: () => set({ systemLogoDataUrl: null }),
      setSystemLogoSizePx: (px) => {
        const n = Number(px);
        const clamped = Number.isFinite(n)
          ? Math.min(SYSTEM_LOGO_SIZE_MAX_PX, Math.max(SYSTEM_LOGO_SIZE_MIN_PX, Math.round(n)))
          : SYSTEM_LOGO_SIZE_DEFAULT_PX;
        set({ systemLogoSizePx: clamped });
      },
      setSystemAppName: (name) => set({ systemAppName: String(name ?? '').trim() }),

      setReceiptLogo: (dataUrl) => set({ receiptLogoDataUrl: dataUrl || null }),
      clearReceiptLogo: () => set({ receiptLogoDataUrl: null }),
      setReceiptLogoMaxHeightMm: (mm) => {
        const n = Number(mm);
        const clamped = Number.isFinite(n)
          ? Math.min(RECEIPT_LOGO_HEIGHT_MAX_MM, Math.max(RECEIPT_LOGO_HEIGHT_MIN_MM, n))
          : RECEIPT_LOGO_HEIGHT_DEFAULT_MM;
        set({ receiptLogoMaxHeightMm: clamped });
        queueMicrotask(() => syncReceiptDisplayCssVars(get()));
      },
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
      version: 3,
      migrate: (persisted, version) => {
        if (!persisted) return persisted;
        let next = persisted;
        if (version < 2) {
          next = { ...next, receiptLogoMaxHeightMm: RECEIPT_LOGO_HEIGHT_DEFAULT_MM };
        }
        if (version < 3) {
          next = { ...next, systemLogoSizePx: SYSTEM_LOGO_SIZE_DEFAULT_PX };
        }
        return next;
      },
      partialize: (s) => ({
        systemLogoDataUrl: s.systemLogoDataUrl,
        systemLogoSizePx: s.systemLogoSizePx,
        systemAppName: s.systemAppName,
        receiptLogoDataUrl: s.receiptLogoDataUrl,
        receiptLogoMaxHeightMm: s.receiptLogoMaxHeightMm,
        receiptCompanyName: s.receiptCompanyName,
        receiptCompanyAddress: s.receiptCompanyAddress,
        receiptStir: s.receiptStir,
        receiptFields: s.receiptFields,
        userFormFields: s.userFormFields,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) syncReceiptDisplayCssVars(state);
      },
    }
  )
);

useTenantDisplayStore.subscribe(() => {
  syncReceiptDisplayCssVars(useTenantDisplayStore.getState());
});
