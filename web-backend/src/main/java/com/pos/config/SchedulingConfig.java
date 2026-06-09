package com.pos.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableScheduling
@EnableConfigurationProperties({PosCacheProperties.class, SecurityCacheProperties.class})
public class SchedulingConfig {

    /**
     * Пул только для параллельного прогрева кешей (аналитика + журнал) — без {@code ForkJoinPool.commonPool()}.
     */
    @Bean(name = "posCacheWarmupExecutor")
    public ThreadPoolTaskExecutor posCacheWarmupExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("pos-cache-warm-");
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(2);
        ex.setQueueCapacity(4);
        ex.initialize();
        return ex;
    }
}
