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
        SELECT u FROM User u
        JOIN FETCH u.role
        JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.company IS NOT NULL AND LOWER(u.username) = LOWER(:username)
        """)
    Optional<User> findTenantUserByUsernameIgnoreCase(@Param("username") String username);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NOT NULL AND LOWER(u.username) = LOWER(:username)
        """)
    boolean existsTenantUsernameIgnoreCase(@Param("username") String username);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NOT NULL AND LOWER(u.username) = LOWER(:username)
        AND u.id <> :excludeId
        """)
    boolean existsTenantUsernameIgnoreCaseExcept(
        @Param("username") String username,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsTenantUsernameIgnoreCase(String username, UUID excludeId) {
        return excludeId == null
            ? existsTenantUsernameIgnoreCase(username)
            : existsTenantUsernameIgnoreCaseExcept(username, excludeId);
    }

    @Query("""
        SELECT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.company
        LEFT JOIN FETCH u.stores
        WHERE u.company.id = :companyId
          AND u.role.name = 'CASHIER'
          AND u.pinDigest = :pinDigest
        """)
    Optional<User> findCashierByCompanyIdAndPinDigest(
        @Param("companyId") Integer companyId,
        @Param("pinDigest") String pinDigest
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId
          AND u.pinDigest = :pinDigest
        """)
    boolean existsByCompanyIdAndPinDigest(
        @Param("companyId") Integer companyId,
        @Param("pinDigest") String pinDigest
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId
          AND u.pinDigest = :pinDigest
          AND u.id <> :excludeId
        """)
    boolean existsByCompanyIdAndPinDigestExcept(
        @Param("companyId") Integer companyId,
        @Param("pinDigest") String pinDigest,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsByCompanyIdAndPinDigest(
        Integer companyId,
        String pinDigest,
        UUID excludeId
    ) {
        return excludeId == null
            ? existsByCompanyIdAndPinDigest(companyId, pinDigest)
            : existsByCompanyIdAndPinDigestExcept(companyId, pinDigest, excludeId);
    }

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
        """)
    boolean existsByCompanyIdAndUsernameIgnoreCase(
        @Param("companyId") Integer companyId,
        @Param("username") String username
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId AND LOWER(u.username) = LOWER(:username)
        AND u.id <> :excludeId
        """)
    boolean existsByCompanyIdAndUsernameIgnoreCaseExcept(
        @Param("companyId") Integer companyId,
        @Param("username") String username,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsByCompanyIdAndUsernameIgnoreCase(
        Integer companyId,
        String username,
        UUID excludeId
    ) {
        return excludeId == null
            ? existsByCompanyIdAndUsernameIgnoreCase(companyId, username)
            : existsByCompanyIdAndUsernameIgnoreCaseExcept(companyId, username, excludeId);
    }

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId AND LOWER(u.email) = LOWER(:email)
        """)
    boolean existsByCompanyIdAndEmailIgnoreCase(
        @Param("companyId") Integer companyId,
        @Param("email") String email
    );

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company.id = :companyId AND LOWER(u.email) = LOWER(:email)
        AND u.id <> :excludeId
        """)
    boolean existsByCompanyIdAndEmailIgnoreCaseExcept(
        @Param("companyId") Integer companyId,
        @Param("email") String email,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsByCompanyIdAndEmailIgnoreCase(
        Integer companyId,
        String email,
        UUID excludeId
    ) {
        return excludeId == null
            ? existsByCompanyIdAndEmailIgnoreCase(companyId, email)
            : existsByCompanyIdAndEmailIgnoreCaseExcept(companyId, email, excludeId);
    }

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.username) = LOWER(:username)
        """)
    boolean existsPlatformUsernameIgnoreCase(@Param("username") String username);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.username) = LOWER(:username)
        AND u.id <> :excludeId
        """)
    boolean existsPlatformUsernameIgnoreCaseExcept(
        @Param("username") String username,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsPlatformUsernameIgnoreCase(String username, UUID excludeId) {
        return excludeId == null
            ? existsPlatformUsernameIgnoreCase(username)
            : existsPlatformUsernameIgnoreCaseExcept(username, excludeId);
    }

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.email) = LOWER(:email)
        """)
    boolean existsPlatformEmailIgnoreCase(@Param("email") String email);

    @Query("""
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u
        WHERE u.company IS NULL AND LOWER(u.email) = LOWER(:email)
        AND u.id <> :excludeId
        """)
    boolean existsPlatformEmailIgnoreCaseExcept(
        @Param("email") String email,
        @Param("excludeId") UUID excludeId
    );

    default boolean existsPlatformEmailIgnoreCase(String email, UUID excludeId) {
        return excludeId == null
            ? existsPlatformEmailIgnoreCase(email)
            : existsPlatformEmailIgnoreCaseExcept(email, excludeId);
    }

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
