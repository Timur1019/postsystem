package com.pos.finance.service;

import com.pos.finance.dto.dashboard.FinanceDashboardDto;

public interface DashboardService {

    FinanceDashboardDto getDashboard(Integer storeId, java.time.LocalDate from, java.time.LocalDate to);
}
