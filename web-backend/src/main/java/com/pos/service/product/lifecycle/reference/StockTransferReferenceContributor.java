package com.pos.service.product.lifecycle.reference;

import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.entity.StockTransfer;
import com.pos.repository.StockTransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
class StockTransferReferenceContributor implements LifecycleReferenceContributor {

    private final StockTransferRepository stockTransferRepository;

    @Override
    public Map<UUID, ProductLifecycleReferenceLabel> resolve(Collection<UUID> referenceIds) {
        Map<UUID, ProductLifecycleReferenceLabel> result = new HashMap<>();
        for (StockTransfer transfer : stockTransferRepository.findAllById(referenceIds)) {
            result.put(transfer.getId(), new ProductLifecycleReferenceLabel("TRANSFER", transfer.getTransferNumber()));
        }
        return result;
    }
}
