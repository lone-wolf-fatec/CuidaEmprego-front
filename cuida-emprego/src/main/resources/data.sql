-- Senha: admin123 (criptografada com BCrypt)
INSERT INTO usuarios (username, password, nome, email, ativo) 
VALUES ('admin', '$2a$10$xPPCc3BS4p0i1Y36iAp4lusR2S.A/SJSPBi2J9.n.V2lAKSb/Xpoy', 'Administrador', 'admin@empresa.com', 1);

-- Adicionar role ADMIN ao usuário admin
INSERT INTO usuario_roles (usuario_id, role) 
VALUES (1, 'ADMIN');