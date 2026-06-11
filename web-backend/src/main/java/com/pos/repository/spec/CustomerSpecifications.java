package com.pos.repository.spec;

import com.pos.entity.Customer;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CustomerSpecifications {

    private CustomerSpecifications() {
    }

    public static Specification<Customer> filter(Integer companyId, String search) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();

            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                String like = "%" + q.toLowerCase() + "%";
                var name = cb.like(cb.lower(root.get("name")), like);
                var phone = cb.like(cb.lower(root.get("phone")), like);
                var email = cb.like(cb.lower(root.get("email")), like);
                parts.add(cb.or(name, phone, email));
            }

            return parts.isEmpty() ? cb.conjunction() : cb.and(parts.toArray(new Predicate[0]));
        };
    }
}
