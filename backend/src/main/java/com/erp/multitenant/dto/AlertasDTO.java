package com.erp.multitenant.dto;

public record AlertasDTO(
        long parcelasAtrasadas,
        long parcelasVencendoHoje,
        long produtosSemMovimento30Dias
) {
}
