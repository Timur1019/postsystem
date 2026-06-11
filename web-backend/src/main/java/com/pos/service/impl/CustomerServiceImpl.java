package com.pos.service.impl;

import com.pos.dto.customer.CreateCustomerRequest;
import com.pos.dto.customer.CustomerResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Customer;
import com.pos.exception.BadRequestException;
import com.pos.mapper.CustomerMapper;
import com.pos.repository.CustomerRepository;
import com.pos.repository.spec.CustomerSpecifications;
import com.pos.service.CustomerService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerServiceImpl implements CustomerService {

    private static final Pattern EMAIL_OK = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<CustomerResponse> list(String search, Pageable pageable) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<Customer> spec = CustomerSpecifications.filter(companyId, search);
        Page<Customer> page = customerRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(customerMapper::toResponse));
    }

    @Override
    @Transactional
    public CustomerResponse create(CreateCustomerRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        String name = req.name().trim();
        if (!StringUtils.hasText(name)) {
            throw new BadRequestException("Укажите имя покупателя");
        }

        String phone = StringUtils.hasText(req.phone()) ? req.phone().trim() : null;
        String email = StringUtils.hasText(req.email()) ? req.email().trim() : null;

        if (phone != null && customerRepository.existsByCompany_IdAndPhone(companyId, phone)) {
            throw new BadRequestException("Покупатель с таким телефоном уже существует");
        }
        if (email != null) {
            if (!EMAIL_OK.matcher(email).matches()) {
                throw new BadRequestException("Некорректный email");
            }
            if (customerRepository.existsByCompany_IdAndEmail(companyId, email)) {
                throw new BadRequestException("Покупатель с таким email уже существует");
            }
        }

        Customer customer = Customer.builder()
            .company(tenantAccess.requireCompany(companyId))
            .name(name)
            .phone(phone)
            .email(email)
            .loyaltyPts(0)
            .build();
        Customer saved = customerRepository.save(customer);
        LogUtil.info(CustomerServiceImpl.class, "Customer created: id={}, name={}", saved.getId(), saved.getName());
        return customerMapper.toResponse(saved);
    }
}
