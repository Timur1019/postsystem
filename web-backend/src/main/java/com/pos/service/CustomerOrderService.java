package com.pos.service;

import com.pos.dto.order.CreateCustomerOrderRequest;
import com.pos.dto.order.CustomerOrderCreatedResponse;
import com.pos.dto.order.CustomerOrderRowResponse;
import com.pos.dto.order.CourierOptionResponse;
import com.pos.dto.order.PhotoDownload;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CustomerOrderService {

    PageResponse<CustomerOrderRowResponse> list(
        String search,
        String externalNumber,
        String clientName,
        String address,
        UUID courierId,
        String status,
        LocalDate createdFrom,
        LocalDate createdTo,
        Pageable pageable
    );

    List<CourierOptionResponse> listCourierCandidates();

    CustomerOrderCreatedResponse createOrder(CreateCustomerOrderRequest req, String username);

    CustomerOrderCreatedResponse createWithPhotos(int storeId, List<MultipartFile> photos, String username);

    PhotoDownload loadPhoto(long orderId, int slot);
}
