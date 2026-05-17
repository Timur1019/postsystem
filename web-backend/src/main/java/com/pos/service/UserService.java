package com.pos.service;

import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {

    List<UserResponse> findAll();

    UserResponse findById(UUID id);

    UserResponse create(CreateUserRequest req);

    UserResponse update(UUID id, UpdateUserRequest req);

    UserResponse toggleActive(UUID id);
}
