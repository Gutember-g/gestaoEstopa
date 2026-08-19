package com.erp.multitenant.controller;

import com.erp.multitenant.dto.AlterarSenhaDTO;
import com.erp.multitenant.dto.PerfilDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/perfil")
public class PerfilController {

    private PerfilDTO currentPerfil = new PerfilDTO(
            "Gabriel Andrade",
            "gabriel@flowerp.com.br",
            "Administrador",
            "",
            "15/01/2024",
            "Hoje às 19:05",
            "Empresa Demo"
    );

    @GetMapping
    public ResponseEntity<PerfilDTO> getPerfil() {
        return ResponseEntity.ok(currentPerfil);
    }

    @PutMapping
    public ResponseEntity<PerfilDTO> updatePerfil(@RequestBody PerfilDTO dto) {
        this.currentPerfil = new PerfilDTO(
                dto.nome() != null ? dto.nome() : currentPerfil.nome(),
                dto.email() != null ? dto.email() : currentPerfil.email(),
                dto.cargo() != null ? dto.cargo() : currentPerfil.cargo(),
                dto.avatar() != null ? dto.avatar() : currentPerfil.avatar(),
                currentPerfil.dataCriacao(),
                currentPerfil.ultimoAcesso(),
                currentPerfil.tenant()
        );
        return ResponseEntity.ok(this.currentPerfil);
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@RequestBody AlterarSenhaDTO dto) {
        return ResponseEntity.noContent().build();
    }
}
