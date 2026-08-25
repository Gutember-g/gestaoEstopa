package com.erp.multitenant.service;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.*;
import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.StatusParcela;
import com.erp.multitenant.model.StatusProduto;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.ParcelaRepository;
import com.erp.multitenant.repository.ProdutoRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private static final String[] MESES_NOME = {
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    };

    private static final String[] MESES_CURTO = {
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

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
        return getDashboardData(null, null);
    }

    public DashboardDTO getDashboardData(Integer mes, Integer ano) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }

        LocalDate hoje = LocalDate.now();
        int targetMes = (mes != null && mes >= 1 && mes <= 12) ? mes : hoje.getMonthValue();
        int targetAno = (ano != null && ano >= 2000 && ano <= 2100) ? ano : hoje.getYear();

        String labelPeriodo = MESES_NOME[targetMes - 1] + " " + targetAno;

        // KPI metrics for target month/year
        BigDecimal faturamentoMensal = vendaRepository.sumValorTotalByTenantAndMesAno(tenantId, targetMes, targetAno);
        if (faturamentoMensal == null) faturamentoMensal = BigDecimal.ZERO;

        BigDecimal lucroLiquidoMensal = vendaRepository.sumLucroLiquidoByTenantAndMesAno(tenantId, targetMes, targetAno);
        if (lucroLiquidoMensal == null) lucroLiquidoMensal = BigDecimal.ZERO;

        BigDecimal fluxocaixaRecebido = parcelaRepository.sumValorByTenantStatusAndMesAno(tenantId, StatusParcela.PAGA, targetMes, targetAno);
        if (fluxocaixaRecebido == null) fluxocaixaRecebido = BigDecimal.ZERO;

        BigDecimal fluxocaixaPendente = parcelaRepository.sumValorByTenantStatusAndMesAno(tenantId, StatusParcela.PENDENTE, targetMes, targetAno);
        if (fluxocaixaPendente == null) fluxocaixaPendente = BigDecimal.ZERO;

        // Calculate percentage variation vs previous month
        YearMonth currentYm = YearMonth.of(targetAno, targetMes);
        YearMonth prevYm = currentYm.minusMonths(1);
        BigDecimal faturamentoPrev = vendaRepository.sumValorTotalByTenantAndMesAno(tenantId, prevYm.getMonthValue(), prevYm.getYear());
        if (faturamentoPrev == null) faturamentoPrev = BigDecimal.ZERO;

        String variacaoPercentual = "+0%";
        if (faturamentoPrev.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = faturamentoMensal.subtract(faturamentoPrev);
            BigDecimal pct = diff.multiply(BigDecimal.valueOf(100)).divide(faturamentoPrev, 1, RoundingMode.HALF_UP);
            variacaoPercentual = pct.compareTo(BigDecimal.ZERO) >= 0 ? "↑ " + pct + "%" : "↓ " + pct.abs() + "%";
        } else if (faturamentoMensal.compareTo(BigDecimal.ZERO) > 0) {
            variacaoPercentual = "↑ 100%";
        }

        // 12-Month Historical Chart data
        List<HistoricoMesDTO> historico12Meses = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = currentYm.minusMonths(i);
            int mVal = ym.getMonthValue();
            int yVal = ym.getYear();

            String key = ym.toString(); // "YYYY-MM"
            String label = MESES_NOME[mVal - 1] + " " + yVal;
            String shortLabel = MESES_CURTO[mVal - 1] + "/" + String.valueOf(yVal).substring(2);

            BigDecimal fatM = vendaRepository.sumValorTotalByTenantAndMesAno(tenantId, mVal, yVal);
            if (fatM == null) fatM = BigDecimal.ZERO;

            BigDecimal pagM = parcelaRepository.sumValorByTenantStatusAndMesAno(tenantId, StatusParcela.PAGA, mVal, yVal);
            if (pagM == null) pagM = BigDecimal.ZERO;

            BigDecimal penM = parcelaRepository.sumValorByTenantStatusAndMesAno(tenantId, StatusParcela.PENDENTE, mVal, yVal);
            if (penM == null) penM = BigDecimal.ZERO;

            BigDecimal lucM = vendaRepository.sumLucroLiquidoByTenantAndMesAno(tenantId, mVal, yVal);
            if (lucM == null) lucM = BigDecimal.ZERO;

            historico12Meses.add(new HistoricoMesDTO(key, label, shortLabel, fatM, pagM, penM, lucM));
        }

        // Top Clientes and Top Produtos for target month/year
        List<TopClienteDTO> topClientes = vendaRepository.findTopClientesByMesAno(tenantId, targetMes, targetAno);
        List<TopProdutoDTO> topProdutos = vendaRepository.findTopProdutosByMesAno(tenantId, targetMes, targetAno);

        // Recent Sales
        List<Venda> recentesEntities = vendaRepository.findByTenantIdOrderByDataVendaDesc(tenantId, PageRequest.of(0, 5));
        List<VendaDTO> recentesVendas = recentesEntities.stream().map(VendaDTO::fromEntity).toList();

        // Upcoming Receivables
        List<Parcela> proximasEntities = parcelaRepository.findByTenantIdAndStatusOrderByDataVencimentoAsc(tenantId, StatusParcela.PENDENTE, PageRequest.of(0, 5));
        List<ParcelaDTO> proximosFaturamentos = proximasEntities.stream().map(ParcelaDTO::fromEntity).toList();

        // System Alerts
        long parcelasAtrasadas = parcelaRepository.countByTenantIdAndStatusAndDataVencimentoBefore(tenantId, StatusParcela.PENDENTE, hoje);
        long parcelasVencendoHoje = parcelaRepository.countByTenantIdAndStatusAndDataVencimento(tenantId, StatusParcela.PENDENTE, hoje);
        long produtosSemMovimento = produtoRepository.countByTenantIdAndStatusAndUltimaMovimentacaoBefore(tenantId, StatusProduto.ATIVO, LocalDateTime.now().minusDays(30));

        AlertasDTO alertas = new AlertasDTO(parcelasAtrasadas, parcelasVencendoHoje, produtosSemMovimento);

        return new DashboardDTO(
                labelPeriodo,
                faturamentoMensal,
                lucroLiquidoMensal,
                fluxocaixaRecebido,
                fluxocaixaPendente,
                variacaoPercentual,
                historico12Meses,
                topClientes,
                topProdutos,
                recentesVendas,
                proximosFaturamentos,
                alertas
        );
    }
}
