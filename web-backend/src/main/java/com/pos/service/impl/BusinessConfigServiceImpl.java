package com.pos.service.impl;

import com.pos.domain.BusinessType;
import com.pos.dto.business.BusinessConfigResponse;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Store;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.BusinessTypeMapper;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.BusinessConfigService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.BusinessTypeParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessConfigServiceImpl implements BusinessConfigService {

    private final BusinessTypeDefinitionRepository typeRepository;
    private final StoreRepository storeRepository;
    private final BusinessTypeMapper mapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public BusinessConfigResponse getByCode(String code) {
        BusinessType parsed = BusinessTypeParser.parseOrDefault(code, BusinessType.UNIVERSAL);
        BusinessTypeDefinition type = typeRepository.findActiveDetailedByCode(parsed.name())
            .or(() -> typeRepository.findActiveDetailedByCode(BusinessType.UNIVERSAL.name()))
            .orElseThrow(() -> new ResourceNotFoundException("Business config not found"));
        return mapper.toConfigResponse(type);
    }

    @Override
    public BusinessConfigResponse getForStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        tenantAccess.assertCanAccessCompany(store.getCompany().getId());
        return getByCode(store.getBusinessType().name());
    }
}
