package com.erp.multitenant.service;

import com.erp.multitenant.model.RefreshToken;
import com.erp.multitenant.repository.RefreshTokenRepository;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    public static final String REFRESH_TOKEN_PATH = "/api/auth/refresh";
    public static final long DEFAULT_REFRESH_EXPIRATION_DAYS = 7;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public String createRefreshToken(String username, String tenantId) {
        String familyId = UUID.randomUUID().toString();
        return createRefreshTokenInFamily(username, tenantId, familyId);
    }

    @Transactional
    public String createRefreshTokenInFamily(String username, String tenantId, String familyId) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(DEFAULT_REFRESH_EXPIRATION_DAYS);

        RefreshToken refreshToken = new RefreshToken(tokenHash, familyId, username, tenantId, expiresAt);
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public RotationResult rotateRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return new RotationResult(null, null, null, false, "Refresh token não informado");
        }

        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElse(null);

        if (token == null) {
            return new RotationResult(null, null, null, false, "Refresh token não encontrado");
        }

        // DETECÇÃO DE REUSO: Se o token já tiver sido revogado previamente e for reapresentado
        if (token.isRevoked()) {
            refreshTokenRepository.revokeAllByFamilyId(token.getFamilyId());
            return new RotationResult(null, null, null, true, "Reuso de Refresh Token detectado. Toda a sessão foi revogada por segurança.");
        }

        // Verificar se expirou
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            return new RotationResult(null, null, null, false, "Refresh token expirado");
        }

        // Marcar o token atual como revogado
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        // Gerar novo token na MESMA família
        String newRawToken = createRefreshTokenInFamily(token.getUsername(), token.getTenantId(), token.getFamilyId());

        return new RotationResult(newRawToken, token.getUsername(), token.getTenantId(), false, null);
    }

    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    public ResponseCookie buildRefreshTokenCookie(String refreshTokenValue, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshTokenValue)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(REFRESH_TOKEN_PATH)
                .maxAge(maxAgeSeconds)
                .build();
    }

    public ResponseCookie buildCleanRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(REFRESH_TOKEN_PATH)
                .maxAge(0)
                .build();
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao calcular hash SHA-256 do token", e);
        }
    }

    public record RotationResult(
            String newRawRefreshToken,
            String username,
            String tenantId,
            boolean reuseDetected,
            String errorMessage
    ) {
        public boolean isSuccess() {
            return errorMessage == null;
        }
    }
}


