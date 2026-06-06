SELECT c.id AS category_id,
       COALESCE(c.name, '') AS category_name,
       COUNT(DISTINCT s.id) AS receipt_count,
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
  AND (:storeId IS NULL OR s.store_id = :storeId)
  AND p.company_id = :companyId
GROUP BY c.id, c.name
HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
   OR COALESCE(SUM(si.returned_quantity), 0) > 0
ORDER BY revenue DESC
