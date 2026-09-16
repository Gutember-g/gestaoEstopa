-- V10__create_notificacao_table.sql - Tabela de Notificações ERP Multi-tenant

CREATE TABLE tb_notificacao (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    icon VARCHAR(20) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE NOT NULL,
    referencia_id BIGINT,
    link VARCHAR(100),
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notificacao_tenant_lida ON tb_notificacao(tenant_id, lida, criado_em);
