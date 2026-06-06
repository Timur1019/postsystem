SELECT COUNT(*) FROM (
  SELECT st.id
  FROM sale_items si
  INNER JOIN sales s ON s.id = si.sale_id
  INNER JOIN stores st ON st.id = s.store_id
  WHERE s.status = 'COMPLETED'
    AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
    AND st.company_id = :companyId
  GROUP BY st.id, st.name
  HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
     OR COALESCE(SUM(si.returned_quantity), 0) > 0
) sub
