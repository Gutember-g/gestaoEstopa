package com.erp.multitenant.dto;

import java.math.BigDecimal;

public record HistoricoMesDTO(
        String key,
        String label,
        String shortLabel,
        BigDecimal faturamento,
        BigDecimal pago,
        BigDecimal pendente,
        BigDecimal lucro
) {}
