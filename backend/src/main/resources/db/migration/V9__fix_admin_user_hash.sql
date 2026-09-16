-- V9__fix_admin_user_hash.sql - Atualizar hash da senha do admin para BCrypt valido

UPDATE tb_usuario
SET senha_hash = '$2a$10$AB2g26VtfJamqV5sa9VSVuBhUqDhQ6DrJa0l.6wZCgYgrkOJCdWcq'
WHERE username = 'admin';
