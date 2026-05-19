package com.pos.repository;

import com.pos.entity.UserModuleAccess;
import com.pos.entity.UserModuleAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserModuleAccessRepository extends JpaRepository<UserModuleAccess, UserModuleAccessId> {

    @Query("SELECT a FROM UserModuleAccess a WHERE a.id.userId = :userId")
    List<UserModuleAccess> findByUserId(@Param("userId") UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserModuleAccess a WHERE a.id.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
