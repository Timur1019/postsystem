package com.pos.service.impl;

import com.pos.dto.business.*;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypeField;
import com.pos.entity.FieldOption;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.BusinessTypeMapper;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.BusinessTypeFieldRepository;
import com.pos.service.BusinessTypeDefinitionService;
import com.pos.util.LogUtil;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessTypeDefinitionServiceImpl implements BusinessTypeDefinitionService {

    private final BusinessTypeDefinitionRepository typeRepository;
    private final BusinessTypeFieldRepository fieldRepository;
    private final BusinessTypeMapper mapper;

    @Override
    public List<BusinessTypeResponse> list() {
        return typeRepository.findAllByOrderBySortOrderAscCodeAsc().stream()
            .map(type -> new BusinessTypeResponse(
                type.getId(),
                type.getCode(),
                type.getName(),
                type.getDescription(),
                type.isActive(),
                type.getSortOrder(),
                (int) fieldRepository.countByBusinessType_Id(type.getId())
            ))
            .toList();
    }

    @Override
    public BusinessTypeDetailResponse getById(Integer id) {
        return mapper.toDetailResponse(requireDetailed(id));
    }

    @Override
    @Transactional
    public BusinessTypeDetailResponse create(SaveBusinessTypeRequest request) {
        String code = request.code().trim().toUpperCase();
        if (typeRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Business type code already exists: " + code);
        }
        BusinessTypeDefinition saved = typeRepository.save(BusinessTypeDefinition.builder()
            .code(code)
            .name(request.name().trim())
            .description(TextUtil.trimOrNull(request.description()))
            .active(request.active() == null || request.active())
            .sortOrder(request.sortOrder() != null ? request.sortOrder() : 100)
            .build());
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Business type created: {}", code);
        return mapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public BusinessTypeDetailResponse update(Integer id, UpdateBusinessTypeRequest request) {
        BusinessTypeDefinition entity = requireDetailed(id);
        entity.setName(request.name().trim());
        entity.setDescription(TextUtil.trimOrNull(request.description()));
        if (request.active() != null) {
            entity.setActive(request.active());
        }
        if (request.sortOrder() != null) {
            entity.setSortOrder(request.sortOrder());
        }
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Business type updated: id={}", id);
        return mapper.toDetailResponse(entity);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        BusinessTypeDefinition entity = requireDetailed(id);
        if ("UNIVERSAL".equalsIgnoreCase(entity.getCode())) {
            throw new BadRequestException("Cannot delete UNIVERSAL business type");
        }
        typeRepository.delete(entity);
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Business type deleted: id={}", id);
    }

    @Override
    @Transactional
    public BusinessTypeFieldResponse addField(Integer typeId, SaveBusinessTypeFieldRequest request) {
        BusinessTypeDefinition type = requireDetailed(typeId);
        String fieldKey = request.fieldKey().trim().toLowerCase();
        if (fieldRepository.existsByBusinessType_IdAndFieldKeyIgnoreCase(typeId, fieldKey)) {
            throw new BadRequestException("Field key already exists: " + fieldKey);
        }
        BusinessTypeField field = BusinessTypeField.builder()
            .businessType(type)
            .fieldKey(fieldKey)
            .label(request.label().trim())
            .fieldType(request.fieldType())
            .required(Boolean.TRUE.equals(request.required()))
            .enabled(request.enabled() == null || request.enabled())
            .sortOrder(request.sortOrder() != null ? request.sortOrder() : 100)
            .placeholder(TextUtil.trimOrNull(request.placeholder()))
            .hint(TextUtil.trimOrNull(request.hint()))
            .build();
        applyOptions(field, request.options());
        type.getFields().add(field);
        BusinessTypeField saved = fieldRepository.save(field);
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Field added: type={}, key={}", type.getCode(), fieldKey);
        return mapper.toFieldResponse(saved);
    }

    @Override
    @Transactional
    public BusinessTypeFieldResponse updateField(
        Integer typeId,
        Integer fieldId,
        UpdateBusinessTypeFieldRequest request
    ) {
        BusinessTypeField field = requireField(typeId, fieldId);
        field.setLabel(request.label().trim());
        field.setFieldType(request.fieldType());
        if (request.required() != null) {
            field.setRequired(request.required());
        }
        if (request.enabled() != null) {
            field.setEnabled(request.enabled());
        }
        if (request.sortOrder() != null) {
            field.setSortOrder(request.sortOrder());
        }
        field.setPlaceholder(TextUtil.trimOrNull(request.placeholder()));
        field.setHint(TextUtil.trimOrNull(request.hint()));
        field.getOptions().clear();
        applyOptions(field, request.options());
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Field updated: id={}", fieldId);
        return mapper.toFieldResponse(field);
    }

    @Override
    @Transactional
    public void deleteField(Integer typeId, Integer fieldId) {
        BusinessTypeField field = requireField(typeId, fieldId);
        fieldRepository.delete(field);
        LogUtil.info(BusinessTypeDefinitionServiceImpl.class, "Field deleted: id={}", fieldId);
    }

    private BusinessTypeDefinition requireDetailed(Integer id) {
        return typeRepository.findDetailedById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Business type not found"));
    }

    private BusinessTypeField requireField(Integer typeId, Integer fieldId) {
        return fieldRepository.findByIdAndBusinessType_Id(fieldId, typeId)
            .orElseThrow(() -> new ResourceNotFoundException("Field not found"));
    }

    private void applyOptions(BusinessTypeField field, List<SaveFieldOptionRequest> options) {
        if (options == null || options.isEmpty()) {
            return;
        }
        List<FieldOption> entities = new ArrayList<>();
        int order = 10;
        for (SaveFieldOptionRequest option : options) {
            entities.add(FieldOption.builder()
                .field(field)
                .value(option.value().trim())
                .label(option.label().trim())
                .sortOrder(option.sortOrder() != null ? option.sortOrder() : order)
                .build());
            order += 10;
        }
        field.getOptions().addAll(entities);
    }

}
