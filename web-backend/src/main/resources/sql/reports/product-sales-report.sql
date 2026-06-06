SELECT CAST(p.id AS varchar) AS product_id,
       p.name AS product_name,
       p.sku,
       COALESCE(p.barcode, '') AS barcode,
       COALESCE(c.name, '') AS category_name,
       COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS net_qty,
       COALESCE(SUM(si.returned_quantity), 0) AS returned_qty,
       COALESCE(SUM(
         CASE WHEN si.quantity > 0 THEN
           si.line_total * CAST((si.quantity - si.returned_quantity) AS numeric) / si.quantity
         ELSE 0 END
       ), 0) AS revenue,
       COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
INNER JOIN products p ON p.id = si.product_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE s.status = 'COMPLETED'
  AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
  AND s.store_id = COALESCE(:storeId, s.store_id)
  AND p.company_id = :companyId
  AND (:categoryId IS NULL OR p.category_id = :categoryId)
  AND (
    :search = ''
    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
  )
GROUP BY p.id, p.name, p.sku, p.barcode, c.name
HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
   OR COALESCE(SUM(si.returned_quantity), 0) > 0
ORDER BY net_qty DESC
