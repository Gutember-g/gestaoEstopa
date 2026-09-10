package com.erp.multitenant.repository;

import com.erp.multitenant.model.Cliente;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByTenantId(String tenantId);
    Optional<Cliente> findByIdAndTenantId(Long id, String tenantId);
    boolean existsByTenantIdAndCpfCnpj(String tenantId, String cpfCnpj);

    @Query("SELECT c FROM Cliente c WHERE (c.tenantId = :tenantId OR :tenantId IS NULL) AND (LOWER(c.nome) LIKE :term OR LOWER(c.cpfCnpj) LIKE :term)")
    List<Cliente> searchByTerm(@Param("tenantId") String tenantId, @Param("term") String term, Pageable pageable);
}
