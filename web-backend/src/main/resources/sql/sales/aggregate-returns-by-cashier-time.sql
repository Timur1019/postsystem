SELECT COUNT(*),
       COALESCE(SUM(tax_total), 0),
       COALESCE(SUM(cash_amount), 0),
       COALESCE(SUM(card_amount), 0),
       COALESCE(SUM(CASE WHEN card_type = 'HUMO' THEN card_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN card_type = 'UZCARD' THEN card_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN payment_method = 'CASHLESS' THEN total_amount ELSE 0 END), 0)
FROM sales
WHERE cashier_id = :cashierId
  AND store_id = :storeId
  AND status IN ('REFUNDED', 'VOIDED')
  AND created_at >= :periodFrom
  AND created_at < :reportAt
