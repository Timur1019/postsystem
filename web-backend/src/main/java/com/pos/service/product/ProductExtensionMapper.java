package com.pos.service.product;

import com.pos.dto.product.ConstructionProductDetailsDto;
import com.pos.dto.product.RestaurantProductDetailsDto;
import com.pos.dto.product.ServiceProductDetailsDto;
import com.pos.entity.ConstructionProductDetails;
import com.pos.entity.RestaurantProductDetails;
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
