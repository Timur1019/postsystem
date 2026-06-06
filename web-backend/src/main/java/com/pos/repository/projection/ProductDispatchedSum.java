package com.pos.repository.projection;

import java.util.UUID;

public record ProductDispatchedSum(UUID productId, long dispatched) {}
