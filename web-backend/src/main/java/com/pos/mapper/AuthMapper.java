package com.pos.mapper;

import com.pos.dto.auth.AuthResponse;
import com.pos.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(config = PosMapperConfig.class, uses = UserMapper.class)
public interface AuthMapper {

    @Mapping(target = "token", source = "token")
    @Mapping(target = "id", source = "user.id", qualifiedByName = "uuidToString")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    @Mapping(target = "patronymic", source = "user.patronymic")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "companyId", source = "user.company.id")
    @Mapping(target = "storeIds", source = "user.stores", qualifiedByName = "storeIds")
    AuthResponse toResponse(User user, String token);

    @Named("uuidToString")
    default String uuidToString(UUID id) {
        return id != null ? id.toString() : null;
    }
}
