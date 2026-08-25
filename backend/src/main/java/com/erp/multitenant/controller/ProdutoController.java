package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.model.Produto;
import com.erp.multitenant.model.StatusProduto;
import com.erp.multitenant.repository.ProdutoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    @PostMapping
    public ResponseEntity<?> createProduto(@RequestBody Produto produto) {
        if (produto.getNome() == null || produto.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome do produto é obrigatório."));
        }
        if (produto.getPrecoCusto() == null || produto.getPrecoCusto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Preço de custo deve ser maior que zero."));
        }
        if (produto.getPrecoVenda() == null || produto.getPrecoVenda().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Preço de venda deve ser maior que zero."));
        }

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }
        produto.setTenantId(tenantId);
        if (produto.getStatus() == null) {
            produto.setStatus(StatusProduto.ATIVO);
        }
        produto.setUltimaMovimentacao(LocalDateTime.now());
        Produto saved = produtoRepository.save(produto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduto(@PathVariable Long id, @RequestBody Produto produto) {
        if (produto.getNome() == null || produto.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome do produto é obrigatório."));
        }
        if (produto.getPrecoCusto() == null || produto.getPrecoCusto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Preço de custo deve ser maior que zero."));
        }
        if (produto.getPrecoVenda() == null || produto.getPrecoVenda().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Preço de venda deve ser maior que zero."));
        }

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }
        produto.setId(id);
        produto.setTenantId(tenantId);
        if (produto.getStatus() == null) {
            produto.setStatus(StatusProduto.ATIVO);
        }
        produto.setUltimaMovimentacao(LocalDateTime.now());
        Produto saved = produtoRepository.save(produto);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduto(@PathVariable Long id) {
        produtoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
