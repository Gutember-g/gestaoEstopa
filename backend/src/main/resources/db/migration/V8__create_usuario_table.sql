-- V8__create_usuario_table.sql - Tabela de Usuários e Autenticação

CREATE TABLE tb_usuario (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    nome VARCHAR(150),
    cargo VARCHAR(100),
    tenant_id VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_usuario_username_tenant UNIQUE (username, tenant_id)
);

CREATE INDEX idx_usuario_username_tenant ON tb_usuario(username, tenant_id);

-- Carga Inicial de Usuário Padrão (admin / admin123)
-- Hash BCrypt válido gerado para 'admin123': $2a$10$AB2g26VtfJamqV5sa9VSVuBhUqDhQ6DrJa0l.6wZCgYgrkOJCdWcq
INSERT INTO tb_usuario (username, senha_hash, email, nome, cargo, tenant_id)
VALUES ('admin', '$2a$10$AB2g26VtfJamqV5sa9VSVuBhUqDhQ6DrJa0l.6wZCgYgrkOJCdWcq', 'gabriel@flowerp.com.br', 'Gabriel Andrade', 'Administrador', 'empresa_demo');
