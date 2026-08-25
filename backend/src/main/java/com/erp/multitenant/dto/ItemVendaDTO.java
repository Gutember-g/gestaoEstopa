package com.erp.multitenant.dto;

import java.math.BigDecimal;

public class ItemVendaDTO {
    private Long id;
    private Long produtoId;
    private String sku;
    private String nomeProduto;
    private BigDecimal custoNoMomento;
    private BigDecimal precoNoMomento;
    private Integer quantidade;

    public ItemVendaDTO() {}

    public ItemVendaDTO(Long id, String nomeProduto, BigDecimal custoNoMomento, BigDecimal precoNoMomento, Integer quantidade) {
        this.id = id;
        this.nomeProduto = nomeProduto;
        this.custoNoMomento = custoNoMomento;
        this.precoNoMomento = precoNoMomento;
        this.quantidade = quantidade;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getNomeProduto() {
        return nomeProduto;
    }

    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }

    public BigDecimal getCustoNoMomento() {
        return custoNoMomento;
    }

    public void setCustoNoMomento(BigDecimal custoNoMomento) {
        this.custoNoMomento = custoNoMomento;
    }

    public BigDecimal getPrecoNoMomento() {
        return precoNoMomento;
    }

    public void setPrecoNoMomento(BigDecimal precoNoMomento) {
        this.precoNoMomento = precoNoMomento;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public static ItemVendaDTO fromEntity(com.erp.multitenant.model.ItemVenda iv) {
        if (iv == null) return null;
        ItemVendaDTO dto = new ItemVendaDTO();
        dto.setId(iv.getId());
        dto.setNomeProduto(iv.getNomeProduto());
        dto.setCustoNoMomento(iv.getCustoNoMomento());
        dto.setPrecoNoMomento(iv.getPrecoNoMomento());
        dto.setQuantidade(iv.getQuantidade());
        return dto;
    }
}
