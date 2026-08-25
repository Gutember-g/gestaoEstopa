-- V5__emissao_venda_envio.sql - Migração para suporte a emissão e envio automático de documentos de vendas

ALTER TABLE tb_cliente ADD COLUMN IF NOT EXISTS endereco VARCHAR(255);

ALTER TABLE tb_venda ADD COLUMN IF NOT EXISTS prazo_faturamento_dias INT DEFAULT 30;
ALTER TABLE tb_venda ADD COLUMN IF NOT EXISTS data_vencimento DATE;

CREATE TABLE IF NOT EXISTS tb_configuracao_envio (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    smtp_host VARCHAR(150),
    smtp_port INT DEFAULT 587,
    smtp_username VARCHAR(100),
    smtp_password VARCHAR(100),
    smtp_from_email VARCHAR(100),
    smtp_auth_enabled BOOLEAN DEFAULT TRUE,
    smtp_tls_enabled BOOLEAN DEFAULT TRUE,
    smtp_ativo BOOLEAN DEFAULT FALSE,
    whatsapp_provedor VARCHAR(50) DEFAULT 'Z_API',
    whatsapp_api_key VARCHAR(255),
    whatsapp_instance_id VARCHAR(100),
    whatsapp_sender_phone VARCHAR(30),
    whatsapp_ativo BOOLEAN DEFAULT FALSE,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_config_envio_tenant ON tb_configuracao_envio(tenant_id);

CREATE TABLE IF NOT EXISTS tb_venda_envio_historico (
    id BIGSERIAL PRIMARY KEY,
    venda_id BIGINT NOT NULL REFERENCES tb_venda(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL,
    canal VARCHAR(20) NOT NULL,
    formato VARCHAR(10) NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL,
    mensagem_erro TEXT,
    data_envio TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venda_envio_hist_venda ON tb_venda_envio_historico(venda_id);
CREATE INDEX IF NOT EXISTS idx_venda_envio_hist_tenant ON tb_venda_envio_historico(tenant_id);

-- Inserir configuração inicial para tenant padrão 'empresa_demo'
INSERT INTO tb_configuracao_envio (tenant_id, smtp_host, smtp_port, smtp_from_email, smtp_ativo, whatsapp_provedor, whatsapp_ativo)
VALUES ('empresa_demo', 'smtp.gestaoestopa.com.br', 587, 'comercial@gestaoestopa.com.br', true, 'Z_API', true);
