-- V6__clean_sample_data.sql - Purga de dados de teste residuais mantendo a integridade referencial
DELETE FROM tb_venda_envio_historico;
DELETE FROM tb_item_venda;
DELETE FROM tb_parcela;
DELETE FROM tb_venda;
DELETE FROM tb_produto;
DELETE FROM tb_cliente;
