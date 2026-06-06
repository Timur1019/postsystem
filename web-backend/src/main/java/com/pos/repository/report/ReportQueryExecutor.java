package com.pos.repository.report;

import com.pos.util.SqlLoader;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

@Component
@RequiredArgsConstructor
public class ReportQueryExecutor {

    private final EntityManager entityManager;
    private final SqlLoader sqlLoader;

    public Page<Object[]> fetchPage(
        String sqlPath,
        String countSqlPath,
        Consumer<Query> parameterBinder,
        Pageable pageable
    ) {
        return fetchPage(sqlPath, countSqlPath, parameterBinder, parameterBinder, pageable);
    }

    public Page<Object[]> fetchPage(
        String sqlPath,
        String countSqlPath,
        Consumer<Query> countParameterBinder,
        Consumer<Query> dataParameterBinder,
        Pageable pageable
    ) {
        Query countQuery = entityManager.createNativeQuery(sqlLoader.load(countSqlPath));
        countParameterBinder.accept(countQuery);
        long total = ((Number) countQuery.getSingleResult()).longValue();
        if (total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        Query query = entityManager.createNativeQuery(sqlLoader.load(sqlPath));
        dataParameterBinder.accept(query);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        @SuppressWarnings("unchecked")
        List<Object[]> content = query.getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> fetchList(String sqlPath, Consumer<Query> parameterBinder) {
        Query query = entityManager.createNativeQuery(sqlLoader.load(sqlPath));
        parameterBinder.accept(query);
        return query.getResultList();
    }
}
