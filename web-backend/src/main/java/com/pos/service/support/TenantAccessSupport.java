package com.pos.service.support;

import com.pos.entity.Company;
import com.pos.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TenantAccessSupport {

    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;
    private final StoreRepository storeRepository;

    public User currentUser() {
        return currentUserProvider.requireCurrentUser();
    }

    public boolean isSuperAdmin() {
        return currentUserProvider.isSuperAdmin(currentUser());
    }

    public Integer resolveCompanyIdForCreate(Integer requestedCompanyId) {
        User actor = currentUser();
        if (currentUserProvider.isSuperAdmin(actor)) {
            if (requestedCompanyId == null) {
                throw new BadRequestException("Company is required");
            }
            return requestedCompanyId;
        }
        if (actor.getCompany() == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return actor.getCompany().getId();
    }

    public Company requireCompany(Integer companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    public void assertCanAccessCompany(Integer companyId) {
        User actor = currentUser();
        if (currentUserProvider.isSuperAdmin(actor)) {
            return;
        }
        if (actor.getCompany() == null || !actor.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Access denied to this company");
        }
    }

    public void assertCanAccessStore(Store store) {
        if (store.getCompany() == null) {
            return;
        }
        assertCanAccessCompany(store.getCompany().getId());
    }

    public Set<Store> resolveStoresForUser(Integer companyId, List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return Set.of();
        }
        Set<Store> stores = new HashSet<>();
        for (Integer storeId : storeIds) {
            Store store = storeRepository.findByIdWithCompany(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found: " + storeId));
            Integer storeCompanyId = store.getCompany() != null ? store.getCompany().getId() : null;
            if (storeCompanyId == null || !storeCompanyId.equals(companyId)) {
                throw new BadRequestException("Store does not belong to the selected company");
            }
            stores.add(store);
        }
        return stores;
    }

    /** companyId для текущего запроса: JWT → user.company → ошибка. */
    public Integer requireEffectiveCompanyId() {
        User actor = currentUser();
        if (currentUserProvider.isSuperAdmin(actor)) {
            return TenantContext.companyId()
                .orElseThrow(() -> new BadRequestException("Company context is required"));
        }
        if (actor.getCompany() == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return actor.getCompany().getId();
    }

    /** Для read-only операций: null только у SUPER_ADMIN без company в JWT. */
    public Integer effectiveCompanyIdOrNull() {
        User actor = currentUser();
        if (currentUserProvider.isSuperAdmin(actor)) {
            return TenantContext.companyId().orElse(null);
        }
        if (actor.getCompany() == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return actor.getCompany().getId();
    }

    public void assertProductBelongsToTenant(Product product) {
        if (product == null || product.getCompany() == null) {
            return;
        }
        Integer companyId = effectiveCompanyIdOrNull();
        if (companyId != null && !product.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Access denied to this product");
        }
    }
}
