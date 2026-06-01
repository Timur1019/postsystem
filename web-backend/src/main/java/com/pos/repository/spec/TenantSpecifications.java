package com.pos.repository.spec;

import com.pos.entity.Store;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public final class TenantSpecifications {

    private TenantSpecifications() {
    }

    public static <T> Specification<T> storeCompanyEquals(Join<T, Store> storeJoin, Integer companyId) {
        if (companyId == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.equal(storeJoin.get("company").get("id"), companyId);
    }

    public static Predicate storeCompanyEqualsPredicate(
        Join<?, Store> storeJoin,
        jakarta.persistence.criteria.CriteriaBuilder cb,
        Integer companyId
    ) {
        if (companyId == null) {
            return cb.conjunction();
        }
        return cb.equal(storeJoin.get("company").get("id"), companyId);
    }
}
