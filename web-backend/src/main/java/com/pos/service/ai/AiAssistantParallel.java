package com.pos.service.ai;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

@Component
public class AiAssistantParallel {

    private final Executor executor;
    private final TransactionTemplate readOnlyTx;

    public AiAssistantParallel(
            @Qualifier("aiAssistantExecutor") Executor executor,
            PlatformTransactionManager transactionManager
    ) {
        this.executor = executor;
        this.readOnlyTx = new TransactionTemplate(transactionManager);
        this.readOnlyTx.setReadOnly(true);
    }

    public <T> CompletableFuture<T> supply(Supplier<T> supplier) {
        return CompletableFuture.supplyAsync(
                () -> readOnlyTx.execute(status -> supplier.get()),
                executor
        );
    }

    public static void awaitAll(CompletableFuture<?>... futures) {
        CompletableFuture.allOf(futures).join();
    }
}
