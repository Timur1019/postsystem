package com.pos.service.impl;

import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.CashRegister;
import com.pos.entity.ZReport;
import com.pos.mapper.CashTransferMapper;
import com.pos.repository.CashRegisterRepository;
import com.pos.repository.ZReportRepository;
import com.pos.repository.spec.CashTransferSpecifications;
import com.pos.service.CashTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashTransferServiceImpl implements CashTransferService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");

    private final ZReportRepository zReportRepository;
    private final CashRegisterRepository cashRegisterRepository;
    private final CashTransferMapper cashTransferMapper;

    @Override
    public PageResponse<CashTransferRowResponse> list(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo,
        Pageable pageable
    ) {
        Instant fromInst = toStartOfDay(closedFrom);
        Instant toInst = toEndOfDay(closedTo);
        Specification<ZReport> spec = CashTransferSpecifications.filter(storeSearch, registerNumber, fromInst, toInst);
        Page<ZReport> page = zReportRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(z -> cashTransferMapper.toRowResponse(z, registerLookupFor(page.getContent()))));
    }

    @Override
    public List<CashTransferRowResponse> listAll(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo
    ) {
        Instant fromInst = toStartOfDay(closedFrom);
        Instant toInst = toEndOfDay(closedTo);
        Specification<ZReport> spec = CashTransferSpecifications.filter(storeSearch, registerNumber, fromInst, toInst);
        List<ZReport> all = zReportRepository.findAll(spec);
        Map<String, Integer> registerLookup = registerLookupFor(all);
        return all.stream()
            .map(z -> cashTransferMapper.toRowResponse(z, registerLookup))
            .collect(Collectors.toList());
    }

    private Map<String, Integer> registerLookupFor(List<ZReport> reports) {
        List<Integer> storeIds = reports.stream()
            .map(z -> z.getStore().getId())
            .distinct()
            .toList();
        if (storeIds.isEmpty()) {
            return Map.of();
        }
        return buildRegisterLookup(cashRegisterRepository.findByStore_IdIn(storeIds));
    }

    private static Map<String, Integer> buildRegisterLookup(List<CashRegister> registers) {
        Map<String, Integer> map = new HashMap<>();
        for (CashRegister cr : registers) {
            int sid = cr.getStore().getId();
            if (StringUtils.hasText(cr.getFiscalCardId())) {
                map.put(sid + "|F:" + cr.getFiscalCardId().trim(), cr.getRegisterNumber());
            }
            if (StringUtils.hasText(cr.getEquipmentSerial())) {
                map.put(sid + "|S:" + cr.getEquipmentSerial().trim(), cr.getRegisterNumber());
            }
        }
        return map;
    }

    private static Instant toStartOfDay(LocalDate d) {
        if (d == null) {
            return null;
        }
        return d.atStartOfDay(TZ).toInstant();
    }

    private static Instant toEndOfDay(LocalDate d) {
        if (d == null) {
            return null;
        }
        return d.plusDays(1).atStartOfDay(TZ).toInstant().minusNanos(1);
    }
}
