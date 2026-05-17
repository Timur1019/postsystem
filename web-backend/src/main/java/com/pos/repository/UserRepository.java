package com.pos.repository;

import com.pos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.name = :roleName AND u.isActive = true ORDER BY u.fullName")
    List<User> findActiveByRoleName(@Param("roleName") String roleName);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.company LEFT JOIN FETCH u.stores")
    List<User> findAllWithDetails();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.company LEFT JOIN FETCH u.stores WHERE u.username = :username")
    java.util.Optional<User> findByUsernameWithDetails(@Param("username") String username);
}
