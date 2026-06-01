package com.pos.repository;

import com.pos.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Integer>, JpaSpecificationExecutor<Store> {

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.company WHERE s.id = :id")
    Optional<Store> findByIdWithCompany(@Param("id") Integer id);

    List<Store> findByCompanyIdOrderByNameAsc(Integer companyId);

    List<Store> findByActiveTrueAndCompanyIsNotNullOrderByNameAsc();

    long countByCompanyId(Integer companyId);

    long countByCompanyIdAndActiveTrue(Integer companyId);
}
