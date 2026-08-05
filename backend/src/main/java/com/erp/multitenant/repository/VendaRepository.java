package com.erp.multitenant.repository;

import com.erp.multitenant.dto.EvolucaoVendaDTO;
import com.erp.multitenant.dto.TopClienteDTO;
import com.erp.multitenant.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio")
    BigDecimal sumValorTotalByTenantAndDataAfter(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);

    @Query("SELECT SUM(v.lucroLiquido) FROM Venda v WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio")
    BigDecimal sumLucroLiquidoByTenantAndDataAfter(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);

    @Query("SELECT new com.erp.multitenant.dto.TopClienteDTO(c.id, c.nome, SUM(v.valorTotal)) " +
           "FROM Venda v JOIN v.cliente c " +
           "WHERE v.tenantId = :tenantId " +
           "GROUP BY c.id, c.nome " +
           "ORDER BY SUM(v.valorTotal) DESC")
    List<TopClienteDTO> findTopClientes(@Param("tenantId") String tenantId);

    @Query("SELECT new com.erp.multitenant.dto.EvolucaoVendaDTO(CAST(v.dataVenda AS string), SUM(v.valorTotal), SUM(v.lucroLiquido)) " +
           "FROM Venda v " +
           "WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio " +
           "GROUP BY CAST(v.dataVenda AS string) " +
           "ORDER BY CAST(v.dataVenda AS string) ASC")
    List<EvolucaoVendaDTO> findEvolucaoDiaria(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);
}
