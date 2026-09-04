package com.erp.multitenant.service;

import com.erp.multitenant.model.RefreshToken;
import com.erp.multitenant.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.http.ResponseCookie;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository);
    }

    @Test
    @DisplayName("Deve criar um RefreshToken no repositorio e retornar o token puro")
    void shouldCreateRefreshToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = refreshTokenService.createRefreshToken("usuario_teste", "empresa_demo");

        assertNotNull(rawToken);
        assertFalse(rawToken.isBlank());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Deve construir cookie HttpOnly + Secure + SameSite=Strict restrito ao path /api/auth/refresh")
    void shouldBuildSecureCookieWithRestrictedPath() {
        String rawToken = "sample_raw_refresh_token_123";
        ResponseCookie cookie = refreshTokenService.buildRefreshTokenCookie(rawToken, 7 * 24 * 3600);

        assertEquals("refreshToken", cookie.getName());
        assertEquals(rawToken, cookie.getValue());
        assertTrue(cookie.isHttpOnly());
        assertTrue(cookie.isSecure());
        assertEquals("None", cookie.getSameSite());
        assertEquals("/api/auth/refresh", cookie.getPath());
        assertEquals(7 * 24 * 3600, cookie.getMaxAge().getSeconds());
    }
}
