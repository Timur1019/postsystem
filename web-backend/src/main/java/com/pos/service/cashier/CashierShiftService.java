package com.pos.service.cashier;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.ShiftReportResponse;

import java.util.UUID;

public interface CashierShiftService {

    CashierShiftResponse getOrOpenCurrent(Integer storeId);

    CashierShiftResponse openShift(Integer storeId);

    ShiftReportResponse buildXReport(UUID shiftId);

    ShiftReportResponse buildZReportPreview(UUID shiftId);

    CashierShiftResponse closeShift(UUID shiftId);
}
