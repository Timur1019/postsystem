package com.pos.service.product.lifecycle.reference;

import com.pos.dto.product.ProductLifecycleReferenceLabel;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * Поставщик ссылок «движение склада → документ-источник» для одного типа документа
 * (приёмка, инвентаризация, перемещение и т.д.). Каждый новый тип документа =
 * новая реализация интерфейса, без правок остальных контрибьюторов и резолвера.
 */
public interface LifecycleReferenceContributor {

    Map<UUID, ProductLifecycleReferenceLabel> resolve(Collection<UUID> referenceIds);
}
