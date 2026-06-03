/**
 * Оркестратор автопечати: продажа → store → очередь → render → print.
 * UI-страницы не участвуют в цепочке печати.
 */
import toast from 'react-hot-toast';
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_TOAST } from '../../config/receiptPrintConfig';
import {
  destroyBodyPrintMount,
  isAutoPrintInFlight,
  setAutoPrintInFlight,
} from '../../utils/autoPrintMount';
import { cleanupDesktopPrintState, isDesktopCashier } from '../../utils/printReceipt';
import {
  assertPrintShellReadyForIpc,
  sleep,
  waitForBodyPrintImagesReady,
  waitForDoubleAnimationFrame,
  waitForPrintShellDomReady,
  waitForPrintShellQrReady,
} from '../../utils/receiptPrintWait';
import { resolveAutoPrintToastMessage } from './autoPrintErrors';
import * as electronPrinter from './ElectronPrinterAdapter';
import * as printQueue from './PrintQueue';
import * as receiptRenderer from './ReceiptRenderer';
import * as receiptStore from './ReceiptStore';

let toastT = (key, opts) => opts?.defaultValue ?? key;

export function setAutoPrintTranslator(t) {
  toastT = t;
}

export function subscribePreview(listener) {
  return receiptStore.subscribeReceiptStore(listener);
}

export function getPreviewReceiptNumber() {
  return receiptStore.getSnapshot().previewReceiptNumber;
}

export function enqueueReceipt(sale) {
  const receiptNumber = receiptStore.putReceipt(sale);
  if (!receiptNumber) return null;
  printQueue.enqueue(receiptNumber);
  receiptStore.pruneOldReceipts();
  return receiptNumber;
}

export { isAutoPrintInFlight };

async function processPrintJob(receiptNumber) {
  const record = receiptStore.getReceipt(receiptNumber);
  if (!record?.sale) return;

  setAutoPrintInFlight(true);
  receiptStore.updateStatus(receiptNumber, 'rendering');

  try {
    receiptRenderer.renderToPrintHost(record.sale);
    receiptStore.setPreviewReceipt(receiptNumber);

    await waitForDoubleAnimationFrame();
    await waitForPrintShellDomReady();
    await waitForPrintShellQrReady(RECEIPT_AUTO_PRINT_UI.qrWaitMaxMs, { required: true });
    await receiptRenderer.showScreenPreviewFromPrintShell();
    await waitForDoubleAnimationFrame();
    await sleep(RECEIPT_AUTO_PRINT_UI.beforePrintSettleMs);

    receiptStore.updateStatus(receiptNumber, 'ready');
    await waitForDoubleAnimationFrame();
    await waitForBodyPrintImagesReady();
    assertPrintShellReadyForIpc();
    receiptStore.updateStatus(receiptNumber, 'printing');

    const mode = await electronPrinter.printReceipt();

    receiptStore.updateStatus(receiptNumber, 'done');

    if (mode === 'silent' || mode === 'dialog') {
      toast.success(
        toastT('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }),
        {
          id: RECEIPT_PRINT_TOAST.toastId,
          duration: RECEIPT_PRINT_TOAST.successDurationMs,
        },
      );
    }
  } catch (err) {
    console.warn('[Aurent] auto print job failed', receiptNumber, err);
    receiptStore.updateStatus(receiptNumber, 'failed', err?.message);
    const msg = resolveAutoPrintToastMessage(err, toastT);
    const showDesktopHint =
      isDesktopCashier() &&
      electronPrinter.isSilentPrintAvailable() &&
      !/принтер чека|Aurent/i.test(msg);
    toast.error(
      showDesktopHint
        ? `${msg} ${toastT('pos.printFailedDesktopHint', {
            defaultValue: 'Aurent → «Принтер чека».',
          })}`
        : msg,
      {
        id: RECEIPT_PRINT_TOAST.toastId,
        duration: RECEIPT_PRINT_TOAST.errorDurationMs,
      },
    );
  } finally {
    await sleep(RECEIPT_AUTO_PRINT_UI.previewHoldAfterPrintMs);
    receiptRenderer.teardownRenderer();
    receiptStore.clearPreview();
    cleanupDesktopPrintState();
    receiptStore.removeReceipt(receiptNumber);
    setAutoPrintInFlight(false);
  }
}

printQueue.setPrintJobHandler(processPrintJob);

export function resetAutoPrintSession() {
  printQueue.clearQueue();
  setAutoPrintInFlight(false);
  receiptRenderer.teardownRenderer();
  receiptStore.clearPreview();
  destroyBodyPrintMount({ force: true });
}
