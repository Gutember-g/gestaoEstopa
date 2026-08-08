package com.erp.multitenant.service;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.AlertasDTO;
import com.erp.multitenant.dto.DashboardDTO;
import com.erp.multitenant.dto.TopClienteDTO;
import com.erp.multitenant.model.StatusParcela;
import com.erp.multitenant.model.StatusProduto;
import com.erp.multitenant.repository.ParcelaRepository;
import com.erp.multitenant.repository.ProdutoRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardService {

    private final VendaRepository vendaRepository;
    private final ParcelaRepository parcelaRepository;
    private final ProdutoRepository produtoRepository;

    public DashboardService(
            VendaRepository vendaRepository,
            ParcelaRepository parcelaRepository,
            ProdutoRepository produtoRepository
    ) {
        this.vendaRepository = vendaRepository;
        this.parcelaRepository = parcelaRepository;
        this.produtoRepository = produtoRepository;
    }

    public DashboardDTO getDashboardData() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal faturamentoMensal = vendaRepository.sumValorTotalByTenantAndDataAfter(tenantId, inicioMes);
        if (faturamentoMensal == null) faturamentoMensal = BigDecimal.ZERO;

        BigDecimal lucroLiquidoMensal = vendaRepository.sumLucroLiquidoByTenantAndDataAfter(tenantId, inicioMes);
        if (lucroLiquidoMensal == null) lucroLiquidoMensal = BigDecimal.ZERO;

        BigDecimal fluxocaixaRecebido = parcelaRepository.sumValorByTenantAndStatus(tenantId, StatusParcela.PAGA);
        if (fluxocaixaRecebido == null) fluxocaixaRecebido = BigDecimal.ZERO;

        BigDecimal fluxocaixaPendente = parcelaRepository.sumValorByTenantAndStatus(tenantId, StatusParcela.PENDENTE);
        if (fluxocaixaPendente == null) fluxocaixaPendente = BigDecimal.ZERO;

        List<TopClienteDTO> topClientes = vendaRepository.findTopClientes(tenantId);

        LocalDate hoje = LocalDate.now();
        long parcelasAtrasadas = parcelaRepository.countByTenantIdAndStatusAndDataVencimentoBefore(tenantId, StatusParcela.PENDENTE, hoje);
        long parcelasVencendoHoje = parcelaRepository.countByTenantIdAndStatusAndDataVencimento(tenantId, StatusParcela.PENDENTE, hoje);
        long produtosSemMovimento = produtoRepository.countByTenantIdAndStatusAndUltimaMovimentacaoBefore(tenantId, StatusProduto.ATIVO, LocalDateTime.now().minusDays(30));

        AlertasDTO alertas = new AlertasDTO(parcelasAtrasadas, parcelasVencendoHoje, produtosSemMovimento);

        return new DashboardDTO(
                faturamentoMensal,
                lucroLiquidoMensal,
                fluxocaixaRecebido,
                fluxocaixaPendente,
                topClientes,
                alertas
        );
    }
}
