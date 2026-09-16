package com.erp.multitenant.service;

import com.erp.multitenant.dto.NotificacaoDTO;
import com.erp.multitenant.model.Notificacao;
import com.erp.multitenant.repository.NotificacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class NotificacaoServiceTest {

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @BeforeEach
    void setUp() {
        notificacaoRepository.deleteAll();
    }

    @Test
    @DisplayName("EVENTOS E ISOLAMENTO: Notificações reais devem ser gravadas por tenant e retornar ordenadas por data")
    void testNotificacoesReaisEIsolamento() {
        // 1. Verificar estado inicial limpo (0 notificações)
        List<NotificacaoDTO> inicial = notificacaoService.getNotificacoesDoTenant("empresa_demo");
        assertTrue(inicial.isEmpty(), "Inicialmente não deve haver nenhuma notificação mockada");

        // 2. Criar notificações reais no tenant 'empresa_demo'
        notificacaoService.criarNotificacao("empresa_demo", "cliente", "👥", "Novo Cliente Cadastrado", "O cliente Teste Silva foi cadastrado.", 1L, "/clientes");
        notificacaoService.criarNotificacao("empresa_demo", "venda", "🛒", "Venda Pendente de Confirmação", "Venda #101 aguarda aprovação.", 101L, "/vendas");

        // 3. Criar notificação no tenant 'filial_sp' (isolamento multi-tenant)
        notificacaoService.criarNotificacao("filial_sp", "estoque", "📦", "Estoque Baixo", "Produto X atingiu estoque crítico.", 5L, "/produtos");

        // 4. Validar notificações do tenant 'empresa_demo'
        List<NotificacaoDTO> notifsDemo = notificacaoService.getNotificacoesDoTenant("empresa_demo");
        assertEquals(2, notifsDemo.size(), "Devem existir exatamente 2 notificações reais para empresa_demo");
        assertFalse(notifsDemo.get(0).lida());
        assertEquals("Venda Pendente de Confirmação", notifsDemo.get(0).titulo(), "A última notificação criada deve vir primeiro");

        // 5. Validar isolamento do tenant 'filial_sp'
        List<NotificacaoDTO> notifsSp = notificacaoService.getNotificacoesDoTenant("filial_sp");
        assertEquals(1, notifsSp.size(), "O tenant filial_sp só deve visualizar suas próprias notificações");
        assertEquals("Estoque Baixo", notifsSp.get(0).titulo());
    }

    @Test
    @DisplayName("MUTACAO: Marcar como lida e marcar todas como lidas deve atualizar status no banco")
    void testMarcarComoLida() {
        Notificacao n1 = notificacaoService.criarNotificacao("empresa_demo", "cliente", "👥", "Cliente A", "Cadastrado", 1L, "/clientes");
        Notificacao n2 = notificacaoService.criarNotificacao("empresa_demo", "cliente", "👥", "Cliente B", "Cadastrado", 2L, "/clientes");

        // Marcar individualmente n1 como lida
        notificacaoService.marcarLida("empresa_demo", n1.getId());
        List<NotificacaoDTO> notifs = notificacaoService.getNotificacoesDoTenant("empresa_demo");
        
        NotificacaoDTO n1Dto = notifs.stream().filter(n -> n.id().equals(n1.getId())).findFirst().orElseThrow();
        assertTrue(n1Dto.lida(), "n1 deve estar marcada como lida");

        // Marcar todas como lidas
        notificacaoService.marcarTodasLidas("empresa_demo");
        List<NotificacaoDTO> notifsAtualizadas = notificacaoService.getNotificacoesDoTenant("empresa_demo");
        assertTrue(notifsAtualizadas.stream().allMatch(NotificacaoDTO::lida), "Todas as notificações de empresa_demo devem estar lidas");
    }
}
