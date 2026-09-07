package com.erp.multitenant.repository;

import com.erp.multitenant.dto.EvolucaoVendaDTO;
import com.erp.multitenant.dto.TopClienteDTO;
import com.erp.multitenant.dto.TopProdutoDTO;
import com.erp.multitenant.model.Venda;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio AND (v.status = 'CONFIRMADA' OR v.status IS NULL)")
    BigDecimal sumValorTotalByTenantAndDataAfter(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE (v.tenantId = :tenantId OR :tenantId IS NULL) AND EXTRACT(MONTH FROM v.dataVenda) = :mes AND EXTRACT(YEAR FROM v.dataVenda) = :ano AND (v.status = 'CONFIRMADA' OR v.status IS NULL)")
    BigDecimal sumValorTotalByTenantAndMesAno(@Param("tenantId") String tenantId, @Param("mes") Integer mes, @Param("ano") Integer ano);

    @Query("SELECT SUM(v.lucroLiquido) FROM Venda v WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio AND (v.status = 'CONFIRMADA' OR v.status IS NULL)")
    BigDecimal sumLucroLiquidoByTenantAndDataAfter(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);

    @Query("SELECT SUM(v.lucroLiquido) FROM Venda v WHERE (v.tenantId = :tenantId OR :tenantId IS NULL) AND EXTRACT(MONTH FROM v.dataVenda) = :mes AND EXTRACT(YEAR FROM v.dataVenda) = :ano AND (v.status = 'CONFIRMADA' OR v.status IS NULL)")
    BigDecimal sumLucroLiquidoByTenantAndMesAno(@Param("tenantId") String tenantId, @Param("mes") Integer mes, @Param("ano") Integer ano);

    @Query("SELECT new com.erp.multitenant.dto.TopClienteDTO(c.id, c.nome, SUM(v.valorTotal)) " +
           "FROM Venda v JOIN v.cliente c " +
           "WHERE (v.tenantId = :tenantId OR :tenantId IS NULL) AND EXTRACT(MONTH FROM v.dataVenda) = :mes AND EXTRACT(YEAR FROM v.dataVenda) = :ano AND (v.status = 'CONFIRMADA' OR v.status IS NULL) " +
           "GROUP BY c.id, c.nome " +
           "ORDER BY SUM(v.valorTotal) DESC")
    List<TopClienteDTO> findTopClientesByMesAno(@Param("tenantId") String tenantId, @Param("mes") Integer mes, @Param("ano") Integer ano);

    @Query("SELECT new com.erp.multitenant.dto.TopProdutoDTO(i.id, 'SKU-00' || i.id, i.nomeProduto, SUM(i.quantidade), SUM(i.precoNoMomento * i.quantidade)) " +
           "FROM ItemVenda i JOIN i.venda v " +
           "WHERE (v.tenantId = :tenantId OR :tenantId IS NULL) AND EXTRACT(MONTH FROM v.dataVenda) = :mes AND EXTRACT(YEAR FROM v.dataVenda) = :ano AND (v.status = 'CONFIRMADA' OR v.status IS NULL) " +
           "GROUP BY i.id, i.nomeProduto " +
           "ORDER BY SUM(i.quantidade) DESC")
    List<TopProdutoDTO> findTopProdutosByMesAno(@Param("tenantId") String tenantId, @Param("mes") Integer mes, @Param("ano") Integer ano);

    @Query("SELECT new com.erp.multitenant.dto.EvolucaoVendaDTO(CAST(v.dataVenda AS string), SUM(v.valorTotal), SUM(v.lucroLiquido)) " +
           "FROM Venda v " +
           "WHERE v.tenantId = :tenantId AND v.dataVenda >= :dataInicio AND (v.status = 'CONFIRMADA' OR v.status IS NULL) " +
           "GROUP BY CAST(v.dataVenda AS string) " +
           "ORDER BY CAST(v.dataVenda AS string) ASC")
    List<EvolucaoVendaDTO> findEvolucaoDiaria(@Param("tenantId") String tenantId, @Param("dataInicio") LocalDateTime dataInicio);

    @Query("SELECT v FROM Venda v WHERE (v.tenantId = :tenantId OR :tenantId IS NULL) AND EXTRACT(MONTH FROM v.dataVenda) = :mes AND EXTRACT(YEAR FROM v.dataVenda) = :ano ORDER BY v.dataVenda DESC")
    List<Venda> findByMesEAno(@Param("tenantId") String tenantId, @Param("mes") Integer mes, @Param("ano") Integer ano);

    List<Venda> findByTenantIdOrderByDataVendaDesc(String tenantId, Pageable pageable);
}
