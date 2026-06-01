package com.pos.repository.spec;

import com.pos.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.entity.ZReport;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class CashTransferSpecifications {

    private CashTransferSpecifications() {
    }

    public static Specification<ZReport> filter(
        Integer companyId,
        String storeSearch,
        Integer registerNumber,
        Instant closedFrom,
        Instant closedTo
    ) {
        return (root, query, cb) -> {
            if (Long.class != query.getResultType() && Integer.class != query.getResultType()) {
                query.distinct(true);
            }
            List<Predicate> parts = new ArrayList<>();
            Join<ZReport, Store> store = root.join("store");

            parts.add(TenantSpecifications.storeCompanyEqualsPredicate(store, cb, companyId));

            if (StringUtils.hasText(storeSearch)) {
                String q = "%" + storeSearch.trim().toLowerCase() + "%";
                parts.add(cb.like(cb.lower(store.get("name")), q));
            }

            if (closedFrom != null) {
                parts.add(cb.greaterThanOrEqualTo(root.get("closedAt"), closedFrom));
            }
            if (closedTo != null) {
                parts.add(cb.lessThanOrEqualTo(root.get("closedAt"), closedTo));
            }

            if (registerNumber != null) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<CashRegister> cr = sq.from(CashRegister.class);
                sq.select(cb.literal(1L));
                Predicate sameStore = cb.equal(cr.get("store").get("id"), root.get("store").get("id"));
                Predicate sameReg = cb.equal(cr.get("registerNumber"), registerNumber);
                Predicate fiscalPair = cb.and(
                    cb.isNotNull(cr.get("fiscalCardId")),
                    cb.notEqual(cr.get("fiscalCardId"), ""),
                    cb.isNotNull(root.get("fiscalCardId")),
                    cb.notEqual(root.get("fiscalCardId"), ""),
                    cb.equal(cr.get("fiscalCardId"), root.get("fiscalCardId"))
                );
                Predicate serialPair = cb.and(
                    cb.isNotNull(cr.get("equipmentSerial")),
                    cb.notEqual(cr.get("equipmentSerial"), ""),
                    cb.isNotNull(root.get("terminalSerial")),
                    cb.notEqual(root.get("terminalSerial"), ""),
                    cb.equal(cr.get("equipmentSerial"), root.get("terminalSerial"))
                );
                sq.where(sameStore, sameReg, cb.or(fiscalPair, serialPair));
                parts.add(cb.exists(sq));
            }

            if (parts.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
