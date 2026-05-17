package com.pos.service.impl;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import com.pos.mapper.ReturnMapper;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnServiceImpl implements ReturnService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ReturnMapper returnMapper;

    @Override
    public PageResponse<ReturnRowResponse> list(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Pageable pageable
    ) {
        ZoneId z = ZoneId.systemDefault();
        Instant start = from != null ? from.atStartOfDay(z).toInstant() : Instant.EPOCH;
        Instant end = to != null ? to.plusDays(1).atStartOfDay(z).toInstant()
            : Instant.now().plus(3650, ChronoUnit.DAYS);
        String c = blankToNull(cashierName);
        String f = blankToNull(fiscalSearch);
        Page<Sale> page = saleRepository.searchReturns(
            List.of(Sale.SaleStatus.VOIDED, Sale.SaleStatus.REFUNDED),
            start,
            end,
            c,
            f,
            pageable
        );
        return PageResponse.from(page.map(sale -> returnMapper.toRowResponse(
            sale,
            (int) saleItemRepository.countBySale_Id(sale.getId())
        )));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
