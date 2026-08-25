package com.erp.multitenant.repository;

import com.erp.multitenant.model.ConfiguracaoEnvio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoEnvioRepository extends JpaRepository<ConfiguracaoEnvio, Long> {
    Optional<ConfiguracaoEnvio> findByTenantId(String tenantId);
}
