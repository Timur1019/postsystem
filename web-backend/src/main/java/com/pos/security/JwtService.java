package com.pos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import com.pos.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpiration;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User user && user.getCompany() != null) {
            claims.put("company_id", user.getCompany().getId());
        }
        return generateToken(claims, userDetails);
    }

    public Integer extractCompanyId(String token) {
        return extractClaim(token, claims -> {
            Object value = claims.get("company_id");
            if (value == null) {
                return null;
            }
            if (value instanceof Number n) {
                return n.intValue();
            }
            return Integer.parseInt(value.toString());
        });
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        String subject = userDetails instanceof User userEntity
            ? userEntity.getId().toString()
            : userDetails.getUsername();
        return Jwts.builder()
            .claims(extraClaims)
            .subject(subject)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!(userDetails instanceof User user)) {
            return false;
        }
        return extractSubjectUserId(token).equals(user.getId()) && !isTokenExpired(token);
    }

    /** JWT subject — UUID пользователя (логин может повторяться в разных компаниях). */
    public UUID extractSubjectUserId(String token) {
        return UUID.fromString(extractClaim(token, Claims::getSubject));
    }

    /** @deprecated use extractSubjectUserId */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
