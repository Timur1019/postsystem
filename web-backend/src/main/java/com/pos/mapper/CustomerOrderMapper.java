package com.pos.mapper;

import com.pos.dto.order.CourierOptionResponse;
import com.pos.dto.order.CustomerOrderRowResponse;
import com.pos.entity.CustomerOrder;
import com.pos.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface CustomerOrderMapper {

    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "courierName", source = "courier.fullName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    CustomerOrderRowResponse toRowResponse(CustomerOrder order);

    CourierOptionResponse toCourierOption(User user);

    List<CourierOptionResponse> toCourierOptionList(List<User> users);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }
}
