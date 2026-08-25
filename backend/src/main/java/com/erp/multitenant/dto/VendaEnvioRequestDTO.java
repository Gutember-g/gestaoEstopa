package com.erp.multitenant.dto;

public class VendaEnvioRequestDTO {
    private Boolean enviarEmail;
    private Boolean enviarWhatsapp;
    private String formatoDocumento; // PDF or XLSX

    public VendaEnvioRequestDTO() {}

    public VendaEnvioRequestDTO(Boolean enviarEmail, Boolean enviarWhatsapp, String formatoDocumento) {
        this.enviarEmail = enviarEmail;
        this.enviarWhatsapp = enviarWhatsapp;
        this.formatoDocumento = formatoDocumento;
    }

    public Boolean getEnviarEmail() {
        return enviarEmail;
    }

    public void setEnviarEmail(Boolean enviarEmail) {
        this.enviarEmail = enviarEmail;
    }

    public Boolean getEnviarWhatsapp() {
        return enviarWhatsapp;
    }

    public void setEnviarWhatsapp(Boolean enviarWhatsapp) {
        this.enviarWhatsapp = enviarWhatsapp;
    }

    public String getFormatoDocumento() {
        return formatoDocumento;
    }

    public void setFormatoDocumento(String formatoDocumento) {
        this.formatoDocumento = formatoDocumento;
    }
}
