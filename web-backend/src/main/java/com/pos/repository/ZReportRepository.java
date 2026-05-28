package com.pos.repository;

import com.pos.entity.ZReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ZReportRepository extends JpaRepository<ZReport, Long>, JpaSpecificationExecutor<ZReport> {

    @Query("SELECT COALESCE(MAX(z.zNumber), 0) FROM ZReport z WHERE z.store.id = :storeId")
    int findMaxZNumberByStoreId(@Param("storeId") Integer storeId);

    @Query("SELECT z FROM ZReport z JOIN FETCH z.store WHERE z.id = :id")
    Optional<ZReport> findDetailById(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"store"})
    @NonNull
    Page<ZReport> findAll(@NonNull Specification<ZReport> spec, @NonNull Pageable pageable);

    @Query("""
        SELECT COUNT(z), COALESCE(SUM(z.totalAmount), 0)
        FROM ZReport z
        WHERE z.store.company.id = :companyId
          AND z.closedAt >= :from
          AND z.closedAt < :to
        """)
    Object[] summarizeByCompanyAndClosedAtBetween(
            @Param("companyId") Integer companyId,
            @Param("from") java.time.Instant from,
            @Param("to") java.time.Instant to
    );
}
