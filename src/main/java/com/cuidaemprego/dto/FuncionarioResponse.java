package com.cuidaemprego.dto;

public class FuncionarioResponse {
    private Long id;
    private String nome;
    private String email;
    private Boolean isAdmin;
    
    // Constructors
    public FuncionarioResponse() {}
    
    public FuncionarioResponse(Long id, String nome, String email, Boolean isAdmin) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.isAdmin = isAdmin;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
}
