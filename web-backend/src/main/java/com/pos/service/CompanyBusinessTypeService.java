package com.pos.service;

import com.pos.dto.company.CompanyBusinessTypeResponse;
import com.pos.dto.company.UpdateCompanyBusinessTypeRequest;

public interface CompanyBusinessTypeService {

    CompanyBusinessTypeResponse getForCurrentCompany();

    CompanyBusinessTypeResponse saveForCurrentCompany(UpdateCompanyBusinessTypeRequest request);
}
