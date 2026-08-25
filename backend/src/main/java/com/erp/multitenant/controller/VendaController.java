package com.erp.multitenant.controller;

import com.erp.multitenant.dto.VendaDTO;
import com.erp.multitenant.dto.VendaEnvioHistoricoDTO;
import com.erp.multitenant.dto.VendaEnvioRequestDTO;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.VendaRepository;
import com.erp.multitenant.service.DocumentoGeneratorService;
import com.erp.multitenant.service.VendaEnvioService;
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
    private final VendaEnvioService vendaEnvioService;
    private final DocumentoGeneratorService documentoGeneratorService;
    private final VendaRepository vendaRepository;

    public VendaController(VendaService vendaService,
                           VendaExportService vendaExportService,
                           VendaEnvioService vendaEnvioService,
                           DocumentoGeneratorService documentoGeneratorService,
                           VendaRepository vendaRepository) {
        this.vendaService = vendaService;
        this.vendaExportService = vendaExportService;
        this.vendaEnvioService = vendaEnvioService;
        this.documentoGeneratorService = documentoGeneratorService;
        this.vendaRepository = vendaRepository;
    }

    @GetMapping
    public ResponseEntity<List<VendaDTO>> getVendas(
            @RequestParam(name = "mes", required = false) Integer mes,
            @RequestParam(name = "ano", required = false) Integer ano) {

        List<VendaDTO> vendas = vendaService.getVendasPorPeriodo(mes, ano);
        return ResponseEntity.ok(vendas);
    }

    @PostMapping
    public ResponseEntity<VendaDTO> criarOuAtualizarVenda(@RequestBody VendaDTO dto) {
        VendaDTO salva = vendaService.salvarVenda(dto);
        return ResponseEntity.ok(salva);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarVenda(@PathVariable("id") Long id) {
        vendaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/emissao-envio")
    public ResponseEntity<List<VendaEnvioHistoricoDTO>> emitirEEnviarDocumento(
            @PathVariable("id") Long id,
            @RequestBody VendaEnvioRequestDTO request) {
        List<VendaEnvioHistoricoDTO> historico = vendaEnvioService.processarEnvioDocumentoVenda(id, request);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/{id}/historico-envio")
    public ResponseEntity<List<VendaEnvioHistoricoDTO>> getHistoricoEnvio(@PathVariable("id") Long id) {
        List<VendaEnvioHistoricoDTO> historico = vendaEnvioService.getHistoricoEnvio(id);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/{id}/documento")
    public ResponseEntity<byte[]> getDocumentoVenda(
            @PathVariable("id") Long id,
            @RequestParam(name = "formato", defaultValue = "pdf") String formato) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Venda não encontrada: " + id));

        byte[] content = documentoGeneratorService.gerarDocumentoVenda(venda, formato);
        String ext = "xlsx".equalsIgnoreCase(formato) ? "xlsx" : "pdf";
        String mimeType = "xlsx".equalsIgnoreCase(formato) 
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                : "application/pdf";
        String fileName = String.format("pedido_venda_%d.%s", id, ext);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(content);
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
