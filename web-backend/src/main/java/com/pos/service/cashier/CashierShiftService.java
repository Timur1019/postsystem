package com.pos.service.cashier;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.ShiftReportResponse;

import java.util.UUID;

public interface CashierShiftService {

    /** Текущая открытая смена; null — открытой смены нет (без автоматического открытия). */
    CashierShiftResponse getCurrent(Integer storeId);

    CashierShiftResponse openShift(Integer storeId);

    ShiftReportResponse buildXReport(UUID shiftId);

    ShiftReportResponse buildZReportPreview(UUID shiftId);

    CashierShiftResponse closeShift(UUID shiftId);
}
