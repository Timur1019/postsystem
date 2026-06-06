SELECT CAST(p.id AS varchar) AS product_id,
       p.name AS product_name,
       p.sku,
       COALESCE(p.barcode, '') AS barcode,
       COALESCE(c.name, '') AS category_name,
       p.stock_quantity AS stock_qty,
       (p.stock_quantity * p.cost_price) AS stock_value,
       (
         SELECT MAX(CAST(s.created_at AS date))
         FROM sale_items si2
         INNER JOIN sales s ON s.id = si2.sale_id
         WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
       ) AS last_sale_date,
       CASE
         WHEN (
           SELECT MAX(CAST(s.created_at AS date))
           FROM sale_items si2
           INNER JOIN sales s ON s.id = si2.sale_id
           WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
         ) IS NULL THEN :daysNoSale
         ELSE GREATEST(0, :asOfDate - (
           SELECT MAX(CAST(s.created_at AS date))
           FROM sale_items si2
           INNER JOIN sales s ON s.id = si2.sale_id
           WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
         ))
       END AS days_without_sale
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
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
ORDER BY days_without_sale DESC, p.stock_quantity DESC
