SELECT s.store_id,
       COALESCE(st.name, '—') AS store_name,
       COALESCE(SUM(s.total_amount), 0) AS revenue,
       COUNT(*) AS checks
FROM sales s
LEFT JOIN stores st ON st.id = s.store_id
WHERE s.created_at >= :start
  AND s.created_at < :end
  AND s.status = 'COMPLETED'
  AND s.company_id = :companyId
GROUP BY s.store_id, st.name
ORDER BY revenue DESC
