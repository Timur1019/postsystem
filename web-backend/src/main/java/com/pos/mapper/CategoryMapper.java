package com.pos.mapper;

import com.pos.dto.category.CategoryResponse;
import com.pos.entity.Category;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);
}
