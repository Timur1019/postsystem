package com.pos.mapper;

import com.pos.dto.business.*;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypeField;
import com.pos.entity.FieldOption;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BusinessTypeMapper {

    public BusinessTypeResponse toResponse(BusinessTypeDefinition entity) {
        int fieldsCount = entity.getFields() == null ? 0 : entity.getFields().size();
        return new BusinessTypeResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            entity.getSortOrder(),
            fieldsCount
        );
    }

    public BusinessTypeDetailResponse toDetailResponse(BusinessTypeDefinition entity) {
        return new BusinessTypeDetailResponse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.isActive(),
            entity.getSortOrder(),
            toFieldResponses(entity.getFields())
        );
    }

    public BusinessConfigResponse toConfigResponse(BusinessTypeDefinition entity) {
        List<BusinessTypeFieldResponse> fields = entity.getFields() == null
            ? List.of()
            : entity.getFields().stream()
                .filter(BusinessTypeField::isEnabled)
                .sorted(java.util.Comparator.comparingInt(BusinessTypeField::getSortOrder).thenComparingInt(BusinessTypeField::getId))
                .map(this::toFieldResponse)
                .toList();
        return new BusinessConfigResponse(entity.getCode(), entity.getName(), fields);
    }

    public BusinessTypeFieldResponse toFieldResponse(BusinessTypeField field) {
        return new BusinessTypeFieldResponse(
            field.getId(),
            field.getFieldKey(),
            field.getLabel(),
            field.getFieldType(),
            field.isRequired(),
            field.isEnabled(),
            field.getSortOrder(),
            field.getPlaceholder(),
            field.getHint(),
            toOptionResponses(field.getOptions())
        );
    }

    public List<BusinessTypeFieldResponse> toFieldResponses(java.util.Collection<BusinessTypeField> fields) {
        if (fields == null || fields.isEmpty()) {
            return List.of();
        }
        return fields.stream()
            .sorted(java.util.Comparator.comparingInt(BusinessTypeField::getSortOrder).thenComparingInt(BusinessTypeField::getId))
            .map(this::toFieldResponse)
            .toList();
    }

    private List<BusinessFieldOptionResponse> toOptionResponses(java.util.Collection<FieldOption> options) {
        if (options == null || options.isEmpty()) {
            return List.of();
        }
        return options.stream()
            .sorted(java.util.Comparator.comparingInt(FieldOption::getSortOrder).thenComparingInt(FieldOption::getId))
            .map(o -> new BusinessFieldOptionResponse(o.getId(), o.getValue(), o.getLabel(), o.getSortOrder()))
            .toList();
    }
}
