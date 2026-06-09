package com.pos.service;

import com.pos.dto.business.*;

import java.util.List;

public interface BusinessTypeDefinitionService {

    List<BusinessTypeResponse> list();

    BusinessTypeDetailResponse getById(Integer id);

    BusinessTypeDetailResponse create(SaveBusinessTypeRequest request);

    BusinessTypeDetailResponse update(Integer id, UpdateBusinessTypeRequest request);

    void delete(Integer id);

    BusinessTypeFieldResponse addField(Integer typeId, SaveBusinessTypeFieldRequest request);

    BusinessTypeFieldResponse updateField(Integer typeId, Integer fieldId, UpdateBusinessTypeFieldRequest request);

    void deleteField(Integer typeId, Integer fieldId);
}
