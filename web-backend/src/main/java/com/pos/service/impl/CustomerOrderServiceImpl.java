package com.pos.service.impl;

import com.pos.dto.order.CreateCustomerOrderRequest;
import com.pos.dto.order.CustomerOrderCreatedResponse;
import com.pos.dto.order.CustomerOrderRowResponse;
import com.pos.dto.order.CourierOptionResponse;
import com.pos.dto.order.PhotoDownload;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.CustomerOrder;
import com.pos.entity.CustomerOrderPhoto;
import com.pos.entity.OrderStatus;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CustomerOrderMapper;
import com.pos.repository.CustomerOrderPhotoRepository;
import com.pos.repository.CustomerOrderRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.UserRepository;
import com.pos.repository.spec.CustomerOrderSpecifications;
import com.pos.service.CustomerOrderService;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderPhotoRepository photoRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final CustomerOrderMapper customerOrderMapper;
    private final String uploadDir;

    public CustomerOrderServiceImpl(
        CustomerOrderRepository orderRepository,
        CustomerOrderPhotoRepository photoRepository,
        StoreRepository storeRepository,
        UserRepository userRepository,
        CustomerOrderMapper customerOrderMapper,
        @Value("${app.orders.upload-dir:uploads/orders}") String uploadDir
    ) {
        this.orderRepository = orderRepository;
        this.photoRepository = photoRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.customerOrderMapper = customerOrderMapper;
        this.uploadDir = uploadDir;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerOrderRowResponse> list(
        String search,
        String externalNumber,
        String clientName,
        String address,
        UUID courierId,
        String status,
        LocalDate createdFrom,
        LocalDate createdTo,
        Pageable pageable
    ) {
        Instant fromInst = createdFrom != null
            ? createdFrom.atStartOfDay(ZoneOffset.UTC).toInstant()
            : null;
        Instant toExclusive = createdTo != null
            ? createdTo.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
            : null;

        OrderStatus st = parseStatus(status);
        var spec = CustomerOrderSpecifications.filter(
            search,
            externalNumber,
            clientName,
            address,
            courierId,
            st,
            fromInst,
            toExclusive
        );
        Page<CustomerOrder> page = orderRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(customerOrderMapper::toRowResponse));
    }

    private OrderStatus parseStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return OrderStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown order status: " + raw);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourierOptionResponse> listCourierCandidates() {
        return customerOrderMapper.toCourierOptionList(userRepository.findActiveByRoleName("COURIER"));
    }

    @Override
    @Transactional
    public CustomerOrderCreatedResponse createOrder(CreateCustomerOrderRequest req, UUID creatorId) {
        Store store = storeRepository.findById(req.storeId())
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        if (!store.isActive()) {
            throw new BadRequestException("Store is inactive");
        }

        User creator = userRepository.findByIdWithDetails(creatorId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User courier = null;
        if (req.courierId() != null) {
            courier = userRepository.findById(req.courierId())
                .orElseThrow(() -> new ResourceNotFoundException("Courier not found"));
            if (!"COURIER".equalsIgnoreCase(courier.getRole().getName())) {
                throw new BadRequestException("Selected user is not a courier");
            }
        }

        String comment = StringUtils.hasText(req.comment()) ? req.comment().trim() : null;

        Instant now = Instant.now();
        CustomerOrder order = CustomerOrder.builder()
            .store(store)
            .clientName(req.clientName().trim())
            .clientPhone(req.clientPhone().trim())
            .deliveryAddress(req.deliveryAddress().trim())
            .comment(comment)
            .courier(courier)
            .status(OrderStatus.NEW)
            .totalAmount(BigDecimal.ZERO)
            .createdBy(creator)
            .createdAt(now)
            .updatedAt(now)
            .build();
        order = orderRepository.save(order);
        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order created: id={}, storeId={}", order.getId(), store.getId());
        return new CustomerOrderCreatedResponse(order.getId());
    }

    @Override
    @Transactional
    public CustomerOrderCreatedResponse createWithPhotos(int storeId, List<MultipartFile> photos, UUID creatorId) {
        if (photos == null || photos.size() != 5) {
            throw new BadRequestException("Exactly 5 image files are required (photo1 … photo5)");
        }
        for (MultipartFile f : photos) {
            validateImage(f);
        }

        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        if (!store.isActive()) {
            throw new BadRequestException("Store is inactive");
        }

        User user = userRepository.findByIdWithDetails(creatorId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Instant now = Instant.now();
        CustomerOrder order = CustomerOrder.builder()
            .store(store)
            .status(OrderStatus.NEW)
            .totalAmount(BigDecimal.ZERO)
            .createdBy(user)
            .createdAt(now)
            .updatedAt(now)
            .build();
        order = orderRepository.save(order);

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path dir = root.resolve(String.valueOf(order.getId()));
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new BadRequestException("Cannot create upload directory: " + e.getMessage());
        }

        for (int i = 0; i < 5; i++) {
            MultipartFile mf = photos.get(i);
            String ext = safeExtension(mf.getOriginalFilename());
            String filename = (i + 1) + ext;
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new BadRequestException("Invalid file path");
            }
            try (InputStream in = mf.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new BadRequestException("Failed to save file: " + e.getMessage());
            }

            String ct = Optional.ofNullable(mf.getContentType())
                .filter(c -> c.toLowerCase().startsWith("image/"))
                .orElse("application/octet-stream");

            CustomerOrderPhoto ph = CustomerOrderPhoto.builder()
                .customerOrder(order)
                .slot(i + 1)
                .fileName(filename)
                .contentType(ct)
                .build();
            photoRepository.save(ph);
        }

        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order with photos created: id={}", order.getId());
        return new CustomerOrderCreatedResponse(order.getId());
    }

    private void validateImage(MultipartFile f) {
        if (f == null || f.isEmpty()) {
            throw new BadRequestException("Each photo must be a non-empty image file");
        }
        String ct = f.getContentType();
        if (ct == null || !ct.toLowerCase().startsWith("image/")) {
            throw new BadRequestException("Each part must be an image (Content-Type image/*)");
        }
    }

    private String safeExtension(String original) {
        if (original == null) {
            return ".jpg";
        }
        int dot = original.lastIndexOf('.');
        if (dot < 0 || dot == original.length() - 1) {
            return ".jpg";
        }
        String ext = original.substring(dot).toLowerCase();
        if (ext.matches("\\.(jpg|jpeg|png|gif|webp|bmp)")) {
            return ext;
        }
        return ".jpg";
    }

    @Override
    @Transactional(readOnly = true)
    public PhotoDownload loadPhoto(long orderId, int slot) {
        if (slot < 1 || slot > 5) {
            throw new BadRequestException("Photo slot must be 1..5");
        }
        orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        CustomerOrderPhoto ph = photoRepository.findByCustomerOrder_IdAndSlot(orderId, slot)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path dir = root.resolve(String.valueOf(orderId)).normalize();
        Path file = dir.resolve(ph.getFileName()).normalize();
        if (!file.startsWith(dir) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Photo file not found on disk");
        }
        return new PhotoDownload(new FileSystemResource(file), ph.getContentType());
    }
}
