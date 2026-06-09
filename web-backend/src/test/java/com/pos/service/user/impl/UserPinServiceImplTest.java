package com.pos.service.user.impl;

import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.service.support.UserLookupSupport;
import com.pos.util.CashierPinUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPinServiceImplTest {

    private static final String PIN_SECRET = "test-pin-secret";
    private static final Integer COMPANY_ID = 42;

    @Mock
    private UserLookupSupport userLookup;

    @InjectMocks
    private UserPinServiceImpl userPinService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userPinService, "pinSecret", PIN_SECRET);
    }

    @Test
    void applyForCreate_nonCashier_skipsPin() {
        User user = new User();

        userPinService.applyForCreate(user, "MANAGER", COMPANY_ID, "1234");

        assertThat(user.getPinDigest()).isNull();
        verify(userLookup, never()).exists(any());
    }

    @Test
    void applyForCreate_cashier_setsUniqueDigest() {
        User user = new User();
        when(userLookup.exists(any())).thenReturn(false);

        userPinService.applyForCreate(user, "CASHIER", COMPANY_ID, "1234");

        assertThat(user.getPinDigest()).isEqualTo(CashierPinUtil.digestHex("1234", PIN_SECRET));
    }

    @Test
    void applyForCreate_duplicatePin_throws() {
        User user = new User();
        when(userLookup.exists(any())).thenReturn(true);

        assertThrows(BadRequestException.class,
            () -> userPinService.applyForCreate(user, "CASHIER", COMPANY_ID, "5678"));
    }

    @Test
    void applyForCreate_invalidPinLength_throws() {
        User user = new User();

        assertThrows(BadRequestException.class,
            () -> userPinService.applyForCreate(user, "CASHIER", COMPANY_ID, "12"));
    }

    @Test
    void clearOnRoleChange_cashierToManager_clearsDigest() {
        User user = User.builder().pinDigest("abc").build();

        userPinService.clearOnRoleChange(user, "CASHIER", "MANAGER", null);

        assertThat(user.getPinDigest()).isNull();
    }

    @Test
    void clearOnRoleChange_assignCashierWithoutPin_throws() {
        User user = new User();

        assertThrows(BadRequestException.class,
            () -> userPinService.clearOnRoleChange(user, "MANAGER", "CASHIER", ""));
    }

    @Test
    void applyForUpdate_nonCashier_throws() {
        User user = User.builder()
            .role(Role.builder().name("MANAGER").build())
            .build();

        assertThrows(BadRequestException.class,
            () -> userPinService.applyForUpdate(user, COMPANY_ID, "1234"));
    }
}
