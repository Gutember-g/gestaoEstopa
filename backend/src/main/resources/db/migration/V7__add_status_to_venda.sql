-- V7__add_status_to_venda.sql
-- Adiciona a coluna status na tabela tb_venda para suportar fluxo de Orçamento (ORCAMENTO vs CONFIRMADA)

ALTER TABLE tb_venda ADD COLUMN status VARCHAR(30) DEFAULT 'CONFIRMADA';

UPDATE tb_venda SET status = 'CONFIRMADA' WHERE status IS NULL OR status = '';
