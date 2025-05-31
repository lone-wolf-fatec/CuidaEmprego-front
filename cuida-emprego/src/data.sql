-- Arquivo para inicialização de dados (src/main/resources/data.sql)

-- Inserir usuários de exemplo (a senha é 'senha123' criptografada)
INSERT INTO usuarios (username, password, nome, email, ativo) 
VALUES 
  ('joao.silva', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'João Silva', 'joao.silva@empresa.com', true),
  ('maria.oliveira', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Maria Oliveira', 'maria.oliveira@empresa.com', true),
  ('carlos.pereira', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Carlos Pereira', 'carlos.pereira@empresa.com', true),
  ('ana.souza', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Ana Souza', 'ana.souza@empresa.com', true),
  ('pedro.santos', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Pedro Santos', 'pedro.santos@empresa.com', true),
  ('julia.costa', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Julia Costa', 'julia.costa@empresa.com', true),
  ('rafael.gomes', '$2a$10$YMEq4Jb5lUiV1XDQbHzq2OvEdkbXKDV9tBGzVu9WqKydvY3CHu9UW', 'Rafael Gomes', 'rafael.gomes@empresa.com', true);

-- Inserir roles para os usuários
INSERT INTO usuario_roles (usuario_id, role) 
VALUES 
  (1, 'ADMIN'),
  (1, 'USER'),
  (2, 'USER'),
  (3, 'USER'),
  (4, 'USER'),
  (5, 'USER'),
  (6, 'MANAGER'),
  (6, 'USER'),
  (7, 'USER');