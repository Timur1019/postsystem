package com.pos.repository;

import com.pos.entity.CashRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CashRegisterRepository extends JpaRepository<CashRegister, Long>, JpaSpecificationExecutor<CashRegister> {

    @Override
    @EntityGraph(attributePaths = {"store"})
    Page<CashRegister> findAll(Specification<CashRegister> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"store"})
    List<CashRegister> findByStore_IdIn(Collection<Integer> storeIds);

    @EntityGraph(attributePaths = {"store"})
    List<CashRegister> findByStatusIgnoreCaseAndStore_CompanyIsNotNullOrderByStore_NameAscRegisterNumberAsc(String status);

    @Query("""
        SELECT DISTINCT c.equipmentSerial FROM CashRegister c
        JOIN c.store s
        WHERE c.equipmentSerial IS NOT NULL AND TRIM(c.equipmentSerial) <> ''
          AND s.active = TRUE AND s.company IS NOT NULL
        ORDER BY c.equipmentSerial
        """)
    List<String> findDistinctEquipmentSerials();

    @Query("SELECT c FROM CashRegister c JOIN FETCH c.store WHERE c.id = :id")
    Optional<CashRegister> findDetailById(@Param("id") Long id);

    Optional<CashRegister> findFirstByStore_IdOrderByRegisterNumberAsc(Integer storeId);
}
