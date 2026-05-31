package com.pos.dto.cashier;

public record FinalizeZReportResponse(
    ShiftReportResponse report,
    CashierShiftResponse newShift
) {}
