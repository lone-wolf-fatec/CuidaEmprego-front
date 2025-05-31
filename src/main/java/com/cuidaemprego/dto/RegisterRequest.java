package com.cuidaemprego.dto;

public class RegisterRequest {
    private String name;
    private String username; // Para compatibilidade
    private String email;
    private String password;
    
    // Constructors
    public RegisterRequest() {}
    
    // Getters e Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
