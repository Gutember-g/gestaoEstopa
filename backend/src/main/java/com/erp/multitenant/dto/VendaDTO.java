package com.erp.multitenant.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VendaDTO {
    private Long id;
    private Long clienteId;
    private String clienteNome;
    private String cpfCnpj;
    private LocalDateTime dataVenda;
    private BigDecimal custoTotal;
    private BigDecimal valorTotal;
    private BigDecimal desconto;
    private BigDecimal lucroLiquido;
    private String status;

    public VendaDTO() {}

    public VendaDTO(Long id, Long clienteId, String clienteNome, String cpfCnpj, LocalDateTime dataVenda,
                    BigDecimal custoTotal, BigDecimal valorTotal, BigDecimal desconto, BigDecimal lucroLiquido, String status) {
        this.id = id;
        this.clienteId = clienteId;
        this.clienteNome = clienteNome;
        this.cpfCnpj = cpfCnpj;
        this.dataVenda = dataVenda;
        this.custoTotal = custoTotal;
        this.valorTotal = valorTotal;
        this.desconto = desconto;
        this.lucroLiquido = lucroLiquido;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteNome() {
        return clienteNome;
    }

    public void setClienteNome(String clienteNome) {
        this.clienteNome = clienteNome;
    }

    public String getCpfCnpj() {
        return cpfCnpj;
    }

    public void setCpfCnpj(String cpfCnpj) {
        this.cpfCnpj = cpfCnpj;
    }

    public LocalDateTime getDataVenda() {
        return dataVenda;
    }

    public void setDataVenda(LocalDateTime dataVenda) {
        this.dataVenda = dataVenda;
    }

    public BigDecimal getCustoTotal() {
        return custoTotal;
    }

    public void setCustoTotal(BigDecimal custoTotal) {
        this.custoTotal = custoTotal;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public void setDesconto(BigDecimal desconto) {
        this.desconto = desconto;
    }

    public BigDecimal getLucroLiquido() {
        return lucroLiquido;
    }

    public void setLucroLiquido(BigDecimal lucroLiquido) {
        this.lucroLiquido = lucroLiquido;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
