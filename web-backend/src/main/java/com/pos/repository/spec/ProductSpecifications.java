package com.pos.repository.spec;

import com.pos.entity.Product;
import com.pos.entity.ProductBarcode;
import com.pos.entity.ProductStorePrice;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> catalogFilter(
        Integer companyId,
        String search,
        Integer categoryId,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact
    ) {
        return (root, query, cb) -> {

            List<Predicate> parts = new ArrayList<>();

            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                query.distinct(true);
                String like = "%" + q.toLowerCase() + "%";
                Join<Product, ProductBarcode> extras = root.join("extraBarcodes", JoinType.LEFT);
                var name = cb.like(cb.lower(root.get("name")), like);
                var sku = cb.like(cb.lower(root.get("sku")), like);
                var description = cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(cb.lower(root.get("description")), like)
                );
                var unitOfMeasure = cb.and(
                    cb.isNotNull(root.get("unitOfMeasure")),
                    cb.like(cb.lower(root.get("unitOfMeasure")), like)
                );
                var bc = cb.and(
                    cb.isNotNull(root.get("barcode")),
                    cb.like(cb.lower(root.get("barcode")), like)
                );
                var extraBc = cb.and(
                    cb.isNotNull(extras.get("barcode")),
                    cb.like(cb.lower(extras.get("barcode")), like)
                );
                var ikpu = cb.and(
                    cb.isNotNull(root.get("ikpu")),
                    cb.like(cb.lower(root.get("ikpu")), like)
                );
                parts.add(cb.or(name, sku, description, unitOfMeasure, bc, extraBc, ikpu));
            }

            if (categoryId != null) {
                parts.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            String scope = deletedScope != null ? deletedScope : "ACTIVE";
            switch (scope) {
                case "ALL" -> { /* no filter */ }
                case "DELETED" -> parts.add(cb.isFalse(root.get("isActive")));
                default -> parts.add(cb.isTrue(root.get("isActive")));
            }

            if (StringUtils.hasText(ikpuStatus) && !"ALL".equalsIgnoreCase(ikpuStatus)) {
                parts.add(cb.equal(root.get("ikpuStatus"), ikpuStatus));
            }

            if (markedProduct != null) {
                parts.add(cb.equal(root.get("markedProduct"), markedProduct));
            }

            if (soldIndividually != null) {
                parts.add(cb.equal(root.get("soldIndividually"), soldIndividually));
            }

            if (StringUtils.hasText(barcodeExact)) {
                parts.add(cb.equal(root.get("barcode"), barcodeExact.trim()));
            }

            if (storeId != null) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<ProductStorePrice> spRoot = sq.from(ProductStorePrice.class);
                sq.select(cb.literal(1L));
                sq.where(
                    cb.equal(spRoot.get("product").get("id"), root.get("id")),
                    cb.equal(spRoot.get("store").get("id"), storeId)
                );
                parts.add(cb.exists(sq));
            }

            return parts.isEmpty() ? cb.conjunction() : cb.and(parts.toArray(new Predicate[0]));
        };
    }

    /**
     * Склад: только активные товары; поиск по названию; штрихкод (основной или доп.);
     * фильтр по маркировке.
     */
    public static Specification<Product> warehouseFilter(
        Integer companyId,
        String search,
        String barcodeContains,
        Boolean markedProduct
    ) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();
            parts.add(cb.isTrue(root.get("isActive")));
            if (companyId != null) {
                parts.add(cb.equal(root.get("company").get("id"), companyId));
            }

            String q = search != null ? search.trim() : "";
            if (StringUtils.hasText(q)) {
                String like = "%" + q.toLowerCase() + "%";
                parts.add(cb.like(cb.lower(root.get("name")), like));
            }

            if (markedProduct != null) {
                parts.add(cb.equal(root.get("markedProduct"), markedProduct));
            }

            if (StringUtils.hasText(barcodeContains)) {
                // LEFT JOIN + DISTINCT: correlated EXISTS в count-запросе Spring Data иногда даёт 500 на Hibernate 6
                query.distinct(true);
                String bcLike = "%" + barcodeContains.trim().toLowerCase() + "%";
                Join<Product, ProductBarcode> extras = root.join("extraBarcodes", JoinType.LEFT);
                var primaryLike = cb.and(
                    cb.isNotNull(root.get("barcode")),
                    cb.like(cb.lower(root.get("barcode")), bcLike)
                );
                var extraLike = cb.and(
                    cb.isNotNull(extras.get("barcode")),
                    cb.like(cb.lower(extras.get("barcode")), bcLike)
                );
                parts.add(cb.or(primaryLike, extraLike));
            }

            return cb.and(parts.toArray(new Predicate[0]));
        };
    }

    /** Товар имеет цену хотя бы в одном из указанных магазинов. */
    public static Specification<Product> storePriceInOneOf(List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            Subquery<Long> sq = query.subquery(Long.class);
            Root<ProductStorePrice> spRoot = sq.from(ProductStorePrice.class);
            sq.select(cb.literal(1L));
            sq.where(
                cb.equal(spRoot.get("product").get("id"), root.get("id")),
                spRoot.get("store").get("id").in(storeIds)
            );
            return cb.exists(sq);
        };
    }
}
