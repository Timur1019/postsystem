SELECT si.product_name AS productName, CAST(SUM(si.quantity) AS BIGINT) AS quantitySold
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
AND s.status = 'COMPLETED'
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
GROUP BY si.product_name
ORDER BY SUM(si.quantity) DESC
LIMIT :limit
