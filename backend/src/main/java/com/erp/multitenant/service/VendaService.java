package com.erp.multitenant.service;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.ItemVendaDTO;
import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.model.ItemVenda;
import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.StatusParcela;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.ClienteRepository;
import com.erp.multitenant.repository.ParcelaRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ClienteRepository clienteRepository;
    private final ParcelaRepository parcelaRepository;

    public VendaService(VendaRepository vendaRepository,
                        ClienteRepository clienteRepository,
                        ParcelaRepository parcelaRepository) {
        this.vendaRepository = vendaRepository;
        this.clienteRepository = clienteRepository;
        this.parcelaRepository = parcelaRepository;
    }

    @Transactional(readOnly = true)
    public List<VendaDTO> getVendasPorPeriodo(Integer mes, Integer ano) {
        LocalDate hoje = LocalDate.now();
        int targetMes = (mes != null) ? mes : hoje.getMonthValue();
        int targetAno = (ano != null) ? ano : hoje.getYear();

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";

        List<Venda> vendas = vendaRepository.findByMesEAno(tenantId, targetMes, targetAno);

        return vendas.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VendaDTO getVendaPorId(Long id) {
        Venda v = vendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Venda não encontrada com o ID: " + id));
        return toDTO(v);
    }

    @Transactional
    public VendaDTO salvarVenda(VendaDTO dto) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";

        Venda venda;
        if (dto.getId() != null && dto.getId() > 0 && vendaRepository.existsById(dto.getId())) {
            venda = vendaRepository.findById(dto.getId()).orElseGet(Venda::new);
        } else {
            venda = new Venda();
            venda.setDataVenda(LocalDateTime.now());
        }

        if (venda.getDataVenda() == null) {
            venda.setDataVenda(LocalDateTime.now());
        }

        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(dto.getClienteId()).orElse(null);
            venda.setCliente(cliente);
        }

        venda.setCustoTotal(dto.getCustoTotal() != null ? dto.getCustoTotal() : BigDecimal.ZERO);
        venda.setValorTotal(dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO);
        venda.setDesconto(dto.getDesconto() != null ? dto.getDesconto() : BigDecimal.ZERO);
        venda.setLucroLiquido(dto.getLucroLiquido() != null ? dto.getLucroLiquido() : BigDecimal.ZERO);
        venda.setPrazoFaturamentoDias(dto.getPrazoFaturamentoDias() != null ? dto.getPrazoFaturamentoDias() : 30);
        
        LocalDate dtVenc = dto.getDataVencimento();
        if (dtVenc == null) {
            dtVenc = LocalDate.now().plusDays(venda.getPrazoFaturamentoDias());
        }
        venda.setDataVencimento(dtVenc);
        venda.setTenantId(tenantId);

        String targetStatus = (dto.getStatus() != null && !dto.getStatus().isBlank()) ? dto.getStatus() : "CONFIRMADA";
        venda.setStatus(targetStatus);

        // Process line items
        venda.getItens().clear();
        if (dto.getItens() != null && !dto.getItens().isEmpty()) {
            for (ItemVendaDTO itemDto : dto.getItens()) {
                ItemVenda item = new ItemVenda(
                        itemDto.getNomeProduto(),
                        itemDto.getCustoNoMomento() != null ? itemDto.getCustoNoMomento() : BigDecimal.ZERO,
                        itemDto.getPrecoNoMomento() != null ? itemDto.getPrecoNoMomento() : BigDecimal.ZERO,
                        itemDto.getQuantidade() != null ? itemDto.getQuantidade() : 1
                );
                venda.addItem(item);
            }
        }

        Venda salva = vendaRepository.save(venda);

        // Create initial financial installment (tb_parcela) ONLY if status is CONFIRMADA
        if ("CONFIRMADA".equalsIgnoreCase(salva.getStatus())) {
            boolean hasParcela = parcelaRepository.findAll().stream().anyMatch(p -> p.getVenda() != null && p.getVenda().getId().equals(salva.getId()));
            if (!hasParcela) {
                Parcela parcela = new Parcela();
                parcela.setVenda(salva);
                parcela.setNumeroSequencial(1);
                parcela.setValor(salva.getValorTotal());
                parcela.setDataVencimento(salva.getDataVencimento());
                parcela.setStatus(StatusParcela.PENDENTE);
                parcela.setTenantId(tenantId);
                parcelaRepository.save(parcela);
            }
        }

        return toDTO(salva);
    }

    @Transactional
    public VendaDTO confirmarVenda(Long id) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Venda não encontrada com o ID: " + id));

        venda.setStatus("CONFIRMADA");
        Venda salva = vendaRepository.save(venda);

        // Check if financial installment exists, if not create it
        boolean hasParcela = parcelaRepository.findAll().stream().anyMatch(p -> p.getVenda() != null && p.getVenda().getId().equals(id));
        if (!hasParcela) {
            String tenantId = salva.getTenantId() != null ? salva.getTenantId() : "empresa_demo";
            Parcela parcela = new Parcela();
            parcela.setVenda(salva);
            parcela.setNumeroSequencial(1);
            parcela.setValor(salva.getValorTotal());
            parcela.setDataVencimento(salva.getDataVencimento() != null ? salva.getDataVencimento() : LocalDate.now().plusDays(30));
            parcela.setStatus(StatusParcela.PENDENTE);
            parcela.setTenantId(tenantId);
            parcelaRepository.save(parcela);
        }

        return toDTO(salva);
    }

    private VendaDTO toDTO(Venda v) {
        String clienteNome = (v.getCliente() != null) ? v.getCliente().getNome() : "Cliente N/A";
        String cpfCnpj = (v.getCliente() != null) ? v.getCliente().getCpfCnpj() : "";
        String email = (v.getCliente() != null) ? v.getCliente().getEmail() : "";
        String telefone = (v.getCliente() != null) ? v.getCliente().getTelefone() : "";
        String endereco = (v.getCliente() != null) ? v.getCliente().getEndereco() : "";
        Long clienteId = (v.getCliente() != null) ? v.getCliente().getId() : null;

        VendaDTO dto = new VendaDTO(
                v.getId(),
                clienteId,
                clienteNome,
                cpfCnpj,
                v.getDataVenda(),
                v.getCustoTotal(),
                v.getValorTotal(),
                v.getDesconto(),
                v.getLucroLiquido(),
                v.getStatus() != null ? v.getStatus() : "CONFIRMADA"
        );

        dto.setEmailCliente(email);
        dto.setTelefoneCliente(telefone);
        dto.setEnderecoCliente(endereco);
        dto.setPrazoFaturamentoDias(v.getPrazoFaturamentoDias() != null ? v.getPrazoFaturamentoDias() : 30);

        LocalDate venc = v.getDataVencimento();
        if (venc == null && v.getDataVenda() != null) {
            venc = v.getDataVenda().toLocalDate().plusDays(dto.getPrazoFaturamentoDias());
        }
        dto.setDataVencimento(venc);

        if (v.getItens() != null) {
            dto.setItens(v.getItens().stream().map(i -> new ItemVendaDTO(
                    i.getId(),
                    i.getNomeProduto(),
                    i.getCustoNoMomento(),
                    i.getPrecoNoMomento(),
                    i.getQuantidade()
            )).collect(Collectors.toList()));
        }

        return dto;
    }
}
