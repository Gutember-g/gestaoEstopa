package com.erp.multitenant.repository;

import com.erp.multitenant.model.VendaEnvioHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendaEnvioHistoricoRepository extends JpaRepository<VendaEnvioHistorico, Long> {
    List<VendaEnvioHistorico> findByVendaIdOrderByDataEnvioDesc(Long vendaId);
    List<VendaEnvioHistorico> findByTenantIdOrderByDataEnvioDesc(String tenantId);
}
