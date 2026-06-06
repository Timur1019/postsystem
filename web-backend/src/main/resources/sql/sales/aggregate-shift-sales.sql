SELECT COUNT(*),
       COALESCE(SUM(total_amount), 0),
       COALESCE(SUM(tax_total), 0),
       COALESCE(SUM(discount_total), 0),
       COALESCE(SUM(cash_amount), 0),
       COALESCE(SUM(card_amount), 0)
FROM sales
WHERE cashier_id = :cashierId
  AND store_id = :storeId
  AND status = 'COMPLETED'
  AND created_at >= :from
  AND created_at < :to
