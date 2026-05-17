package com.pos.repository;

import com.pos.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    Optional<Category> findByNameIgnoreCase(String name);

    @Query("""
        SELECT DISTINCT c FROM Category c
        WHERE EXISTS (
            SELECT 1 FROM Product p
            WHERE p.category = c AND p.isActive = true
        )
        ORDER BY c.name ASC
        """)
    List<Category> findAllWithActiveProducts();
}
