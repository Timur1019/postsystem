package com.pos.repository.spec;

import com.pos.entity.Supplier;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

public final class SupplierSpecifications {

    private SupplierSpecifications() {
    }

    public static Specification<Supplier> filter(Integer companyId, String search, LocalDate createdOn) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();

            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                String like = "%" + q.toLowerCase() + "%";
                var name = cb.like(cb.lower(root.get("name")), like);
                var tax = cb.like(cb.lower(root.get("taxId")), like);
                parts.add(cb.or(name, tax));
            }

            if (createdOn != null) {
                ZoneId z = ZoneId.systemDefault();
                Instant start = createdOn.atStartOfDay(z).toInstant();
                Instant end = createdOn.plusDays(1).atStartOfDay(z).toInstant();
                parts.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
                parts.add(cb.lessThan(root.get("createdAt"), end));
            }

            return parts.isEmpty() ? cb.conjunction() : cb.and(parts.toArray(new Predicate[0]));
        };
    }
}
