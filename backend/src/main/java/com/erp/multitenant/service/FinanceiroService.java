package com.erp.multitenant.service;

import com.erp.multitenant.dto.ParcelaDTO;
import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.StatusParcela;
import com.erp.multitenant.repository.ParcelaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceiroService {

    private final ParcelaRepository parcelaRepository;

    public FinanceiroService(ParcelaRepository parcelaRepository) {
        this.parcelaRepository = parcelaRepository;
    }

    @Transactional(readOnly = true)
    public List<ParcelaDTO> getParcelasPorPeriodoEStatus(Integer mes, Integer ano, String status) {
        LocalDate hoje = LocalDate.now();
        int targetMes = (mes != null) ? mes : hoje.getMonthValue();
        int targetAno = (ano != null) ? ano : hoje.getYear();

        String tenantId = "empresa_demo";

        List<Parcela> parcelas = parcelaRepository.findByMesEAno(tenantId, targetMes, targetAno);

        return parcelas.stream()
            .filter(p -> matchesStatus(p, status, hoje))
            .map(p -> {
                Long vendaId = (p.getVenda() != null) ? p.getVenda().getId() : null;
                String clienteNome = (p.getVenda() != null && p.getVenda().getCliente() != null)
                        ? p.getVenda().getCliente().getNome() : "Cliente N/A";
                String cpfCnpj = (p.getVenda() != null && p.getVenda().getCliente() != null)
                        ? p.getVenda().getCliente().getCpfCnpj() : "";

                String statusStr = p.getStatus() != null ? p.getStatus().name() : "PENDENTE";
                if (p.getStatus() == StatusParcela.PAGA) {
                    statusStr = "PAGO";
                } else if (p.getStatus() == StatusParcela.PENDENTE && p.getDataVencimento() != null && p.getDataVencimento().isBefore(hoje)) {
                    statusStr = "ATRASADO";
                }

                return new ParcelaDTO(
                    p.getId(),
                    vendaId,
                    p.getNumeroSequencial(),
                    p.getValor(),
                    p.getDataVencimento(),
                    p.getDataPagamento(),
                    statusStr,
                    clienteNome,
                    cpfCnpj,
                    (p.getVenda() != null) ? p.getVenda().getDesconto() : null
                );
            })
            .collect(Collectors.toList());
    }

    private boolean matchesStatus(Parcela p, String status, LocalDate hoje) {
        if (status == null || status.trim().isEmpty() || "TODAS".equalsIgnoreCase(status)) {
            return true;
        }

        String st = status.trim().toUpperCase();
        if ("PAGO".equals(st) || "PAGA".equals(st)) {
            return p.getStatus() == StatusParcela.PAGA;
        }
        if ("CANCELADO".equals(st) || "CANCELADA".equals(st)) {
            return p.getStatus() == StatusParcela.CANCELADA;
        }
        if ("ATRASADO".equals(st)) {
            return p.getStatus() == StatusParcela.PENDENTE
                    && p.getDataVencimento() != null
                    && p.getDataVencimento().isBefore(hoje);
        }
        if ("PENDENTE".equals(st)) {
            return p.getStatus() == StatusParcela.PENDENTE
                    && (p.getDataVencimento() == null || !p.getDataVencimento().isBefore(hoje));
        }

        return true;
    }

    @Transactional
    public ParcelaDTO baixarParcela(Long id) {
        Parcela p = parcelaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Parcela não encontrada com ID: " + id));

        p.setStatus(StatusParcela.PAGA);
        p.setDataPagamento(LocalDate.now());

        Parcela salva = parcelaRepository.save(p);

        Long vendaId = (salva.getVenda() != null) ? salva.getVenda().getId() : null;
        String clienteNome = (salva.getVenda() != null && salva.getVenda().getCliente() != null)
                ? salva.getVenda().getCliente().getNome() : "Cliente N/A";
        String cpfCnpj = (salva.getVenda() != null && salva.getVenda().getCliente() != null)
                ? salva.getVenda().getCliente().getCpfCnpj() : "";

        return new ParcelaDTO(
                salva.getId(),
                vendaId,
                salva.getNumeroSequencial(),
                salva.getValor(),
                salva.getDataVencimento(),
                salva.getDataPagamento(),
                "PAGO",
                clienteNome,
                cpfCnpj,
                (salva.getVenda() != null) ? salva.getVenda().getDesconto() : null
        );
    }
}
