SELECT COUNT(*) FROM products p
WHERE p.is_active = true
  AND p.company_id = :companyId
  AND p.stock_quantity > 0
  AND (:categoryId IS NULL OR p.category_id = :categoryId)
  AND (
    :search = ''
    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
  )
  AND NOT EXISTS (
    SELECT 1 FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    WHERE si.product_id = p.id
      AND s.status = 'COMPLETED'
      AND CAST(s.created_at AS date) > :cutoffDate
  )
