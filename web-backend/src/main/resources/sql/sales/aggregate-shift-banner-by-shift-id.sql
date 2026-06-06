SELECT CAST(COUNT(*) AS INTEGER),
       COALESCE(SUM(
           CASE s.status
               WHEN 'COMPLETED' THEN s.total_amount
               WHEN 'VOIDED' THEN 0
               WHEN 'REFUNDED' THEN GREATEST(
                   0,
                   s.total_amount - COALESCE((
                       SELECT SUM(
                           CASE
                               WHEN si.quantity <= 0 THEN 0
                               WHEN si.returned_quantity >= si.quantity THEN si.line_total
                               ELSE ROUND(
                                   si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity,
                                   2
                               )
                           END
                       )
                       FROM sale_items si
                       WHERE si.sale_id = s.id
                   ), 0)
               )
               ELSE 0
           END
       ), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.tax_total ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.discount_total ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.cash_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.card_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.line_discount_total ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.order_discount_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' AND s.card_type = 'HUMO' THEN s.card_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' AND s.card_type = 'UZCARD' THEN s.card_amount ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' AND s.payment_method = 'CASHLESS' THEN s.total_amount ELSE 0 END), 0)
FROM sales s
WHERE s.cashier_shift_id = :shiftId
  AND s.created_at >= :periodFrom
  AND s.created_at < :reportAt
