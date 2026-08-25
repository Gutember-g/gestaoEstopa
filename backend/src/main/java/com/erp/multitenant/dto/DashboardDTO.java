package com.erp.multitenant.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
        String labelPeriodo,
        BigDecimal faturamentoMensal,
        BigDecimal lucroLiquidoMensal,
        BigDecimal fluxocaixaRecebido,
        BigDecimal fluxocaixaPendente,
        String variacaoPercentual,
        List<HistoricoMesDTO> historico12Meses,
        List<TopClienteDTO> topClientes,
        List<TopProdutoDTO> topProdutos,
        List<VendaDTO> recentesVendas,
        List<ParcelaDTO> proximosFaturamentos,
        AlertasDTO alertas
) {}
