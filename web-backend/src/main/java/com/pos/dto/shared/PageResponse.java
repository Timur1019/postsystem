package com.pos.dto.shared;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }
}
