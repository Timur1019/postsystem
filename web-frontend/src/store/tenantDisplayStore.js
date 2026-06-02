import { create } from 'zustand';
import { APP_NAME } from '../config/brand';
import { tenantDisplayApi } from '../services/api';
import {
  syncReceiptDisplayCssVars,
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';
import {
  applyPrintSettingsFromPayload,
  printSettingsToPayload,
  isPrintDirtySuppressed,
} from '../utils/tenantDisplaySync';
import { usePrintSettingsStore } from './printSettingsStore';

export {
  RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../utils/syncReceiptDisplayCssVars';

export const SYSTEM_LOGO_SIZE_DEFAULT_PX = 32;
export const SYSTEM_LOGO_SIZE_MIN_PX = 20;
export const SYSTEM_LOGO_SIZE_MAX_PX = 96;

const LEGACY_STORAGE_KEY = 'pos-tenant-display';

/** Поля фискального чека (вкл./выкл. в настройках принтера). */
export const RECEIPT_FIELD_DEFS = [
  { key: 'logo', labelKey: 'tenantSettings.receiptFields.logo' },
  { key: 'companyName', labelKey: 'tenantSettings.receiptFields.companyName' },
  { key: 'companyAddress', labelKey: 'tenantSettings.receiptFields.companyAddress' },
  { key: 'companyPhone', labelKey: 'tenantSettings.receiptFields.companyPhone' },
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

function emptyDisplayState() {
  return {
    systemLogoDataUrl: null,
    systemLogoSizePx: SYSTEM_LOGO_SIZE_DEFAULT_PX,
    systemAppName: '',
    receiptLogoDataUrl: null,
    receiptLogoMaxHeightMm: RECEIPT_LOGO_HEIGHT_DEFAULT_MM,
    receiptCompanyName: '',
    receiptCompanyAddress: '',
    receiptCompanyPhone: '',
    receiptStir: '',
    receiptFields: defaultFieldMap(RECEIPT_FIELD_DEFS),
    userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS),
  };
}

function mergeFieldMap(defs, saved) {
  const base = defaultFieldMap(defs);
  if (!saved || typeof saved !== 'object') return base;
  for (const d of defs) {
    if (typeof saved[d.key] === 'boolean') base[d.key] = saved[d.key];
  }
  return base;
}

function payloadToDisplay(payload) {
  const p = payload ?? {};
  return {
    systemLogoDataUrl: p.systemLogoDataUrl || null,
    systemLogoSizePx: clampLogoSize(p.systemLogoSizePx),
    systemAppName: String(p.systemAppName ?? '').trim(),
    receiptLogoDataUrl: p.receiptLogoDataUrl || null,
    receiptLogoMaxHeightMm: clampLogoHeightMm(p.receiptLogoMaxHeightMm),
    receiptCompanyName: String(p.receiptCompanyName ?? '').trim(),
    receiptCompanyAddress: String(p.receiptCompanyAddress ?? '').trim(),
    receiptCompanyPhone: String(p.receiptCompanyPhone ?? '').trim(),
    receiptStir: String(p.receiptStir ?? '').trim(),
    receiptFields: mergeFieldMap(RECEIPT_FIELD_DEFS, p.receiptFields),
    userFormFields: mergeFieldMap(USER_FORM_FIELD_DEFS, p.userFormFields),
  };
}

function displayToPayload(display) {
  const d = display ?? emptyDisplayState();
  return {
    systemLogoDataUrl: d.systemLogoDataUrl,
    systemLogoSizePx: d.systemLogoSizePx,
    systemAppName: d.systemAppName || null,
    receiptLogoDataUrl: d.receiptLogoDataUrl,
    receiptLogoMaxHeightMm: d.receiptLogoMaxHeightMm,
    receiptCompanyName: d.receiptCompanyName || null,
    receiptCompanyAddress: d.receiptCompanyAddress || null,
    receiptCompanyPhone: d.receiptCompanyPhone || null,
    receiptStir: d.receiptStir || null,
    receiptFields: d.receiptFields,
    userFormFields: d.userFormFields,
    printSettings: printSettingsToPayload(),
  };
}

function isPayloadEmpty(payload) {
  if (!payload || typeof payload !== 'object') return true;
  const keys = [
    'systemLogoDataUrl',
    'systemAppName',
    'receiptLogoDataUrl',
    'receiptCompanyName',
    'receiptCompanyAddress',
    'receiptCompanyPhone',
    'receiptStir',
  ];
  return !keys.some((k) => {
    const v = payload[k];
    return v != null && String(v).trim() !== '';
  });
}

function readLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

function readLegacyPrintSettings() {
  try {
    const raw = localStorage.getItem('pos-print-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

function clampLogoSize(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return SYSTEM_LOGO_SIZE_DEFAULT_PX;
  return Math.min(SYSTEM_LOGO_SIZE_MAX_PX, Math.max(SYSTEM_LOGO_SIZE_MIN_PX, Math.round(n)));
}

function clampLogoHeightMm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return RECEIPT_LOGO_HEIGHT_DEFAULT_MM;
  return Math.min(RECEIPT_LOGO_HEIGHT_MAX_MM, Math.max(RECEIPT_LOGO_HEIGHT_MIN_MM, n));
}

function patchDraft(set, patch) {
  set((s) => ({
    draft: { ...s.draft, ...patch },
    isDirty: true,
  }));
}

export const useTenantDisplayStore = create((set, get) => ({
  committed: emptyDisplayState(),
  draft: emptyDisplayState(),
  isDirty: false,
  isLoading: false,
  isSaving: false,

  displayAppName: () => {
    const custom = get().committed.systemAppName;
    return custom || APP_NAME;
  },

  isReceiptFieldOn: (key) => get().committed.receiptFields[key] !== false,
  isUserFormFieldOn: (key) => get().committed.userFormFields[key] !== false,

  setSystemLogo: (dataUrl) => patchDraft(set, { systemLogoDataUrl: dataUrl || null }),
  clearSystemLogo: () => patchDraft(set, { systemLogoDataUrl: null }),
  setSystemLogoSizePx: (px) => patchDraft(set, { systemLogoSizePx: clampLogoSize(px) }),
  setSystemAppName: (name) => patchDraft(set, { systemAppName: String(name ?? '').trim() }),

  setReceiptLogo: (dataUrl) => patchDraft(set, { receiptLogoDataUrl: dataUrl || null }),
  clearReceiptLogo: () => patchDraft(set, { receiptLogoDataUrl: null }),
  setReceiptLogoMaxHeightMm: (mm) => {
    const clamped = clampLogoHeightMm(mm);
    patchDraft(set, { receiptLogoMaxHeightMm: clamped });
    queueMicrotask(() => syncReceiptDisplayCssVars({ ...get().draft, receiptLogoMaxHeightMm: clamped }));
  },
  setReceiptCompanyName: (v) => patchDraft(set, { receiptCompanyName: String(v ?? '').trim() }),
  setReceiptCompanyAddress: (v) => patchDraft(set, { receiptCompanyAddress: String(v ?? '').trim() }),
  setReceiptCompanyPhone: (v) => patchDraft(set, { receiptCompanyPhone: String(v ?? '').trim() }),
  setReceiptStir: (v) => patchDraft(set, { receiptStir: String(v ?? '').trim() }),

  setReceiptField: (key, enabled) =>
    set((s) => ({
      draft: {
        ...s.draft,
        receiptFields: { ...s.draft.receiptFields, [key]: !!enabled },
      },
      isDirty: true,
    })),
  setUserFormField: (key, enabled) =>
    set((s) => ({
      draft: {
        ...s.draft,
        userFormFields: { ...s.draft.userFormFields, [key]: !!enabled },
      },
      isDirty: true,
    })),

  resetReceiptFields: () =>
    patchDraft(set, { receiptFields: defaultFieldMap(RECEIPT_FIELD_DEFS) }),
  resetUserFormFields: () =>
    patchDraft(set, { userFormFields: defaultFieldMap(USER_FORM_FIELD_DEFS) }),

  applyDraftToCommitted: () => {
    const { draft } = get();
    set({ committed: { ...draft }, isDirty: false });
    syncReceiptDisplayCssVars(draft);
  },

  discardDraft: () => {
    const { committed } = get();
    set({ draft: { ...committed }, isDirty: false });
    syncReceiptDisplayCssVars(committed);
  },

  resetSession: () => {
    const empty = emptyDisplayState();
    set({
      committed: empty,
      draft: empty,
      isDirty: false,
      isLoading: false,
      isSaving: false,
    });
    syncReceiptDisplayCssVars(empty);
  },

  hydrateFromPayload: (payload) => {
    const display = payloadToDisplay(payload);
    set({
      draft: display,
      committed: display,
      isDirty: false,
    });
    syncReceiptDisplayCssVars(display);
    applyPrintSettingsFromPayload(payload?.printSettings);
  },

  fetchFromServer: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { data } = await tenantDisplayApi.get();
      if (isPayloadEmpty(data)) {
        const legacy = readLegacyLocalStorage();
        if (legacy) {
          const legacyDisplay = payloadToDisplay(legacy);
          get().hydrateFromPayload({
            ...displayToPayload(legacyDisplay),
            printSettings: readLegacyPrintSettings(),
          });
          try {
            await get().saveToServer();
          } catch {
            /* migration best-effort */
          }
          return;
        }
      }
      get().hydrateFromPayload(data);
    } catch {
      /* offline / not migrated yet — keep local defaults */
    } finally {
      set({ isLoading: false });
    }
  },

  saveToServer: async () => {
    if (get().isSaving) return;
    set({ isSaving: true });
    try {
      const body = displayToPayload(get().draft);
      const { data } = await tenantDisplayApi.save(body);
      get().hydrateFromPayload(data);
    } finally {
      set({ isSaving: false });
    }
  },
}));

useTenantDisplayStore.subscribe((state, prev) => {
  if (state.committed.receiptLogoMaxHeightMm !== prev.committed.receiptLogoMaxHeightMm) {
    syncReceiptDisplayCssVars(state.committed);
  }
});

usePrintSettingsStore.subscribe(() => {
  if (isPrintDirtySuppressed()) return;
  const { isLoading } = useTenantDisplayStore.getState();
  if (isLoading) return;
  useTenantDisplayStore.setState({ isDirty: true });
});
