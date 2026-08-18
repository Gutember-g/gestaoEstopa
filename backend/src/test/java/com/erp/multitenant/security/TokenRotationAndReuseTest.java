package com.erp.multitenant.security;

import com.erp.multitenant.model.RefreshToken;
import com.erp.multitenant.repository.RefreshTokenRepository;
import com.erp.multitenant.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class TokenRotationAndReuseTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve rotacionar o Refresh Token com sucesso e emitir novo cookie")
    void shouldRotateRefreshTokenSuccessfully() throws Exception {
        String originalRawToken = refreshTokenService.createRefreshToken("usuario_teste", "empresa_demo");

        MvcResult result = mockMvc.perform(post("/auth/refresh")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .cookie(new Cookie("refreshToken", originalRawToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        // Token original deve ter sido revogado no banco
        String originalHash = refreshTokenService.hashToken(originalRawToken);
        Optional<RefreshToken> originalEntity = refreshTokenRepository.findByTokenHash(originalHash);
        assertTrue(originalEntity.isPresent());
        assertTrue(originalEntity.get().isRevoked());

        // Deve existir 2 registros (o antigo revogado e o novo ativo)
        assertEquals(2, refreshTokenRepository.count());
    }

    @Test
    @DisplayName("DETECCAO DE REUSO: Reapresentar token antigo deve revogar toda a familia de sessoes")
    void shouldRevokeAllTokensInFamilyOnReuseDetection() throws Exception {
        // 1. Criar e rotacionar token 1 vez
        String token1 = refreshTokenService.createRefreshToken("usuario_atacante", "empresa_demo");

        MvcResult firstRotation = mockMvc.perform(post("/auth/refresh")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .cookie(new Cookie("refreshToken", token1)))
                .andExpect(status().isOk())
                .andReturn();

        // 2. Tentar reusar o token1 (que ja foi rotacionado e revogado)
        mockMvc.perform(post("/auth/refresh")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .cookie(new Cookie("refreshToken", token1)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Reuso de Refresh Token detectado. Toda a sessão foi revogada por segurança."));

        // 3. Todos os tokens da familia devem estar revogados
        long activeTokensCount = refreshTokenRepository.findAll().stream()
                .filter(t -> !t.isRevoked())
                .count();

        assertEquals(0, activeTokensCount, "Nenhum token da família deve permanecer ativo após detecção de reuso");
    }

    @Test
    @DisplayName("PROTECAO CSRF: Requisicao de refresh sem o cabecalho X-Requested-With deve retornar 403 Forbidden")
    void shouldRejectRefreshRequestWithoutCsrfHeader() throws Exception {
        String rawToken = refreshTokenService.createRefreshToken("usuario_csrf", "empresa_demo");

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refreshToken", rawToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Proteção CSRF: Cabeçalho X-Requested-With ausente ou inválido"));
    }

    @Test
    @DisplayName("LOGOUT: Deve revogar o Refresh Token no banco de dados e limpar o cookie HttpOnly no cliente")
    void shouldRevokeRefreshTokenOnLogout() throws Exception {
        String rawToken = refreshTokenService.createRefreshToken("usuario_logout", "empresa_demo");

        mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie("refreshToken", rawToken)))
                .andExpect(status().isNoContent())
                .andExpect(header().exists("Set-Cookie"));

        // O token deve estar revogado no banco de dados
        String tokenHash = refreshTokenService.hashToken(rawToken);
        Optional<RefreshToken> entity = refreshTokenRepository.findByTokenHash(tokenHash);
        assertTrue(entity.isPresent());
        assertTrue(entity.get().isRevoked(), "O token de refresh deve ter sido revogado no banco de dados no logout");
    }
}


