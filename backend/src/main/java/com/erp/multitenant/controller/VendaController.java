package com.erp.multitenant.controller;

import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.service.VendaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/vendas")
public class VendaController {

    private final VendaService vendaService;

    public VendaController(VendaService vendaService) {
        this.vendaService = vendaService;
    }

    @GetMapping
    public ResponseEntity<List<VendaDTO>> getVendas(
            @RequestParam(name = "mes", required = false) Integer mes,
            @RequestParam(name = "ano", required = false) Integer ano) {

        List<VendaDTO> vendas = vendaService.getVendasPorPeriodo(mes, ano);
        return ResponseEntity.ok(vendas);
    }
}
