package com.pos.mapper;

import com.pos.dto.company.CompanyResponse;
import com.pos.entity.Company;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PosMapperConfig.class)
public interface CompanyMapper {

    @Mapping(target = "storeCount", source = "storeCount")
    CompanyResponse toResponse(Company company, int storeCount);
}
