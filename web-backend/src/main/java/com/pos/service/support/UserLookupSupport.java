package com.pos.service.support;

import com.pos.entity.User;
import com.pos.repository.UserRepository;
import com.pos.repository.spec.UserSpecifications;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserLookupSupport {

    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public Optional<User> findOne(UserSpecifications.LookupBuilder lookup) {
        return userRepository.findAll(lookup.build(), PageRequest.of(0, 1))
            .stream()
            .findFirst();
    }

    public boolean exists(UserSpecifications.LookupBuilder lookup) {
        return findOne(lookup).isPresent();
    }

    public Optional<User> findOneWithDetails(UserSpecifications.LookupBuilder lookup) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);
        root.fetch("role", JoinType.INNER);
        root.fetch("company", JoinType.LEFT);
        root.fetch("stores", JoinType.LEFT);
        cq.select(root).distinct(true);
        cq.where(lookup.build().toPredicate(root, cq, cb));

        TypedQuery<User> query = entityManager.createQuery(cq);
        query.setMaxResults(1);
        List<User> results = query.getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
}
