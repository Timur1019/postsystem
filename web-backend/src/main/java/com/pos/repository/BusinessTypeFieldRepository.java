package com.pos.repository;

import com.pos.entity.BusinessTypeField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BusinessTypeFieldRepository extends JpaRepository<BusinessTypeField, Integer> {

    long countByBusinessType_Id(Integer businessTypeId);

    Optional<BusinessTypeField> findByIdAndBusinessType_Id(Integer id, Integer businessTypeId);

    boolean existsByBusinessType_IdAndFieldKeyIgnoreCase(Integer businessTypeId, String fieldKey);

    boolean existsByBusinessType_IdAndFieldKeyIgnoreCaseAndIdNot(
        Integer businessTypeId,
        String fieldKey,
        Integer id
    );
}
