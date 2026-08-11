package com.erp.multitenant.repository;

import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.StatusParcela;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface ParcelaRepository extends JpaRepository<Parcela, Long> {

    @Query("SELECT SUM(p.valor) FROM Parcela p WHERE p.tenantId = :tenantId AND p.status = :status")
    BigDecimal sumValorByTenantAndStatus(@Param("tenantId") String tenantId, @Param("status") StatusParcela status);

    long countByTenantIdAndStatusAndDataVencimentoBefore(String tenantId, StatusParcela status, LocalDate data);
    long countByTenantIdAndStatusAndDataVencimento(String tenantId, StatusParcela status, LocalDate data);

    @Query("SELECT p FROM Parcela p WHERE (p.tenantId = :tenantId OR :tenantId IS NULL) " +
           "AND EXTRACT(MONTH FROM p.dataVencimento) = :mes " +
           "AND EXTRACT(YEAR FROM p.dataVencimento) = :ano " +
           "ORDER BY p.dataVencimento ASC")
    java.util.List<Parcela> findByMesEAno(@Param("tenantId") String tenantId,
                                          @Param("mes") Integer mes,
                                          @Param("ano") Integer ano);
}
