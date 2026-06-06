SELECT si.product_id,
       s.store_id,
       CAST(COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS BIGINT)
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= :start AND s.created_at < :end
  AND s.status = 'COMPLETED'
  AND s.company_id = :companyId
GROUP BY si.product_id, s.store_id
