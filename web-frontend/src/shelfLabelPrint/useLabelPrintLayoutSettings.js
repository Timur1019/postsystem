import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LABEL_LAYOUT, findLabelPresetByLayout, getLabelPresetById, layoutFromPreset } from './constants';
import {
  applyLabelPrintCssVars,
  constrainLabelPads,
  getSafePadMaxMm,
  loadSavedLabelLayout,
  mergeLabelLayout,
  saveLabelLayout,
} from './labelLayoutUtils';

const LabelPrintLayoutContext = createContext(null);

function useLabelPrintLayoutSettingsState() {
  const { t } = useTranslation();
  const [layout, setLayout] = useState(() => loadSavedLabelLayout() || DEFAULT_LABEL_LAYOUT);

  const maxPadXmm = useMemo(() => getSafePadMaxMm(layout.paperWmm, 14, 50), [layout.paperWmm]);
  const maxPadYmm = useMemo(() => getSafePadMaxMm(layout.paperHmm, 14, 70), [layout.paperHmm]);
  const activePreset = useMemo(() => findLabelPresetByLayout(layout), [layout]);

  const patchLayout = useCallback((patch) => {
    setLayout((prev) => mergeLabelLayout(prev, patch));
  }, []);

  const applyPreset = useCallback((preset) => {
    setLayout(
      layoutFromPreset(preset.id, {
        pageMarginMm: layout.pageMarginMm,
      })
    );
  }, [layout.pageMarginMm]);

  const resetPresetDefaults = useCallback(() => {
    const presetId = activePreset?.id || layout.presetId || DEFAULT_LABEL_LAYOUT.presetId;
    const preset = getLabelPresetById(presetId);
    if (!preset) return;
    setLayout(layoutFromPreset(preset.id));
    toast.success(
      t('usersBarcodePrint.presetDefaultsRestored', {
        defaultValue: 'Эталонные значения восстановлены',
      })
    );
  }, [activePreset?.id, layout.presetId, t]);

  useEffect(() => {
    setLayout((s) => constrainLabelPads(s));
  }, [maxPadXmm, maxPadYmm]);

  useEffect(() => {
    applyLabelPrintCssVars(layout);
    saveLabelLayout(layout);
  }, [layout]);

  return {
    layout,
    patchLayout,
    applyPreset,
    resetPresetDefaults,
    activePreset,
    maxPadXmm,
    maxPadYmm,
  };
}

/** Один экземпляр настроек на страницу печати (панель + модалка). */
export function LabelPrintLayoutProvider({ children }) {
  const value = useLabelPrintLayoutSettingsState();
  return createElement(LabelPrintLayoutContext.Provider, { value }, children);
}

/**
 * Сохранённые настройки размера и калибровки этикетки (localStorage).
 * Внутри LabelPrintLayoutProvider — общее состояние для панели и модалки.
 */
export function useLabelPrintLayoutSettings() {
  const ctx = useContext(LabelPrintLayoutContext);
  if (ctx) return ctx;
  return useLabelPrintLayoutSettingsState();
}
