// src/services/authService.js

class AuthService {
  
  // ✅ LOGIN COM JWT
  async login(username, password) {
    try {
      console.log('🔐 Fazendo login JWT...', { username });
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('📨 Resposta do login:', data);
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          authenticated: true
        }));
        
        console.log('✅ Login realizado com sucesso');
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Erro no login' };
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  }
  
  // ✅ LOGOUT
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  }
  
  // ✅ VERIFICAR SE ESTÁ AUTENTICADO
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) return false;
    
    try {
      const userData = JSON.parse(user);
      return userData?.authenticated === true;
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return false;
    }
  }
  
  // ✅ PEGAR USUÁRIO ATUAL
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário:', error);
      return null;
    }
  }
  
  // ✅ VERIFICAR SE É ADMIN
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.isAdmin === true || 
           user.email?.toLowerCase().includes('admin') ||
           user.username?.toLowerCase() === 'admin' ||
           (user.roles && user.roles.some(role => 
             typeof role === 'string' && role.toUpperCase() === 'ADMIN'
           ));
  }
  
  // ✅ PEGAR TOKEN
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();