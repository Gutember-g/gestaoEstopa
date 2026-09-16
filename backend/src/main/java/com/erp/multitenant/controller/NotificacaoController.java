package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.NotificacaoDTO;
import com.erp.multitenant.service.NotificacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    public NotificacaoController(NotificacaoService notificacaoService) {
        this.notificacaoService = notificacaoService;
    }

    @GetMapping
    public ResponseEntity<List<NotificacaoDTO>> getNotificacoes() {
        String tenantId = resolveTenantId();
        List<NotificacaoDTO> list = notificacaoService.getNotificacoesDoTenant(tenantId);
        return ResponseEntity.ok(list);
    }

    @RequestMapping(value = "/{id}/marcar-lida", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<Void> marcarLida(@PathVariable Long id) {
        String tenantId = resolveTenantId();
        notificacaoService.marcarLida(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(value = "/marcar-todas-lidas", method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<Void> marcarTodasLidas() {
        String tenantId = resolveTenantId();
        notificacaoService.marcarTodasLidas(tenantId);
        return ResponseEntity.noContent().build();
    }

    private String resolveTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : "empresa_demo";
    }
}
