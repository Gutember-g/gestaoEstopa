-- V2__suporte.sql - Auditoria Técnica e Suporte

CREATE TABLE tb_auditoria_suporte (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    usuario_suporte VARCHAR(100) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    registro_id BIGINT,
    data_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    detalhes TEXT
);

CREATE INDEX idx_auditoria_tenant ON tb_auditoria_suporte(tenant_id);

-- Inserção de Conta Técnica Global de Suporte
INSERT INTO tb_cliente (nome, cpf_cnpj, email, observacao, tenant_id)
VALUES ('SYSTEM SUPPORT ACCOUNT', '00.000.000/0001-00', 'suporte@erp-master.com', 'Conta técnica de manutenção global', 'SYSTEM_MASTER');
