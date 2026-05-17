package com.pos.mapper;

import com.pos.dto.zreport.ZReportDetailResponse;
import com.pos.dto.zreport.ZReportRowResponse;
import com.pos.entity.ZReport;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ZReportMapper {

    @Mapping(target = "zNumber", source = "ZNumber")
    @Mapping(target = "storeName", source = "report", qualifiedByName = "storeName")
    ZReportRowResponse toRowResponse(ZReport report);

    List<ZReportRowResponse> toRowResponseList(List<ZReport> reports);

    @Mapping(target = "zNumber", source = "ZNumber")
    @Mapping(target = "storeName", source = "report", qualifiedByName = "storeName")
    ZReportDetailResponse toDetailResponse(ZReport report);

    @Named("storeName")
    default String storeName(ZReport report) {
        return report.getStore() != null ? report.getStore().getName() : "";
    }
}
