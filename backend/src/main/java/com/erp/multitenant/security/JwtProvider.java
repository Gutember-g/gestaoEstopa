package com.erp.multitenant.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final long expirationMs;
    private final String issuer;
    private final String audience;

    public JwtProvider(
            @Value("${jwt.secret:dev_secret_key_super_segura_para_desenvolvimento_local_123456789}") String secret,
            @Value("${jwt.expiration:900000}") long expirationMs,
            @Value("${jwt.issuer:gestao-estopa-api}") String issuer,
            @Value("${jwt.audience:gestao-estopa-web}") String audience
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.issuer = issuer;
        this.audience = audience;
    }

    public String generateAccessToken(String username, String tenantId, List<String> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuer(issuer)
                .audience().add(audience).and()
                .claim("tenant_id", tenantId)
                .claim("roles", roles != null ? roles : List.of())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(secretKey)
                .compact();
    }

    public Claims validateAndExtractClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            validateAndExtractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getIssuer() {
        return issuer;
    }

    public String getAudience() {
        return audience;
    }
}
