SELECT COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0)
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
INNER JOIN products p ON p.id = si.product_id
WHERE s.created_at >= :start AND s.created_at < :end
  AND s.status = 'COMPLETED'
  AND (:storeId IS NULL OR s.store_id = :storeId)
  AND (
    s.company_id = :companyId
    OR (
      s.company_id IS NULL
      AND EXISTS (
        SELECT 1 FROM stores st
        WHERE st.id = s.store_id AND st.company_id = :companyId
      )
    )
  )
