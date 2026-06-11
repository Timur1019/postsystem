package com.pos.finance.service;

import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.dto.transfer.AccountTransferDto;
import com.pos.finance.dto.transfer.CreateAccountTransferRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AccountTransferService {

    PageResponse<AccountTransferDto> list(Integer storeId, LocalDate from, LocalDate to, Pageable pageable);

    AccountTransferDto create(CreateAccountTransferRequest request);
}
