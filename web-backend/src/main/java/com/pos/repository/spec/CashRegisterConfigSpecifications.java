package com.pos.repository.spec;

import com.pos.entity.CashRegister;
import com.pos.entity.CashRegisterConfig;
import com.pos.entity.Store;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CashRegisterConfigSpecifications {

    private CashRegisterConfigSpecifications() {
    }

    public static Specification<CashRegisterConfig> filter(String nameSearch, Integer storeId, String equipmentSerial) {
        return (root, query, cb) -> {
            if (Long.class != query.getResultType() && Integer.class != query.getResultType()) {
                query.distinct(true);
            }
            List<Predicate> parts = new ArrayList<>();

            if (StringUtils.hasText(nameSearch)) {
                String q = "%" + nameSearch.trim().toLowerCase() + "%";
                parts.add(cb.like(cb.lower(root.get("name")), q));
            }

            if (storeId != null) {
                Join<CashRegisterConfig, Store> sj = root.join("stores", JoinType.INNER);
                parts.add(cb.equal(sj.get("id"), storeId));
            }

            if (StringUtils.hasText(equipmentSerial)) {
                Join<CashRegisterConfig, CashRegister> rj = root.join("registers", JoinType.INNER);
                parts.add(cb.equal(rj.get("equipmentSerial"), equipmentSerial.trim()));
            }

            if (parts.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
