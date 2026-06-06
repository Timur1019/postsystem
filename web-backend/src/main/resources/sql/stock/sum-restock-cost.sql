SELECT COALESCE(SUM(sm.quantity * p.cost_price), 0)
FROM stock_movements sm
INNER JOIN products p ON p.id = sm.product_id AND p.company_id = :companyId
WHERE sm.movement_type = 'RESTOCK' AND sm.quantity > 0
  AND sm.created_at >= :start AND sm.created_at < :end
  AND (:storeId IS NULL OR sm.store_id = :storeId)
