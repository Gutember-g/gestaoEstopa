package com.erp.multitenant.controller;

import com.erp.multitenant.dto.EmpresaDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/empresa")
public class EmpresaController {

    private EmpresaDTO currentEmpresa = new EmpresaDTO(
            "Gestão Estopa Comercial Ltda",
            "Estopas & Panos Premium",
            "12.345.678/0001-90",
            "(11) 3456-7890",
            "contato@gestaoestopa.com.br",
            "Rua das Indústrias, 1000 - São Paulo, SP"
    );

    @GetMapping
    public ResponseEntity<EmpresaDTO> getEmpresa() {
        return ResponseEntity.ok(currentEmpresa);
    }

    @PutMapping
    public ResponseEntity<EmpresaDTO> updateEmpresa(@RequestBody EmpresaDTO dto) {
        this.currentEmpresa = dto;
        return ResponseEntity.ok(this.currentEmpresa);
    }
}
