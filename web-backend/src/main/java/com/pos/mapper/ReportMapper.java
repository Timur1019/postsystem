package com.pos.mapper;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.TopProductRow;
import org.mapstruct.Mapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ReportMapper {

    default TopProductRow toTopProductRow(Object[] row) {
        String name = (String) row[0];
        Number qty = (Number) row[1];
        return new TopProductRow(name, qty.longValue());
    }

    default List<TopProductRow> toTopProductRowList(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<TopProductRow> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(toTopProductRow(row));
        }
        return out;
    }

    default CashierStat toCashierStat(Object[] row) {
        String name = (String) row[0];
        BigDecimal revenue = row[1] instanceof BigDecimal bd
            ? bd
            : BigDecimal.valueOf(((Number) row[1]).doubleValue());
        return new CashierStat(name, revenue);
    }

    default List<CashierStat> toCashierStatList(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<CashierStat> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(toCashierStat(row));
        }
        return out;
    }
}
