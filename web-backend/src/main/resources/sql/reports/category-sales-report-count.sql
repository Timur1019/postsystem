SELECT COUNT(*) FROM (
  SELECT c.id
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
) sub
