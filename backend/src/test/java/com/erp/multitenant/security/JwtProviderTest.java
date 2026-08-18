package com.erp.multitenant.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private final String secret = "secret_key_super_segura_para_testes_unitarios_123456789";
    private final String issuer = "gestao-estopa-api";
    private final String audience = "gestao-estopa-web";
    private final long expirationMs = 900000; // 15 min

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(secret, expirationMs, issuer, audience);
    }

    @Test
    @DisplayName("Deve gerar e validar um token JWT valido com issuer e audience corretos")
    void shouldGenerateAndValidateJwtToken() {
        String token = jwtProvider.generateAccessToken("usuario_teste", "empresa_demo", List.of("ROLE_USER"));
        assertNotNull(token);

        assertTrue(jwtProvider.validateToken(token));

        Claims claims = jwtProvider.validateAndExtractClaims(token);
        assertEquals("usuario_teste", claims.getSubject());
        assertEquals("empresa_demo", claims.get("tenant_id"));
        assertEquals(issuer, claims.getIssuer());
        assertTrue(claims.getAudience().contains(audience));
    }

    @Test
    @DisplayName("Deve rejeitar token com issuer invalido")
    void shouldRejectTokenWithInvalidIssuer() {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String tokenWithWrongIssuer = Jwts.builder()
                .subject("usuario_teste")
                .issuer("issuer-invalido")
                .audience().add(audience).and()
                .signWith(key)
                .compact();

        assertFalse(jwtProvider.validateToken(tokenWithWrongIssuer));
        assertThrows(JwtException.class, () -> jwtProvider.validateAndExtractClaims(tokenWithWrongIssuer));
    }

    @Test
    @DisplayName("Deve rejeitar token com audience invalido")
    void shouldRejectTokenWithInvalidAudience() {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String tokenWithWrongAudience = Jwts.builder()
                .subject("usuario_teste")
                .issuer(issuer)
                .audience().add("audience-invalida").and()
                .signWith(key)
                .compact();

        assertFalse(jwtProvider.validateToken(tokenWithWrongAudience));
        assertThrows(JwtException.class, () -> jwtProvider.validateAndExtractClaims(tokenWithWrongAudience));
    }

    @Test
    @DisplayName("Deve rejeitar token expirado")
    void shouldRejectExpiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Instant past = Instant.now().minus(2, ChronoUnit.HOURS);
        String expiredToken = Jwts.builder()
                .subject("usuario_teste")
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(Date.from(past))
                .expiration(Date.from(past.plus(15, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();

        assertFalse(jwtProvider.validateToken(expiredToken));
        assertThrows(JwtException.class, () -> jwtProvider.validateAndExtractClaims(expiredToken));
    }
}
