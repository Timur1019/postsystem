-- One-time alignment: products.stock_quantity = sum(store_stock) per company.
-- Run manually on existing deployments if totals diverged before StoreStockService unification.
UPDATE products p
SET stock_quantity = COALESCE(
    (
        SELECT SUM(ss.quantity)
        FROM store_stock ss
        INNER JOIN stores s ON s.id = ss.store_id
        WHERE ss.product_id = p.id
          AND s.company_id = p.company_id
    ),
    0
)
WHERE p.company_id IS NOT NULL;
