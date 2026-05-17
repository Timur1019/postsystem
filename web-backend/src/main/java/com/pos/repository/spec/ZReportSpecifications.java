package com.pos.repository.spec;

import com.pos.entity.ZReport;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class ZReportSpecifications {

    private ZReportSpecifications() {
    }

    public static Specification<ZReport> filter(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        Instant closedFrom,
        Instant closedTo
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();

            String emp = employeeSearch != null ? employeeSearch.trim() : "";
            if (StringUtils.hasText(emp)) {
                parts.add(cb.like(cb.lower(root.get("employeeName")), "%" + emp.toLowerCase() + "%"));
            }

            String fiscal = fiscalCardId != null ? fiscalCardId.trim() : "";
            if (StringUtils.hasText(fiscal)) {
                parts.add(cb.like(cb.lower(root.get("fiscalCardId")), "%" + fiscal.toLowerCase() + "%"));
            }

            String term = terminalSerial != null ? terminalSerial.trim() : "";
            if (StringUtils.hasText(term)) {
                parts.add(cb.like(cb.lower(root.get("terminalSerial")), "%" + term.toLowerCase() + "%"));
            }

            if (storeId != null) {
                parts.add(cb.equal(root.get("store").get("id"), storeId));
            }

            if (closedFrom != null) {
                parts.add(cb.greaterThanOrEqualTo(root.get("closedAt"), closedFrom));
            }
            if (closedTo != null) {
                parts.add(cb.lessThanOrEqualTo(root.get("closedAt"), closedTo));
            }

            if (parts.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
