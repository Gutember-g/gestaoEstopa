package com.erp.multitenant.service;

import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;

    public VendaService(VendaRepository vendaRepository) {
        this.vendaRepository = vendaRepository;
    }

    @Transactional(readOnly = true)
    public List<VendaDTO> getVendasPorPeriodo(Integer mes, Integer ano) {
        LocalDate hoje = LocalDate.now();
        int targetMes = (mes != null) ? mes : hoje.getMonthValue();
        int targetAno = (ano != null) ? ano : hoje.getYear();

        String tenantId = "empresa_demo";

        List<Venda> vendas = vendaRepository.findByMesEAno(tenantId, targetMes, targetAno);

        return vendas.stream().map(v -> {
            String clienteNome = (v.getCliente() != null) ? v.getCliente().getNome() : "Cliente N/A";
            String cpfCnpj = (v.getCliente() != null) ? v.getCliente().getCpfCnpj() : "";
            Long clienteId = (v.getCliente() != null) ? v.getCliente().getId() : null;

            return new VendaDTO(
                v.getId(),
                clienteId,
                clienteNome,
                cpfCnpj,
                v.getDataVenda(),
                v.getCustoTotal(),
                v.getValorTotal(),
                v.getDesconto(),
                v.getLucroLiquido(),
                "PENDENTE"
            );
        }).collect(Collectors.toList());
    }
}
