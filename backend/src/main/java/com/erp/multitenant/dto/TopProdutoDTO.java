package com.erp.multitenant.dto;

import java.math.BigDecimal;

public record TopProdutoDTO(
        Long produtoId,
        String sku,
        String nomeProduto,
        Long quantidadeVendida,
        BigDecimal valorTotal
) {}
