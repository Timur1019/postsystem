package com.pos.monitoring.log;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Превращает singleton-буфер логов в Spring-bean, чтобы сервисы могли
 * инжектить его через конструктор (DIP) и подменять в тестах.
 */
@Configuration
public class LogEventBufferConfig {

    @Bean
    public LogEventBuffer logEventBuffer() {
        return LogEventBuffer.getInstance();
    }
}
