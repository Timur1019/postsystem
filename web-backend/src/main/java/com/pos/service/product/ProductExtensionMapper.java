package com.pos.service.product;

import com.pos.dto.product.ConstructionProductDetailsDto;
import com.pos.dto.product.RestaurantProductDetailsDto;
import com.pos.dto.product.RetailExtrasDto;
import com.pos.dto.product.ServiceProductDetailsDto;
import com.pos.entity.ConstructionProductDetails;
import com.pos.entity.RestaurantProductDetails;
import com.pos.entity.RetailProductDetails;
import com.pos.entity.ServiceProductDetails;
import org.springframework.stereotype.Component;

@Component
public class ProductExtensionMapper {

    public ConstructionProductDetailsDto toDto(ConstructionProductDetails details) {
        if (details == null) {
            return null;
        }
        return new ConstructionProductDetailsDto(
            details.getStandardLength(),
            details.getWidth(),
            details.getThickness(),
            details.isAllowCutting()
        );
    }

    public RestaurantProductDetailsDto toDto(RestaurantProductDetails details) {
        if (details == null) {
            return null;
        }
        return new RestaurantProductDetailsDto(
            details.getPreparationTimeMinutes(),
            details.getKitchenDepartment(),
            details.isComboComponent()
        );
    }

    public RetailExtrasDto toDto(RetailProductDetails details) {
        if (details == null) {
            return null;
        }
        boolean hasClothing = details.getClothingSizeRange() != null
            || details.getClothingColor() != null
            || details.getClothingGender() != null;
        boolean hasPharmacy = details.isPharmacyExpiryRequired()
            || details.isPharmacyPrescriptionRequired()
            || details.getPharmacyDosageForm() != null;
        if (!hasClothing && !hasPharmacy) {
            return null;
        }
        return new RetailExtrasDto(
            details.getClothingSizeRange(),
            details.getClothingColor(),
            details.getClothingGender(),
            details.isPharmacyExpiryRequired(),
            details.isPharmacyPrescriptionRequired(),
            details.getPharmacyDosageForm()
        );
    }

    public ServiceProductDetailsDto toDto(ServiceProductDetails details) {
        if (details == null) {
            return null;
        }
        return new ServiceProductDetailsDto(
            details.getDurationMinutes(),
            details.isRequiresAppointment()
        );
    }
}
