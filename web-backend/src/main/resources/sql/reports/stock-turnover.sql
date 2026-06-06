SELECT CAST(p.id AS varchar) AS product_id,
       p.name AS product_name,
       p.sku,
       COALESCE(c.name, '') AS category_name,
       (p.stock_quantity - COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.created_at >= :start
       ), 0)) AS opening_qty,
       COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.movement_type = 'RESTOCK'
             AND sm.quantity > 0 AND sm.created_at >= :start AND sm.created_at < :end
       ), 0) AS received_qty,
       COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.movement_type = 'RETURN'
             AND sm.quantity > 0 AND sm.created_at >= :start AND sm.created_at < :end
       ), 0) AS returned_qty,
       COALESCE((
           SELECT SUM(-sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.movement_type = 'SALE'
             AND sm.quantity < 0 AND sm.created_at >= :start AND sm.created_at < :end
       ), 0) AS sold_qty,
       COALESCE((
           SELECT SUM(-sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.movement_type = 'WRITE_OFF'
             AND sm.quantity < 0 AND sm.created_at >= :start AND sm.created_at < :end
       ), 0) AS write_off_qty,
       COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.movement_type = 'ADJUSTMENT'
             AND sm.created_at >= :start AND sm.created_at < :end
       ), 0) AS adjustment_qty,
       (p.stock_quantity - COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.created_at >= :end
       ), 0)) AS closing_qty,
       (p.stock_quantity - COALESCE((
           SELECT SUM(sm.quantity) FROM stock_movements sm
           WHERE sm.product_id = p.id AND sm.created_at >= :end
       ), 0)) * p.cost_price AS closing_cost
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
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
ORDER BY p.name ASC
