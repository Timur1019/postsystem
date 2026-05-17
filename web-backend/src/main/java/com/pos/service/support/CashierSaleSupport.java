package com.pos.service.support;

import com.pos.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CashierSaleSupport {

    private final StoreRepository storeRepository;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final CurrentUserProvider currentUserProvider;

    public Store requireStoreForSale(User cashier, Integer storeId) {
        if (storeId == null) {
            throw new BadRequestException("Store is required");
        }
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException("Store not found"));

        if (currentUserProvider.isSuperAdmin(cashier)) {
            return store;
        }

        String role = cashier.getRole().getName();
        if ("ADMIN".equals(role) || "MANAGER".equals(role)) {
            if (cashier.getCompany() != null && store.getCompany() != null
                && !cashier.getCompany().getId().equals(store.getCompany().getId())) {
                throw new BadRequestException("Store does not belong to your company");
            }
            return store;
        }

        Set<Integer> allowed = cashier.getStores().stream().map(Store::getId).collect(Collectors.toSet());
        if (!allowed.isEmpty() && !allowed.contains(storeId)) {
            throw new BadRequestException("You are not assigned to this store");
        }
        if (allowed.isEmpty() && cashier.getCompany() != null && store.getCompany() != null
            && cashier.getCompany().getId().equals(store.getCompany().getId())) {
            return store;
        }
        if (allowed.isEmpty()) {
            throw new BadRequestException("No store assigned to your account");
        }
        return store;
    }

    public BigDecimal resolveUnitPrice(Product product, Integer storeId) {
        if (storeId == null) {
            return product.getSellingPrice();
        }
        return productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
    }
}
