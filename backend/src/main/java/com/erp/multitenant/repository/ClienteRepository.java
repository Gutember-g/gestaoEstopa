package com.erp.multitenant.repository;

import com.erp.multitenant.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByTenantId(String tenantId);
    Optional<Cliente> findByIdAndTenantId(Long id, String tenantId);
}
