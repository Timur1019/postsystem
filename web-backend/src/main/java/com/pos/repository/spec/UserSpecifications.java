package com.pos.repository.spec;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static LookupBuilder lookup() {
        return new LookupBuilder();
    }

    public static final class LookupBuilder {

        private Integer companyId;
        private Boolean platformOnly;
        private Boolean tenantOnly;
        private String usernameIgnoreCase;
        private String emailIgnoreCase;
        private String pinDigest;
        private String roleName;
        private Boolean activeOnly;
        private UUID excludeId;

        public LookupBuilder companyId(Integer value) {
            this.companyId = value;
            return this;
        }

        public LookupBuilder platformOnly() {
            this.platformOnly = true;
            return this;
        }

        public LookupBuilder tenantOnly() {
            this.tenantOnly = true;
            return this;
        }

        public LookupBuilder usernameIgnoreCase(String value) {
            this.usernameIgnoreCase = value;
            return this;
        }

        public LookupBuilder emailIgnoreCase(String value) {
            this.emailIgnoreCase = value;
            return this;
        }

        public LookupBuilder pinDigest(String value) {
            this.pinDigest = value;
            return this;
        }

        public LookupBuilder roleName(String value) {
            this.roleName = value;
            return this;
        }

        public LookupBuilder activeOnly() {
            this.activeOnly = true;
            return this;
        }

        public LookupBuilder excludeId(UUID value) {
            this.excludeId = value;
            return this;
        }

        public Specification<com.pos.entity.User> build() {
            if (!StringUtils.hasText(usernameIgnoreCase)
                && !StringUtils.hasText(emailIgnoreCase)
                && !StringUtils.hasText(pinDigest)
                && !StringUtils.hasText(roleName)) {
                throw new IllegalStateException("At least one lookup field is required");
            }
            return (root, query, cb) -> {
                List<Predicate> parts = new ArrayList<>();

                if (companyId != null) {
                    parts.add(cb.equal(root.get("company").get("id"), companyId));
                }
                if (Boolean.TRUE.equals(platformOnly)) {
                    parts.add(cb.isNull(root.get("company")));
                }
                if (Boolean.TRUE.equals(tenantOnly)) {
                    parts.add(cb.isNotNull(root.get("company")));
                }
                if (StringUtils.hasText(usernameIgnoreCase)) {
                    parts.add(cb.equal(
                        cb.lower(root.get("username")),
                        usernameIgnoreCase.trim().toLowerCase()
                    ));
                }
                if (StringUtils.hasText(emailIgnoreCase)) {
                    parts.add(cb.equal(
                        cb.lower(root.get("email")),
                        emailIgnoreCase.trim().toLowerCase()
                    ));
                }
                if (StringUtils.hasText(pinDigest)) {
                    parts.add(cb.equal(root.get("pinDigest"), pinDigest));
                }
                if (StringUtils.hasText(roleName)) {
                    parts.add(cb.equal(root.get("role").get("name"), roleName.trim()));
                }
                if (Boolean.TRUE.equals(activeOnly)) {
                    parts.add(cb.isTrue(root.get("isActive")));
                }
                if (excludeId != null) {
                    parts.add(cb.notEqual(root.get("id"), excludeId));
                }

                return cb.and(parts.toArray(new Predicate[0]));
            };
        }
    }
}
