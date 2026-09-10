package com.erp.multitenant.repository;

import com.erp.multitenant.model.Produto;
import com.erp.multitenant.model.StatusProduto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    List<Produto> findByTenantId(String tenantId);
    Optional<Produto> findByIdAndTenantId(Long id, String tenantId);
    long countByTenantIdAndStatusAndUltimaMovimentacaoBefore(String tenantId, StatusProduto status, LocalDateTime data);

    @Query("SELECT p FROM Produto p WHERE (p.tenantId = :tenantId OR :tenantId IS NULL) AND LOWER(p.nome) LIKE :term")
    List<Produto> searchByTerm(@Param("tenantId") String tenantId, @Param("term") String term, Pageable pageable);
}
