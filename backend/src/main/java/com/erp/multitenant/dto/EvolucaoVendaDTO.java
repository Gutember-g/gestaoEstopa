package com.erp.multitenant.dto;

import java.math.BigDecimal;

public record EvolucaoVendaDTO(String data, BigDecimal valorTotal, BigDecimal lucroLiquido) {
}
