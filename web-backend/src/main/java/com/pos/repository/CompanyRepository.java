package com.pos.repository;

import com.pos.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer>, JpaSpecificationExecutor<Company> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    Optional<Company> findByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCaseAndIdNot(String loginCode, Integer id);

    List<Company> findByActiveTrueOrderByNameAsc();

    /**
     * Максимальный числовой код входа в диапазоне 10000–99999, или null если таких нет.
     */
    @Query(
        value = """
        SELECT MAX(CAST(login_code AS INTEGER))
        FROM companies
        WHERE login_code ~ '^[0-9]+$'
          AND CAST(login_code AS INTEGER) >= :minCode
          AND CAST(login_code AS INTEGER) <= :maxCode
        """,
        nativeQuery = true
    )
    Integer findMaxNumericLoginCode(
        @Param("minCode") int minCode,
        @Param("maxCode") int maxCode
    );
}
