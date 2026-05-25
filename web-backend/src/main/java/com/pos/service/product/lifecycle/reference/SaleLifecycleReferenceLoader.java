package com.pos.service.product.lifecycle.reference;

import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.entity.Sale;
import com.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Загрузка чеков и их меток. Вынесено отдельно от {@link LifecycleReferenceContributor},
 * потому что чек нужен ещё и как полноценный объект для KPI/мет данных, а не только как label.
 */
@Component
@RequiredArgsConstructor
public class SaleLifecycleReferenceLoader {

    private final SaleRepository saleRepository;

    public Result load(Collection<UUID> referenceIds) {
        Map<UUID, ProductLifecycleReferenceLabel> labels = new HashMap<>();
        Map<UUID, Sale> sales = new HashMap<>();
        for (Sale sale : saleRepository.findAllById(referenceIds)) {
            sales.put(sale.getId(), sale);
            labels.put(sale.getId(), new ProductLifecycleReferenceLabel("SALE", sale.getReceiptNumber()));
        }
        return new Result(labels, sales);
    }

    public record Result(Map<UUID, ProductLifecycleReferenceLabel> labels, Map<UUID, Sale> sales) {
    }
}
