package com.pos.repository;

import com.pos.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, ProductAttribute.ProductAttributeId> {

    List<ProductAttribute> findByProductIdOrderByFieldKeyAsc(UUID productId);

    void deleteByProductId(UUID productId);
}
