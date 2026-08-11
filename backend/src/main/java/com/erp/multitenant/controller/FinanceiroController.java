package com.erp.multitenant.controller;

import com.erp.multitenant.dto.ParcelaDTO;
import com.erp.multitenant.service.FinanceiroService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class FinanceiroController {

    private final FinanceiroService financeiroService;

    public FinanceiroController(FinanceiroService financeiroService) {
        this.financeiroService = financeiroService;
    }

    @GetMapping({"/financeiro/parcelas", "/parcelas"})
    public ResponseEntity<List<ParcelaDTO>> getParcelas(
            @RequestParam(name = "mes", required = false) Integer mes,
            @RequestParam(name = "ano", required = false) Integer ano,
            @RequestParam(name = "status", required = false) String status) {

        List<ParcelaDTO> parcelas = financeiroService.getParcelasPorPeriodoEStatus(mes, ano, status);
        return ResponseEntity.ok(parcelas);
    }
}
