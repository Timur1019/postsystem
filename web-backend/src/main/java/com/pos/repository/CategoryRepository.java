package com.pos.repository;

import com.pos.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndCompanyId(String name, Integer companyId);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    boolean existsByNameIgnoreCaseAndCompanyIdAndIdNot(String name, Integer companyId, Integer id);

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findByCompanyIdOrderByNameAsc(Integer companyId);

    @Query("""
        SELECT DISTINCT c FROM Category c
        WHERE EXISTS (
            SELECT 1 FROM Product p
            WHERE p.category = c AND p.isActive = true
        )
        ORDER BY c.name ASC
        """)
    List<Category> findAllWithActiveProducts();

    @Query("""
        SELECT DISTINCT c FROM Category c
        WHERE c.company.id = :companyId
        AND EXISTS (
            SELECT 1 FROM Product p
            WHERE p.category = c AND p.isActive = true
        )
        ORDER BY c.name ASC
        """)
    List<Category> findAllWithActiveProductsByCompanyId(@Param("companyId") Integer companyId);

    @Query("""
        SELECT COUNT(c) FROM Category c
        WHERE c.company.id = :companyId
        """)
    long countByCompanyId(@Param("companyId") Integer companyId);
}
