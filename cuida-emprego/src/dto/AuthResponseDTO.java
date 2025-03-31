package com.cuidaemprego.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String tipo = "Bearer";
    private Long id;
    private String username;
    private String nome;
    private List<String> roles;
    private boolean isAdmin;
    private boolean isFuncionario;

    public AuthResponseDTO(String token, Long id, String username, String nome, List<String> roles) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.nome = nome;
        this.roles = roles;
        this.isAdmin = roles.contains("ADMIN");
        this.isFuncionario = roles.contains("FUNCIONARIO");
    }
    
    public AuthResponseDTO(String token, Long id, String username, String nome, List<String> roles,
                           boolean isAdmin, boolean isFuncionario) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.nome = nome;
        this.roles = roles;
        this.isAdmin = isAdmin;
        this.isFuncionario = isFuncionario;
    }
}