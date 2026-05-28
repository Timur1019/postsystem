package com.pos.repository;

import com.pos.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer>, JpaSpecificationExecutor<Store> {

    List<Store> findByCompanyIdOrderByNameAsc(Integer companyId);

    List<Store> findByActiveTrueAndCompanyIsNotNullOrderByNameAsc();

    long countByCompanyId(Integer companyId);

    long countByCompanyIdAndActiveTrue(Integer companyId);
}
