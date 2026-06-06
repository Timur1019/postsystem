SELECT CAST(sm.created_at AS date) AS day,
       COALESCE(SUM(CASE WHEN sm.movement_type = 'RESTOCK' AND sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0) AS received_units,
       COALESCE(SUM(CASE WHEN sm.movement_type = 'WRITE_OFF' AND sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0) AS write_off_units
FROM stock_movements sm
INNER JOIN products p ON p.id = sm.product_id AND p.company_id = :companyId
WHERE sm.created_at >= :start AND sm.created_at < :end
  AND sm.store_id = COALESCE(:storeId, sm.store_id)
GROUP BY CAST(sm.created_at AS date)
ORDER BY day
