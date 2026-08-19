package com.erp.multitenant.controller;

import com.erp.multitenant.dto.NotificacaoDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/notificacoes")
public class NotificacaoController {

    private final List<NotificacaoDTO> notificacoes = new ArrayList<>(List.of(
            new NotificacaoDTO(1L, "cobranca", "🔴", "Cobrança Vencida", "Parcela de R$ 1.250,00 da empresa Silva & Cia venceu ontem.", "há 10 min", false, "/financeiro"),
            new NotificacaoDTO(2L, "meta", "🎯", "Meta de Faturamento Atingida!", "Parabéns! A meta mensal de R$ 250.000,00 foi ultrapassada.", "há 2 horas", false, "/dashboard"),
            new NotificacaoDTO(3L, "estoque", "📦", "Estoque Baixo", "Estopa Branca Premium 1kg atingiu o nível crítico (3 un).", "há 4 horas", false, "/produtos"),
            new NotificacaoDTO(4L, "cliente", "👥", "Novo Cliente Cadastrado", "Mecânica Express Eireli foi cadastrado no sistema.", "ontem", true, "/clientes"),
            new NotificacaoDTO(5L, "venda", "🛒", "Venda Pendente de Confirmação", "Venda #103 no valor de R$ 3.400,00 aguarda aprovação.", "ontem", true, "/vendas")
    ));

    @GetMapping
    public ResponseEntity<List<NotificacaoDTO>> getNotificacoes() {
        return ResponseEntity.ok(notificacoes);
    }

    @PatchMapping("/{id}/marcar-lida")
    public ResponseEntity<Void> marcarLida(@PathVariable Long id) {
        for (int i = 0; i < notificacoes.size(); i++) {
            NotificacaoDTO n = notificacoes.get(i);
            if (n.id().equals(id)) {
                notificacoes.set(i, new NotificacaoDTO(
                        n.id(), n.tipo(), n.icon(), n.titulo(), n.descricao(), n.timestamp(), true, n.link()
                ));
                break;
            }
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/marcar-todas-lidas")
    public ResponseEntity<Void> marcarTodasLidas() {
        for (int i = 0; i < notificacoes.size(); i++) {
            NotificacaoDTO n = notificacoes.get(i);
            notificacoes.set(i, new NotificacaoDTO(
                    n.id(), n.tipo(), n.icon(), n.titulo(), n.descricao(), n.timestamp(), true, n.link()
            ));
        }
        return ResponseEntity.noContent().build();
    }
}
