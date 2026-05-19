package com.pos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "user_module_access")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserModuleAccess {

    @EmbeddedId
    private UserModuleAccessId id;

    @Column(nullable = false)
    private boolean allowed;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    public UUID getUserId() {
        return id != null ? id.getUserId() : null;
    }

    public String getModuleKey() {
        return id != null ? id.getModuleKey() : null;
    }
}
