SELECT COUNT(*),
       COALESCE(SUM(total_amount), 0),
       COALESCE(SUM(tax_total), 0),
       COALESCE(SUM(discount_total), 0),
       COALESCE(SUM(cash_amount), 0),
       COALESCE(SUM(card_amount), 0),
       MIN(receipt_number),
       MAX(receipt_number)
FROM sales
WHERE cashier_shift_id = :shiftId
  AND status = 'COMPLETED'
  AND created_at >= :periodFrom
  AND created_at < :reportAt
