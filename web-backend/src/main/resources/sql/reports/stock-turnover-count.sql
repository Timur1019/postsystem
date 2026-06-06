SELECT COUNT(*) FROM products p
WHERE p.is_active = true
  AND p.company_id = :companyId
  AND (:categoryId IS NULL OR p.category_id = :categoryId)
  AND (
    :search = ''
    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
  )
  AND (
    EXISTS (
      SELECT 1 FROM stock_movements sm2
      WHERE sm2.product_id = p.id AND sm2.created_at >= :start AND sm2.created_at < :end
    )
    OR p.stock_quantity <> 0
  )
