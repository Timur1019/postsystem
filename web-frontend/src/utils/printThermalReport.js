// src/utils/printThermalReport.js
import { printThermalReceipt } from './printReceipt';

export async function printThermalReport() {
  return printThermalReceipt({ useModalShell: true });
}

export function waitForPrintDialogClose(timeoutMs = 120_000) {
  return new Promise((resolve) => {
    const done = () => resolve();
    window.addEventListener('afterprint', done, { once: true });
    setTimeout(done, timeoutMs);
  });
}
