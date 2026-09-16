package com.erp.multitenant.service;

import com.erp.multitenant.dto.NotificacaoDTO;
import com.erp.multitenant.model.Notificacao;
import com.erp.multitenant.repository.NotificacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository) {
        this.notificacaoRepository = notificacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificacaoDTO> getNotificacoesDoTenant(String tenantId) {
        List<Notificacao> lista = notificacaoRepository.findByTenantIdOrderByCriadoEmDesc(tenantId);
        return lista.stream().map(this::toDTO).toList();
    }

    @Transactional
    public Notificacao criarNotificacao(
            String tenantId,
            String tipo,
            String icon,
            String titulo,
            String descricao,
            Long referenciaId,
            String link
    ) {
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "empresa_demo";
        }
        Notificacao notif = new Notificacao(tenantId, tipo, icon, titulo, descricao, referenciaId, link);
        return notificacaoRepository.save(notif);
    }

    @Transactional
    public void marcarLida(String tenantId, Long id) {
        notificacaoRepository.findByIdAndTenantId(id, tenantId).ifPresent(n -> {
            n.setLida(true);
            notificacaoRepository.save(n);
        });
    }

    @Transactional
    public void marcarTodasLidas(String tenantId) {
        notificacaoRepository.marcarTodasComoLidasDoTenant(tenantId);
    }

    private NotificacaoDTO toDTO(Notificacao n) {
        return new NotificacaoDTO(
                n.getId(),
                n.getTipo(),
                n.getIcon(),
                n.getTitulo(),
                n.getDescricao(),
                calcularTimestampAmigavel(n.getCriadoEm()),
                n.isLida(),
                n.getLink()
        );
    }

    private String calcularTimestampAmigavel(LocalDateTime data) {
        if (data == null) return "agora";
        LocalDateTime agora = LocalDateTime.now();
        Duration duracao = Duration.between(data, agora);

        long minutos = duracao.toMinutes();
        if (minutos < 1) return "agora";
        if (minutos < 60) return "há " + minutos + " min";

        long horas = duracao.toHours();
        if (horas < 24) return "há " + horas + (horas == 1 ? " hora" : " horas");

        long dias = duracao.toDays();
        if (dias == 1) return "ontem";
        if (dias < 7) return "há " + dias + " dias";

        return data.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}
