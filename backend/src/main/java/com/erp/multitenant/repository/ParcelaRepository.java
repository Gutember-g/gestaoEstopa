package com.erp.multitenant.repository;

import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.StatusParcela;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ParcelaRepository extends JpaRepository<Parcela, Long> {

    @Query("SELECT SUM(p.valor) FROM Parcela p WHERE p.tenantId = :tenantId AND p.status = :status")
    BigDecimal sumValorByTenantAndStatus(@Param("tenantId") String tenantId, @Param("status") StatusParcela status);

    @Query("SELECT SUM(p.valor) FROM Parcela p WHERE (p.tenantId = :tenantId OR :tenantId IS NULL) AND p.status = :status AND EXTRACT(MONTH FROM p.dataVencimento) = :mes AND EXTRACT(YEAR FROM p.dataVencimento) = :ano")
    BigDecimal sumValorByTenantStatusAndMesAno(@Param("tenantId") String tenantId, @Param("status") StatusParcela status, @Param("mes") Integer mes, @Param("ano") Integer ano);

    long countByTenantIdAndStatusAndDataVencimentoBefore(String tenantId, StatusParcela status, LocalDate data);
    long countByTenantIdAndStatusAndDataVencimento(String tenantId, StatusParcela status, LocalDate data);

    @Query("SELECT p FROM Parcela p WHERE (p.tenantId = :tenantId OR :tenantId IS NULL) " +
           "AND EXTRACT(MONTH FROM p.dataVencimento) = :mes " +
           "AND EXTRACT(YEAR FROM p.dataVencimento) = :ano " +
           "ORDER BY p.dataVencimento ASC")
    List<Parcela> findByMesEAno(@Param("tenantId") String tenantId,
                                @Param("mes") Integer mes,
                                @Param("ano") Integer ano);

    List<Parcela> findByTenantIdAndStatusOrderByDataVencimentoAsc(String tenantId, StatusParcela status, Pageable pageable);
}
