package com.erp.multitenant.dto;

public record EmpresaDTO(
        String razaoSocial,
        String nomeFantasia,
        String cnpj,
        String telefone,
        String email,
        String endereco
) {
}
