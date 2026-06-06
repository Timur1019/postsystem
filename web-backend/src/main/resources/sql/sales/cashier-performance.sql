SELECT u.full_name AS cashierName, COALESCE(SUM(s.total_amount), 0) AS revenue
FROM sales s
INNER JOIN users u ON u.id = s.cashier_id
WHERE CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
AND s.status = 'COMPLETED'
AND s.company_id = :companyId
GROUP BY u.id, u.full_name
ORDER BY revenue DESC
