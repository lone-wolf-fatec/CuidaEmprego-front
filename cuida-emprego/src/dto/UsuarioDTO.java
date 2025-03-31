package com.empresa.controleponto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO para transferir dados de usuário para o frontend
 * sem expor informações sensíveis como senha
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String username;
    private String nome;
    private String email;
    private Set<String> roles;
    private boolean ativo;
}