package com.pos.repository;

import com.pos.entity.CompanyTenantDisplaySettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyTenantDisplaySettingsRepository extends JpaRepository<CompanyTenantDisplaySettings, Integer> {

    Optional<CompanyTenantDisplaySettings> findByCompanyId(Integer companyId);
}
