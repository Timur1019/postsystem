package com.pos.dto.shared;

public record ApiResponse(String message) {
    public static ApiResponse success(String message) {
        return new ApiResponse(message);
    }
}
