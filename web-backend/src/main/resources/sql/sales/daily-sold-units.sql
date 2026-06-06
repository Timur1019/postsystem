SELECT CAST(s.created_at AS date) AS day,
       COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS sold_units
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= :start AND s.created_at < :end
  AND s.status = 'COMPLETED'
  AND (:storeId IS NULL OR s.store_id = :storeId)
  AND s.company_id = :companyId
GROUP BY CAST(s.created_at AS date)
ORDER BY day
