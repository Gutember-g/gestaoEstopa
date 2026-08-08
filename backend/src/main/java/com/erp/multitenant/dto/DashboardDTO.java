package com.erp.multitenant.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
        BigDecimal faturamentoMensal,
        BigDecimal lucroLiquidoMensal,
        BigDecimal fluxocaixaRecebido,
        BigDecimal fluxocaixaPendente,
        List<TopClienteDTO> topClientes,
        AlertasDTO alertas
) {
}
