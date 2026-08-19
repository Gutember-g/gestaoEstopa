package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.model.Produto;
import com.erp.multitenant.repository.ProdutoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoRepository produtoRepository;

    public ProdutoController(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @GetMapping
    public ResponseEntity<List<Produto>> getProdutos() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }
        List<Produto> produtos = produtoRepository.findByTenantId(tenantId);
        return ResponseEntity.ok(produtos);
    }
}
