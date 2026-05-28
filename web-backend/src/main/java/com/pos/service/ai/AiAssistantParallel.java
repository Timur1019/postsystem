package com.pos.service.ai;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

@Component
public class AiAssistantParallel {

    private final Executor executor;

    public AiAssistantParallel(@Qualifier("aiAssistantExecutor") Executor executor) {
        this.executor = executor;
    }

    public <T> CompletableFuture<T> supply(Supplier<T> supplier) {
        return CompletableFuture.supplyAsync(supplier, executor);
    }

    public static void awaitAll(CompletableFuture<?>... futures) {
        CompletableFuture.allOf(futures).join();
    }
}
