package com.pos.repository.spec;

import com.pos.entity.Sale;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class SaleSpecifications {

    private SaleSpecifications() {
    }

    public static Specification<Sale> cashierSalesFilter(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        Instant dateFrom,
        Instant dateTo
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();

            parts.add(cb.equal(root.get("cashier").get("username"), username));

            if (shiftId != null) {
                parts.add(cb.equal(root.get("cashierShift").get("id"), shiftId));
            }
            if (excludeShiftId != null) {
                parts.add(
                    cb.or(
                        cb.isNull(root.get("cashierShift")),
                        cb.notEqual(root.get("cashierShift").get("id"), excludeShiftId)
                    )
                );
            }
            if (StringUtils.hasText(receiptNumber)) {
                String like = "%" + receiptNumber.trim().toLowerCase() + "%";
                parts.add(cb.like(cb.lower(root.get("receiptNumber")), like));
            }
            if (paymentMethod != null) {
                parts.add(cb.equal(root.get("paymentMethod"), paymentMethod));
            }
            if (status != null) {
                parts.add(cb.equal(root.get("status"), status));
            }
            if (dateFrom != null) {
                parts.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
            }
            if (dateTo != null) {
                parts.add(cb.lessThan(root.get("createdAt"), dateTo));
            }

            if (query != null) {
                query.orderBy(cb.desc(root.get("createdAt")));
            }

            return cb.and(parts.toArray(new Predicate[0]));
        };
    }
}
