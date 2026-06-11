package com.pos.finance.config;

import com.pos.finance.util.LogUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Бизнес-таймзона сервиса. Все LocalDate.now() должны давать локальную дату
 * компании, а не UTC контейнера (иначе записи после полуночи попадают на вчера).
 */
@Configuration
public class TimezoneConfig {

    @Value("${app.timezone:Asia/Tashkent}")
    private String timezone;

    @PostConstruct
    void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(timezone));
        LogUtil.info(TimezoneConfig.class, "Default timezone set to {}", timezone);
    }
}
