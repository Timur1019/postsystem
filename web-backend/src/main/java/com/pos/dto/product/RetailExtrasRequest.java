package com.pos.dto.product;

public record RetailExtrasRequest(
    String clothingSizeRange,
    String clothingColor,
    String clothingGender,
    Boolean pharmacyExpiryRequired,
    Boolean pharmacyPrescriptionRequired,
    String pharmacyDosageForm
) {}
