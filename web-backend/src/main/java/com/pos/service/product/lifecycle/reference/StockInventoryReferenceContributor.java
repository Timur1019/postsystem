package com.pos.service.product.lifecycle.reference;

import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.entity.StockInventory;
import com.pos.repository.StockInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
class StockInventoryReferenceContributor implements LifecycleReferenceContributor {

    private final StockInventoryRepository stockInventoryRepository;

    @Override
    public Map<UUID, ProductLifecycleReferenceLabel> resolve(Collection<UUID> referenceIds) {
        Map<UUID, ProductLifecycleReferenceLabel> result = new HashMap<>();
        for (StockInventory inventory : stockInventoryRepository.findAllById(referenceIds)) {
            result.put(inventory.getId(), new ProductLifecycleReferenceLabel("INVENTORY", inventory.getInventoryNumber()));
        }
        return result;
    }
}
