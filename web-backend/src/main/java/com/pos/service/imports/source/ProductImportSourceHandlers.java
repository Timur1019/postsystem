package com.pos.service.imports.source;

import com.pos.exception.BadRequestException;
import com.pos.service.imports.ProductImportSource;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registry обработчиков импорта. Открыт для расширения через добавление нового {@link ProductImportSourceHandler}.
 */
@Component
public class ProductImportSourceHandlers {

    private final Map<ProductImportSource, ProductImportSourceHandler> byType;

    public ProductImportSourceHandlers(List<ProductImportSourceHandler> handlers) {
        Map<ProductImportSource, ProductImportSourceHandler> map = new EnumMap<>(ProductImportSource.class);
        for (ProductImportSourceHandler handler : handlers) {
            ProductImportSourceHandler previous = map.put(handler.source(), handler);
            if (previous != null) {
                throw new IllegalStateException(
                    "Дублирующий обработчик импорта для " + handler.source()
                        + ": " + previous.getClass().getName()
                        + " и " + handler.getClass().getName()
                );
            }
        }
        this.byType = Map.copyOf(map);
    }

    public ProductImportSourceHandler require(ProductImportSource source) {
        ProductImportSourceHandler handler = byType.get(source);
        if (handler == null) {
            throw new BadRequestException("Источник импорта не поддерживается: " + source);
        }
        return handler;
    }
}
