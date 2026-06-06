package com.pos.repository.sale.impl;

import com.pos.entity.Sale;
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
class SaleJpaQueryExecutor {

    private final EntityManager entityManager;

    Page<Sale> fetchPage(
        String jpql,
        String countJpql,
        Consumer<TypedQuery<?>> bindParams,
        Pageable pageable
    ) {
        return fetchPage(jpql, countJpql, bindParams, pageable, null);
    }

    Page<Sale> fetchPage(
        String jpql,
        String countJpql,
        Consumer<TypedQuery<?>> bindParams,
        Pageable pageable,
        Consumer<EntityGraph<Sale>> graphSetup
    ) {
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        bindParams.accept(countQuery);
        Long total = countQuery.getSingleResult();
        if (total == null || total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        TypedQuery<Sale> query = entityManager.createQuery(jpql, Sale.class);
        bindParams.accept(query);
        if (graphSetup != null) {
            EntityGraph<Sale> graph = entityManager.createEntityGraph(Sale.class);
            graphSetup.accept(graph);
            query.setHint("jakarta.persistence.fetchgraph", graph);
        }
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        return new PageImpl<>(query.getResultList(), pageable, total);
    }

    List<Sale> fetchList(String jpql, Consumer<TypedQuery<?>> bindParams) {
        TypedQuery<Sale> query = entityManager.createQuery(jpql, Sale.class);
        bindParams.accept(query);
        return query.getResultList();
    }
}
