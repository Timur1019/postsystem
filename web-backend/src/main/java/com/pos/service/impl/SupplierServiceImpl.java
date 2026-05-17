package com.pos.service.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.supplier.CreateSupplierRequest;
import com.pos.dto.supplier.SupplierResponse;
import com.pos.entity.Supplier;
import com.pos.exception.BadRequestException;
import com.pos.mapper.SupplierMapper;
import com.pos.repository.SupplierRepository;
import com.pos.repository.spec.SupplierSpecifications;
import com.pos.service.SupplierService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierServiceImpl implements SupplierService {

    private static final Pattern EMAIL_OK = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Override
    public PageResponse<SupplierResponse> list(String search, LocalDate createdOn, Pageable pageable) {
        Specification<Supplier> spec = SupplierSpecifications.filter(search, createdOn);
        Page<Supplier> page = supplierRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(supplierMapper::toResponse));
    }

    @Override
    @Transactional
    public SupplierResponse create(CreateSupplierRequest req) {
        String taxId = req.taxId().trim();
        if (supplierRepository.existsByTaxId(taxId)) {
            throw new BadRequestException("Поставщик с таким ИНН/ПИНФЛ уже существует");
        }
        if (StringUtils.hasText(req.email()) && !EMAIL_OK.matcher(req.email().trim()).matches()) {
            throw new BadRequestException("Некорректный email");
        }

        Supplier s = Supplier.builder()
            .name(req.name().trim())
            .taxId(taxId)
            .address(StringUtils.hasText(req.address()) ? req.address().trim() : null)
            .email(StringUtils.hasText(req.email()) ? req.email().trim() : null)
            .phone(StringUtils.hasText(req.phone()) ? req.phone().trim() : null)
            .build();
        Supplier saved = supplierRepository.save(s);
        LogUtil.info(SupplierServiceImpl.class, "Supplier created: id={}, taxId={}", saved.getId(), saved.getTaxId());
        return supplierMapper.toResponse(saved);
    }

}
