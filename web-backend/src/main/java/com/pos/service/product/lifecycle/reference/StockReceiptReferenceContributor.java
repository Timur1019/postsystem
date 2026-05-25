package com.pos.service.product.lifecycle.reference;

import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.entity.StockReceipt;
import com.pos.repository.StockReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
class StockReceiptReferenceContributor implements LifecycleReferenceContributor {

    private final StockReceiptRepository stockReceiptRepository;

    @Override
    public Map<UUID, ProductLifecycleReferenceLabel> resolve(Collection<UUID> referenceIds) {
        Map<UUID, ProductLifecycleReferenceLabel> result = new HashMap<>();
        for (StockReceipt receipt : stockReceiptRepository.findAllById(referenceIds)) {
            result.put(receipt.getId(), new ProductLifecycleReferenceLabel("RECEIPT", receipt.getReceiptNumber()));
        }
        return result;
    }
}
