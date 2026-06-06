SELECT CAST(s.created_at AS date) AS day,
       COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
INNER JOIN products p ON p.id = si.product_id
WHERE s.created_at >= :start AND s.created_at < :end
  AND s.status = 'COMPLETED'
  AND s.company_id = :companyId
GROUP BY CAST(s.created_at AS date)
ORDER BY day
