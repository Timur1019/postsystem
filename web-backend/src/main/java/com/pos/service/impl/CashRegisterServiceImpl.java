package com.pos.service.impl;

import com.pos.dto.cashregister.CashRegisterDetailResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CashRegisterMapper;
import com.pos.repository.CashRegisterRepository;
import com.pos.repository.spec.CashRegisterSpecifications;
import com.pos.service.CashRegisterService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashRegisterServiceImpl implements CashRegisterService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    private final CashRegisterRepository cashRegisterRepository;
    private final CashRegisterMapper cashRegisterMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<CashRegisterRowResponse> list(
        String storeSearch,
        String equipmentModel,
        String equipmentSerial,
        String fiscalCardId,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        var spec = CashRegisterSpecifications.filter(
            companyId, storeSearch, equipmentModel, equipmentSerial, fiscalCardId
        );
        Pageable sorted = pageable.getSort().isSorted()
            ? pageable
            : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Order.asc("store.name"), Sort.Order.asc("registerNumber")));
        Page<CashRegister> page = cashRegisterRepository.findAll(spec, sorted);
        return PageResponse.from(page.map(cashRegisterMapper::toRowResponse));
    }

    @Override
    public List<String> listDistinctEquipmentSerials() {
        return cashRegisterRepository.findDistinctEquipmentSerials(tenantAccess.requireEffectiveCompanyId());
    }

    @Override
    public CashRegisterDetailResponse getById(Long id) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + id));
        Store store = register.getStore();
        if (store == null || !store.isActive() || store.getCompany() == null) {
            throw new BadRequestException("Cash register is not available");
        }
        tenantAccess.assertCanAccessStore(store);
        return cashRegisterMapper.toDetailResponse(register);
    }

    @Override
    @Transactional
    public CashRegisterRowResponse toggleStatus(Long id) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + id));
        Store store = register.getStore();
        if (store == null || !store.isActive() || store.getCompany() == null) {
            throw new BadRequestException("Cash register store is not available");
        }
        tenantAccess.assertCanAccessStore(store);
        String next = STATUS_ACTIVE.equalsIgnoreCase(register.getStatus()) ? STATUS_INACTIVE : STATUS_ACTIVE;
        register.setStatus(next);
        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(
            CashRegisterServiceImpl.class,
            "Cash register status toggled: id={}, status={}",
            id,
            saved.getStatus()
        );
        return cashRegisterMapper.toRowResponse(saved);
    }

}
