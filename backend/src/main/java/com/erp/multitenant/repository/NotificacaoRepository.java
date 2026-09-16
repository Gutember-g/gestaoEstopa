package com.erp.multitenant.repository;

import com.erp.multitenant.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findByTenantIdOrderByCriadoEmDesc(String tenantId);

    Optional<Notificacao> findByIdAndTenantId(Long id, String tenantId);

    @Modifying
    @Query("UPDATE Notificacao n SET n.lida = true WHERE n.tenantId = :tenantId")
    void marcarTodasComoLidasDoTenant(@Param("tenantId") String tenantId);
}
