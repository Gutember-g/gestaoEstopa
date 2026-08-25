package com.erp.multitenant.service;

import com.erp.multitenant.dto.VendaEnvioHistoricoDTO;
import com.erp.multitenant.dto.VendaEnvioRequestDTO;
import com.erp.multitenant.model.ConfiguracaoEnvio;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.model.VendaEnvioHistorico;
import com.erp.multitenant.repository.VendaEnvioHistoricoRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class VendaEnvioService {

    private final VendaRepository vendaRepository;
    private final DocumentoGeneratorService documentoGeneratorService;
    private final EmailSenderService emailSenderService;
    private final WhatsappSenderService whatsappSenderService;
    private final ConfiguracaoEnvioService configuracaoEnvioService;
    private final VendaEnvioHistoricoRepository vendaEnvioHistoricoRepository;
    private static final String DEFAULT_TENANT = "empresa_demo";

    public VendaEnvioService(VendaRepository vendaRepository,
                             DocumentoGeneratorService documentoGeneratorService,
                             EmailSenderService emailSenderService,
                             WhatsappSenderService whatsappSenderService,
                             ConfiguracaoEnvioService configuracaoEnvioService,
                             VendaEnvioHistoricoRepository vendaEnvioHistoricoRepository) {
        this.vendaRepository = vendaRepository;
        this.documentoGeneratorService = documentoGeneratorService;
        this.emailSenderService = emailSenderService;
        this.whatsappSenderService = whatsappSenderService;
        this.configuracaoEnvioService = configuracaoEnvioService;
        this.vendaEnvioHistoricoRepository = vendaEnvioHistoricoRepository;
    }

    @Transactional
    public List<VendaEnvioHistoricoDTO> processarEnvioDocumentoVenda(Long vendaId, VendaEnvioRequestDTO request) {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new IllegalArgumentException("Venda não encontrada com o ID: " + vendaId));

        String formato = (request.getFormatoDocumento() != null && !request.getFormatoDocumento().isEmpty())
                ? request.getFormatoDocumento()
                : "pdf";

        byte[] documentoBytes = documentoGeneratorService.gerarDocumentoVenda(venda, formato);
        ConfiguracaoEnvio config = configuracaoEnvioService.getEntityByTenant(venda.getTenantId() != null ? venda.getTenantId() : DEFAULT_TENANT);
        List<VendaEnvioHistoricoDTO> resultados = new ArrayList<>();

        // 1. Dispatch Email if requested
        if (Boolean.TRUE.equals(request.getEnviarEmail())) {
            String emailCliente = (venda.getCliente() != null) ? venda.getCliente().getEmail() : null;
            VendaEnvioHistorico histEmail = new VendaEnvioHistorico();
            histEmail.setVenda(venda);
            histEmail.setTenantId(venda.getTenantId() != null ? venda.getTenantId() : DEFAULT_TENANT);
            histEmail.setCanal("EMAIL");
            histEmail.setFormato(formato.toUpperCase());
            histEmail.setDestinatario(emailCliente != null ? emailCliente : "N/A");

            try {
                emailSenderService.enviarDocumentoVendaEmail(venda, documentoBytes, formato, config, emailCliente);
                histEmail.setStatus("SUCESSO");
                histEmail.setMensagemErro(null);
            } catch (Exception e) {
                histEmail.setStatus("ERRO");
                histEmail.setMensagemErro(e.getMessage());
            }
            vendaEnvioHistoricoRepository.save(histEmail);
            resultados.add(toDTO(histEmail));
        }

        // 2. Dispatch WhatsApp if requested
        if (Boolean.TRUE.equals(request.getEnviarWhatsapp())) {
            String telefoneCliente = (venda.getCliente() != null) ? venda.getCliente().getTelefone() : null;
            VendaEnvioHistorico histWa = new VendaEnvioHistorico();
            histWa.setVenda(venda);
            histWa.setTenantId(venda.getTenantId() != null ? venda.getTenantId() : DEFAULT_TENANT);
            histWa.setCanal("WHATSAPP");
            histWa.setFormato(formato.toUpperCase());
            histWa.setDestinatario(telefoneCliente != null ? telefoneCliente : "N/A");

            try {
                whatsappSenderService.enviarDocumentoVendaWhatsapp(venda, formato, config, telefoneCliente);
                histWa.setStatus("SUCESSO");
                histWa.setMensagemErro(null);
            } catch (Exception e) {
                histWa.setStatus("ERRO");
                histWa.setMensagemErro(e.getMessage());
            }
            vendaEnvioHistoricoRepository.save(histWa);
            resultados.add(toDTO(histWa));
        }

        return resultados;
    }

    @Transactional(readOnly = true)
    public List<VendaEnvioHistoricoDTO> getHistoricoEnvio(Long vendaId) {
        List<VendaEnvioHistorico> logs = vendaEnvioHistoricoRepository.findByVendaIdOrderByDataEnvioDesc(vendaId);
        return logs.stream().map(this::toDTO).toList();
    }

    private VendaEnvioHistoricoDTO toDTO(VendaEnvioHistorico entity) {
        return new VendaEnvioHistoricoDTO(
                entity.getId(),
                entity.getVenda() != null ? entity.getVenda().getId() : null,
                entity.getCanal(),
                entity.getFormato(),
                entity.getDestinatario(),
                entity.getStatus(),
                entity.getMensagemErro(),
                entity.getDataEnvio()
        );
    }
}
