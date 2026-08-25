package com.erp.multitenant.dto;

public class ConfiguracaoEnvioDTO {
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String smtpFromEmail;
    private Boolean smtpAuthEnabled;
    private Boolean smtpTlsEnabled;
    private Boolean smtpAtivo;

    private String whatsappProvedor;
    private String whatsappApiKey;
    private String whatsappInstanceId;
    private String whatsappSenderPhone;
    private Boolean whatsappAtivo;

    public ConfiguracaoEnvioDTO() {}

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
}
