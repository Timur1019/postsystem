SELECT st.id AS store_id,
       COALESCE(st.name, '') AS store_name,
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
INNER JOIN stores st ON st.id = s.store_id
WHERE s.status = 'COMPLETED'
  AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
  AND st.company_id = :companyId
GROUP BY st.id, st.name
HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
   OR COALESCE(SUM(si.returned_quantity), 0) > 0
ORDER BY revenue DESC
