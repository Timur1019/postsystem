package com.pos.service.impl;

import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.BusinessTypeField;
import com.pos.entity.ProductAttribute;
import com.pos.exception.BadRequestException;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.ProductAttributeRepository;
import com.pos.service.ProductAttributeService;
import com.pos.util.BusinessTypeParser;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductAttributeServiceImpl implements ProductAttributeService {

    private final ProductAttributeRepository attributeRepository;
    private final BusinessTypeDefinitionRepository typeRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAttributes(UUID productId) {
        return attributeRepository.findByProductIdOrderByFieldKeyAsc(productId).stream()
            .collect(Collectors.toMap(
                ProductAttribute::getFieldKey,
                row -> row.getValueText() == null ? "" : row.getValueText(),
                (a, b) -> b,
                LinkedHashMap::new
            ));
    }

    @Override
    public void saveAttributes(UUID productId, String businessTypeCode, Map<String, String> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            attributeRepository.deleteByProductId(productId);
            return;
        }

        BusinessTypeDefinition type = typeRepository.findActiveDetailedByCode(
            BusinessTypeParser.parseOrDefault(businessTypeCode, com.pos.domain.BusinessType.UNIVERSAL).name()
        ).orElse(null);

        Map<String, BusinessTypeField> allowed = type == null
            ? Map.of()
            : type.getFields().stream()
                .filter(BusinessTypeField::isEnabled)
                .collect(Collectors.toMap(f -> f.getFieldKey().toLowerCase(), f -> f, (a, b) -> a));

        Map<String, String> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : attributes.entrySet()) {
            if (!StringUtils.hasText(entry.getKey())) {
                continue;
            }
            String key = entry.getKey().trim().toLowerCase();
            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            if (!allowed.containsKey(key)) {
                continue;
            }
            BusinessTypeField field = allowed.get(key);
            if (field.isRequired() && !StringUtils.hasText(value)) {
                throw new BadRequestException("Required field is empty: " + field.getLabel());
            }
            if (StringUtils.hasText(value)) {
                normalized.put(key, value);
            }
        }

        for (BusinessTypeField field : allowed.values()) {
            if (field.isRequired() && !normalized.containsKey(field.getFieldKey().toLowerCase())) {
                throw new BadRequestException("Required field is empty: " + field.getLabel());
            }
        }

        attributeRepository.deleteByProductId(productId);
        if (normalized.isEmpty()) {
            return;
        }

        List<ProductAttribute> rows = normalized.entrySet().stream()
            .map(e -> ProductAttribute.builder()
                .productId(productId)
                .fieldKey(e.getKey())
                .valueText(e.getValue())
                .build())
            .toList();
        attributeRepository.saveAll(rows);
        LogUtil.info(ProductAttributeServiceImpl.class, "Product attributes saved: productId={}, count={}",
            productId, rows.size());
    }
}
