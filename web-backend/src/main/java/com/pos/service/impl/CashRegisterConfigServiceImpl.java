package com.pos.service.impl;

import com.pos.dto.cashregister.CashRegisterConfigFormOptionsResponse;
import com.pos.dto.cashregister.CashRegisterConfigRowResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.dto.cashregister.CreateCashRegisterConfigRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.CashRegister;
import com.pos.entity.CashRegisterConfig;
import com.pos.entity.Category;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CashRegisterConfigMapper;
import com.pos.mapper.CashRegisterMapper;
import com.pos.mapper.CategoryMapper;
import com.pos.mapper.StoreMapper;
import com.pos.repository.CashRegisterConfigRepository;
import com.pos.repository.CashRegisterRepository;
import com.pos.repository.CategoryRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.CashRegisterConfigSpecifications;
import com.pos.service.CashRegisterConfigService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashRegisterConfigServiceImpl implements CashRegisterConfigService {

    private static final String RESERVED_DEFAULT_NAME = "Конфигурация по умолчанию";

    private final CashRegisterConfigRepository configRepository;
    private final StoreRepository storeRepository;
    private final CashRegisterRepository cashRegisterRepository;
    private final CategoryRepository categoryRepository;
    private final StoreMapper storeMapper;
    private final CategoryMapper categoryMapper;
    private final CashRegisterMapper cashRegisterMapper;
    private final CashRegisterConfigMapper cashRegisterConfigMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public CashRegisterConfigFormOptionsResponse getFormOptions() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        var stores = storeMapper.toResponseList(
            storeRepository.findByCompanyIdOrderByNameAsc(companyId)
        );

        var registers = cashRegisterMapper.toRowResponseList(
            cashRegisterRepository.findActiveByCompanyId("ACTIVE", companyId)
        );

        var categories = categoryMapper.toResponseList(
            categoryRepository.findAllWithActiveProductsByCompanyId(companyId)
        );

        return new CashRegisterConfigFormOptionsResponse(stores, registers, categories);
    }

    @Override
    public PageResponse<CashRegisterConfigRowResponse> list(
        String search,
        Integer storeId,
        String equipmentSerial,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<CashRegisterConfig> spec = CashRegisterConfigSpecifications.filter(
            companyId, search, storeId, equipmentSerial
        );
        Pageable sorted = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            pageable.getSort().isSorted()
                ? pageable.getSort()
                : Sort.by(Sort.Order.desc("lockedDefault"), Sort.Order.asc("name"))
        );
        Page<CashRegisterConfig> page = configRepository.findAll(spec, sorted);
        return PageResponse.from(page.map(cashRegisterConfigMapper::toRowResponse));
    }

    @Override
    @Transactional
    public CashRegisterConfigRowResponse create(CreateCashRegisterConfigRequest request) {
        String name = request.name().trim();
        assertNameAllowed(name, null);
        if (configRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Configuration name already exists");
        }

        CashRegisterConfig cfg = CashRegisterConfig.builder()
            .name(name)
            .lockedDefault(false)
            .build();
        applyLinks(cfg, request);
        CashRegisterConfig saved = configRepository.save(cfg);
        LogUtil.info(CashRegisterConfigServiceImpl.class, "Cash register config created: id={}, name={}", saved.getId(), saved.getName());
        return cashRegisterConfigMapper.toRowResponse(saved);
    }

    @Override
    @Transactional
    public CashRegisterConfigRowResponse update(Long id, CreateCashRegisterConfigRequest request) {
        CashRegisterConfig cfg = requireAccessibleConfig(id);
        if (cfg.isLockedDefault()) {
            throw new BadRequestException("Default configuration cannot be modified");
        }
        String name = request.name().trim();
        assertNameAllowed(name, id);
        if (configRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BadRequestException("Configuration name already exists");
        }
        cfg.setName(name);
        applyLinks(cfg, request);
        CashRegisterConfig saved = configRepository.save(cfg);
        LogUtil.info(CashRegisterConfigServiceImpl.class, "Cash register config updated: id={}", id);
        return cashRegisterConfigMapper.toRowResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        CashRegisterConfig cfg = requireAccessibleConfig(id);
        if (cfg.isLockedDefault()) {
            throw new BadRequestException("Default configuration cannot be deleted");
        }
        configRepository.delete(cfg);
        LogUtil.info(CashRegisterConfigServiceImpl.class, "Cash register config deleted: id={}", id);
    }

    private static void assertNameAllowed(String name, Long ignoreId) {
        if (!StringUtils.hasText(name)) {
            throw new BadRequestException("Name is required");
        }
        if (RESERVED_DEFAULT_NAME.equalsIgnoreCase(name)) {
            throw new BadRequestException("This configuration name is reserved for the system default");
        }
    }

    private void applyLinks(CashRegisterConfig cfg, CreateCashRegisterConfigRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        cfg.getStores().clear();
        for (Integer sid : req.storeIds()) {
            Store s = storeRepository.findById(sid)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + sid));
            tenantAccess.assertCanAccessStore(s);
            if (!s.isActive() || s.getCompany() == null) {
                throw new BadRequestException("Store is not available for configuration: " + sid);
            }
            cfg.getStores().add(s);
        }
        cfg.getRegisters().clear();
        for (Long rid : req.cashRegisterIds()) {
            CashRegister r = cashRegisterRepository.findById(rid)
                .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + rid));
            if (!"ACTIVE".equalsIgnoreCase(r.getStatus()) || r.getStore().getCompany() == null) {
                throw new BadRequestException("Cash register is not active: " + rid);
            }
            tenantAccess.assertCanAccessStore(r.getStore());
            cfg.getRegisters().add(r);
        }
        Set<Integer> allowedCategoryIds = categoryRepository.findAllWithActiveProductsByCompanyId(companyId).stream()
            .map(Category::getId)
            .collect(Collectors.toSet());
        cfg.getCategories().clear();
        for (Integer cid : req.categoryIds()) {
            if (!allowedCategoryIds.contains(cid)) {
                throw new BadRequestException("Category has no active products: " + cid);
            }
            Category c = categoryRepository.findById(cid)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + cid));
            if (c.getCompany() == null || !c.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Category does not belong to your company: " + cid);
            }
            cfg.getCategories().add(c);
        }
    }

    private CashRegisterConfig requireAccessibleConfig(Long id) {
        CashRegisterConfig cfg = configRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Configuration not found"));
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        boolean belongsToTenant = cfg.getStores().stream()
            .anyMatch(s -> s.getCompany() != null && s.getCompany().getId().equals(companyId));
        if (!belongsToTenant) {
            throw new BadRequestException("Access denied to this configuration");
        }
        return cfg;
    }
}
