package com.erp.multitenant.controller;

import com.erp.multitenant.dto.AuthResponseDTO;
import com.erp.multitenant.dto.LoginRequestDTO;
import com.erp.multitenant.security.JwtProvider;
import com.erp.multitenant.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    public AuthController(JwtProvider jwtProvider, RefreshTokenService refreshTokenService) {
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody @Valid LoginRequestDTO loginDTO,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String headerTenantId = request.getHeader("X-Tenant-ID");
        String tenantId = resolveTenantId(loginDTO.username(), loginDTO.tenantId(), headerTenantId);

        String accessToken = jwtProvider.generateAccessToken(loginDTO.username(), tenantId, List.of("ROLE_USER"));
        String refreshToken = refreshTokenService.createRefreshToken(loginDTO.username(), tenantId);

        ResponseCookie cookie = refreshTokenService.buildRefreshTokenCookie(refreshToken, 7 * 24 * 3600);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new AuthResponseDTO(accessToken, tenantId));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            @RequestHeader(name = "X-Requested-With", required = false) String requestedWith,
            HttpServletResponse response
    ) {
        if (requestedWith == null || !"XMLHttpRequest".equalsIgnoreCase(requestedWith)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Forbidden\", \"message\": \"Proteção CSRF: Cabeçalho X-Requested-With ausente ou inválido\"}");
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Unauthorized\", \"message\": \"Cookie de Refresh Token ausente\"}");
        }

        RefreshTokenService.RotationResult result = refreshTokenService.rotateRefreshToken(refreshToken);

        if (!result.isSuccess()) {
            ResponseCookie cleanCookie = refreshTokenService.buildCleanRefreshTokenCookie();
            response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Unauthorized\", \"message\": \"" + result.errorMessage() + "\"}");
        }

        String newAccessToken = jwtProvider.generateAccessToken(result.username(), result.tenantId(), List.of("ROLE_USER"));
        ResponseCookie newCookie = refreshTokenService.buildRefreshTokenCookie(result.newRawRefreshToken(), 7 * 24 * 3600);
        response.addHeader(HttpHeaders.SET_COOKIE, newCookie.toString());

        return ResponseEntity.ok(new AuthResponseDTO(newAccessToken, result.tenantId()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken);
        }

        ResponseCookie cleanCookie = refreshTokenService.buildCleanRefreshTokenCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());

        return ResponseEntity.noContent().build();
    }

    private String resolveTenantId(String username, String bodyTenantId, String headerTenantId) {
        if (bodyTenantId != null && !bodyTenantId.isBlank()) {
            return bodyTenantId;
        }
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            return headerTenantId;
        }
        if (username != null) {
            String lower = username.toLowerCase();
            if (lower.contains("sp")) return "filial_sp";
            if (lower.contains("rj")) return "filial_rj";
        }
        return "empresa_demo";
    }
}
