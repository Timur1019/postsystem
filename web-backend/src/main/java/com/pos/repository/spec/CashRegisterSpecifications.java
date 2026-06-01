package com.pos.repository.spec;

import com.pos.entity.CashRegister;
import com.pos.entity.Store;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CashRegisterSpecifications {

    private CashRegisterSpecifications() {
    }

    /**
     * @param storeSearch поиск по названию магазина (верхняя строка)
     * @param equipmentModel / equipmentSerial / fiscalCardId — из панели фильтров
     */
    public static Specification<CashRegister> filter(
        Integer companyId,
        String storeSearch,
        String equipmentModel,
        String equipmentSerial,
        String fiscalCardId
    ) {
        return (root, query, cb) -> {
            Join<CashRegister, Store> store = root.join("store", JoinType.INNER);
            List<Predicate> parts = new ArrayList<>();

            parts.add(cb.isTrue(store.get("active")));
            parts.add(cb.isNotNull(store.get("company")));
            parts.add(TenantSpecifications.storeCompanyEqualsPredicate(store, cb, companyId));

            String s = storeSearch != null ? storeSearch.trim() : "";
            if (StringUtils.hasText(s)) {
                parts.add(cb.like(cb.lower(store.get("name")), "%" + s.toLowerCase() + "%"));
            }

            String m = equipmentModel != null ? equipmentModel.trim() : "";
            if (StringUtils.hasText(m)) {
                parts.add(cb.like(cb.lower(root.get("equipmentModel")), "%" + m.toLowerCase() + "%"));
            }

            String ser = equipmentSerial != null ? equipmentSerial.trim() : "";
            if (StringUtils.hasText(ser)) {
                parts.add(cb.like(cb.lower(root.get("equipmentSerial")), "%" + ser.toLowerCase() + "%"));
            }

            String f = fiscalCardId != null ? fiscalCardId.trim() : "";
            if (StringUtils.hasText(f)) {
                parts.add(cb.like(cb.lower(root.get("fiscalCardId")), "%" + f.toLowerCase() + "%"));
            }

            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
