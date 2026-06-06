SELECT COUNT(*),
       COALESCE(SUM(tax_total), 0),
       COALESCE(SUM(cash_amount), 0),
       COALESCE(SUM(card_amount), 0)
FROM sales
WHERE cashier_shift_id = :shiftId
  AND status IN ('REFUNDED', 'VOIDED')
  AND created_at >= :periodFrom
  AND created_at < :reportAt
