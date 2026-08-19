package com.erp.multitenant.dto;

public record NotificacaoDTO(
        Long id,
        String tipo,
        String icon,
        String titulo,
        String descricao,
        String timestamp,
        boolean lida,
        String link
) {
}
