// Global keyboard-wedge barcode capture (USB/Bluetooth scanners act as keyboard + Enter).
import { useEffect, useRef } from 'react';

const MIN_CODE_LENGTH = 3;
const INTER_CHAR_MS = 80;
const BUFFER_RESET_MS = 200;

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(el.isContentEditable);
}

/**
 * @param {Object} opts
 * @param {boolean} opts.enabled
 * @param {(code: string) => void} opts.onScan
 * @param {React.RefObject<HTMLInputElement>} [opts.barcodeInputRef] — dedicated field; still receives focus on enable
 * @param {boolean} [opts.alwaysCapture] — capture scans even when focus is not on barcode field (POS mode)
 */
export function useBarcodeScanner({ enabled, onScan, barcodeInputRef, alwaysCapture = false }) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;
    barcodeInputRef?.current?.focus();

    let buffer = '';
    let lastCharAt = 0;
    let resetTimer = null;

    const clearBuffer = () => {
      buffer = '';
      lastCharAt = 0;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
    };

    const flush = () => {
      const code = buffer.trim();
      clearBuffer();
      if (code.length >= MIN_CODE_LENGTH) {
        onScanRef.current(code);
      }
    };

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target;
      const onDedicatedBarcode =
        barcodeInputRef?.current && target === barcodeInputRef.current;

      if (!alwaysCapture && isTypingTarget(target) && !onDedicatedBarcode) {
        return;
      }

      if (e.key === 'Enter') {
        if (buffer.length >= MIN_CODE_LENGTH) {
          e.preventDefault();
          flush();
        } else {
          clearBuffer();
        }
        return;
      }

      if (e.key.length !== 1) return;

      const now = Date.now();
      if (lastCharAt && now - lastCharAt > INTER_CHAR_MS) {
        buffer = '';
      }
      lastCharAt = now;
      buffer += e.key;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(clearBuffer, BUFFER_RESET_MS);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      clearBuffer();
    };
  }, [enabled, barcodeInputRef, alwaysCapture]);
}
