package com.pos.repository.stock.impl;

import com.pos.entity.StockMovement;
import jakarta.persistence.EntityGraph;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

@Component
@RequiredArgsConstructor
public class StockMovementJpaQueryExecutor {

    private final EntityManager entityManager;

    public Page<StockMovement> fetchPage(
        String jpql,
        String countJpql,
        Consumer<TypedQuery<?>> bindParams,
        Pageable pageable
    ) {
        return fetchPage(jpql, countJpql, bindParams, pageable, null);
    }

    public Page<StockMovement> fetchPage(
        String jpql,
        String countJpql,
        Consumer<TypedQuery<?>> bindParams,
        Pageable pageable,
        Consumer<EntityGraph<StockMovement>> graphSetup
    ) {
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        bindParams.accept(countQuery);
        Long total = countQuery.getSingleResult();
        if (total == null || total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        TypedQuery<StockMovement> query = entityManager.createQuery(jpql, StockMovement.class);
        bindParams.accept(query);
        if (graphSetup != null) {
            EntityGraph<StockMovement> graph = entityManager.createEntityGraph(StockMovement.class);
            graphSetup.accept(graph);
            query.setHint("jakarta.persistence.fetchgraph", graph);
        }
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        return new PageImpl<>(query.getResultList(), pageable, total);
    }
}
