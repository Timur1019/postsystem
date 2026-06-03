/**
 * Тестовая продажа для «Тестовая печать» в меню Aurent.
 */
export function buildEscposTestSale() {
  return {
    id: 'escpos-test',
    receiptNumber: String(Date.now()).slice(-6),
    cashierName: 'Aurent Test',
    storeName: 'AURENT',
    createdAt: new Date().toISOString(),
    totalAmount: 1000,
    taxTotal: 107.14,
    discountTotal: 0,
    paymentMethod: 'CASH',
    amountTendered: 1000,
    changeGiven: 0,
    items: [
      {
        productName: 'Test item / Тест',
        quantity: 1,
        lineTotal: 1000,
      },
    ],
  };
}
