package com.pos.repository.spec;

import com.pos.entity.Store;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class StoreSpecifications {

    private StoreSpecifications() {}

    public static Specification<Store> filter(String search, Integer companyId) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("name")), pattern));
            }

            if (companyId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("company").get("id"), companyId));
            }

            return predicates;
        };
    }
}
