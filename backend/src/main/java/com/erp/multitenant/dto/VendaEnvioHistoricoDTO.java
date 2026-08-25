package com.erp.multitenant.dto;

import java.time.LocalDateTime;

public class VendaEnvioHistoricoDTO {
    private Long id;
    private Long vendaId;
    private String canal;
    private String formato;
    private String destinatario;
    private String status;
    private String mensagemErro;
    private LocalDateTime dataEnvio;

    public VendaEnvioHistoricoDTO() {}

    public VendaEnvioHistoricoDTO(Long id, Long vendaId, String canal, String formato, String destinatario, String status, String mensagemErro, LocalDateTime dataEnvio) {
        this.id = id;
        this.vendaId = vendaId;
        this.canal = canal;
        this.formato = formato;
        this.destinatario = destinatario;
        this.status = status;
        this.mensagemErro = mensagemErro;
        this.dataEnvio = dataEnvio;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVendaId() {
        return vendaId;
    }

    public void setVendaId(Long vendaId) {
        this.vendaId = vendaId;
    }

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public String getFormato() {
        return formato;
    }

    public void setFormato(String formato) {
        this.formato = formato;
    }

    public String getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(String destinatario) {
        this.destinatario = destinatario;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMensagemErro() {
        return mensagemErro;
    }

    public void setMensagemErro(String mensagemErro) {
        this.mensagemErro = mensagemErro;
    }

    public LocalDateTime getDataEnvio() {
        return dataEnvio;
    }

    public void setDataEnvio(LocalDateTime dataEnvio) {
        this.dataEnvio = dataEnvio;
    }
}
