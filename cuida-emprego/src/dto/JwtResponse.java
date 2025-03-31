
package com.empresa.controleponto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String tipo = "Bearer";
    private Long id;
    private String username;
    private String nome;
    private List<String> roles;
    private boolean isAdmin;
    private boolean isFuncionario;

    public JwtResponse(String token, Long id, String username, String nome, List<String> roles) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.nome = nome;
        this.roles = roles;
        this.isAdmin = roles.contains("ADMIN");
        this.isFuncionario = roles.contains("FUNCIONARIO");
    }
}