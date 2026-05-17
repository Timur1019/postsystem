package com.pos.service.tasnif;

import com.pos.dto.tasnif.MxikCatalogItemDto;
import com.pos.dto.tasnif.MxikLookupDto;
import com.pos.dto.tasnif.MxikSearchResponse;

public interface TasnifMxikService {

    MxikSearchResponse search(String query, String lang, int page, int size);

    MxikCatalogItemDto getByMxik(String mxik, String lang);

    MxikLookupDto lookupByIkpu(String ikpu, String lang);

    MxikLookupDto lookupByBarcode(String barcode, String lang);
}
