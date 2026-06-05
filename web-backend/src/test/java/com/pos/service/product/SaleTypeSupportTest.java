package com.pos.service.product;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SaleTypeSupportTest {

    @Test
    void resolve_weightFromKgAndLiter() {
        assertEquals(SaleType.WEIGHT, SaleTypeSupport.resolve(null, "кг"));
        assertEquals(SaleType.WEIGHT, SaleTypeSupport.resolve(null, "л"));
        assertEquals(SaleType.WEIGHT, SaleTypeSupport.resolve(null, "литр"));
        assertEquals(SaleType.WEIGHT, SaleTypeSupport.resolve(null, "g"));
    }

    @Test
    void resolve_pieceFromDonaAndPack() {
        assertEquals(SaleType.PIECE, SaleTypeSupport.resolve(null, "dona"));
        assertEquals(SaleType.PIECE, SaleTypeSupport.resolve(null, "шт"));
        assertEquals(SaleType.PIECE, SaleTypeSupport.resolve(null, "упаковка"));
        assertEquals(SaleType.PIECE, SaleTypeSupport.resolve(null, "pachka"));
    }

    @Test
    void importRules_kgGetsWeightScale() {
        ProductQuantityRules rules = ProductQuantityRulesResolver.resolve(null, null, null, null, "кг");
        assertEquals(SaleType.WEIGHT, rules.saleType());
        assertEquals(UnitCode.KG, rules.unitCode());
        assertEquals(3, rules.quantityScale());
        assertTrue(rules.allowFraction());
    }

    @Test
    void importRules_literGetsWeightWithL() {
        ProductQuantityRules rules = ProductQuantityRulesResolver.resolve(null, null, null, null, "л");
        assertEquals(SaleType.WEIGHT, rules.saleType());
        assertEquals(UnitCode.L, rules.unitCode());
        assertTrue(rules.allowFraction());
    }

    @Test
    void importRules_donaIsPieceInteger() {
        ProductQuantityRules rules = ProductQuantityRulesResolver.resolve(null, null, null, null, "dona");
        assertEquals(SaleType.PIECE, rules.saleType());
        assertEquals(UnitCode.PCS, rules.unitCode());
        assertEquals(0, rules.quantityScale());
        assertFalse(rules.allowFraction());
    }
}
