package com.pos.repository;

import com.pos.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer>, JpaSpecificationExecutor<Company> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    Optional<Company> findByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCaseAndIdNot(String loginCode, Integer id);

    List<Company> findByActiveTrueOrderByNameAsc();
}
