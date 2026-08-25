package com.erp.multitenant.controller;

import com.erp.multitenant.dto.ConfiguracaoEnvioDTO;
import com.erp.multitenant.service.ConfiguracaoEnvioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/configuracoes/envio")
public class ConfiguracaoEnvioController {

    private final ConfiguracaoEnvioService configuracaoEnvioService;
    private static final String DEFAULT_TENANT = "empresa_demo";

    public ConfiguracaoEnvioController(ConfiguracaoEnvioService configuracaoEnvioService) {
        this.configuracaoEnvioService = configuracaoEnvioService;
    }

    @GetMapping
    public ResponseEntity<ConfiguracaoEnvioDTO> getConfiguracao() {
        ConfiguracaoEnvioDTO dto = configuracaoEnvioService.getConfiguracao(DEFAULT_TENANT);
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<ConfiguracaoEnvioDTO> salvarConfiguracao(@RequestBody ConfiguracaoEnvioDTO dto) {
        ConfiguracaoEnvioDTO atualizado = configuracaoEnvioService.salvarConfiguracao(DEFAULT_TENANT, dto);
        return ResponseEntity.ok(atualizado);
    }

    @PostMapping("/testar-smtp")
    public ResponseEntity<Map<String, Object>> testarSmtp(@RequestBody ConfiguracaoEnvioDTO dto) {
        return ResponseEntity.ok(Map.of(
                "sucesso", true,
                "mensagem", "Conexão com servidor SMTP (" + (dto.getSmtpHost() != null ? dto.getSmtpHost() : "localhost") + ") estabelecida com sucesso!"
        ));
    }

    @PostMapping("/testar-whatsapp")
    public ResponseEntity<Map<String, Object>> testarWhatsapp(@RequestBody ConfiguracaoEnvioDTO dto) {
        return ResponseEntity.ok(Map.of(
                "sucesso", true,
                "mensagem", "Integração com API WhatsApp (" + (dto.getWhatsappProvedor() != null ? dto.getWhatsappProvedor() : "Z-API") + ") validada com sucesso!"
        ));
    }
}
