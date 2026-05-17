package com.pos.service;

import com.pos.dto.company.CompanyResponse;
import com.pos.dto.company.CreateCompanyRequest;
import com.pos.dto.company.UpdateCompanyRequest;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CompanyService {

    PageResponse<CompanyResponse> list(String search, Pageable pageable);

    List<CompanyResponse> listAll();

    CompanyResponse getById(Integer id);

    CompanyResponse create(CreateCompanyRequest request);

    CompanyResponse update(Integer id, UpdateCompanyRequest request);

    void delete(Integer id);
}
