package com.erp.multitenant.repository;

import com.erp.multitenant.model.Produto;
import com.erp.multitenant.model.StatusProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    List<Produto> findByTenantId(String tenantId);
    Optional<Produto> findByIdAndTenantId(Long id, String tenantId);
    long countByTenantIdAndStatusAndUltimaMovimentacaoBefore(String tenantId, StatusProduto status, LocalDateTime data);
}
