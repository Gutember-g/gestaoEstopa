package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.BuscaGlobalDTO;
import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.model.Produto;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.ClienteRepository;
import com.erp.multitenant.repository.ProdutoRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
public class BuscaGlobalController {

    private final ClienteRepository clienteRepository;
    private final ProdutoRepository produtoRepository;
    private final VendaRepository vendaRepository;

    public BuscaGlobalController(ClienteRepository clienteRepository,
                                 ProdutoRepository produtoRepository,
                                 VendaRepository vendaRepository) {
        this.clienteRepository = clienteRepository;
        this.produtoRepository = produtoRepository;
        this.vendaRepository = vendaRepository;
    }

    @GetMapping({"/busca-global", "/api/busca-global"})
    public ResponseEntity<BuscaGlobalDTO> buscar(@RequestParam(name = "q", required = false) String q) {
        if (q == null || q.trim().isBlank()) {
            return ResponseEntity.ok(new BuscaGlobalDTO(Collections.emptyList(), Collections.emptyList(), Collections.emptyList()));
        }

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }

        String termo = q.trim();
        PageRequest limit = PageRequest.of(0, 5);

        List<Cliente> clientes = clienteRepository.searchByTerm(tenantId, termo, limit);
        List<Produto> produtos = produtoRepository.searchByTerm(tenantId, termo, limit);
        List<Venda> vendasEntities = vendaRepository.searchByTerm(tenantId, termo, limit);
        List<VendaDTO> vendas = vendasEntities.stream().map(VendaDTO::fromEntity).toList();

        return ResponseEntity.ok(new BuscaGlobalDTO(clientes, produtos, vendas));
    }
}
