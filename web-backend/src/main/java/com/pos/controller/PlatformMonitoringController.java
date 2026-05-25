package com.pos.controller;

import com.pos.dto.monitoring.LogEventDto;
import com.pos.dto.monitoring.MetricDetail;
import com.pos.dto.monitoring.MetricSummary;
import com.pos.dto.monitoring.SystemOverviewResponse;
import com.pos.exception.ResourceNotFoundException;
import com.pos.monitoring.SystemMonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/platform/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PlatformMonitoringController {

    private final SystemMonitorService monitorService;

    @GetMapping("/overview")
    public ResponseEntity<SystemOverviewResponse> overview() {
        return ResponseEntity.ok(monitorService.overview());
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<MetricSummary>> metrics(
        @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(monitorService.listMetrics(search));
    }

    @GetMapping("/metrics/{name}")
    public ResponseEntity<MetricDetail> metricDetail(@PathVariable("name") String name) {
        return monitorService.metricDetail(name)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Metric not found: " + name));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<LogEventDto>> logs(
        @RequestParam(value = "limit", defaultValue = "200") int limit,
        @RequestParam(value = "level", required = false) String level
    ) {
        return ResponseEntity.ok(monitorService.recentLogs(limit, level));
    }

    @DeleteMapping("/logs")
    public ResponseEntity<Void> clearLogs() {
        monitorService.clearLogs();
        return ResponseEntity.noContent().build();
    }
}
