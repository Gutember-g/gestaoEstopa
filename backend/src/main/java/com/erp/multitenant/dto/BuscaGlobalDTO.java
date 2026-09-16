package com.erp.multitenant.dto;

import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.model.Produto;
import java.util.List;

public record BuscaGlobalDTO(
        List<Cliente> clientes,
        List<Produto> produtos,
        List<VendaDTO> vendas
) {}
