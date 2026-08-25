package com.erp.multitenant.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tb_item_venda")
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venda_id")
    @JsonIgnore
    private Venda venda;

    @Column(name = "nome_produto", nullable = false)
    private String nomeProduto;

    @Column(name = "custo_no_momento", nullable = false)
    private BigDecimal custoNoMomento;

    @Column(name = "preco_no_momento", nullable = false)
    private BigDecimal precoNoMomento;

    @Column(nullable = false)
    private Integer quantidade;

    public ItemVenda() {}

    public ItemVenda(String nomeProduto, BigDecimal custoNoMomento, BigDecimal precoNoMomento, Integer quantidade) {
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

    public Venda getVenda() {
        return venda;
    }

    public void setVenda(Venda venda) {
        this.venda = venda;
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
}
