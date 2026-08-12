package com.erp.multitenant.controller;

import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.service.VendaExportService;
import com.erp.multitenant.service.VendaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/vendas")
public class VendaController {

    private final VendaService vendaService;
    private final VendaExportService vendaExportService;

    public VendaController(VendaService vendaService, VendaExportService vendaExportService) {
        this.vendaService = vendaService;
        this.vendaExportService = vendaExportService;
    }

    @GetMapping
    public ResponseEntity<List<VendaDTO>> getVendas(
            @RequestParam(name = "mes", required = false) Integer mes,
            @RequestParam(name = "ano", required = false) Integer ano) {

        List<VendaDTO> vendas = vendaService.getVendasPorPeriodo(mes, ano);
        return ResponseEntity.ok(vendas);
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarVendas(
            @RequestParam(name = "mes", required = false) Integer mes,
            @RequestParam(name = "ano", required = false) Integer ano,
            @RequestParam(name = "formato", defaultValue = "csv") String formato) throws IOException {

        byte[] content = vendaExportService.exportVendasMes(mes, ano, formato);
        String ext = "pdf".equalsIgnoreCase(formato) ? "pdf" : ("xlsx".equalsIgnoreCase(formato) ? "xlsx" : "csv");
        String mimeType = "pdf".equalsIgnoreCase(formato) ? "application/pdf" :
                ("xlsx".equalsIgnoreCase(formato) ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv");
        String fileName = String.format("vendas_empresa_demo_%s.%s", LocalDate.now(), ext);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(content);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getVendaPdf(@PathVariable("id") Long id) {
        byte[] pdfContent = vendaExportService.exportVendaIndividualPdf(id);
        String fileName = String.format("venda_%d_empresa_demo.pdf", id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }
}
