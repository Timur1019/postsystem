package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.monitoring.LogEventDto;
import com.pos.dto.monitoring.MetricDetail;
import com.pos.dto.monitoring.MetricSummary;
import com.pos.dto.monitoring.SystemOverviewResponse;
import com.pos.exception.ResourceNotFoundException;
import com.pos.monitoring.SystemMonitorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Platform Monitoring", description = "Мониторинг системы: метрики, логи, обзор (SUPER_ADMIN)")
@StandardApiResponses
public class PlatformMonitoringController {

    private final SystemMonitorService monitorService;

    @GetMapping("/overview")
    @Operation(summary = "Обзор системы", description = "Сводные показатели состояния платформы")
    @ApiResponse(responseCode = "200", description = "Обзор системы")
    public ResponseEntity<SystemOverviewResponse> overview() {
        return ResponseEntity.ok(monitorService.overview());
    }

    @GetMapping("/metrics")
    @Operation(summary = "Список метрик", description = "Доступные метрики с опциональным поиском")
    @ApiResponse(responseCode = "200", description = "Список метрик")
    public ResponseEntity<List<MetricSummary>> metrics(
        @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(monitorService.listMetrics(search));
    }

    @GetMapping("/metrics/{name}")
    @Operation(summary = "Детали метрики", description = "Подробная информация о конкретной метрике")
    @ApiResponse(responseCode = "200", description = "Детали метрики")
    public ResponseEntity<MetricDetail> metricDetail(@PathVariable("name") String name) {
        return monitorService.metricDetail(name)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Metric not found: " + name));
    }

    @GetMapping("/logs")
    @Operation(summary = "Журнал логов", description = "Последние события логов с фильтром по уровню")
    @ApiResponse(responseCode = "200", description = "Список логов")
    public ResponseEntity<List<LogEventDto>> logs(
        @RequestParam(value = "limit", defaultValue = "200") int limit,
        @RequestParam(value = "level", required = false) String level
    ) {
        return ResponseEntity.ok(monitorService.recentLogs(limit, level));
    }

    @DeleteMapping("/logs")
    @Operation(summary = "Очистить логи", description = "Удаление всех записей из буфера логов")
    @ApiResponse(responseCode = "204", description = "Логи очищены")
    public ResponseEntity<Void> clearLogs() {
        monitorService.clearLogs();
        return ResponseEntity.noContent().build();
    }
}
