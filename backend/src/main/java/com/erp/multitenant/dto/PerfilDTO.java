package com.erp.multitenant.dto;

public record PerfilDTO(
        String nome,
        String email,
        String cargo,
        String avatar,
        String dataCriacao,
        String ultimoAcesso,
        String tenant
) {
}
