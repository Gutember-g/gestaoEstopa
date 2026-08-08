package com.erp.multitenant.dto;

import java.math.BigDecimal;

public record TopClienteDTO(Long clienteId, String nomeCliente, BigDecimal totalComprado) {
}
