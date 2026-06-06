package com.pos.repository;

import com.pos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsername(String username);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.name = :roleName AND u.isActive = true ORDER BY u.fullName")
    List<User> findActiveByRoleName(@Param("roleName") String roleName);

    @Query("""
        SELECT u FROM User u
        JOIN FETCH u.role r
        JOIN FETCH u.company c
        WHERE c.id = :companyId AND r.name = :roleName AND u.isActive = true
        ORDER BY u.fullName
        """)
    List<User> findActiveByRoleNameAndCompanyId(
        @Param("roleName") String roleName,
        @Param("companyId") Integer companyId
    );

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.company LEFT JOIN FETCH u.stores")
    List<User> findAllWithDetails();

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.username = :username
        """)
    Optional<User> findByUsernameWithDetails(@Param("username") String username);

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        JOIN FETCH u.company c
        WHERE c.id = :companyId AND u.role.name <> 'SUPER_ADMIN'
        ORDER BY u.fullName
        """)
    List<User> findByCompanyIdWithDetails(@Param("companyId") Integer companyId);
}
