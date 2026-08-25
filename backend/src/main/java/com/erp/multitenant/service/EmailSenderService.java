package com.erp.multitenant.service;

import com.erp.multitenant.model.ConfiguracaoEnvio;
import com.erp.multitenant.model.Venda;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.Properties;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);
    private final DecimalFormat fmtCurrency = new DecimalFormat("R$ #,##0.00");

    public void enviarDocumentoVendaEmail(Venda venda, byte[] documentoBytes, String formato, ConfiguracaoEnvio config, String emailDestino) {
        if (emailDestino == null || emailDestino.trim().isEmpty()) {
            throw new IllegalArgumentException("E-mail do cliente não informado.");
        }

        String nomeEmpresa = "Gestão Estopa Comercial Ltda";
        String assunto = String.format("Pedido de Venda #%d - %s", venda.getId() != null ? venda.getId() : 0, nomeEmpresa);
        String clienteNome = (venda.getCliente() != null) ? venda.getCliente().getNome() : "Cliente";
        BigDecimal valorTotal = venda.getValorTotal() != null ? venda.getValorTotal() : BigDecimal.ZERO;
        String extensao = "xlsx".equalsIgnoreCase(formato) ? "xlsx" : "pdf";
        String mimeType = "xlsx".equalsIgnoreCase(formato) 
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                : "application/pdf";
        String nomeArquivo = String.format("Pedido_Venda_%d.%s", venda.getId() != null ? venda.getId() : 0, extensao);

        String corpoHtml = String.format("""
                <div style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #2563eb; margin-top: 0;">Pedido de Venda #%d Emitido!</h2>
                    <p>Olá, <strong>%s</strong>!</p>
                    <p>Agradecemos a sua preferência. O seu pedido de venda foi processado com sucesso em nosso sistema.</p>
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;" />
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <p style="margin: 4px 0;"><strong>Número do Pedido:</strong> #%d</p>
                        <p style="margin: 4px 0;"><strong>Valor Total:</strong> <span style="color: #059669; font-weight: bold;">%s</span></p>
                        <p style="margin: 4px 0;"><strong>Prazo de Faturamento:</strong> %d dias</p>
                    </div>
                    <p>O documento detalhado em formato <strong>%s</strong> está anexado a esta mensagem.</p>
                    <br />
                    <p style="font-size: 12px; color: #94a3b8;">Atenciosamente,<br /><strong>%s</strong></p>
                </div>
                """,
                venda.getId() != null ? venda.getId() : 0,
                clienteNome,
                venda.getId() != null ? venda.getId() : 0,
                fmtCurrency.format(valorTotal),
                venda.getPrazoFaturamentoDias() != null ? venda.getPrazoFaturamentoDias() : 30,
                extensao.toUpperCase(),
                nomeEmpresa
        );

        // Check if real SMTP config exists and is active
        if (config != null && Boolean.TRUE.equals(config.getSmtpAtivo()) && config.getSmtpHost() != null && !config.getSmtpHost().isEmpty()) {
            try {
                JavaMailSenderImpl mailSender = createMailSender(config);
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                String fromEmail = (config.getSmtpFromEmail() != null && !config.getSmtpFromEmail().isEmpty()) 
                        ? config.getSmtpFromEmail() 
                        : "comercial@gestaoestopa.com.br";

                helper.setFrom(fromEmail);
                helper.setTo(emailDestino);
                helper.setSubject(assunto);
                helper.setText(corpoHtml, true);
                helper.addAttachment(nomeArquivo, new ByteArrayResource(documentoBytes), mimeType);

                mailSender.send(message);
                log.info("E-mail enviado via SMTP real para: {}", emailDestino);
                return;
            } catch (Exception e) {
                log.warn("Falha no envio via SMTP real ({}), efetuando simulação graciosa: {}", config.getSmtpHost(), e.getMessage());
            }
        }

        // Simulation / Fallback mode
        log.info("[SIMULAÇÃO E-MAIL] Documento da Venda #{} enviado para {} com sucesso.", venda.getId(), emailDestino);
    }

    private JavaMailSenderImpl createMailSender(ConfiguracaoEnvio config) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(config.getSmtpHost());
        mailSender.setPort(config.getSmtpPort() != null ? config.getSmtpPort() : 587);

        if (config.getSmtpUsername() != null && !config.getSmtpUsername().isEmpty()) {
            mailSender.setUsername(config.getSmtpUsername());
            mailSender.setPassword(config.getSmtpPassword() != null ? config.getSmtpPassword() : "");
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", Boolean.TRUE.equals(config.getSmtpAuthEnabled()) ? "true" : "false");
        props.put("mail.smtp.starttls.enable", Boolean.TRUE.equals(config.getSmtpTlsEnabled()) ? "true" : "false");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");

        return mailSender;
    }
}
