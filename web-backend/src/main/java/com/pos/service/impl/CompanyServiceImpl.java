package com.pos.service.impl;

import com.pos.dto.company.CompanyResponse;
import com.pos.dto.company.CreateCompanyRequest;
import com.pos.dto.company.UpdateCompanyRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Company;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CompanyMapper;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.CompanySpecifications;
import com.pos.service.CompanyService;
import com.pos.util.CompanyLoginCodeUtil;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final StoreRepository storeRepository;
    private final CompanyMapper companyMapper;

    @Override
    public PageResponse<CompanyResponse> list(String search, Pageable pageable) {
        Pageable sorted = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("name").ascending()
        );
        Page<Company> page = companyRepository.findAll(CompanySpecifications.filter(search), sorted);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Override
    public java.util.List<CompanyResponse> listAll() {
        return companyRepository.findAll(Sort.by("name").ascending()).stream().map(this::toResponse).toList();
    }

    @Override
    public CompanyResponse getById(Integer id) {
        return toResponse(requireCompany(id));
    }

    @Override
    @Transactional
    public CompanyResponse create(CreateCompanyRequest request) {
        String name = request.name().trim();
        if (companyRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Company name already exists");
        }
        String loginCode = allocateNextLoginCode(null);
        Company company = Company.builder()
            .name(name)
            .loginCode(loginCode)
            .legalName(trimOrNull(request.legalName()))
            .tin(trimOrNull(request.tin()))
            .address(trimOrNull(request.address()))
            .phone(trimOrNull(request.phone()))
            .active(request.active() == null || request.active())
            .build();
        Company saved = companyRepository.save(company);
        LogUtil.info(CompanyServiceImpl.class, "Company created: id={}, name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CompanyResponse update(Integer id, UpdateCompanyRequest request) {
        Company company = requireCompany(id);
        if (request.name() != null) {
            String name = request.name().trim();
            if (companyRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new BadRequestException("Company name already exists");
            }
            company.setName(name);
        }
        if (request.legalName() != null) company.setLegalName(trimOrNull(request.legalName()));
        if (request.tin() != null) company.setTin(trimOrNull(request.tin()));
        if (request.address() != null) company.setAddress(trimOrNull(request.address()));
        if (request.phone() != null) company.setPhone(trimOrNull(request.phone()));
        if (request.active() != null) company.setActive(request.active());
        LogUtil.info(CompanyServiceImpl.class, "Company updated: id={}", id);
        return toResponse(companyRepository.save(company));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Company company = requireCompany(id);
        long storeCount = storeRepository.findByCompanyIdOrderByNameAsc(id).size();
        if (storeCount > 0) {
            throw new BadRequestException("Cannot delete company with assigned stores");
        }
        companyRepository.delete(company);
        LogUtil.info(CompanyServiceImpl.class, "Company deleted: id={}", id);
    }

    private Company requireCompany(Integer id) {
        return companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private CompanyResponse toResponse(Company company) {
        int storeCount = storeRepository.findByCompanyIdOrderByNameAsc(company.getId()).size();
        return companyMapper.toResponse(company, storeCount);
    }

    private String allocateNextLoginCode(Integer excludeId) {
        Integer max = companyRepository.findMaxNumericLoginCode(
            CompanyLoginCodeUtil.MIN_CODE,
            CompanyLoginCodeUtil.MAX_CODE
        );
        int candidate = max == null ? CompanyLoginCodeUtil.MIN_CODE : max + 1;
        while (candidate <= CompanyLoginCodeUtil.MAX_CODE) {
            String code = CompanyLoginCodeUtil.format(candidate);
            if (!isLoginCodeTaken(code, excludeId)) {
                return code;
            }
            candidate++;
        }
        throw new BadRequestException("Нет свободных кодов входа (диапазон исчерпан)");
    }

    private boolean isLoginCodeTaken(String code, Integer excludeId) {
        return excludeId == null
            ? companyRepository.existsByLoginCodeIgnoreCase(code)
            : companyRepository.existsByLoginCodeIgnoreCaseAndIdNot(code, excludeId);
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) return null;
        return value.trim();
    }
}
