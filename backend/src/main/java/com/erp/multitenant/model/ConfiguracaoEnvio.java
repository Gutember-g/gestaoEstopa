package com.erp.multitenant.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_configuracao_envio")
public class ConfiguracaoEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private String tenantId;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    @Column(name = "smtp_password")
    private String smtpPassword;

    @Column(name = "smtp_from_email")
    private String smtpFromEmail;

    @Column(name = "smtp_auth_enabled")
    private Boolean smtpAuthEnabled;

    @Column(name = "smtp_tls_enabled")
    private Boolean smtpTlsEnabled;

    @Column(name = "smtp_ativo")
    private Boolean smtpAtivo;

    @Column(name = "whatsapp_provedor")
    private String whatsappProvedor;

    @Column(name = "whatsapp_api_key")
    private String whatsappApiKey;

    @Column(name = "whatsapp_instance_id")
    private String whatsappInstanceId;

    @Column(name = "whatsapp_sender_phone")
    private String whatsappSenderPhone;

    @Column(name = "whatsapp_ativo")
    private Boolean whatsappAtivo;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    public Integer getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(Integer smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getSmtpUsername() {
        return smtpUsername;
    }

    public void setSmtpUsername(String smtpUsername) {
        this.smtpUsername = smtpUsername;
    }

    public String getSmtpPassword() {
        return smtpPassword;
    }

    public void setSmtpPassword(String smtpPassword) {
        this.smtpPassword = smtpPassword;
    }

    public String getSmtpFromEmail() {
        return smtpFromEmail;
    }

    public void setSmtpFromEmail(String smtpFromEmail) {
        this.smtpFromEmail = smtpFromEmail;
    }

    public Boolean getSmtpAuthEnabled() {
        return smtpAuthEnabled;
    }

    public void setSmtpAuthEnabled(Boolean smtpAuthEnabled) {
        this.smtpAuthEnabled = smtpAuthEnabled;
    }

    public Boolean getSmtpTlsEnabled() {
        return smtpTlsEnabled;
    }

    public void setSmtpTlsEnabled(Boolean smtpTlsEnabled) {
        this.smtpTlsEnabled = smtpTlsEnabled;
    }

    public Boolean getSmtpAtivo() {
        return smtpAtivo;
    }

    public void setSmtpAtivo(Boolean smtpAtivo) {
        this.smtpAtivo = smtpAtivo;
    }

    public String getWhatsappProvedor() {
        return whatsappProvedor;
    }

    public void setWhatsappProvedor(String whatsappProvedor) {
        this.whatsappProvedor = whatsappProvedor;
    }

    public String getWhatsappApiKey() {
        return whatsappApiKey;
    }

    public void setWhatsappApiKey(String whatsappApiKey) {
        this.whatsappApiKey = whatsappApiKey;
    }

    public String getWhatsappInstanceId() {
        return whatsappInstanceId;
    }

    public void setWhatsappInstanceId(String whatsappInstanceId) {
        this.whatsappInstanceId = whatsappInstanceId;
    }

    public String getWhatsappSenderPhone() {
        return whatsappSenderPhone;
    }

    public void setWhatsappSenderPhone(String whatsappSenderPhone) {
        this.whatsappSenderPhone = whatsappSenderPhone;
    }

    public Boolean getWhatsappAtivo() {
        return whatsappAtivo;
    }

    public void setWhatsappAtivo(Boolean whatsappAtivo) {
        this.whatsappAtivo = whatsappAtivo;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
