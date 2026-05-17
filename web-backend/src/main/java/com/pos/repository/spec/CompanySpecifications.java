package com.pos.repository.spec;

import com.pos.entity.Company;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class CompanySpecifications {

    private CompanySpecifications() {}

    public static Specification<Company> filter(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) {
                return cb.conjunction();
            }
            String pattern = "%" + search.trim().toLowerCase() + "%";
            return cb.like(cb.lower(root.get("name")), pattern);
        };
    }
}
