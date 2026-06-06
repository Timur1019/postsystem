SELECT CAST(s.created_at AS date) AS day,
       COALESCE(SUM(s.total_amount), 0) AS revenue,
       COUNT(*) AS tx_count
FROM sales s
WHERE s.created_at >= :start AND s.created_at < :end
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
GROUP BY CAST(s.created_at AS date)
ORDER BY day
