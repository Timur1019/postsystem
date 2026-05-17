package com.pos.repository.projection;

import java.util.UUID;

public interface ProductDispatchedSum {

    UUID getProductId();

    Long getDispatched();
}
