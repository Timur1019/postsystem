package com.pos.service.impl;

import com.pos.domain.BusinessType;
import com.pos.dto.shared.PageResponse;
import com.pos.util.BusinessTypeParser;
import com.pos.util.TextUtil;
import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.dto.store.UpdateStoreRequest;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.StoreMapper;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.CustomerOrderRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockInventoryRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StockReceiptRepository;
import com.pos.repository.StockTransferRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.StoreSpecifications;
import com.pos.service.StoreService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;
    private final TenantAccessSupport tenantAccess;
    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final StockInventoryRepository stockInventoryRepository;
    private final StockTransferRepository stockTransferRepository;
    private final CustomerOrderRepository customerOrderRepository;

    @Override
    @Cacheable(value = "stores", key = "@tenantCacheKeyResolver.stores()")
    public List<StoreResponse> listStores() {
        User actor = tenantAccess.currentUser();
        if (tenantAccess.isSuperAdmin()) {
            return storeRepository.findAll(Sort.by("name").ascending()).stream().map(storeMapper::toResponse).toList();
        }
        if (actor.getCompany() != null) {
            return storeRepository.findByCompanyIdOrderByNameAsc(actor.getCompany().getId())
                .stream().map(storeMapper::toResponse).toList();
        }
        if (!actor.getStores().isEmpty()) {
            return actor.getStores().stream().map(storeMapper::toResponse).toList();
        }
        return List.of();
    }

    @Override
    public PageResponse<StoreResponse> listManaged(String search, Integer companyId, Pageable pageable) {
        Integer scopedCompanyId = resolveListCompanyId(companyId);
        Pageable sorted = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("name").ascending()
        );
        Page<Store> page = storeRepository.findAll(
            StoreSpecifications.filter(search, scopedCompanyId),
            sorted
        );
        return PageResponse.from(page.map(storeMapper::toResponse));
    }

    @Override
    public StoreResponse getById(Integer id) {
        Store store = requireStore(id);
        tenantAccess.assertCanAccessStore(store);
        return storeMapper.toResponse(store);
    }

    @Override
    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public StoreResponse create(CreateStoreRequest request) {
        Integer companyId = tenantAccess.resolveCompanyIdForCreate(request.companyId());
        Company company = tenantAccess.requireCompany(companyId);
        tenantAccess.assertCanAccessCompany(companyId);

        BusinessType businessType = resolveStoreBusinessType(request.businessType(), company.getBusinessType());

        Store store = Store.builder()
            .name(request.name().trim())
            .code(TextUtil.trimOrNull(request.code()))
            .address(TextUtil.trimOrNull(request.address()))
            .phone(TextUtil.trimOrNull(request.phone()))
            .company(company)
            .businessType(businessType)
            .active(request.active() == null || request.active())
            .build();
        Store saved = storeRepository.save(store);
        LogUtil.info(StoreServiceImpl.class, "Store created: id={}, name={}", saved.getId(), saved.getName());
        return storeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public StoreResponse update(Integer id, UpdateStoreRequest request) {
        Store store = requireStore(id);
        tenantAccess.assertCanAccessStore(store);

        if (request.name() != null) store.setName(request.name().trim());
        if (request.code() != null) store.setCode(TextUtil.trimOrNull(request.code()));
        if (request.address() != null) store.setAddress(TextUtil.trimOrNull(request.address()));
        if (request.phone() != null) store.setPhone(TextUtil.trimOrNull(request.phone()));
        if (request.active() != null) store.setActive(request.active());
        if (request.businessType() != null) {
            store.setBusinessType(BusinessTypeParser.parseRequired(request.businessType()));
        }
        if (request.companyId() != null && tenantAccess.isSuperAdmin()) {
            store.setCompany(tenantAccess.requireCompany(request.companyId()));
        }

        LogUtil.info(StoreServiceImpl.class, "Store updated: id={}", id);
        return storeMapper.toResponse(storeRepository.save(store));
    }

    @Override
    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public StoreResponse toggleActive(Integer id) {
        Store store = requireStore(id);
        tenantAccess.assertCanAccessStore(store);
        store.setActive(!store.isActive());
        Store saved = storeRepository.save(store);
        LogUtil.info(StoreServiceImpl.class, "Store active toggled: id={}, active={}", id, saved.isActive());
        return storeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "stores", allEntries = true)
    public void delete(Integer id) {
        Store store = requireStore(id);
        tenantAccess.assertCanAccessStore(store);
        assertDeletable(id);
        storeRepository.delete(store);
        LogUtil.info(StoreServiceImpl.class, "Store deleted: id={}, name={}", id, store.getName());
    }

    private void assertDeletable(Integer storeId) {
        List<String> blocks = new ArrayList<>();
        long sales = saleRepository.countByStore_Id(storeId);
        if (sales > 0) {
            blocks.add("продажи — " + sales);
        }
        long shifts = cashierShiftRepository.countByStore_Id(storeId);
        if (shifts > 0) {
            blocks.add("смены кассиров — " + shifts);
        }
        long movements = stockMovementRepository.countByStore_Id(storeId);
        if (movements > 0) {
            blocks.add("складские движения — " + movements);
        }
        long receipts = stockReceiptRepository.countByStore_Id(storeId);
        if (receipts > 0) {
            blocks.add("приходы — " + receipts);
        }
        long inventories = stockInventoryRepository.countByStore_Id(storeId);
        if (inventories > 0) {
            blocks.add("инвентаризации — " + inventories);
        }
        long transfers = stockTransferRepository.countByFromStore_IdOrToStore_Id(storeId, storeId);
        if (transfers > 0) {
            blocks.add("перемещения — " + transfers);
        }
        long orders = customerOrderRepository.countByStore_Id(storeId);
        if (orders > 0) {
            blocks.add("заказы — " + orders);
        }
        if (!blocks.isEmpty()) {
            throw new BadRequestException(
                "Нельзя удалить магазин: есть связанные данные (" + String.join("; ", blocks) + ")"
            );
        }
    }

    private Integer resolveListCompanyId(Integer companyId) {
        if (tenantAccess.isSuperAdmin()) {
            return companyId;
        }
        User actor = tenantAccess.currentUser();
        if (actor.getCompany() == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return actor.getCompany().getId();
    }

    private Store requireStore(Integer id) {
        return storeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
    }

    private static BusinessType resolveStoreBusinessType(String requestType, BusinessType companyDefault) {
        if (StringUtils.hasText(requestType)) {
            return BusinessTypeParser.parseRequired(requestType);
        }
        return companyDefault != null ? companyDefault : BusinessType.UNIVERSAL;
    }
}
