-- V4__create_refresh_token_table.sql - Tabela para controle de Refresh Tokens e Sessões

CREATE TABLE tb_refresh_token (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    family_id VARCHAR(64) NOT NULL,
    username VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_refresh_token_hash ON tb_refresh_token(token_hash);
CREATE INDEX idx_refresh_token_family ON tb_refresh_token(family_id);
