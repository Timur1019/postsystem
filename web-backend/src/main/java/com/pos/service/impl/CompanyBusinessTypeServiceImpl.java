package com.pos.service.impl;

import com.pos.domain.BusinessType;
import com.pos.dto.company.CompanyBusinessTypeResponse;
import com.pos.dto.company.UpdateCompanyBusinessTypeRequest;
import com.pos.entity.Company;
import com.pos.repository.CompanyRepository;
import com.pos.service.CompanyBusinessTypeService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.BusinessTypeParser;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyBusinessTypeServiceImpl implements CompanyBusinessTypeService {

    private final CompanyRepository companyRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public CompanyBusinessTypeResponse getForCurrentCompany() {
        Company company = requireCurrentCompany();
        return toResponse(company);
    }

    @Override
    @Transactional
    public CompanyBusinessTypeResponse saveForCurrentCompany(UpdateCompanyBusinessTypeRequest request) {
        Company company = requireCurrentCompany();
        BusinessType businessType = BusinessTypeParser.parseRequired(request.businessType());
        company.setBusinessType(businessType);
        companyRepository.save(company);
        LogUtil.info(
            CompanyBusinessTypeServiceImpl.class,
            "Company business type saved: companyId={}, businessType={}",
            company.getId(),
            businessType
        );
        return toResponse(company);
    }

    private Company requireCurrentCompany() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return tenantAccess.requireCompany(companyId);
    }

    private static CompanyBusinessTypeResponse toResponse(Company company) {
        BusinessType type = company.getBusinessType() != null ? company.getBusinessType() : BusinessType.UNIVERSAL;
        return new CompanyBusinessTypeResponse(type.name());
    }
}
