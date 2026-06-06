SELECT COUNT(*) FROM (
  SELECT p.id
  FROM sale_items si
  INNER JOIN sales s ON s.id = si.sale_id
  INNER JOIN products p ON p.id = si.product_id
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
  GROUP BY p.id
  HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
     OR COALESCE(SUM(si.returned_quantity), 0) > 0
) sub
