/**
 * FIFO-очередь заданий печати (один job за раз).
 */

/** @typedef {(receiptNumber: string) => Promise<void>} PrintJobHandler */

const queue = [];
let draining = false;
/** @type {PrintJobHandler|null} */
let handler = null;

export function setPrintJobHandler(fn) {
  handler = fn;
}

export function enqueue(receiptNumber) {
  if (!receiptNumber) return;
  if (!queue.includes(receiptNumber)) {
    queue.push(receiptNumber);
  }
  void drain();
}

export function getQueueLength() {
  return queue.length;
}

export function isDraining() {
  return draining;
}

async function drain() {
  if (draining || !handler) return;
  draining = true;
  try {
    while (queue.length > 0) {
      const receiptNumber = queue.shift();
      if (!receiptNumber) continue;
      await handler(receiptNumber);
    }
  } finally {
    draining = false;
    if (queue.length > 0) {
      void drain();
    }
  }
}

export function clearQueue() {
  queue.length = 0;
}
