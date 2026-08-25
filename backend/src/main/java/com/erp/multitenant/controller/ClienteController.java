package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.repository.ClienteRepository;
import com.erp.multitenant.service.ClienteExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteExportService clienteExportService;
    private final ClienteRepository clienteRepository;

    public ClienteController(ClienteExportService clienteExportService, ClienteRepository clienteRepository) {
        this.clienteExportService = clienteExportService;
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    public ResponseEntity<List<Cliente>> getClientes() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";
        List<Cliente> clientes = clienteRepository.findByTenantId(tenantId);
        return ResponseEntity.ok(clientes);
    }

    @PostMapping
    public ResponseEntity<?> createCliente(@RequestBody Cliente cliente) {
        if (cliente.getNome() == null || cliente.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome / Razão Social é obrigatório."));
        }
        if (cliente.getCpfCnpj() == null || cliente.getCpfCnpj().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "CPF / CNPJ é obrigatório."));
        }

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";
        cliente.setTenantId(tenantId);
        if (cliente.getCriadoEm() == null) {
            cliente.setCriadoEm(java.time.LocalDateTime.now());
        }
        Cliente saved = clienteRepository.save(cliente);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCliente(@PathVariable Long id, @RequestBody Cliente cliente) {
        if (cliente.getNome() == null || cliente.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome / Razão Social é obrigatório."));
        }
        if (cliente.getCpfCnpj() == null || cliente.getCpfCnpj().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "CPF / CNPJ é obrigatório."));
        }

        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";
        cliente.setId(id);
        cliente.setTenantId(tenantId);
        if (cliente.getCriadoEm() == null) {
            cliente.setCriadoEm(java.time.LocalDateTime.now());
        }
        Cliente saved = clienteRepository.save(cliente);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCliente(@PathVariable Long id) {
        clienteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/importar")
    public ResponseEntity<Map<String, Object>> importarClientes(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> response = clienteExportService.importClientes(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarClientes(
            @RequestParam(name = "formato", defaultValue = "csv") String formato,
            @RequestParam(name = "search", required = false) String search) throws IOException {

        byte[] content = clienteExportService.exportClientes(formato, search);
        String ext = "xlsx".equalsIgnoreCase(formato) ? "xlsx" : "csv";
        String mimeType = "xlsx".equalsIgnoreCase(formato)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv";
        String fileName = String.format("clientes_empresa_demo_%s.%s", LocalDate.now(), ext);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(content);
    }

    @GetMapping("/modelo")
    public ResponseEntity<byte[]> modeloImportacao(@RequestParam(name = "formato", defaultValue = "csv") String formato) throws IOException {
        byte[] content = clienteExportService.generateTemplate(formato);
        String ext = "xlsx".equalsIgnoreCase(formato) ? "xlsx" : "csv";
        String mimeType = "xlsx".equalsIgnoreCase(formato)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv";
        String fileName = "modelo_importacao_clientes." + ext;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(content);
    }
}
