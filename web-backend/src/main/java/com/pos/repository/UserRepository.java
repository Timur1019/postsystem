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

    @Query("""
        SELECT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.company.id = :companyId AND LOWER(u.username) = LOWER(:username)
        """)
    Optional<User> findByCompanyIdAndUsernameIgnoreCase(
        @Param("companyId") Integer companyId,
        @Param("username") String username
    );

    @Query("""
        SELECT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.company IS NULL AND LOWER(u.username) = LOWER(:username)
        """)
    Optional<User> findPlatformUserByUsernameIgnoreCase(@Param("username") String username);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId AND LOWER(u.username) = LOWER(:username)
        AND (:excludeId IS NULL OR u.id <> :excludeId)
        """)
    boolean existsByCompanyIdAndUsernameIgnoreCase(
        @Param("companyId") Integer companyId,
        @Param("username") String username,
        @Param("excludeId") UUID excludeId
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId AND LOWER(u.email) = LOWER(:email)
        AND (:excludeId IS NULL OR u.id <> :excludeId)
        """)
    boolean existsByCompanyIdAndEmailIgnoreCase(
        @Param("companyId") Integer companyId,
        @Param("email") String email,
        @Param("excludeId") UUID excludeId
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.username) = LOWER(:username)
        AND (:excludeId IS NULL OR u.id <> :excludeId)
        """)
    boolean existsPlatformUsernameIgnoreCase(
        @Param("username") String username,
        @Param("excludeId") UUID excludeId
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.email) = LOWER(:email)
        AND (:excludeId IS NULL OR u.id <> :excludeId)
        """)
    boolean existsPlatformEmailIgnoreCase(
        @Param("email") String email,
        @Param("excludeId") UUID excludeId
    );

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.name = :roleName AND u.isActive = true ORDER BY u.fullName")
    List<User> findActiveByRoleName(@Param("roleName") String roleName);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.company LEFT JOIN FETCH u.stores")
    List<User> findAllWithDetails();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.company LEFT JOIN FETCH u.stores WHERE u.username = :username")
    java.util.Optional<User> findByUsernameWithDetails(@Param("username") String username);

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        JOIN FETCH u.company c
        WHERE c.id = :companyId AND u.role.name <> 'SUPER_ADMIN'
        ORDER BY u.fullName
        """)
    List<User> findByCompanyIdWithDetails(@Param("companyId") Integer companyId);
}
