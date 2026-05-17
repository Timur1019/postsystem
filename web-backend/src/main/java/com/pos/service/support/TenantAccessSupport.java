package com.pos.service.support;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
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
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found: " + storeId));
            if (store.getCompany() == null || !store.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Store does not belong to the selected company");
            }
            stores.add(store);
        }
        return stores;
    }
}
