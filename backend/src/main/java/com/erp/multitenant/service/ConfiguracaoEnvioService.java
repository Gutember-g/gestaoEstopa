package com.erp.multitenant.service;

import com.erp.multitenant.dto.ConfiguracaoEnvioDTO;
import com.erp.multitenant.model.ConfiguracaoEnvio;
import com.erp.multitenant.repository.ConfiguracaoEnvioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoEnvioService {

    private final ConfiguracaoEnvioRepository configuracaoEnvioRepository;
    private static final String DEFAULT_TENANT = "empresa_demo";

    public ConfiguracaoEnvioService(ConfiguracaoEnvioRepository configuracaoEnvioRepository) {
        this.configuracaoEnvioRepository = configuracaoEnvioRepository;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoEnvio getEntityByTenant(String tenantId) {
        String targetTenant = (tenantId != null && !tenantId.isEmpty()) ? tenantId : DEFAULT_TENANT;
        return configuracaoEnvioRepository.findByTenantId(targetTenant)
                .orElseGet(() -> {
                    ConfiguracaoEnvio c = new ConfiguracaoEnvio();
                    c.setTenantId(targetTenant);
                    c.setSmtpHost("smtp.gestaoestopa.com.br");
                    c.setSmtpPort(587);
                    c.setSmtpFromEmail("comercial@gestaoestopa.com.br");
                    c.setSmtpAtivo(true);
                    c.setWhatsappProvedor("Z_API");
                    c.setWhatsappAtivo(true);
                    return c;
                });
    }

    @Transactional(readOnly = true)
    public ConfiguracaoEnvioDTO getConfiguracao(String tenantId) {
        ConfiguracaoEnvio entity = getEntityByTenant(tenantId);
        ConfiguracaoEnvioDTO dto = new ConfiguracaoEnvioDTO();
        dto.setSmtpHost(entity.getSmtpHost());
        dto.setSmtpPort(entity.getSmtpPort());
        dto.setSmtpUsername(entity.getSmtpUsername());
        dto.setSmtpPassword(entity.getSmtpPassword());
        dto.setSmtpFromEmail(entity.getSmtpFromEmail());
        dto.setSmtpAuthEnabled(entity.getSmtpAuthEnabled());
        dto.setSmtpTlsEnabled(entity.getSmtpTlsEnabled());
        dto.setSmtpAtivo(entity.getSmtpAtivo());

        dto.setWhatsappProvedor(entity.getWhatsappProvedor());
        dto.setWhatsappApiKey(entity.getWhatsappApiKey());
        dto.setWhatsappInstanceId(entity.getWhatsappInstanceId());
        dto.setWhatsappSenderPhone(entity.getWhatsappSenderPhone());
        dto.setWhatsappAtivo(entity.getWhatsappAtivo());
        return dto;
    }

    @Transactional
    public ConfiguracaoEnvioDTO salvarConfiguracao(String tenantId, ConfiguracaoEnvioDTO dto) {
        String targetTenant = (tenantId != null && !tenantId.isEmpty()) ? tenantId : DEFAULT_TENANT;
        ConfiguracaoEnvio entity = configuracaoEnvioRepository.findByTenantId(targetTenant)
                .orElseGet(() -> {
                    ConfiguracaoEnvio c = new ConfiguracaoEnvio();
                    c.setTenantId(targetTenant);
                    return c;
                });

        entity.setSmtpHost(dto.getSmtpHost());
        entity.setSmtpPort(dto.getSmtpPort());
        entity.setSmtpUsername(dto.getSmtpUsername());
        entity.setSmtpPassword(dto.getSmtpPassword());
        entity.setSmtpFromEmail(dto.getSmtpFromEmail());
        entity.setSmtpAuthEnabled(dto.getSmtpAuthEnabled());
        entity.setSmtpTlsEnabled(dto.getSmtpTlsEnabled());
        entity.setSmtpAtivo(dto.getSmtpAtivo());

        entity.setWhatsappProvedor(dto.getWhatsappProvedor());
        entity.setWhatsappApiKey(dto.getWhatsappApiKey());
        entity.setWhatsappInstanceId(dto.getWhatsappInstanceId());
        entity.setWhatsappSenderPhone(dto.getWhatsappSenderPhone());
        entity.setWhatsappAtivo(dto.getWhatsappAtivo());

        configuracaoEnvioRepository.save(entity);
        return getConfiguracao(targetTenant);
    }
}
