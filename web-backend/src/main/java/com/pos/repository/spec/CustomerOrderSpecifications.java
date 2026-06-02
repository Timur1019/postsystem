package com.pos.repository.spec;

import com.pos.entity.CustomerOrder;
import com.pos.entity.OrderStatus;
import com.pos.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CustomerOrderSpecifications {

    private CustomerOrderSpecifications() {
    }

    public static Specification<CustomerOrder> filter(
        Integer companyId,
        String search,
        String externalNumber,
        String clientName,
        String address,
        UUID courierId,
        OrderStatus status,
        Instant createdFrom,
        Instant createdToExclusive
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();

            if (companyId != null) {
                Join<CustomerOrder, com.pos.entity.Store> store = root.join("store", JoinType.INNER);
                parts.add(cb.equal(store.get("company").get("id"), companyId));
            }

            String s = search != null ? search.trim() : "";
            if (StringUtils.hasText(s)) {
                List<Predicate> or = new ArrayList<>();
                if (s.matches("\\d+")) {
                    try {
                        long id = Long.parseLong(s);
                        or.add(cb.equal(root.get("id"), id));
                    } catch (NumberFormatException ignored) {
                        // ignore
                    }
                }
                String like = "%" + s.toLowerCase() + "%";
                or.add(cb.like(cb.lower(cb.coalesce(root.get("externalNumber"), "")), like));
                or.add(cb.like(cb.lower(cb.coalesce(root.get("clientName"), "")), like));
                parts.add(cb.or(or.toArray(Predicate[]::new)));
            }

            String ext = externalNumber != null ? externalNumber.trim() : "";
            if (StringUtils.hasText(ext)) {
                parts.add(cb.like(cb.lower(cb.coalesce(root.get("externalNumber"), "")), "%" + ext.toLowerCase() + "%"));
            }

            String cn = clientName != null ? clientName.trim() : "";
            if (StringUtils.hasText(cn)) {
                parts.add(cb.like(cb.lower(cb.coalesce(root.get("clientName"), "")), "%" + cn.toLowerCase() + "%"));
            }

            String addr = address != null ? address.trim() : "";
            if (StringUtils.hasText(addr)) {
                parts.add(cb.like(cb.lower(cb.coalesce(root.get("deliveryAddress"), "")), "%" + addr.toLowerCase() + "%"));
            }

            if (courierId != null) {
                Join<CustomerOrder, User> courier = root.join("courier", JoinType.INNER);
                parts.add(cb.equal(courier.get("id"), courierId));
            }

            if (status != null) {
                parts.add(cb.equal(root.get("status"), status));
            }

            if (createdFrom != null) {
                parts.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
            }
            if (createdToExclusive != null) {
                parts.add(cb.lessThan(root.get("createdAt"), createdToExclusive));
            }

            if (parts.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
