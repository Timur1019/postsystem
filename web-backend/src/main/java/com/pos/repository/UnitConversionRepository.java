package com.pos.repository;

import com.pos.entity.UnitConversion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitConversionRepository extends JpaRepository<UnitConversion, UnitConversion.UnitConversionId> {

    List<UnitConversion> findAllByOrderByFromCodeAscToCodeAsc();
}
