package com.erp.multitenant.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VendaDTO {
    private Long id;
    private Long clienteId;
    private String clienteNome;
    private String cpfCnpj;
    private String emailCliente;
    private String telefoneCliente;
    private String enderecoCliente;

    private LocalDateTime dataVenda;
    private BigDecimal custoTotal;
    private BigDecimal valorTotal;
    private BigDecimal desconto;
    private BigDecimal lucroLiquido;

    private Integer prazoFaturamentoDias;
    private LocalDate dataVencimento;
    private String status;

    private List<ItemVendaDTO> itens = new ArrayList<>();

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

    public String getEmailCliente() {
        return emailCliente;
    }

    public void setEmailCliente(String emailCliente) {
        this.emailCliente = emailCliente;
    }

    public String getTelefoneCliente() {
        return telefoneCliente;
    }

    public void setTelefoneCliente(String telefoneCliente) {
        this.telefoneCliente = telefoneCliente;
    }

    public String getEnderecoCliente() {
        return enderecoCliente;
    }

    public void setEnderecoCliente(String enderecoCliente) {
        this.enderecoCliente = enderecoCliente;
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

    public Integer getPrazoFaturamentoDias() {
        return prazoFaturamentoDias;
    }

    public void setPrazoFaturamentoDias(Integer prazoFaturamentoDias) {
        this.prazoFaturamentoDias = prazoFaturamentoDias;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<ItemVendaDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemVendaDTO> itens) {
        this.itens = itens;
    }

    public static VendaDTO fromEntity(com.erp.multitenant.model.Venda v) {
        if (v == null) return null;
        VendaDTO dto = new VendaDTO();
        dto.setId(v.getId());
        if (v.getCliente() != null) {
            dto.setClienteId(v.getCliente().getId());
            dto.setClienteNome(v.getCliente().getNome());
            dto.setCpfCnpj(v.getCliente().getCpfCnpj());
            dto.setEmailCliente(v.getCliente().getEmail());
            dto.setTelefoneCliente(v.getCliente().getTelefone());
            dto.setEnderecoCliente(v.getCliente().getEndereco());
        }
        dto.setDataVenda(v.getDataVenda());
        dto.setCustoTotal(v.getCustoTotal());
        dto.setValorTotal(v.getValorTotal());
        dto.setDesconto(v.getDesconto());
        dto.setLucroLiquido(v.getLucroLiquido());
        dto.setPrazoFaturamentoDias(v.getPrazoFaturamentoDias());
        dto.setDataVencimento(v.getDataVencimento());
        dto.setStatus(v.getStatus() != null ? v.getStatus() : "CONFIRMADA");
        if (v.getItens() != null && !v.getItens().isEmpty()) {
            dto.setItens(v.getItens().stream().map(ItemVendaDTO::fromEntity).toList());
        }
        return dto;
    }
}
