package com.pos.service.analytics.impl;

import com.pos.cache.analytics.ReportAnalyticsCache;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.entity.Company;
import com.pos.exception.CacheRefreshException;
import com.pos.repository.CompanyRepository;
import com.pos.service.analytics.ReportAnalyticsCacheLoader;
import com.pos.service.analytics.ReportAnalyticsCacheService;
import com.pos.service.cache.PosCacheRefreshTask;
import com.pos.util.LogUtil;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Order(1)
public class ReportAnalyticsCacheServiceImpl implements ReportAnalyticsCacheService, PosCacheRefreshTask {

    private final ReportAnalyticsCacheLoader loader;
    private final ReportAnalyticsCache cache;
    private final CompanyRepository companyRepository;

    public ReportAnalyticsCacheServiceImpl(
        ReportAnalyticsCacheLoader loader,
        ReportAnalyticsCache cache,
        CompanyRepository companyRepository
    ) {
        this.loader = loader;
        this.cache = cache;
        this.companyRepository = companyRepository;
    }

    @Override
    public String cacheName() {
        return "analytics";
    }

    @Override
    public synchronized void refresh() {
        List<Company> companies = companyRepository.findByActiveTrueOrderByNameAsc();
        if (companies.isEmpty()) {
            return;
        }
        for (Company company : companies) {
            long started = System.currentTimeMillis();
            try {
                ReportAnalyticsSnapshot snapshot = loader.loadSnapshot(company.getId());
                cache.replace(company.getId(), snapshot);
                LogUtil.info(
                    ReportAnalyticsCacheServiceImpl.class,
                    "Analytics cache refreshed for company {} in {} ms ({} .. {}, {} days)",
                    company.getId(),
                    System.currentTimeMillis() - started,
                    snapshot.windowStart(),
                    snapshot.windowEnd(),
                    snapshot.dailyByDate().size()
                );
            } catch (RuntimeException e) {
                LogUtil.error(ReportAnalyticsCacheServiceImpl.class, "Analytics cache refresh failed for company " + company.getId(), e);
                if (e instanceof CacheRefreshException cre) {
                    throw cre;
                }
                throw new CacheRefreshException("Analytics cache refresh failed for company " + company.getId(), e);
            }
        }
    }

    @Override
    public boolean isReady() {
        return cache.hasAny();
    }
}
