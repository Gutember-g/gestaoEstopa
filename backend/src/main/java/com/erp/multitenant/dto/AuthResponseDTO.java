package com.erp.multitenant.dto;

public record AuthResponseDTO(
        String accessToken,
        String tenantId
) {
    public AuthResponseDTO(String accessToken) {
        this(accessToken, "empresa_demo");
    }
}
