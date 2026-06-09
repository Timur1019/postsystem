package com.pos.service.product.impl;

import com.pos.domain.ProductType;
import com.pos.dto.product.ConstructionProductDetailsRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.RestaurantProductDetailsRequest;
import com.pos.dto.product.RetailExtrasRequest;
import com.pos.dto.product.ServiceProductDetailsRequest;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.ConstructionProductDetails;
import com.pos.entity.Product;
import com.pos.entity.RestaurantProductDetails;
import com.pos.entity.RetailProductDetails;
import com.pos.entity.ServiceProductDetails;
import com.pos.service.product.ProductExtensionService;
import com.pos.util.TextUtil;
import com.pos.service.product.ProductTypeSupport;
import org.springframework.stereotype.Service;

@Service
public class ProductExtensionServiceImpl implements ProductExtensionService {

    @Override
    public void applyOnCreate(Product product, CreateProductRequest req) {
        ProductType type = ProductTypeSupport.resolve(req.productType(), req.saleType());
        product.setProductType(type);
        clearExtensions(product);
        switch (type) {
            case RETAIL -> {
                applyRetailFlags(product, req.soldIndividually(), req.markedProduct());
                applyRetailExtras(product, req.retailExtras());
            }
            case MATERIAL -> applyConstruction(product, req.constructionDetails());
            case DISH -> applyRestaurant(product, req.restaurantDetails());
            case SERVICE -> applyService(product, req.serviceDetails());
            default -> {
            }
        }
    }

    @Override
    public void applyOnUpdate(Product product, UpdateProductRequest req) {
        if (req.productType() != null && req.productType() != product.getProductType()) {
            product.setProductType(req.productType());
            clearExtensions(product);
        }
        ProductType type = product.getProductType();
        switch (type) {
            case RETAIL -> {
                if (req.soldIndividually() != null || req.markedProduct() != null) {
                    applyRetailFlags(product, req.soldIndividually(), req.markedProduct());
                }
                if (req.retailExtras() != null) {
                    applyRetailExtras(product, req.retailExtras());
                }
            }
            case MATERIAL -> {
                if (req.constructionDetails() != null) {
                    applyConstruction(product, req.constructionDetails());
                }
            }
            case DISH -> {
                if (req.restaurantDetails() != null) {
                    applyRestaurant(product, req.restaurantDetails());
                }
            }
            case SERVICE -> {
                if (req.serviceDetails() != null) {
                    applyService(product, req.serviceDetails());
                }
            }
            default -> {
            }
        }
    }

    @Override
    public void applyRetailFlags(Product product, Boolean soldIndividually, Boolean markedProduct) {
        boolean sold = soldIndividually == null || soldIndividually;
        boolean marked = Boolean.TRUE.equals(markedProduct);
        product.setSoldIndividually(sold);
        product.setMarkedProduct(marked);

        RetailProductDetails details = product.getRetailDetails();
        if (details == null) {
            details = RetailProductDetails.builder().product(product).build();
            product.setRetailDetails(details);
        }
        details.setSoldIndividually(sold);
        details.setMarkedProduct(marked);
    }

    @Override
    public void applyConstruction(Product product, ConstructionProductDetailsRequest req) {
        if (req == null) {
            if (product.getConstructionDetails() == null) {
                product.setConstructionDetails(ConstructionProductDetails.builder().product(product).build());
            }
            return;
        }
        ConstructionProductDetails details = product.getConstructionDetails();
        if (details == null) {
            details = ConstructionProductDetails.builder().product(product).build();
            product.setConstructionDetails(details);
        }
        details.setStandardLength(req.standardLength());
        details.setWidth(req.width());
        details.setThickness(req.thickness());
        if (req.allowCutting() != null) {
            details.setAllowCutting(req.allowCutting());
        }
    }

    @Override
    public void applyRestaurant(Product product, RestaurantProductDetailsRequest req) {
        if (req == null) {
            if (product.getRestaurantDetails() == null) {
                product.setRestaurantDetails(RestaurantProductDetails.builder().product(product).build());
            }
            return;
        }
        RestaurantProductDetails details = product.getRestaurantDetails();
        if (details == null) {
            details = RestaurantProductDetails.builder().product(product).build();
            product.setRestaurantDetails(details);
        }
        details.setPreparationTimeMinutes(req.preparationTimeMinutes());
        details.setKitchenDepartment(req.kitchenDepartment());
        if (req.comboComponent() != null) {
            details.setComboComponent(req.comboComponent());
        }
    }

    @Override
    public void applyService(Product product, ServiceProductDetailsRequest req) {
        if (req == null) {
            if (product.getServiceDetails() == null) {
                product.setServiceDetails(ServiceProductDetails.builder().product(product).build());
            }
            return;
        }
        ServiceProductDetails details = product.getServiceDetails();
        if (details == null) {
            details = ServiceProductDetails.builder().product(product).build();
            product.setServiceDetails(details);
        }
        details.setDurationMinutes(req.durationMinutes());
        if (req.requiresAppointment() != null) {
            details.setRequiresAppointment(req.requiresAppointment());
        }
    }

    @Override
    public void applyRetailExtras(Product product, RetailExtrasRequest req) {
        if (req == null) {
            return;
        }
        RetailProductDetails details = product.getRetailDetails();
        if (details == null) {
            details = RetailProductDetails.builder().product(product).build();
            product.setRetailDetails(details);
        }
        if (req.clothingSizeRange() != null) {
            details.setClothingSizeRange(TextUtil.trimOrNull(req.clothingSizeRange()));
        }
        if (req.clothingColor() != null) {
            details.setClothingColor(TextUtil.trimOrNull(req.clothingColor()));
        }
        if (req.clothingGender() != null) {
            details.setClothingGender(TextUtil.trimOrNull(req.clothingGender()));
        }
        if (req.pharmacyExpiryRequired() != null) {
            details.setPharmacyExpiryRequired(req.pharmacyExpiryRequired());
        }
        if (req.pharmacyPrescriptionRequired() != null) {
            details.setPharmacyPrescriptionRequired(req.pharmacyPrescriptionRequired());
        }
        if (req.pharmacyDosageForm() != null) {
            details.setPharmacyDosageForm(TextUtil.trimOrNull(req.pharmacyDosageForm()));
        }
    }

    private void clearExtensions(Product product) {
        product.setRetailDetails(null);
        product.setConstructionDetails(null);
        product.setRestaurantDetails(null);
        product.setServiceDetails(null);
    }
}
