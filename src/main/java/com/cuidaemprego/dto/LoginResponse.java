package com.cuidaemprego.dto;

import java.util.List;

public class LoginResponse {
    private Long id;
    private String email;
    private String name;
    private List<String> roles;
    private String token;
    private Boolean isAdmin;
    
    // Constructors
    public LoginResponse() {}
    
    public LoginResponse(Long id, String email, String name, List<String> roles, String token, Boolean isAdmin) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.roles = roles;
        this.token = token;
        this.isAdmin = isAdmin;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
}