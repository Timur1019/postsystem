package com.pos.repository;

import com.pos.entity.BusinessTypeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BusinessTypeDefinitionRepository extends JpaRepository<BusinessTypeDefinition, Integer> {

    List<BusinessTypeDefinition> findAllByOrderBySortOrderAscCodeAsc();

    Optional<BusinessTypeDefinition> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Integer id);

    @Query("""
        SELECT DISTINCT bt FROM BusinessTypeDefinition bt
        LEFT JOIN FETCH bt.fields f
        LEFT JOIN FETCH f.options
        WHERE bt.id = :id
        """)
    Optional<BusinessTypeDefinition> findDetailedById(Integer id);

    @Query("""
        SELECT DISTINCT bt FROM BusinessTypeDefinition bt
        LEFT JOIN FETCH bt.fields f
        LEFT JOIN FETCH f.options
        WHERE UPPER(bt.code) = UPPER(:code) AND bt.active = TRUE
        """)
    Optional<BusinessTypeDefinition> findActiveDetailedByCode(String code);
}
