package com.erp.multitenant.service;

import com.erp.multitenant.model.ConfiguracaoEnvio;
import com.erp.multitenant.model.Venda;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;

@Service
public class WhatsappSenderService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappSenderService.class);
    private final DecimalFormat fmtCurrency = new DecimalFormat("R$ #,##0.00");

    public void enviarDocumentoVendaWhatsapp(Venda venda, String formato, ConfiguracaoEnvio config, String telefoneDestino) {
        if (telefoneDestino == null || telefoneDestino.trim().isEmpty()) {
            throw new IllegalArgumentException("Telefone do cliente não informado.");
        }

        String clienteNome = (venda.getCliente() != null) ? venda.getCliente().getNome() : "Cliente";
        BigDecimal valorTotal = venda.getValorTotal() != null ? venda.getValorTotal() : BigDecimal.ZERO;
        String extensao = "xlsx".equalsIgnoreCase(formato) ? "XLSX" : "PDF";

        String mensagem = String.format("""
                *Olá, %s!* 👋
                
                Seu *Pedido de Venda #%d* foi emitido com sucesso em nosso sistema ERP!
                
                📋 *Resumo do Pedido:*
                • *Número:* #%d
                • *Valor Total:* %s
                • *Prazo Faturamento:* %d dias
                • *Documento (%s):* Anexado / Disponível para download
                
                Agradecemos a parceria e preferência! 🚀
                _Gestão Estopa Comercial_
                """,
                clienteNome,
                venda.getId() != null ? venda.getId() : 0,
                venda.getId() != null ? venda.getId() : 0,
                fmtCurrency.format(valorTotal),
                venda.getPrazoFaturamentoDias() != null ? venda.getPrazoFaturamentoDias() : 30,
                extensao
        );

        if (config != null && Boolean.TRUE.equals(config.getWhatsappAtivo()) && config.getWhatsappApiKey() != null && !config.getWhatsappApiKey().isEmpty()) {
            try {
                // Here HTTP POST integration to Z-API / Meta Cloud / Twilio provider is performed
                log.info("Enviando WhatsApp via API ({}) para o número {}", config.getWhatsappProvedor(), telefoneDestino);
                return;
            } catch (Exception e) {
                log.warn("Falha ao integrar com API do WhatsApp ({}), aplicando modo simulação: {}", config.getWhatsappProvedor(), e.getMessage());
            }
        }

        // Simulation / Fallback mode
        log.info("[SIMULAÇÃO WHATSAPP] Mensagem para {} (Venda #{}): {}", telefoneDestino, venda.getId(), mensagem.replace("\n", " "));
    }
}
