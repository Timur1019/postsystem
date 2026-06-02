package com.pos.service.product.impl;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Product;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.product.ProductQueryService;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.stock.StoreStockService;
import com.pos.service.support.AbstractProductCatalogSupport;
import com.pos.service.support.TenantAccessSupport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductQueryServiceImpl extends AbstractProductCatalogSupport implements ProductQueryService {

    private final ProductResponseAssembler assembler;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;

    public ProductQueryServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository,
        ProductResponseAssembler assembler,
        StoreStockService storeStockService,
        TenantAccessSupport tenantAccess
    ) {
        super(productRepository, categoryRepository, productBarcodeRepository, productStorePriceRepository, storeRepository);
        this.assembler = assembler;
        this.storeStockService = storeStockService;
        this.tenantAccess = tenantAccess;
    }

    @Override
    public PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Pageable pageable
    ) {
        String scope = deletedScope != null ? deletedScope : (activeOnly ? "ACTIVE" : "ALL");
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            tenantAccess.effectiveCompanyIdOrNull(),
            search, categoryId, scope, storeId, ikpuStatus, markedProduct, soldIndividually, barcodeExact
        );
        Page<Product> page = productRepository.findAll(spec, pageable);
        return mapPage(page, storeId);
    }

    @Override
    public PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<Product> spec = ProductSpecifications.warehouseFilter(
            companyId, search, barcodeContains, markedProduct
        );
        Page<Product> page = productRepository.findAll(spec, pageable);
        return mapPage(page, null);
    }

    @Override
    public ProductResponse getProduct(UUID id, Integer storeId) {
        Product product = findDetailed(id);
        tenantAccess.assertProductBelongsToTenant(product);
        return forStore(assembler.toResponse(product), product, storeId);
    }

    @Override
    public ProductResponse getByBarcode(String barcode) {
        return assembler.toResponse(validateBarcodeProduct(resolveByBarcode(barcode), null));
    }

    @Override
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        Product product = validateBarcodeProduct(resolveByBarcode(barcode), storeId);
        ProductResponse base = assembler.toResponse(product);
        return forStore(base, product, storeId);
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return productRepository.findLowStockProductsByCompanyId(companyId, PageRequest.of(0, 500)).stream()
            .map(assembler::toResponse)
            .collect(Collectors.toList());
    }

    private PageResponse<ProductResponse> mapPage(Page<Product> page, Integer storeId) {
        List<Product> content = page.getContent();
        Map<UUID, Integer> storeCounts = loadStoreCounts(content);
        Map<UUID, Integer> dispatched = assembler.loadDispatchedCounts(content);
        if (storeId == null) {
            return PageResponse.from(page.map(p -> assembler.toResponse(p, storeCounts, dispatched)));
        }
        Map<UUID, Integer> storeQty = storeStockService.getQuantities(
            content.stream().map(Product::getId).toList(),
            storeId
        );
        return PageResponse.from(page.map(p -> {
            ProductResponse base = assembler.toResponse(p, storeCounts, dispatched);
            int qty = storeQty.getOrDefault(p.getId(), 0);
            ProductResponse withQty = assembler.withStockQuantity(base, qty);
            BigDecimal price = productStorePriceRepository
                .findByProduct_IdAndStore_Id(p.getId(), storeId)
                .map(sp -> sp.getPrice())
                .orElse(p.getSellingPrice());
            return assembler.withSellingPrice(withQty, price);
        }));
    }

    private ProductResponse forStore(ProductResponse base, Product product, Integer storeId) {
        if (storeId == null) {
            return base;
        }
        int qty = storeStockService.getQuantity(product.getId(), storeId);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
        return assembler.withSellingPrice(withQty, price);
    }

    private Product validateBarcodeProduct(Product product, Integer storeId) {
        if (!product.isActive()) {
            throw new BadRequestException("Product is not active");
        }
        if (storeId != null
            && productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId).isEmpty()) {
            throw new BadRequestException("Product is not available in this store");
        }
        return product;
    }

    private Product resolveByBarcode(String barcode) {
        Optional<Product> primary = productRepository.findByBarcode(barcode);
        if (primary.isPresent()) {
            return primary.get();
        }
        return productBarcodeRepository.findByBarcode(barcode)
            .map(pb -> pb.getProduct())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found for barcode: " + barcode));
    }
}
