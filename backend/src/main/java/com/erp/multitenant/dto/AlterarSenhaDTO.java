package com.erp.multitenant.dto;

public record AlterarSenhaDTO(
        String senhaAtual,
        String novaSenha
) {
}
