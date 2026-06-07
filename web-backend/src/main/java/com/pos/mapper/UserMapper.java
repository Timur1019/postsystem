package com.pos.mapper;

import com.pos.dto.user.UserResponse;
import com.pos.entity.Store;
import com.pos.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Mapper(config = PosMapperConfig.class)
public interface UserMapper {

    @Mapping(target = "role", source = "role.name")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "companyLoginCode", source = "company.loginCode")
    @Mapping(target = "active", source = "active")
    @Mapping(target = "storeIds", source = "stores", qualifiedByName = "storeIds")
    @Mapping(target = "storeNames", source = "stores", qualifiedByName = "storeNames")
    UserResponse toResponse(User user);

    List<UserResponse> toResponseList(List<User> users);

    @Named("storeIds")
    default List<Integer> storeIds(Set<Store> stores) {
        if (stores == null || stores.isEmpty()) {
            return List.of();
        }
        return stores.stream()
            .map(Store::getId)
            .sorted()
            .toList();
    }

    @Named("storeNames")
    default List<String> storeNames(Set<Store> stores) {
        if (stores == null || stores.isEmpty()) {
            return List.of();
        }
        return stores.stream()
            .map(Store::getName)
            .sorted(Comparator.naturalOrder())
            .toList();
    }
}
