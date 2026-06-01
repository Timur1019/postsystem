package com.pos.repository;

import com.pos.entity.CustomerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    long countByStore_Id(Integer storeId);

    @EntityGraph(attributePaths = {"store", "createdBy", "courier"})
    Page<CustomerOrder> findAll(Specification<CustomerOrder> spec, Pageable pageable);
}
